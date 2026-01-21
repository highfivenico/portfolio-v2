import api from "./client";
import db from "../data/portfolio-projects.json";

// URL de base de l'API
const USE_API = String(import.meta.env.VITE_USE_API ?? "false") === "true";

// --------- Mise en cache ---------

let projectsSummaryCache = null; // Pour le carousel
const projectDetailCache = new Map(); // Pour la modale (slug → project)

// Cache interne (liste complète)
let projectsCache = null;

// --------- Helpers ---------

function getLocalProjectsArray() {
  const data = db;
  const arr = Array.isArray(data) ? data : data?.projects;
  return Array.isArray(arr) ? arr : [];
}

function toSummary(p) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    shortDescription: p.shortDescription,
    thumbnail: p.thumbnail,
    technologies: p.technologies,
    year: p.year,
    type: p.type,
  };
}

function normalizeApiError(error, fallbackMessage) {
  // Si axios a déjà normalisé l'erreur (status/data)
  if (error?.status !== undefined) {
    const err = new Error(error.message || fallbackMessage);
    err.status = error.status;
    err.data = error.data ?? null;
    return err;
  }

  // Pas de réponse du serveur
  if (!error?.response) {
    const err = new Error(
      "Impossible de contacter le serveur. Vérifiez votre connexion.",
    );
    err.status = null;
    err.data = null;
    return err;
  }

  // Le serveur répond avec une erreur HTTP
  const { status, data } = error.response;

  const message =
    data?.message ||
    (status >= 500 ? "Une erreur serveur est survenue." : fallbackMessage);

  const err = new Error(message);
  err.status = status;
  err.data = data;
  return err;
}

/* -------------------- SOURCES -------------------- */

async function fetchAllFromLocal() {
  return getLocalProjectsArray();
}

async function fetchAllFromApi(signal) {
  try {
    const { data } = await api.get("/projects", { signal });

    // L'API peut renvoyer un tableau ou { projects: [...] }
    const projects = Array.isArray(data) ? data : data?.projects || [];

    // Si le format est incorrect cela active le fallback
    if (!Array.isArray(projects)) {
      const err = new Error("Format de réponse invalide.");
      err.status = 500;
      err.data = data;
      throw err;
    }

    return projects;
  } catch (error) {
    throw normalizeApiError(
      error,
      "Une erreur est survenue lors du chargement des projets.",
    );
  }
}

async function getAllProjects({ force = false, signal } = {}) {
  // Cache (sauf si force)
  if (!force && projectsCache) return projectsCache;

  if (USE_API) {
    try {
      projectsCache = await fetchAllFromApi(signal);
      return projectsCache;
    } catch (e) {
      // Fallback local si l'API échoue
      projectsCache = await fetchAllFromLocal();
      return projectsCache;
    }
  }

  projectsCache = await fetchAllFromLocal();
  return projectsCache;
}

/* -------------------- PUBLIC API -------------------- */

// --------- Liste des projets pour le carousel ---------
export async function fetchProjectsSummary(options = {}) {
  const { force = false, signal } = options;

  // Vérifie si les projets sont en cache
  if (!force && projectsSummaryCache) {
    return projectsSummaryCache;
  }

  try {
    const projects = await getAllProjects({ force, signal });

    // Mise en cache (summary)
    projectsSummaryCache = projects.map(toSummary);

    return projectsSummaryCache;
  } catch (error) {
    throw normalizeApiError(
      error,
      "Une erreur est survenue lors du chargement des projets.",
    );
  }
}

// --------- Détail d'un projet ---------
export async function fetchProjectDetail(slug, options = {}) {
  const { force = false, signal } = options;

  if (!slug) {
    const err = new Error("Slug de projet manquant.");
    err.status = null;
    err.data = null;
    throw err;
  }

  // Si le projet est déjà en cache
  if (!force && projectDetailCache.has(slug)) {
    return projectDetailCache.get(slug);
  }

  try {
    const projects = await getAllProjects({ force, signal });
    const project = projects.find((p) => p.slug === slug);

    if (!project) {
      const err = new Error("Projet introuvable.");
      err.status = 404;
      err.data = { slug };
      throw err;
    }

    // Mise en cache
    projectDetailCache.set(slug, project);

    return project;
  } catch (error) {
    throw normalizeApiError(
      error,
      "Une erreur est survenue lors du chargement du projet.",
    );
  }
}

// --------- Utilitaire ---------
export function clearProjectsCache() {
  projectsCache = null;
  projectsSummaryCache = null;
  projectDetailCache.clear();
}

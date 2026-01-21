import axios from "axios";

// URL de base de l'API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

// Timeout global (en ms)
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 10000);

/* -------------------- CLIENT AXIOS -------------------- */

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    Accept: "application/json",
  },
});

/* -------------------- INTERCEPTORS -------------------- */

// --------- Requêtes ---------
api.interceptors.request.use(
  (config) => {
    // Exemple : ajout d’un token si nécessaire
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// --------- Réponses / erreurs ---------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Pas de réponse du serveur (réseau, CORS, serveur off)
    if (!error.response) {
      const err = new Error(
        "Impossible de contacter le serveur. Vérifiez votre connexion.",
      );
      err.status = null;
      err.data = null;
      err.original = error;
      return Promise.reject(err);
    }

    const { status, data } = error.response;

    const message =
      data?.message ||
      (status >= 500
        ? "Une erreur serveur est survenue."
        : "Une erreur est survenue lors de la requête.");

    const err = new Error(message);
    err.status = status;
    err.data = data;
    err.original = error;

    return Promise.reject(err);
  },
);

export default api;

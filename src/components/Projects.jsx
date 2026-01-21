import { useRef, useLayoutEffect, useState, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { fetchProjectsSummary, fetchProjectDetail } from "../api/projectsApi";
import ProjectModal from "./ProjectModal";
import ProjectsCarousel from "./ProjectsCarousel";

gsap.registerPlugin(ScrollTrigger);

// Composant principal de la section Projets avec carousel et modale
const Projects = () => {
  const titleRef = useRef(null);
  const sectionRef = useRef(null);

  // Données des projets chargées depuis l'API pour le carousel
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Données des projets chargées depuis l'API pour les détails dans la modale
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProject, setModalProject] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Charger les projets depuis l'API au montage
  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        setLoading(true);
        const data = await fetchProjectsSummary();
        if (!isMounted) return;
        setProjects(data);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error("Erreur lors du chargement des projets :", err);
        setError(err.message || "Impossible de charger les projets.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  // Effet de parallax sur le titre
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const section = sectionRef.current;
      const title = titleRef.current;
      if (!section || !title) return;

      // Parallax sur le titre
      gsap.fromTo(
        title,
        { y: 100 }, // décalage initial vers le bas
        {
          y: -100, // décalage vers le haut à la fin
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Handler d'ouverture de la modale de projet
  const handleOpenModal = async (slug) => {
    if (!slug) return;

    setIsModalOpen(true);
    setModalLoading(true);
    setModalError(null);
    setModalProject(null);

    try {
      const project = await fetchProjectDetail(slug);
      setModalProject(project);
    } catch (err) {
      console.error("Erreur lors du chargement du projet :", err);
      setModalError(err.message || "Impossible de charger ce projet.");
    } finally {
      setModalLoading(false);
    }
  };

  // Handler de fermeture de la modale de projet
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalProject(null);
    setModalError(null);
  };

  // Rendu du composant
  return (
    <section className="projects" ref={sectionRef} id="projects">
      <h2 className="projects__title" ref={titleRef}>
        PROJECTS
      </h2>

      <p className="projects__subtitle">
        Je conçois des interfaces modernes et élégantes en alliant esthétique,
        performance et précision.
      </p>

      <ProjectsCarousel
        projects={projects}
        loading={loading}
        error={error}
        isModalOpen={isModalOpen}
        onOpenModal={handleOpenModal}
      />

      <ProjectModal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        project={modalProject}
        loading={modalLoading}
        error={modalError}
      />
    </section>
  );
};

export default Projects;

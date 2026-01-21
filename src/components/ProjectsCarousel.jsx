import { useRef, useLayoutEffect, useState, useEffect } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

// Composant du carousel de la section Projets (draggable + navigation)
const ProjectsCarousel = ({
  projects,
  loading,
  error,
  isModalOpen,
  onOpenModal,
}) => {
  const wrapperRef = useRef(null);
  const carouselRef = useRef(null);
  const cardsRef = useRef([]);
  const draggableRef = useRef(null);

  // Etat de la modale dans les listeners GSAP
  const isModalOpenRef = useRef(false);

  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  // API interne pour contrôler depuis les flèches
  const apiRef = useRef({
    goToRelative: () => {},
  });

  // Suivre la largeur de la fenêtre
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  // Met à jour la largeur au redimensionnement
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Effet carousel draggable
  useLayoutEffect(() => {
    // Ne rien faire tant que les projets ne sont pas chargés
    if (!projects.length) return;

    // Contexte GSAP pour le carousel
    const ctx = gsap.context(() => {
      const wrapper = wrapperRef.current;
      const carousel = carouselRef.current;
      const cards = cardsRef.current;

      if (!wrapper || !carousel || !cards.length) return;

      // Toujours repartir d'un x propre
      gsap.set(carousel, { x: 0 });

      const wrapperWidth = wrapper.offsetWidth;

      // Mesure réelle dans le repère du wrapper
      const wrapperRect = wrapper.getBoundingClientRect();

      const cardCenters = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        return rect.left - wrapperRect.left + rect.width / 2;
      });

      // Positions pour centrer chaque carte
      const targetPositions = cardCenters.map((c) => wrapperWidth / 2 - c);

      let isDragging = false;
      let dragStartX = 0;
      // Interaction sur le bouton "Voir le détail"
      let pressedOnCTA = false;
      let indexOnPressCTA = 0;

      // Met à jour le scale des cartes en fonction de la position
      const updateScale = () => {
        const bounds = wrapper.getBoundingClientRect();
        const center = bounds.left + bounds.width / 2;

        const dragFactor = isDragging ? 0.97 : 1;

        // Met à l'échelle chaque carte en fonction de la distance au centre
        cards.forEach((card) => {
          if (!card) return;
          const rect = card.getBoundingClientRect();
          const cardCenter = rect.left + rect.width / 2;
          const dist = Math.abs(center - cardCenter);
          const ratio = gsap.utils.clamp(0, 1, dist / (bounds.width / 2));
          const baseScale = 0.9 + (1.06 - 0.9) * (1 - ratio);
          const scale = baseScale * dragFactor;

          gsap.to(card, {
            scale,
            duration: 0.15,
            ease: "power2.out",
            overwrite: "auto",
          });
        });
      };

      // Trouve l'index de la carte la plus proche du centre
      const getClosestIndex = () => {
        const currentX = parseFloat(gsap.getProperty(carousel, "x")) || 0;

        let closestIndex = 0;
        let closestDist = Infinity;

        targetPositions.forEach((tx, index) => {
          const dist = Math.abs(currentX - tx);
          if (dist < closestDist) {
            closestDist = dist;
            closestIndex = index;
          }
        });

        return closestIndex;
      };

      // Anime le carousel pour centrer la carte à l'index donné
      const snapToIndex = (targetIndex) => {
        const clamped = gsap.utils.clamp(
          0,
          targetPositions.length - 1,
          targetIndex,
        );

        const targetX = targetPositions[clamped];
        const currentX = parseFloat(gsap.getProperty(carousel, "x")) || 0;
        const distance = Math.abs(currentX - targetX);

        // Pas d'animation si la distance est faible
        if (distance < 5) {
          isDragging = false;
          updateScale();
          return;
        }

        isDragging = false;

        // Animation vers la position cible
        gsap.to(carousel, {
          x: targetX,
          duration: 0.25,
          ease: "power2.out",
          onUpdate: () => {
            draggableRef.current && draggableRef.current.update();
            updateScale();
          },
        });
      };

      // Centre la carte la plus proche
      const snapToClosest = () => {
        const idx = getClosestIndex();
        snapToIndex(idx);
      };

      const finishDrag = (finalX) => {
        const delta = finalX - dragStartX;
        // Mouvement minimale pour le drag
        const threshold = 18;

        if (Math.abs(delta) > threshold) {
          const direction = delta < 0 ? 1 : -1;
          const current = getClosestIndex();
          snapToIndex(current + direction);
        } else {
          // Si le mouvement est trop petit la carte ne bouge pas
          snapToClosest();
        }
      };

      // Draggable avec bounds à jour
      draggableRef.current = Draggable.create(carousel, {
        type: "x",
        inertia: true,
        dragClickables: true,
        bounds: {
          minX: targetPositions[targetPositions.length - 1],
          maxX: targetPositions[0],
        },

        onPress: function (event) {
          // Si l'interaction commence sur le bouton "Voir le détail"
          if (event.target.closest(".project-card__cta")) {
            pressedOnCTA = true;
            isDragging = false;
            // Mémorise la carte active au moment du press
            indexOnPressCTA = getClosestIndex();
            dragStartX = this.x;
            return;
          }

          // Drag normal
          pressedOnCTA = false;
          isDragging = true;
          dragStartX = this.x;
          updateScale();
        },

        onDrag: function () {
          updateScale();
        },

        onThrowUpdate: function () {
          updateScale();
        },

        onRelease: function () {
          if (pressedOnCTA) {
            pressedOnCTA = false;
            snapToIndex(indexOnPressCTA);
            return;
          }

          finishDrag(this.x);
        },

        onDragEnd: function () {
          if (pressedOnCTA) {
            pressedOnCTA = false;
            snapToIndex(indexOnPressCTA);
            return;
          }

          finishDrag(this.x);
        },
      })[0];

      // Centrer la première carte au chargement
      gsap.set(carousel, { x: targetPositions[0] });
      draggableRef.current.update();
      updateScale();

      const goToRelative = (step) => {
        const current = getClosestIndex();
        snapToIndex(current + step);
      };

      apiRef.current.goToRelative = goToRelative;
      apiRef.current.goToIndex = (index) => {
        snapToIndex(index);
      };

      // Navigation clavier avec flèches gauche/droite
      const onKeyDown = (e) => {
        // Pas de navigation si la modale est ouverte
        if (isModalOpenRef.current) return;

        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;

        const section = wrapperRef.current?.closest("section");
        if (!section) return;

        // Vérifie si la section est dans le viewport
        const rect = section.getBoundingClientRect();
        const inView = rect.bottom > 0 && rect.top < window.innerHeight;

        // Vérifie si le focus est dans la section
        const activeElement = document.activeElement;
        const hasFocusInside = activeElement && section.contains(activeElement);

        if (!inView || !hasFocusInside) {
          return;
        }

        e.preventDefault();

        if (e.key === "ArrowRight") {
          goToRelative(1);
        } else if (e.key === "ArrowLeft") {
          goToRelative(-1);
        }
      };

      window.addEventListener("keydown", onKeyDown);

      // Nettoyage des listeners et Draggable au démontage
      return () => {
        window.removeEventListener("keydown", onKeyDown);
        if (draggableRef.current) {
          draggableRef.current.kill();
          draggableRef.current = null;
        }
      };
    }, wrapperRef);

    // Nettoyage du contexte GSAP au démontage
    return () => ctx.revert();
  }, [viewportWidth, projects.length]);

  // Navigation via les boutons fléchés
  const handlePrev = () => {
    apiRef.current.goToRelative(-1);
  };
  const handleNext = () => {
    apiRef.current.goToRelative(1);
  };

  // Rendu du composant
  return (
    <div className="projects__carousel-wrapper" ref={wrapperRef}>
      {loading && (
        <div className="projects__status projects__status--loading">
          Chargement des projets...
        </div>
      )}

      {error && !loading && (
        <div className="projects__status projects__status--error"></div>
      )}

      {!loading && !error && projects.length > 0 && (
        <>
          <div className="projects__carousel" ref={carouselRef}>
            {projects.map((project, index) => (
              <article
                key={project.id}
                className="project-card"
                ref={(el) => (cardsRef.current[index] = el)}
                onFocus={() => {
                  // Ne pas bouger le carousel si la modale est ouverte
                  if (isModalOpenRef.current) return;
                  if (
                    apiRef.current &&
                    typeof apiRef.current.goToIndex === "function"
                  ) {
                    apiRef.current.goToIndex(index);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target === e.currentTarget) {
                    e.preventDefault();
                    onOpenModal(project.slug);
                  }
                }}
                tabIndex={0}
                aria-label={`Voir les détails du projet ${project.title}`}
              >
                <div className="project-card__head">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div className="project-card__content">
                  {project.thumbnail && (
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="project-card__image"
                    />
                  )}
                </div>

                <div className="project-card__hover">
                  <h3 className="project-card__title">
                    {project.shortDescription}
                  </h3>
                  <button
                    type="button"
                    className="project-card__cta"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenModal(project.slug);
                    }}
                  >
                    Voir le détail
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="projects__controls">
            <button
              className="projects__arrow projects__arrow--left"
              type="button"
              aria-label="Projet précédent"
              onClick={handlePrev}
            >
              ‹
            </button>

            <button
              className="projects__arrow projects__arrow--right"
              type="button"
              aria-label="Projet suivant"
              onClick={handleNext}
            >
              ›
            </button>
          </div>
        </>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="projects__status projects__status--empty"></div>
      )}
    </div>
  );
};

export default ProjectsCarousel;

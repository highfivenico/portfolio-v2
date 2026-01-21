import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

const Button = () => {
  const buttonRef = useRef(null);

  // Animation hover du flair
  useLayoutEffect(() => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;
    const flair = button.querySelector(".button__flair");

    const xSet = gsap.quickSetter(flair, "xPercent");
    const ySet = gsap.quickSetter(flair, "yPercent");

    const getXY = (e) => {
      const { left, top, width, height } = button.getBoundingClientRect();
      const x = Math.min(Math.max(((e.clientX - left) / width) * 100, 0), 100);
      const y = Math.min(Math.max(((e.clientY - top) / height) * 100, 0), 100);
      return { x, y };
    };

    const onMouseMove = (e) => {
      const { x, y } = getXY(e);
      gsap.to(flair, {
        xPercent: x,
        yPercent: y,
        duration: 0.4,
        ease: "power2",
      });
    };

    const onMouseEnter = (e) => {
      const { x, y } = getXY(e);
      xSet(x);
      ySet(y);
      gsap.to(flair, { scale: 1, duration: 0.4, ease: "power2.out" });
    };

    const onMouseLeave = (e) => {
      const { x, y } = getXY(e);
      gsap.killTweensOf(flair);
      gsap.to(flair, {
        xPercent: x > 90 ? x + 20 : x < 10 ? x - 20 : x,
        yPercent: y > 90 ? y + 20 : y < 10 ? y - 20 : y,
        scale: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    button.addEventListener("mousemove", onMouseMove);
    button.addEventListener("mouseenter", onMouseEnter);
    button.addEventListener("mouseleave", onMouseLeave);

    return () => {
      button.removeEventListener("mousemove", onMouseMove);
      button.removeEventListener("mouseenter", onMouseEnter);
      button.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  // Clic sur le bouton → LinkedIn avec animation
  const handleClick = (e) => {
    e.preventDefault();
    const flair = buttonRef.current.querySelector(".button__flair");

    gsap.to(".button", { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
    gsap.to(flair, {
      scale: 1.3,
      rotation: 10,
      duration: 0.3,
      ease: "power2.out",
      onComplete: () => {
        window.open(
          "https://www.linkedin.com/in/highfivenico/",
          "_blank",
          "noopener,noreferrer",
        );
      },
    });
  };

  return (
    <a
      href="https://www.linkedin.com/in/tonprofil"
      className="button button--stroke"
      ref={buttonRef}
      onClick={handleClick}
    >
      <span className="button__label">ME CONTACTER</span>
      <div className="button__flair"></div>
    </a>
  );
};

export default Button;

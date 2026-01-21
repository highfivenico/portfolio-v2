import Button from "./Button";

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero__content">
        <p className="hero__intro">
          Bonjour, je suis Nicolas — développeur passionné par le design,
          l'expérience utilisateur et la technique.
        </p>
        <Button />
      </div>
    </section>
  );
};

export default Hero;

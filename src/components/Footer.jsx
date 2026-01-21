import Button from "./Button";

const Footer = () => {
  return (
    <footer className="footer">
      <p className="footer__text">
        Un projet, une idée, une envie de collaborer ?
        <br />
        N'hésitez pas à me contacter !
      </p>
      <Button variant="light" />
    </footer>
  );
};

export default Footer;

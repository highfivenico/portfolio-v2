import Hero from "../components/Hero";
import Projects from "../components/Projects";
import About from "../components/About";
import Footer from "../components/Footer";

const Home = () => {
  return (
    <div className="app">
      <Hero />
      <Projects />
      <About />
      <Footer />
    </div>
  );
};

export default Home;

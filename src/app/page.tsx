import Hero from "@/components/sections/Hero";
import Marquee from "@/components/sections/Marquee";
import About from "@/components/sections/About";
import Projects from "@/components/sections/Projects";
import Services from "@/components/sections/Services";
import Process from "@/components/sections/Process";
import Crate from "@/components/sections/Crate";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <About />
      <Projects />
      <Crate />
      <Services />
      <Process />
      <Contact />
    </>
  );
}

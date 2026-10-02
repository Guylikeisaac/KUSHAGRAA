export const profile = {
  name: "Kushagra Chaudhary",
  heroName: "KUSHAGRA",
  title: "Creative Developer & Product Builder",
  pitch:
    "I build high-quality websites and digital products for ambitious businesses worldwide.",
  location: "Bengaluru, India",
  coords: "12.97° N — 77.59° E",
  timezone: "Asia/Kolkata",
  education: "B.Tech — Computer Science & Engineering",
  school: "Bennett University",
  experience: "3+ years",
  email: "kushagrachaudhary196@gmail.com",
  whatsapp: "+91 75797 10491",
  whatsappLink: "https://wa.me/917579710491",
  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/kushagra-chaudhary-1323b628a/" },
    { label: "GitHub", href: "https://github.com/Guylikeisaac" },
    { label: "Instagram", href: "https://www.instagram.com/guylikeisaac/" },
  ],
  stack: [
    "Next.js",
    "React",
    "TypeScript",
    "JavaScript",
    "Tailwind CSS",
    "HTML / CSS",
    "Node.js",
    "Express.js",
    "MongoDB",
    "Git / GitHub",
    "Figma",
    "Vercel",
    "AI-assisted development",
  ],
};

export type Project = {
  slug: string;
  index: number;
  name: string;
  subtitle: string;
  category: string;
  role: string;
  contribution: string;
  tech: string[];
  summary: string;
  story: string;
  outcomes: string[];
  live: string;
  cover: string;
  accent: string;
};

export const projects: Project[] = [
  {
    slug: "evalis",
    index: 0,
    name: "Evalis",
    subtitle: "Academic grading platform",
    category: "EdTech / SaaS",
    role: "Product Designer & Developer",
    contribution: "Design · Frontend · Product development",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Figma"],
    summary:
      "A modern academic grading platform that simplifies grade management and makes academic performance easier to understand for students and educators.",
    story:
      "I gathered requirements directly from faculty, translated them into product design, and built an end-to-end platform that cuts unnecessary steps out of everyday academic workflows.",
    outcomes: [
      "End-to-end academic grading platform",
      "Designed around simplified academic workflows",
      "Built from real user requirements into a working product",
    ],
    live: "https://evalis-gt.vercel.app/",
    cover: "/img/projects/evalis-cd-v2.jpg",
    accent: "#ff3b2f",
  },
  {
    slug: "rk-propwell",
    index: 1,
    name: "RK Propwell",
    subtitle: "Real-estate platform",
    category: "Real Estate / Web Platform",
    role: "Full-Stack Developer / Product Designer",
    contribution: "UI/UX · Development",
    tech: ["MongoDB", "Express.js", "React", "Node.js"],
    summary:
      "A modern real-estate platform that helps people discover, buy and rent properties through a simple, visually driven experience.",
    story:
      "Built for a property dealer: I designed and developed the discovery experience end to end, from the visual language to the browsing and rental flows.",
    outcomes: [
      "Designed and developed the property discovery experience",
      "Built a fully responsive real-estate interface",
      "Implemented property browsing and rental-focused user flows",
    ],
    live: "https://real-93g3.vercel.app/",
    cover: "/img/projects/rk-propwell-cd-v3.jpg",
    accent: "#e11d2e",
  },
  {
    slug: "bu-serves",
    index: 2,
    name: "BU Serves",
    subtitle: "Campus services platform",
    category: "Campus / Service Platform",
    role: "Full-Stack Developer & Product Designer",
    contribution: "Design · Development",
    tech: ["MongoDB", "Express.js", "React", "Node.js"],
    summary:
      "A campus-services platform that brings everyday student services (food, salon and laundry) into one centralized experience.",
    story:
      "Built for my college: BU Serves puts everyday campus services behind one door, so students can find and book what they need without the back-and-forth of running around campus.",
    outcomes: [
      "Centralized multiple campus services into one platform",
      "Designed a simplified service-discovery experience",
      "Built a responsive web experience for students",
    ],
    live: "https://bu-serves.vercel.app/",
    cover: "/img/projects/bu-serves-cd-v2.jpg",
    accent: "#ff4d6d",
  },
];

export const services = [
  {
    no: "01",
    title: "Marketing websites",
    body: "Fast, animated, conversion-minded sites and landing pages for brands that want to look the part.",
  },
  {
    no: "02",
    title: "Web apps & SaaS",
    body: "Dashboards, portals and platforms, designed and built end to end. Evalis is one of them.",
  },
  {
    no: "03",
    title: "Portfolios & personal brands",
    body: "Sites like this one, for founders, creatives and professionals who want to be remembered.",
  },
  {
    no: "04",
    title: "Product design",
    body: "Figma to production. User flows, interfaces and design systems that actually ship.",
  },
];

export const process = [
  {
    no: "01",
    title: "Discover",
    body: "We talk goals, audience and what success looks like. You get a clear scope, timeline and price before anything starts.",
  },
  {
    no: "02",
    title: "Design",
    body: "Wireframes first, then high-fidelity Figma designs you can click through and react to before a single line of code.",
  },
  {
    no: "03",
    title: "Build",
    body: "Next.js, TypeScript and Tailwind. Animated, responsive, fast and accessible, with progress you can see every week.",
  },
  {
    no: "04",
    title: "Launch",
    body: "Deployed on Vercel with SEO basics and analytics in place, plus a clean handover so you own everything.",
  },
];

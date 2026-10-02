import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Instrument_Sans, Instrument_Serif, JetBrains_Mono, UnifrakturCook } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Loader from "@/components/Loader";
import Cursor from "@/components/Cursor";
import Nav from "@/components/Nav";
import DiscCanvas from "@/components/disc/DiscCanvas";
import { TransitionProvider } from "@/components/Transition";
import Soundtrack from "@/components/Soundtrack";

const display = Big_Shoulders({ subsets: ["latin"], weight: "variable", axes: ["opsz"], variable: "--font-display" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });
const blackletter = UnifrakturCook({ subsets: ["latin"], weight: "700", variable: "--font-black" });

const site = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const metadata: Metadata = {
  metadataBase: new URL(site ? `https://${site}` : "http://localhost:3000"),
  title: "Kushagra Chaudhary — Creative Developer & Product Builder",
  description:
    "I build high-quality websites and digital products for ambitious businesses worldwide. Based in Bengaluru, working with clients everywhere.",
  openGraph: {
    title: "Kushagra Chaudhary — Creative Developer & Product Builder",
    description: "High-quality websites and digital products for ambitious businesses worldwide.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Kushagra Chaudhary — Creative Developer & Product Builder" }],
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${serif.variable} ${mono.variable} ${blackletter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preload" as="image" href="/img/loader-collage.jpg" />
        {/* a fresh load always opens on the landing page: no restored scroll, no leftover #section */}
        <script
          dangerouslySetInnerHTML={{
            __html: `history.scrollRestoration="manual";if(location.hash){history.replaceState(history.state,"",location.pathname+location.search)}window.scrollTo(0,0);`,
          }}
        />
      </head>
      <body>
        <a
          href="#main"
          className="fixed left-4 top-4 z-[300] -translate-y-24 rounded-full bg-bone px-4 py-2 text-sm font-semibold text-ink focus:translate-y-0"
        >
          Skip to content
        </a>
        <SmoothScroll />
        <TransitionProvider>
          <Loader />
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(120%_70%_at_50%_120%,rgba(255,59,47,0.16),transparent_60%),radial-gradient(80%_50%_at_100%_0%,rgba(255,255,255,0.04),transparent_60%)]"
          />
          <DiscCanvas />
          <Nav />
          <main id="main">{children}</main>
          <Soundtrack />
          <Cursor />
          <div className="grain" aria-hidden />
        </TransitionProvider>
      </body>
    </html>
  );
}

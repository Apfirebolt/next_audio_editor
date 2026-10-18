// app/about/page.jsx
import AboutClient from "./AboutClient";

export const metadata = {
  title: "About Softgenie Beats | Browser-Based DAW & Virtual Synth Studio",
  description: "Discover Softgenie Beats, a high-performance browser-based Digital Audio Workstation (DAW) powered by Tone.js, Web Audio API, and client-side audio rendering.",
  keywords: ["Browser DAW", "Tone.js Studio", "Web Audio API", "Virtual Synthesizer", "Online Music Producer"],
  openGraph: {
    title: "About Softgenie Beats | Browser-Based DAW",
    description: "Compose multi-track arrangements and play virtual instruments directly in your browser with zero installation.",
    type: "website",
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
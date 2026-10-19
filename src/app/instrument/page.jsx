// app/about/page.jsx
import InstrumentClient from "./InstrumentClient";

export const metadata = {
  title: "About Softgenie Beats | Virtual Instruments",
  description: "Discover Softgenie Beats, a high-performance browser-based Digital Audio Workstation (DAW) powered by Tone.js, Web Audio API, and client-side audio rendering.",
  keywords: ["Browser DAW", "Tone.js Studio", "Web Audio API", "Virtual Synthesizer", "Online Music Producer"],
  openGraph: {
    title: "About Softgenie Beats | Virtual Instruments",
    description: "Use Softgenie Beats to create music with virtual instruments directly in your browser. Use mic input to record vocals and instruments seamlessly.",
    type: "website",
  },
};

export default function InstrumentPage() {
  return <InstrumentClient />;
}
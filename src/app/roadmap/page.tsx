import type { Metadata } from "next";
import { RoadmapView } from "./roadmap-view";

export const metadata: Metadata = {
  title: "Roadmap | Koinos",
  description:
    "Acompanhe o que já entregamos, o que está em desenvolvimento e o que planejamos para o futuro do Koinos.",
};

export default function RoadmapPage() {
  return <RoadmapView />;
}

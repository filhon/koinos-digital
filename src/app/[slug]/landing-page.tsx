"use client";

import {
  type FullLandingData,
  type LandingSection,
} from "@/lib/validators/landing-page";
import HeroSection from "./sections/hero-section";
import AboutSection from "./sections/about-section";
import PastorSection from "./sections/pastor-section";
import LeadershipSection from "./sections/leadership-section";
import EventsSection from "./sections/events-section";
import StreamingSection from "./sections/streaming-section";
import AddressSection from "./sections/address-section";
import CtaSection from "./sections/cta-section";
import LandingNav from "./landing-nav";

interface Props {
  data: FullLandingData;
}

const SECTION_MAP: Record<
  LandingSection,
  (props: { data: FullLandingData }) => React.ReactNode
> = {
  hero: ({ data }) => <HeroSection data={data} />,
  about: ({ data }) => (data.about_us ? <AboutSection data={data} /> : null),
  pastor: ({ data }) =>
    data.pastor_name || data.pastor_bio ? <PastorSection data={data} /> : null,
  leadership: ({ data }) =>
    data.leadership.length > 0 ? <LeadershipSection data={data} /> : null,
  events: ({ data }) =>
    data.upcomingEvents.length > 0 ? <EventsSection data={data} /> : null,
  streaming: ({ data }) =>
    data.streaming_url ? <StreamingSection data={data} /> : null,
  address: ({ data }) =>
    data.address_text || data.address_embed_url ? (
      <AddressSection data={data} />
    ) : null,
  cta: ({ data }) => <CtaSection data={data} />,
};

export default function LandingPageClient({ data }: Props) {
  return (
    <div
      className="min-h-screen bg-[oklch(0.97_0.005_250)]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <LandingNav churchName={data.name} />
      {data.sections_order.map((section) => {
        const Component = SECTION_MAP[section];
        return Component ? (
          <section key={section} id={section}>
            <Component data={data} />
          </section>
        ) : null;
      })}

      {/* Footer simples */}
      <footer className="border-t border-[oklch(0.88_0.01_250)] bg-[oklch(0.13_0.025_250)] text-[oklch(0.65_0.02_250)] py-10 px-6 text-center text-sm">
        <p
          style={{ fontFamily: "var(--font-display)" }}
          className="text-base text-[oklch(0.8_0.03_250)] mb-1"
        >
          {data.name}
        </p>
        <p>
          Powered by <span className="text-[oklch(0.78_0.13_55)]">Koinos</span>
        </p>
      </footer>
    </div>
  );
}

import type { CommuteMode } from "@/lib/types";

/**
 * The four commute modes. Only 2-Wheeler is live at launch; the rest render a
 * "Coming Soon" treatment with their catalogues hidden (build-plan §1).
 */
export const MODES: CommuteMode[] = [
  {
    id: "mode-2w",
    slug: "2-wheeler",
    name: "2-Wheeler",
    icon: "two-wheeler",
    status: "live",
    tagline: "Built for the daily ride",
    description:
      "Essentials engineered for life on two wheels — sweat, weather, grime and the everyday grind of the commute, handled.",
    bannerImage: { pattern: "compass", accent: 800, tone: "navy", seed: "2w-banner" },
  },
  {
    id: "mode-4w",
    slug: "4-wheeler",
    name: "4-Wheeler",
    icon: "four-wheeler",
    status: "coming_soon",
    tagline: "In development",
    description:
      "Cabin care, organisation and comfort for the four-wheel commute. Landing soon.",
  },
  {
    id: "mode-ped",
    slug: "pedestrian",
    name: "Pedestrian",
    icon: "pedestrian",
    status: "coming_soon",
    tagline: "In development",
    description:
      "Carry-light essentials for the walk-and-transit commuter. Landing soon.",
  },
  {
    id: "mode-pt",
    slug: "public-transport",
    name: "Public Transport",
    icon: "public-transport",
    status: "coming_soon",
    tagline: "In development",
    description:
      "Compact, commute-ready kit for buses, trains and the metro. Landing soon.",
  },
];

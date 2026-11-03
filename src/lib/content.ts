/**
 * Everything the pages say, in one place.
 *
 * Copy marked DRAFT is placeholder text written in the studio's voice,
 * to be replaced when the client sends the real words. Images are
 * placeholders until then too: give an entry an `image` (a path under
 * /public) and the page shows the photograph instead.
 */

export type Section = {
  href: string;
  /** How the section is named in the cover's contents. */
  label: string;
  /** The page's own heading. */
  title: string;
  /** Page number, set small in the corner like a printed folio. */
  folio: string;
  /** One line for search results and shared links. */
  description: string;
};

/** The book, in reading order. Page turns go forward or back by this. */
export const sections: Section[] = [
  {
    href: "/",
    label: "Cover",
    title: "Interiors By B.",
    folio: "i",
    description: "",
  },
  {
    href: "/about",
    label: "About us",
    title: "About Us",
    folio: "ii",
    description:
      "Interiors By B. is a residential and commercial interior design studio. Intentional spaces that tell meaningful stories — curious, curated and connected.",
  },
  {
    href: "/services",
    label: "Our services",
    title: "Our Services",
    folio: "iii",
    description:
      "Interior design & consultation, space planning, procurement and project management for homes and businesses.",
  },
  {
    href: "/projects",
    label: "Our projects",
    title: "Our Projects",
    folio: "iv",
    description:
      "Selected residential and commercial interiors by Interiors By B.",
  },
  {
    href: "/contact",
    label: "Contact us",
    title: "Contact Us",
    folio: "v",
    description:
      "Tell us about your space. Get in touch with Interiors By B. to begin your project.",
  },
];

export const sectionByHref = (href: string) =>
  sections.find((section) => section.href === href);

/**
 * Where a path sits in the book. A detail page (/services/space-planning)
 * sits just after its section, so opening one turns forward and leaving
 * it turns back.
 */
export function pageOrder(pathname: string): number {
  const path = pathname.replace(/\/+$/, "") || "/";
  const exact = sections.findIndex((section) => section.href === path);
  if (exact !== -1) return exact;
  const parent = sections.findIndex(
    (section) => section.href !== "/" && path.startsWith(`${section.href}/`),
  );
  return parent === -1 ? 0 : parent + 0.5;
}

/** The section after (or before) the one a path belongs to. */
export function neighbour(pathname: string, step: 1 | -1): string | undefined {
  const order = pageOrder(pathname);
  // A detail page's previous page is its own section's list.
  const index = step === 1 ? Math.floor(order) + 1 : Math.ceil(order) - 1;
  return sections[index]?.href;
}

// ─── About ───────────────────────────────────────────────────────────

export const about = {
  /** The studio bio, as it stands today. */
  bio: "is a residential and commercial interior design studio. We design intentional spaces that tell meaningful stories — rooted in purpose, shaped by context, and executed with quiet excellence.",
  image: undefined as string | undefined,
  /** DRAFT */
  philosophy: [
    {
      title: "We are Curious",
      body: "Every project begins with questions — about how you live, what you love and the story your space should tell. We listen first, then design.",
    },
    {
      title: "We Curate",
      body: "Each material, piece and finish is chosen with intent. We edit carefully, so what remains feels considered, personal and built to last.",
    },
    {
      title: "We Connect",
      body: "Good design connects people to place. We bring makers, suppliers and trades together to deliver spaces that feel effortlessly whole.",
    },
  ],
};

// ─── Services ────────────────────────────────────────────────────────

export type Service = {
  slug: string;
  name: string;
  /** DRAFT — one line for the service's page and search results. */
  summary: string;
};

export const services: Service[] = [
  {
    slug: "interior-design-consultation",
    name: "Interior Design & Consultation",
    summary:
      "From a single room to a whole home or workplace: a design direction shaped around how you live and work.",
  },
  {
    slug: "space-planning",
    name: "Space Planning",
    summary:
      "Layouts that make every square metre work harder — flow, light and function considered from the start.",
  },
  {
    slug: "procurement",
    name: "Procurement",
    summary:
      "Sourcing, ordering and coordinating every piece, so the right things arrive in the right place.",
  },
  {
    slug: "project-management",
    name: "Project Management",
    summary:
      "One point of contact from first sketch to final styling, keeping trades, timelines and budgets on course.",
  },
];

/** DRAFT — the wide photograph under the services list. */
export const servicesImage = undefined as string | undefined;

// ─── Projects ────────────────────────────────────────────────────────

export type Project = {
  slug: string;
  /** DRAFT */
  title: string;
  /** DRAFT */
  kind: string;
  /** DRAFT */
  summary: string;
  image?: string;
};

export const projects: Project[] = [
  {
    slug: "the-garden-house",
    title: "The Garden House",
    kind: "Residential",
    summary: "A family home opened up to the light and the garden beyond.",
  },
  {
    slug: "atelier-nine",
    title: "Atelier Nine",
    kind: "Commercial",
    summary: "A calm, tactile studio space for a creative practice.",
  },
  {
    slug: "the-courtyard-apartment",
    title: "The Courtyard Apartment",
    kind: "Residential",
    summary: "A compact apartment made generous through careful planning.",
  },
];

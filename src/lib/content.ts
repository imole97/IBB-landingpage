/**
 * Everything the pages say, in one place.
 *
 * Copy marked DRAFT is placeholder text written in the studio's voice,
 * to be replaced when the client sends the real words.
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
    href: "/process",
    label: "Our process",
    title: "Our Process",
    folio: "iv",
    description:
      "How your story is written: six stages, from discovery to the final reveal — curious, curated and connected throughout.",
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
 * it turns back. The process stages sit in sequence after Our Process, so
 * turning from one stage to an earlier one turns back.
 */
export function pageOrder(pathname: string): number {
  const path = pathname.replace(/\/+$/, "") || "/";
  const exact = sections.findIndex((section) => section.href === path);
  if (exact !== -1) return exact;
  const parent = sections.findIndex(
    (section) => section.href !== "/" && path.startsWith(`${section.href}/`),
  );
  if (parent === -1) return 0;
  const stage = stageIndex(path);
  if (stage !== -1) return parent + (stage + 1) / (studioProcess.stages.length + 1);
  return parent + 0.5;
}

/**
 * The page after (or before) this one. Mostly that's the next section;
 * the process stages are read in sequence, from Our Process through to
 * the final reveal and on to Contact us.
 */
export function neighbour(pathname: string, step: 1 | -1): string | undefined {
  const path = pathname.replace(/\/+$/, "") || "/";
  const stage = stageIndex(path);
  if (stage !== -1) {
    const next = studioProcess.stages[stage + step];
    if (next) return stageHref(next);
    if (step === -1) return PROCESS_HREF;
  }
  const order = pageOrder(path);
  // A detail page's previous page is its own section's list.
  const index = step === 1 ? Math.floor(order) + 1 : Math.ceil(order) - 1;
  return sections[index]?.href;
}

/** How a page is named in a "turn to" link: its section, or its stage. */
export function pageLabel(href: string): string | undefined {
  const stage = stageIndex(href);
  if (stage !== -1) return studioProcess.stages[stage].name;
  return sectionByHref(href)?.label;
}

// ─── About ───────────────────────────────────────────────────────────

export const about = {
  /** The studio bio, as it stands today. */
  bio: "is a residential and commercial interior design studio. We design intentional spaces that tell meaningful stories — rooted in purpose, shaped by context, and executed with quiet excellence.",
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

// ─── Process ─────────────────────────────────────────────────────────

export type Stage = {
  slug: string;
  /** Where it sits in the story: "Draft 01" … "Final Reveal". */
  draft: string;
  name: string;
  paragraphs: string[];
};

const PROCESS_HREF = "/process";

/** How your story is written — the studio's six stages, in its own words. */
export const studioProcess = {
  heading: "How your story is written.",
  lede: "Every great story has a structure. Here is ours.",
  /** Plain text, with the three words the studio sets apart in `words`. */
  intro: [
    { text: "Ours has six stages — and everything we do across them comes back to the same three things. We stay " },
    { word: "Curious" },
    { text: " about the people behind every brief. We stay " },
    { word: "Curated" },
    { text: " in every decision we make on their behalf. And we stay " },
    { word: "Connected" },
    { text: " — to the vision, the detail, and to you — until the very last page. Here is how your story gets written." },
  ] as ({ text: string } | { word: string })[],
  stages: [
    {
      slug: "discovery",
      draft: "Draft 01",
      name: "Discovery",
      paragraphs: [
        "This is where everything begins — with a real conversation, not a questionnaire. We are genuinely curious about you before we are curious about your space. How you live, what you love, what quietly bothers you, and what you’ve been wanting to do but haven’t quite said out loud yet.",
        "We ask good questions, we listen properly, and we make the process feel a lot more like getting to know someone than filling in a brief. We might even make you laugh. The clarity we build together here shapes every single decision that follows — so we never rush it.",
      ],
    },
    {
      slug: "concept-development",
      draft: "Draft 02",
      name: "Concept Development",
      paragraphs: [
        "Every story has a genre — and so does every well-designed space. This is the stage where we find yours. We are curious enough to keep asking until we land on a concept that genuinely fits — not one that just looks good on paper. Through mood boards, colour and material direction, and a genuine back and forth, we develop a design language that captures the feeling and identity of your space.",
        "Think of it as finding the kind of book you’d reach for without thinking. Are you a slow-burn literary novel or a bold, graphic thriller? We figure that out together — and nothing moves forward until we’re both looking at the same picture.",
      ],
    },
    {
      slug: "design-and-detailing",
      draft: "Draft 03",
      name: "Design & Detailing",
      paragraphs: [
        "This is where the concept becomes a real, workable design. Floor plans, elevations, material specifications, furniture layouts, lighting plans — every detail considered and documented. We believe the difference between a good space and a great one almost always lives in the details, so this stage gets the attention it deserves.",
        "Fair warning: this is also when the artisans arrive. We handle them so you don’t have to — and we do it with a smile. Mostly.",
      ],
    },
    {
      slug: "procurement-and-sourcing",
      draft: "Draft 04",
      name: "Procurement & Sourcing",
      paragraphs: [
        "With the design approved, we source everything your space needs — furniture, lighting, finishes, fixtures, and the considered details that pull it all together. Every piece is curated with the same rigour we brought to the design itself. We use our supplier relationships and knowledge of the market to find what genuinely fits, not just what’s available.",
        "We look, you approve, we buy — and yes, your wallet will feel it. But you’ll never have to spend an evening lost in a rabbit hole of fabric swatches and delivery lead times. We handle all of that.",
      ],
    },
    {
      slug: "project-management-and-delivery",
      draft: "Draft 05",
      name: "Project Management & Delivery",
      paragraphs: [
        "We stay on site and on it. From contractor coordination to installation oversight, we manage the delivery of your project so that what gets built actually matches what was designed — down to the last detail. Staying connected to the process at every stage is how we make sure nothing gets lost between the drawing and the doing.",
        "If someone installs the wrong tiles, we handle that conversation — so you don’t have to. We communicate clearly, we anticipate problems before they become yours, and you’ll never have to chase us for an update.",
      ],
    },
    {
      slug: "reveal-and-handover",
      draft: "Final Reveal",
      name: "Reveal & Handover",
      paragraphs: [
        "This is the moment your chapter gets its cover. The space is complete, the story is told, and everything you said yes to — every material, every detail, every considered decision — is finally standing in front of you as a finished whole. This is what staying curated, curious, and connected from start to finish actually looks like.",
        "We walk you through everything, make sure it’s exactly as it should be, and hand it back to you — complete, considered, and entirely yours. We’ll be there too, probably more excited than we should professionally admit. The kind of space that stops people when they walk in. The kind that belongs on the shelf and stays there.",
      ],
    },
  ] satisfies Stage[] as Stage[],
};

export const stageHref = (stage: Stage) => `${PROCESS_HREF}/${stage.slug}`;

/** Which stage a path is, or -1. */
function stageIndex(pathname: string): number {
  const path = pathname.replace(/\/+$/, "");
  return studioProcess.stages.findIndex((stage) => stageHref(stage) === path);
}

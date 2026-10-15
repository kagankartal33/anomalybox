export type ClusterLink = {
  slug: string;
  title: string;
  anchorText: string;
};

export const LANE_CLUSTER_LINKS: Record<string, ClusterLink[]> = {
  ugc: [
    {
      slug: "brand-safe-ugc-brief",
      title: "How to Write a Brand-Safe UGC Brief",
      anchorText: "Brand-Safe UGC Briefing Guidelines",
    },
    {
      slug: "ugc-creator-portfolio-shot-list",
      title: "UGC Creator Portfolio Shot List & Script Structure",
      anchorText: "UGC Portfolio Shot List Framework",
    },
    {
      slug: "skincare-brand-ugc-brief-framework",
      title: "Skincare Brand UGC Brief Framework",
      anchorText: "Skincare UGC Brief Framework",
    },
    {
      slug: "ugc-non-payment-prevention-and-contracts",
      title: "UGC Non-Payment Prevention and Contract Safety Rules",
      anchorText: "UGC Contract Safety Rules",
    },
    {
      slug: "perpetual-usage-rights-vs-organic-post-fees",
      title: "Perpetual Usage Rights vs Organic Post Fees in UGC Deals",
      anchorText: "UGC Usage Rights & Licensing Terms",
    },
  ],
  beauty: [
    {
      slug: "beauty-skincare-reels-script-frameworks",
      title: "Beauty & Skincare Reels Script Frameworks",
      anchorText: "Beauty & Skincare Script Architecture",
    },
    {
      slug: "skincare-cosmeceutical-visual-direction",
      title: "Skincare & Cosmeceutical Visual Direction & Lighting Plan",
      anchorText: "Clinical Skincare Lighting Plan",
    },
    {
      slug: "reels-creative-brief-template-for-brands",
      title: "Reels Creative Brief Template for Skincare & Beauty Brands",
      anchorText: "Beauty Creative Brief Template",
    },
  ],
  fashion: [
    {
      slug: "fashion-content-ideas-without-buying-new-clothes",
      title: "Fashion Content Ideas Without Buying New Clothes",
      anchorText: "Capsule Wardrobe Styling System",
    },
    {
      slug: "fashion-lookbook-reels-structure",
      title: "Fashion Lookbook Reels Structure & Shot Sequence",
      anchorText: "Fashion Lookbook Shot Sequence",
    },
    {
      slug: "sustainable-fashion-content-strategy",
      title: "Sustainable Fashion Content Strategy & Styling Proof",
      anchorText: "Sustainable Fashion Content Strategy",
    },
  ],
  fitness: [
    {
      slug: "fitness-coach-high-ticket-content-plan",
      title: "Fitness Coach High-Ticket Content Plan",
      anchorText: "High-Ticket Fitness Content Blueprint",
    },
    {
      slug: "wellness-fitness-high-ticket-lead-gen",
      title: "Wellness & Fitness High-Ticket Lead Generation Reels",
      anchorText: "Fitness Lead Generation System",
    },
  ],
  food: [
    {
      slug: "food-recipe-reels-lighting-and-angle-plan",
      title: "Food & Recipe Reels Lighting and Angle Plan",
      anchorText: "Food Filming Lighting & Angle Plan",
    },
    {
      slug: "coffee-beverage-recipe-filming-angles",
      title: "Coffee & Beverage Recipe Filming Angles",
      anchorText: "Beverage Recipe Filming Framework",
    },
    {
      slug: "local-restaurant-hospitality-video-brief",
      title: "Local Restaurant & Hospitality Video Content Brief",
      anchorText: "Hospitality Video Content Brief",
    },
  ],
  travel: [
    {
      slug: "travel-creator-cinematic-b-roll-dossier",
      title: "Travel Creator Cinematic B-Roll Dossier",
      anchorText: "Travel Cinematic B-Roll Guide",
    },
    {
      slug: "luxury-travel-b-roll-storytelling",
      title: "Luxury Travel B-Roll Storytelling & Itinerary Sequence",
      anchorText: "Luxury Travel Itinerary Sequencing",
    },
    {
      slug: "faceless-travel-content-system",
      title: "Faceless Travel Content System & Route Storytelling",
      anchorText: "Faceless Travel Content System",
    },
  ],
  faceless: [
    {
      slug: "faceless-content-production-guide",
      title: "Faceless Content Production Guide",
      anchorText: "Faceless Content Production Guide",
    },
    {
      slug: "faceless-reels-ideas-for-busy-creators",
      title: "Faceless Reels Ideas for Busy Creators",
      anchorText: "Faceless Reels Production Framework",
    },
    {
      slug: "reels-ideas-for-introverted-creators",
      title: "Reels Ideas for Introverted Creators",
      anchorText: "Camera-Shy Video Formats",
    },
  ],
  b2b: [
    {
      slug: "saas-founder-linkedin-video-strategy",
      title: "SaaS Founder LinkedIn Video Strategy",
      anchorText: "SaaS Founder Video Strategy",
    },
    {
      slug: "b2b-saas-linkedin-video-systems",
      title: "B2B SaaS LinkedIn Video Systems for Executive Founders",
      anchorText: "B2B SaaS LinkedIn Video Systems",
    },
    {
      slug: "founder-storytelling-reels-framework",
      title: "Founder Storytelling Reels Framework",
      anchorText: "Founder Storytelling Reels Framework",
    },
  ],
  lighting: [
    {
      slug: "studio-lighting-setups-for-solo-creators",
      title: "Studio Lighting Setups for Solo Creators",
      anchorText: "Solo Creator Studio Lighting Guide",
    },
    {
      slug: "how-to-film-high-quality-reels-with-iphone-only",
      title: "How to Film High-Quality Reels With iPhone Only",
      anchorText: "iPhone Camera Setup & Exposure Rules",
    },
    {
      slug: "minimalist-aesthetic-home-studio-setup",
      title: "Minimalist Aesthetic Home Studio Setup",
      anchorText: "Desk Creator Studio Setup",
    },
  ],
  aeo: [
    {
      slug: "answer-engine-optimization-for-creators",
      title: "Answer Engine Optimization (AEO) for Creators in 2026",
      anchorText: "AEO Optimization Strategy for 2026",
    },
    {
      slug: "do-audiences-trust-creators-less-in-ai-era",
      title: "Do Audiences Trust Creators Less in the AI Content Era?",
      anchorText: "Human Authenticity in the AI Era",
    },
  ],
  product: [
    {
      slug: "creative-direction-box-dossier-system",
      title: "Creative Direction Dossier System",
      anchorText: "Creative Direction Dossier System",
    },
    {
      slug: "custom-instagram-content-plan-framework",
      title: "Custom Instagram Content Plan Framework",
      anchorText: "Custom Shoot-Ready Content Plan",
    },
  ],
  visual: [
    {
      slug: "visual-signature-guide",
      title: "Visual Signature Guide for Instagram Creators",
      anchorText: "Visual Signature & Aesthetic Guide",
    },
    {
      slug: "personal-brand-creative-direction-guide",
      title: "Personal Brand Creative Direction Guide",
      anchorText: "Personal Brand Visual Direction",
    },
    {
      slug: "tech-unboxing-visual-signature-guide",
      title: "Tech Unboxing Visual Signature Guide",
      anchorText: "Tech Aesthetic Visual Signature",
    },
  ],
  burnout: [
    {
      slug: "rebuilding-content-consistency-after-burnout",
      title: "Rebuilding Content Consistency After Creator Burnout",
      anchorText: "Sustainable Content Recovery System",
    },
    {
      slug: "1-idea-becomes-10-posts-repurposing-system",
      title: "1 Idea Becomes 10 Posts Repurposing System",
      anchorText: "1-to-10 Content Repurposing Engine",
    },
    {
      slug: "creative-block-to-shoot-ready-script-workflow",
      title: "Creative Block to Shoot-Ready Script Workflow",
      anchorText: "Creative Block Script Workflow",
    },
  ],
  strategy: [
    {
      slug: "how-to-build-a-repeatable-content-system",
      title: "How to Build a Repeatable Creator Content System",
      anchorText: "Repeatable Content Production System",
    },
    {
      slug: "instagram-reels-shoot-plan",
      title: "A Practical Instagram Reels Shoot Plan",
      anchorText: "Practical Reels Shoot Plan",
    },
    {
      slug: "reels-script-frameworks",
      title: "Viral Reels Script Frameworks & Hook Architecture",
      anchorText: "Reels Script Hook Architecture",
    },
  ],
};

export function getClusterLinksForLane(lane: string, currentSlug: string): ClusterLink[] {
  const list = LANE_CLUSTER_LINKS[lane] || LANE_CLUSTER_LINKS["strategy"];
  return list.filter((item) => item.slug !== currentSlug);
}

/** Central paths for premium web assets under /public/assets/premium */

export const premiumAssets = {
  brand: {
    logo: "/brand/logo-horizontal-ink.png",
    logoInk: "/brand/logo-horizontal-ink.png",
    mark: "/brand/mark-anomaly.svg",
  },
  marketing: {
    heroDesktop: "/assets/premium/studio/hero-studio-desktop.webp",
    heroMobile: "/assets/premium/studio/hero-studio-mobile.webp",
    howConfigure: "/assets/premium/studio/workflow-configure.webp",
    howReceive: "/assets/premium/studio/workflow-receive.webp",
    howReveal: "/assets/premium/studio/workflow-reveal.webp",
    howShoot: "/assets/premium/studio/workflow-shoot.webp",
    emptyVault: "/assets/premium/studio/vault-empty.webp",
    atelier: "/assets/premium/studio/atelier-campaign.webp",
  },
  dossiers: {
    classic: "/assets/premium/studio/dossier-classic.webp",
    signature: "/assets/premium/studio/dossier-signature.webp",
    atelier: "/assets/premium/studio/dossier-atelier.webp",
  },
  cardGuides: {
    videoFlow: "/assets/premium/card-guides/guide_video_flow.webp",
    shootPlanAnatomy: "/assets/premium/card-guides/guide_shoot_plan_anatomy.webp",
    shotLanguage: "/assets/premium/card-guides/guide_shot_language.webp",
    textSafeZone: "/assets/premium/card-guides/guide_text_safe_zone.webp",
    editAssembly: "/assets/premium/card-guides/guide_edit_assembly.webp",
    performanceDirection: "/assets/premium/card-guides/guide_performance_direction.webp",
    postingSafety: "/assets/premium/card-guides/guide_posting_safety.webp",
    fieldIcons: {
      goal: "/assets/premium/card-guides/icons/field-goal.svg",
      action: "/assets/premium/card-guides/icons/field-action.svg",
      sayThis: "/assets/premium/card-guides/icons/field-say-this.svg",
      shot: "/assets/premium/card-guides/icons/field-shot.svg",
      onScreenText: "/assets/premium/card-guides/icons/field-on-screen-text.svg",
      editNote: "/assets/premium/card-guides/icons/field-edit-note.svg",
      performanceNote: "/assets/premium/card-guides/icons/field-performance-note.svg",
    },
  },
  og: {
    default: "/assets/premium/og/og-studio-default.jpg",
    pricing: "/assets/premium/og/og-studio-pricing.jpg",
    store: "/assets/premium/og/og-studio-store.jpg",
    atelier: "/assets/premium/og/og-studio-atelier.jpg",
  },
  textures: {
    paper: "/assets/premium/textures/texture_paper_soft.png",
    mist: "/assets/premium/textures/bg_mist_soft.png",
    ink: "/assets/premium/textures/bg_ink_soft.png",
  },
} as const;

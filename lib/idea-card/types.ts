/** Anomaly Box idea-card schema v2 */

export type IdeaCardDifficulty = "easy" | "medium" | "advanced";

export type IdeaCardProductionEstimate = {
  /** Setup, takes and resets included; editing excluded. */
  captureMinutesLow: number;
  captureMinutesHigh: number;
  /** Editing is deliberately reported separately from filming. */
  editMinutesLow?: number;
  editMinutesHigh?: number;
  confidence: "low" | "calibrated";
  version: string;
};

export type IdeaCardStage =
  | "hook"
  | "context"
  | "demonstration"
  | "takeaway"
  | "cta"
  | "custom";

export type IdeaCardStep = {
  id: string;
  order: number;
  stage: IdeaCardStage;
  customStageLabel?: string;
  startSecond: number;
  endSecond: number;
  /** One-line overview purpose (Video Flow) */
  purpose: string;
  /** Detailed step goal (Shoot Plan) — must not clone purpose when both shown */
  goal: string;
  action: string;
  spokenLine?: string;
  shot?: string;
  onScreenText?: string;
  editNote?: string;
  performanceNote?: string;
};

export type IdeaCard = {
  id: string;
  title: string;
  conceptSummary: string;
  format: string;
  category: string;
  platform?: string;
  audience?: string;
  durationSeconds: number;
  difficulty: IdeaCardDifficulty;
  requiredItems: string[];
  viewerTakeaway: string;
  steps: IdeaCardStep[];
  overallProductionNotes?: string[];
  /** Creator-readable reason this card earns a save/share. */
  whyItWorks?: string;
  /** Taxonomy hook id (e.g. reverse_prescription). */
  hookId?: string;
  /** 8 production shoot formats. */
  shootFormat?: string;
  /** 6 camera-presence overlays. */
  presenceMode?: string;
  /** Checkout creator_personas.slug when known. */
  personaSlug?: string;
  /** Optional for legacy compatibility; required on newly generated cards. */
  productionEstimate?: IdeaCardProductionEstimate;
  schemaVersion: 2;
};

export type QualityIssueSeverity = "warning" | "error";

export type QualityIssue = {
  code: string;
  severity: QualityIssueSeverity;
  path: string;
  message: string;
  suggestion?: string;
};

export type AdaptResult = {
  card: IdeaCard;
  issues: QualityIssue[];
  legacy: boolean;
};

export type IdeaCardStepStage = "hook" | "context" | "demonstration" | "takeaway" | "cta";

export type IdeaCardStep = {
  id: string;
  order: number;
  stage: IdeaCardStepStage;
  startSecond: number;
  endSecond: number;
  purpose: string;
  goal: string;
  action: string;
  spokenLine?: string;
  shot?: string;
  onScreenText?: string;
  editNote?: string;
  performanceNote?: string;
  customStageLabel?: string;
};

export type IdeaCardProductionEstimate = {
  version: string;
  captureMinutesLow: number;
  captureMinutesHigh: number;
  editMinutesLow: number;
  editMinutesHigh: number;
  totalProductionMinutesLow?: number;
  totalProductionMinutesHigh?: number;
  confidence: "low" | "medium" | "high";
  riskDrivers?: string[];
};

export type IdeaCard = {
  id: string;
  title: string;
  schemaVersion: number;
  conceptSummary: string;
  viewerTakeaway: string;
  format: string;
  platform: string;
  category: string;
  personaSlug?: string;
  audience: string;
  durationSeconds: number;
  difficulty: "easy" | "medium" | "advanced";
  requiredItems: string[];
  hookId: string;
  shootFormat: string;
  presenceMode?: string;
  whyItWorks?: string;
  overallProductionNotes: string[];
  steps: IdeaCardStep[];
  productionEstimate?: IdeaCardProductionEstimate;
};

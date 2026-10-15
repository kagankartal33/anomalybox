/**
 * Algorithmic Reason & Psychological Hook Taxonomy Types
 * 12 purchase lanes, 8 shoot formats, 6 presence personas,
 * 12 hook categories, 66 hook types, cognitive triggers, platform signals.
 */

export type PurchaseLane =
  | "beauty"
  | "fashion"
  | "commerce_affiliate"
  | "creator_education"
  | "entertainment_comedy"
  | "fitness_wellness_safe"
  | "food"
  | "lifestyle"
  | "luxury"
  | "parenting_family"
  | "thought_leadership"
  | "travel";

/** Production shoot format (card field, not a checkout key). */
export type CreatorMode =
  | "talking_head"
  | "voiceover"
  | "hands_only"
  | "pov"
  | "screen_recording"
  | "object_led"
  | "text_led"
  | "interview";

/** Camera-presence overlay. Not a creator_personas row. */
export type CreatorPersona =
  | "editorial_insider"
  | "calm_expert_editor"
  | "relatable_confidant"
  | "high_status_minimalist"
  | "faceless_curator"
  | "busy_founder_creator";

export type HookCategory =
  | "cognitive_subversion"
  | "curiosity_open_loop"
  | "visual_kinesthetic"
  | "status_identity"
  | "auditory_vibe"
  | "save_utility"
  | "loss_aversion_cost"
  | "narrative_confession"
  | "comment_friction"
  | "proof_authority"
  | "empathy_relatable"
  | "timing_structural";

export type AlgorithmicSignalType =
  | "watch_time"
  | "completion_rate"
  | "dm_share"
  | "save_rate"
  | "loop_replay"
  | "engagement_velocity"
  | "comment_depth"
  | "profile_visit"
  | "affinity_score";

export type NeurocognitiveTriggerType =
  | "reward_prediction_error"
  | "anterior_cingulate_cortex"
  | "information_gap"
  | "mirror_neuron_system"
  | "default_mode_suppression"
  | "loss_aversion"
  | "zeigarnik_effect"
  | "social_proof"
  | "authority_bias"
  | "scarcity_heuristic"
  | "anchoring_bias"
  | "mere_exposure_effect"
  | "peak_end_rule"
  | "von_restorff_effect"
  | "cocktail_party_effect"
  | "negativity_bias"
  | "endowment_effect"
  | "ikea_effect"
  | "pratfall_effect"
  | "bizarreness_effect"
  | "reciprocity_norm"
  | "commitment_consistency"
  | "liking_similarity"
  | "unity_identity";

export interface HookTypeDefinition {
  id: string;
  code: number;
  category: HookCategory;
  categoryNameTr: string;
  nameTr: string;
  nameEn: string;
  primaryCognitiveTrigger: NeurocognitiveTriggerType;
  primaryCognitiveTriggerLabelTr: string;
  targetSignal: AlgorithmicSignalType;
  targetSignalLabelTr: string;
  descriptionTr: string;
  formulaTr: string;
  shotDirectionTr: string;
  vibeDirectionTr: string;
  editNoteTr: string;
  sampleDialogues: string[];
  keywords: string[];
  compatibleLanes: PurchaseLane[];
  compatibleModes: CreatorMode[];
  compatiblePersonas: CreatorPersona[];
  proofDeviceTr?: string;
  claimBoundaryTr?: string;
}

export type ConsumerDemandCluster =
  | "feed_control_chronology"
  | "recommendation_persistence"
  | "repetition_homogenization"
  | "compulsive_scroll_autoplay"
  | "ad_load_frequency"
  | "sponsor_interruption"
  | "sponsor_authenticity"
  | "ai_slop_genericness"
  | "ai_false_positives_nuance"
  | "clickbait_promise_mismatch"
  | "filler_time_waste"
  | "text_vs_video_mismatch"
  | "searchability_ctrl_f"
  | "sources_verification"
  | "correction_visibility"
  | "freshness_outdated_info"
  | "oversimplification_missing_nuance"
  | "trend_sameness_monoculture"
  | "substance_intellectual_depth"
  | "comment_quality_value"
  | "toxicity_harassment_filtering"
  | "privacy_creepy_personalization"
  | "subscription_paywall_fatigue"
  | "inbox_notification_overload"
  | "membership_churn_multicausal"
  | "multisource_purchase_validation"
  | "tradeoffs_negative_info"
  | "human_relationship_relatability"
  | "qualified_relevance_vs_virality"
  | "accessibility_readability"
  | "save_share_reference_utility"
  | "applicability_who_is_this_for";

export type FailedAdviceRisk =
  | "unsustainable_volume_daily_posting"
  | "trending_audio_without_narrative"
  | "cheap_comment_bait_dm_bots"
  | "generic_template_ai_slop"
  | "overproducing_without_hook"
  | "broad_virality_over_buyer_intent"
  | "premature_monetization_spam"
  | "ignoring_first_frame_action"
  | "unsubstantiated_growth_hacks"
  | "copying_competitor_surface";

export interface ConsumerClusterDefinition {
  id: ConsumerDemandCluster;
  clusterNumber: number;
  nameTr: string;
  category: "CONTROL" | "QUALITY" | "WELLBEING" | "MONETIZATION" | "TRUST" | "UTILITY" | "FORMAT" | "COMMUNITY" | "RELATIONSHIP" | "RELEVANCE" | "ACCESS" | "COMMERCE";
  consumerComplaintTr: string;
  consumerWantTr: string;
  creatorImplicationTr: string;
  directingRuleTr: string;
}

export interface AlgorithmicInsight {
  hookTypeId?: string;
  hookCode?: number;
  hookNameTr?: string;
  hookNameEn?: string;
  category?: HookCategory;
  categoryLabelTr?: string;
  cognitiveTrigger?: NeurocognitiveTriggerType;
  cognitiveTriggerLabelTr?: string;
  targetSignal?: AlgorithmicSignalType;
  targetSignalLabelTr?: string;
  consumerCluster?: ConsumerDemandCluster;
  consumerClusterLabelTr?: string;
  fullReasonText: string;
  isAlgorithmicReasonValid: boolean;
  scoreBonus: number;
  fitScore?: number;
  recommendations?: string[];
}

export interface HookAnalysisResult {
  detectedHook?: HookTypeDefinition;
  confidence: number;
  detectedTriggers: NeurocognitiveTriggerType[];
  detectedSignals: AlgorithmicSignalType[];
  detectedClusters: ConsumerDemandCluster[];
  issues: string[];
  recommendations: string[];
  fitScore?: number;
}


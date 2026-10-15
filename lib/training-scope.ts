/**
 * Product category slugs → training affinity scopes.
 * Keep in sync with supabase/functions/admin-generation-batches resolveTrainingScopeSlug.
 */
const TRAINING_SCOPE_ALIASES: Record<string, string> = {
  comedy: "entertainment_comedy",
  entertainment: "entertainment_comedy",
  humor: "entertainment_comedy",
  funny: "entertainment_comedy",
  fitness: "fitness_wellness_safe",
  wellness: "fitness_wellness_safe",
  gym: "fitness_wellness_safe",
  health: "fitness_wellness_safe",
};

export function resolveTrainingScopeSlug(categorySlug: string): string {
  const raw = String(categorySlug ?? "").trim().toLowerCase();
  return TRAINING_SCOPE_ALIASES[raw] ?? raw;
}

export function trainingScopeAliases(): Readonly<Record<string, string>> {
  return TRAINING_SCOPE_ALIASES;
}

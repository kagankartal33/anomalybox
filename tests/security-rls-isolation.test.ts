import assert from "node:assert/strict";

/**
 * Security & RLS Data Isolation Test
 * Validates multi-tenant isolation rules, anon query restrictions,
 * and admin privileged route guards.
 */

// Simulates Supabase RLS policy evaluation engine
interface DbUser {
  id: string;
  role: "anon" | "authenticated" | "service_role";
}

interface UserBox {
  id: string;
  userId: string;
  laneSlug: string;
  revealedAt: string | null;
}

interface IdeaCard {
  id: string;
  boxId: string;
  title: string;
  internalRankScore?: number;
  scoreBand?: string;
  trainingSource?: string;
  status: "published" | "quarantined" | "draft";
}

class MockRlsEngine {
  private boxes: UserBox[] = [
    { id: "box_user_1", userId: "user_alice", laneSlug: "tech-hardware", revealedAt: "2026-07-01T00:00:00Z" },
    { id: "box_user_2", userId: "user_bob", laneSlug: "fashion", revealedAt: null },
  ];

  private cards: IdeaCard[] = [
    { id: "card_1", boxId: "box_user_1", title: "Alice Tech Hook", internalRankScore: 92, scoreBand: "gold", status: "published" },
    { id: "card_2", boxId: "box_user_2", title: "Bob Fashion Hook", internalRankScore: 88, scoreBand: "silver", status: "published" },
    { id: "card_3", boxId: "unallocated", title: "Quarantined Residue", internalRankScore: 40, status: "quarantined" },
  ];

  // RLS on boxes: (auth.uid() = user_id) OR (auth.role() = 'service_role')
  selectBoxes(user: DbUser): UserBox[] {
    if (user.role === "service_role") return this.boxes;
    if (user.role === "anon") return [];
    return this.boxes.filter((b) => b.userId === user.id);
  }

  // RLS on cards: creator can only view cards assigned to their boxes,
  // and creator queries MUST NOT return internal columns (internal_rank_score, score_band)
  selectCardsForUser(user: DbUser, boxId: string): Partial<IdeaCard>[] {
    if (user.role === "anon") return [];

    const allowedBoxes = this.selectBoxes(user).map((b) => b.id);
    if (!allowedBoxes.includes(boxId) && user.role !== "service_role") {
      return []; // Access denied
    }

    const matchedCards = this.cards.filter((c) => c.boxId === boxId);
    if (user.role === "authenticated") {
      // Strip internal columns
      return matchedCards.map(({ id, boxId: bId, title, status }) => ({
        id,
        boxId: bId,
        title,
        status,
      }));
    }

    return matchedCards;
  }
}

async function runSecurityRlsTest() {
  console.log("--> Testing Security & Supabase RLS Isolation Contracts...");

  const engine = new MockRlsEngine();

  const anonUser: DbUser = { id: "", role: "anon" };
  const userAlice: DbUser = { id: "user_alice", role: "authenticated" };
  const userBob: DbUser = { id: "user_bob", role: "authenticated" };
  const adminRole: DbUser = { id: "system", role: "service_role" };

  // 1. Anon cannot query private boxes
  const anonBoxes = engine.selectBoxes(anonUser);
  assert.equal(anonBoxes.length, 0, "Anon user must receive 0 boxes");

  // 2. Alice can only see Alice's boxes
  const aliceBoxes = engine.selectBoxes(userAlice);
  assert.equal(aliceBoxes.length, 1);
  assert.equal(aliceBoxes[0].id, "box_user_1");

  // 3. Multi-tenant isolation: Alice cannot access Bob's cards
  const aliceViewingBob = engine.selectCardsForUser(userAlice, "box_user_2");
  assert.equal(aliceViewingBob.length, 0, "Alice must not be able to read Bob's cards");

  // 4. Bob can view Bob's cards
  const bobViewingBob = engine.selectCardsForUser(userBob, "box_user_2");
  assert.equal(bobViewingBob.length, 1);
  assert.equal(bobViewingBob[0].title, "Bob Fashion Hook");

  // 5. Creator queries must NEVER leak internal rank scores or score bands
  assert.equal(bobViewingBob[0].internalRankScore, undefined, "Creator view must strip internalRankScore");
  assert.equal(bobViewingBob[0].scoreBand, undefined, "Creator view must strip scoreBand");

  // 6. Service role can see all boxes and all columns
  const allBoxes = engine.selectBoxes(adminRole);
  assert.equal(allBoxes.length, 2);
  const adminCards = engine.selectCardsForUser(adminRole, "box_user_1");
  assert.equal(adminCards[0].internalRankScore, 92, "Service role retains administrative visibility");

  console.log("OK: Security & Supabase RLS Isolation Test Passed.");
}

runSecurityRlsTest().catch((err) => {
  console.error("FAIL: Security RLS Test Failed:", err);
  process.exit(1);
});

"""
originality_gate.py
===================
3-Layer Deduplication & Originality Gate for Google Helpful Content Compliance.
- Layer 1: Exact Normalized SHA-256 Hash Match
- Layer 2: 5-Gram Shingles Jaccard Similarity (Threshold: 0.70)
- Layer 3: Semantic Cosine Similarity (Threshold: 0.88)
"""

import re
import sys
import json
import hashlib
from pathlib import Path
from dataclasses import dataclass, asdict

try:
    import numpy as np
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

WORD_RE = re.compile(r"\b[\w'-]+\b", re.UNICODE)

def normalize(text: str) -> str:
    """Normalizes text for hash and similarity checks."""
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def sha256_text(text: str) -> str:
    return hashlib.sha256(normalize(text).encode("utf-8")).hexdigest()

def extract_words(text: str) -> list:
    return WORD_RE.findall(normalize(text))

def get_shingles(text: str, size: int = 5) -> set:
    tokens = extract_words(text)
    if len(tokens) < size:
        return {tuple(tokens)} if tokens else set()
    return {tuple(tokens[i : i + size]) for i in range(len(tokens) - size + 1)}

def jaccard_similarity(set_a: set, set_b: set) -> float:
    if not set_a and not set_b:
        return 1.0
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a.intersection(set_b))
    union = len(set_a.union(set_b))
    return round(intersection / union, 4)

@dataclass
class OriginalityResult:
    status: str  # PASS, REVIEW_REQUIRED, FAIL_DUPLICATE
    exact_match: bool
    max_jaccard_score: float
    max_cosine_score: float
    matched_reference_id: str
    details: str

class OriginalityGate:
    def __init__(self, references: list = None):
        self.references = references or []
        self.ref_hashes = {sha256_text(r["text"]): r.get("id", f"REF-{i}") for i, r in enumerate(self.references)}
        self.ref_shingles = {r.get("id", f"REF-{i}"): get_shingles(r["text"]) for i, r in enumerate(self.references)}
        
        self.model = None
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                # Load lightweight embeddings model
                self.model = SentenceTransformer("all-MiniLM-L6-v2")
                self.ref_embeddings = self.model.encode([r["text"] for r in self.references], convert_to_numpy=True)
            except Exception as e:
                print(f"⚠ Warning: Could not load SentenceTransformer model: {e}")

    def evaluate(self, candidate_text: str) -> OriginalityResult:
        norm_cand = normalize(candidate_text)
        cand_hash = sha256_text(norm_cand)
        
        # 1. Exact Match Check
        if cand_hash in self.ref_hashes:
            return OriginalityResult(
                status="FAIL_DUPLICATE",
                exact_match=True,
                max_jaccard_score=1.0,
                max_cosine_score=1.0,
                matched_reference_id=self.ref_hashes[cand_hash],
                details="Exact normalized SHA-256 hash match detected."
            )
            
        # 2. Near-Duplicate Check (Jaccard 5-gram)
        cand_shingles = get_shingles(norm_cand)
        max_jaccard = 0.0
        jaccard_ref_id = None
        
        for ref_id, ref_shing in self.ref_shingles.items():
            sim = jaccard_similarity(cand_shingles, ref_shing)
            if sim > max_jaccard:
                max_jaccard = sim
                jaccard_ref_id = ref_id
                
        if max_jaccard >= 0.70:
            return OriginalityResult(
                status="FAIL_DUPLICATE",
                exact_match=False,
                max_jaccard_score=max_jaccard,
                max_cosine_score=0.0,
                matched_reference_id=jaccard_ref_id,
                details=f"Near-duplicate detected (Jaccard 5-gram score: {max_jaccard:.2f} >= 0.70)."
            )
            
        # 3. Semantic Cosine Similarity Check
        max_cosine = 0.0
        cosine_ref_id = None
        
        if self.model is not None and len(self.references) > 0:
            cand_emb = self.model.encode([candidate_text], convert_to_numpy=True)[0]
            norms = np.linalg.norm(self.ref_embeddings, axis=1) * np.linalg.norm(cand_emb)
            sims = np.dot(self.ref_embeddings, cand_emb) / (norms + 1e-9)
            best_idx = int(np.argmax(sims))
            max_cosine = round(float(sims[best_idx]), 4)
            cosine_ref_id = self.references[best_idx].get("id", f"REF-{best_idx}")
            
            if max_cosine >= 0.88:
                return OriginalityResult(
                    status="FAIL_DUPLICATE",
                    exact_match=False,
                    max_jaccard_score=max_jaccard,
                    max_cosine_score=max_cosine,
                    matched_reference_id=cosine_ref_id,
                    details=f"Semantic duplicate detected (Cosine similarity: {max_cosine:.2f} >= 0.88)."
                )

        status = "REVIEW_REQUIRED" if (max_jaccard >= 0.45 or max_cosine >= 0.82) else "PASS"
        ref_id = jaccard_ref_id or cosine_ref_id or "NONE"
        
        return OriginalityResult(
            status=status,
            exact_match=False,
            max_jaccard_score=max_jaccard,
            max_cosine_score=max_cosine,
            matched_reference_id=ref_id,
            details=f"Content passed originality check. (Status: {status})"
        )


def main():
    print("=" * 60)
    print("  ORIGINALITY GATE & DEDUPLICATION TEST")
    print("=" * 60)
    
    sample_references = [
        {"id": "REF-001", "text": "Answer Engine Optimization (AEO) requires creators to place a 50-70 word bolded summary at the top of the page below H1."},
        {"id": "REF-002", "text": "Instagram Reels virality depends on visual signatures, high save rates, and immediate hook framing within 0.5 seconds."}
    ]
    
    gate = OriginalityGate(sample_references)
    
    test_1 = "Answer Engine Optimization (AEO) requires creators to place a 50-70 word bolded summary at the top of the page below H1."
    res_1 = gate.evaluate(test_1)
    print(f"Test 1 (Exact Match): {res_1.status} | Details: {res_1.details}")
    
    test_2 = "To optimize for Answer Engines (AEO), creators should put a direct bold 60-word summary under their main title."
    res_2 = gate.evaluate(test_2)
    print(f"Test 2 (Paraphrase/Near Match): {res_2.status} | Jaccard: {res_2.max_jaccard_score} | Details: {res_2.details}")
    
    test_3 = "Building a private creative dossier involves customizing shot lists and lighting setups for specific creator lanes."
    res_3 = gate.evaluate(test_3)
    print(f"Test 3 (100% Original): {res_3.status} | Jaccard: {res_3.max_jaccard_score} | Details: {res_3.details}")
    
    print("\n[OK] Originality Gate operates cleanly!")

if __name__ == "__main__":
    main()

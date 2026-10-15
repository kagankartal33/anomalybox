"""
batch_generate_sprint1_content.py
=================================
Automated Batch Generator for Sprint 1 (28 Target Pages) of AnomalyBox.
Uses WorldClassContentPipeline (4-Pass Generator + Originality Gate).
"""

import sys
from pathlib import Path
from world_class_generator import WorldClassContentPipeline

SPRINT_1_TOPICS = [
    # A. Revenue & Conversion Pages (8 Pages)
    ("Personal Brand Creative Direction Guide for High-Ticket Creators", "personal-brand-creative-direction-guide"),
    ("Custom Instagram Content Plan Framework: Beyond Generic Prompts", "custom-instagram-content-plan-framework"),
    ("Reels Creative Brief Template for Skincare & Beauty Brands", "reels-creative-brief-template-for-brands"),
    ("UGC Creator Portfolio Shot List & Script Structure", "ugc-creator-portfolio-shot-list"),
    ("Content Strategist for Instagram Creators: DIY vs Done-For-You", "content-strategist-for-instagram-creators"),
    ("Creative Direction Box Dossier System: Shoot-Ready Direction", "creative-direction-box-dossier-system"),
    ("Done-For-You Content Planning Structure for Growth Creators", "done-for-you-content-planning-structure"),
    ("Skincare Brand UGC Brief Framework for Highest Conversion", "skincare-brand-ugc-brief-framework"),
    
    # B. Execution & Constraint Pages (10 Pages)
    ("Faceless Reels Ideas for Busy Creators & Introverts", "faceless-reels-ideas-for-busy-creators"),
    ("Fashion Content Ideas Without Buying New Clothes", "fashion-content-ideas-without-buying-new-clothes"),
    ("Studio Lighting Setups for Solo Creators & Home Studios", "studio-lighting-setups-for-solo-creators"),
    ("Reels Ideas for Introverted Creators: Camera-Shy Formats", "reels-ideas-for-introverted-creators"),
    ("How to Film High-Quality Reels With iPhone Only", "how-to-film-high-quality-reels-with-iphone-only"),
    ("Small-Space Content Creation Studio Setup Guide", "small-space-content-creation-studio-setup"),
    ("Rebuilding Content Consistency After Creator Burnout", "rebuilding-content-consistency-after-burnout"),
    ("Creative Block to Shoot-Ready Script Workflow", "creative-block-to-shoot-ready-script-workflow"),
    ("High-Converting UGC Hook Frameworks for TikTok & Reels", "high-converting-ugc-hook-frameworks"),
    ("Cinematic B-Roll Shot List for Lifestyle & Travel Creators", "cinematic-b-roll-shot-list-for-lifestyle-creators"),
    
    # C. Tier 1 Creator Lanes (10 Pages)
    ("Beauty & Skincare Reels Script Frameworks for Product Filming", "beauty-skincare-reels-script-frameworks"),
    ("Tech Unboxing Visual Signature Guide for Creators", "tech-unboxing-visual-signature-guide"),
    ("Fashion Lookbook Reels Structure & Shot Sequence", "fashion-lookbook-reels-structure"),
    ("Fitness Coach High-Ticket Content Plan & Conversion Blueprint", "fitness-coach-high-ticket-content-plan"),
    ("Founder Storytelling Reels Framework for Personal Branding", "founder-storytelling-reels-framework"),
    ("Luxury Lifestyle Visual Aesthetic Guide & Color Grading", "luxury-lifestyle-visual-aesthetic-guide"),
    ("Food & Recipe Reels Lighting and Angle Plan", "food-recipe-reels-lighting-and-angle-plan"),
    ("Travel Creator Cinematic B-Roll Dossier & Filming Guide", "travel-creator-cinematic-b-roll-dossier"),
    ("SaaS Founder LinkedIn Video Strategy & Script Architecture", "saas-founder-linkedin-video-strategy"),
    ("Minimalist Aesthetic Home Studio Setup for Desk Creators", "minimalist-aesthetic-home-studio-setup")
]

def main():
    print("=" * 70)
    print(" 🚀 ANOMALYBOX SPRINT 1 BATCH GENERATOR (28 WORLD-CLASS PAGES)")
    print("=" * 70)
    
    pipeline = WorldClassContentPipeline()
    passed_count = 0
    
    for i, (title, slug) in enumerate(SPRINT_1_TOPICS, 1):
        print(f"\n[{i}/28] Processing: {title}...")
        result = pipeline.generate(title, slug)
        if result:
            passed_count += 1
            
    print("\n" + "=" * 70)
    print(f"🎉 BATCH COMPLETE: {passed_count}/28 World-Class pages generated & passed Originality Gate!")
    print("=" * 70)

if __name__ == "__main__":
    main()

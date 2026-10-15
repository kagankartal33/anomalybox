"""
generate_diagram_assets.py
==========================
Generates Mermaid.js architectural visual diagrams and structured SVG 
flowcharts for World-Class content pieces to maximize Information Gain.
"""

def generate_mermaid_flowchart(topic_slug: str, title: str) -> str:
    """Generates a clean Mermaid.js diagram block based on topic."""
    
    if "visual" in topic_slug or "signature" in topic_slug:
        return f"""```mermaid
graph TD
    A["🎥 0.0s: Visual Anchor (Color Grade / Prop)"] --> B["⚡ 0.5s: Pattern Interrupt (Camera Movement)"]
    B --> C["💡 2.0s: Information Gain (Unique Insight/Demo)"]
    C --> D["📊 15.0s: Proof / Decision Framework"]
    D --> E["🚀 25.0s: Share Trigger (Save & DM Framing)"]
    
    style A fill:#B42335,stroke:#fff,stroke-width:2px,color:#fff
    style C fill:#2A6F97,stroke:#fff,stroke-width:2px,color:#fff
    style E fill:#2D6A4F,stroke:#fff,stroke-width:2px,color:#fff
```"""
    elif "aeo" in topic_slug or "seo" in topic_slug:
        return f"""```mermaid
graph LR
    H1["H1 Title"] --> ZeroClick["⚡ 50-70 Word Zero-Click Snippet Bait"]
    ZeroClick --> Entities["🏷️ Entity Cluster & PAA Questions"]
    Entities --> DataMatrix["📊 Decision Matrix & Source Ledger (SRC-0001)"]
    DataMatrix --> Schema["Structured JSON-LD (FAQ / HowTo / Article)"]
    
    style ZeroClick fill:#E63946,stroke:#fff,color:#fff
    style Schema fill:#1D3557,stroke:#fff,color:#fff
```"""
    else:
        return f"""```mermaid
graph TD
    Step1["1. Research & Citation Ledger"] --> Step2["2. Information Gain Structuring"]
    Step2 --> Step3["3. Anti-AI Burstiness Polish"]
    Step3 --> Step4["4. Originality Gate Verification"]
    
    style Step1 fill:#457B9D,color:#fff
    style Step4 fill:#2A9D8F,color:#fff
```"""

if __name__ == "__main__":
    diagram = generate_mermaid_flowchart("visual-signature", "Visual Signature Architecture")
    print("Generated Diagram Test:")
    print(diagram)

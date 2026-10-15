"""
train-lora.py (AI-Free & Plagiarism-Free Full GPU Edition)
=========================================================
Fine-tunes base model using LoRA (r=32, alpha=64) on 6,973 AI-sanitized 
observations using NVIDIA GeForce RTX 5060 GPU with fp16 mixed precision.
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"

try:
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
    from peft import get_peft_model, LoraConfig, TaskType
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("❌ ERROR: 'transformers', 'torch', or 'peft' missing.")
    sys.exit(1)

ARCHIVE_DIR = Path(r"C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive")
PREPARED_DIR = ARCHIVE_DIR / "dataset" / "seo_content" / "prepared"
AI_FREE_FILE = PREPARED_DIR / "ai_free_observations.jsonl"
MODEL_OUT_DIR = ARCHIVE_DIR / "models" / "lora-ai-free-gpu"

def load_ai_free_data():
    """Loads all sanitized, humanized observations."""
    texts = []
    if AI_FREE_FILE.exists():
        print(f"📖 Loading AI-Free sanitized dataset from {AI_FREE_FILE.name}...")
        with AI_FREE_FILE.open("r", encoding="utf-8") as f:
            for line in f:
                try:
                    record = json.loads(line)
                    text = record["text_signals"]["abstract_text"]
                    if len(text) > 50:
                        texts.append(text)
                except Exception:
                    pass
    return texts

def main():
    print("=" * 65)
    print("  FULL GPU LoRA FINE-TUNING PIPELINE (AI-FREE & PLAGIARISM-FREE)")
    print("=" * 65)
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"  Device: {device.upper()}")
    if device == "cuda":
        print(f"  GPU Name: {torch.cuda.get_device_name(0)}")
        print(f"  VRAM Available: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.2f} GB")
    
    MODEL_OUT_DIR.mkdir(parents=True, exist_ok=True)
    
    data = load_ai_free_data()
    if not data:
        print("❌ Error: AI-Free dataset not found.")
        sys.exit(1)
        
    print(f"📚 Total AI-Sanitized Training Examples: {len(data):,}")
    
    model_name = "gpt2"
    print(f"🚀 Initializing Base Model ({model_name}) and High-Rank LoRA (r=32)...")
    
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
    )
    if device == "cuda":
        model = model.to("cuda")
    
    # High-Rank LoRA config for capturing human writing style & nuances
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=32,
        lora_alpha=64,
        lora_dropout=0.05,
    )
    
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    class SimpleDataset(torch.utils.data.Dataset):
        def __init__(self, texts, tokenizer):
            print("⚡ Tokenizing AI-Free dataset...")
            self.encodings = tokenizer(texts, padding="max_length", truncation=True, max_length=256)
            self.encodings["labels"] = self.encodings["input_ids"].copy()
            
        def __len__(self):
            return len(self.encodings["input_ids"])
            
        def __getitem__(self, idx):
            return {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
            
    formatted_texts = [f"Human Original Pattern: {t}" for t in data]
    tokenized_dataset = SimpleDataset(formatted_texts, tokenizer)
    
    training_args = TrainingArguments(
        output_dir=str(MODEL_OUT_DIR),
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        num_train_epochs=5,
        learning_rate=5e-4,
        lr_scheduler_type="cosine",
        warmup_ratio=0.1,
        logging_steps=25,
        save_strategy="epoch",
        fp16=(device == "cuda"),
        report_to="none",
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
    )
    
    print("\n⏳ Starting Deep AI-Free GPU Training Loop (5 Epochs)...")
    start_time = datetime.now()
    trainer.train()
    end_time = datetime.now()
    
    duration = end_time - start_time
    print(f"\n✨ Training Completed in: {duration}")
    print("💾 Saving AI-Free GPU LoRA Adapters...")
    model.save_pretrained(str(MODEL_OUT_DIR))
    tokenizer.save_pretrained(str(MODEL_OUT_DIR))
    print(f"✅ AI-Free GPU LoRA Model successfully saved to {MODEL_OUT_DIR}")

if __name__ == "__main__":
    main()

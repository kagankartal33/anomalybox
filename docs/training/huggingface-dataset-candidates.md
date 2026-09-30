# Hugging Face Training Dataset Candidates

These datasets are candidate sources for ViralBox training. Use them as pattern-only, eval, safety, or metadata signals. Do not copy creator-facing text, names, links, titles, jokes, captions, or exact scenes into generated idea cards.

## Priority Sources

| Priority | Dataset | Rows / Size Signal | Useful Fields | ViralBox Use |
|---|---|---:|---|---|
| P0 | [SocialGrep/one-million-reddit-jokes](https://hf.co/datasets/SocialGrep/one-million-reddit-jokes) | 1,000,000 rows | `title`, `selftext`, `score`, `subreddit.nsfw` | Comedy mechanism extraction, setup/payoff patterns, score-weighted humor signals. |
| P0 | [SocialGrep/one-million-reddit-questions](https://hf.co/datasets/SocialGrep/one-million-reddit-questions) | 1,000,000 rows | `title`, `selftext`, `score` | Comment-trigger and question-hook training for captions, pinned comments, story polls. |
| P0 | [SocialGrep/one-million-reddit-confessions](https://hf.co/datasets/SocialGrep/one-million-reddit-confessions) | 1M+ scale | post text, score | Relatable confession structure, vulnerability-safe narrative mechanisms. |
| P0 | [ctr4si/reddit_tifu](https://hf.co/datasets/ctr4si/reddit_tifu) | 100K-1M category | `title`, `document`, `tldr`, `ups`, `score`, `num_comments`, `upvote_ratio` | Story arc compression, TLDR/payoff shaping, performance-weighted narrative tension. |
| P0 | [tskolm/youtube_top_popular_videos_comments](https://hf.co/datasets/tskolm/youtube_top_popular_videos_comments) | 187,466 rows | `title`, `description`, `comment`, `reply_count`, `like_count` | Comment engine, audience reaction mining, hook/comment alignment. |
| P1 | [kkcosmos/instagram-images-with-captions](https://hf.co/datasets/kkcosmos/instagram-images-with-captions) | 31,512 rows | `image`, `caption`, `item_id` | Instagram caption structure and image-caption pairing. License unknown, use only as abstract pattern/eval. |
| P1 | [prakhars/instagram_captions](https://hf.co/datasets/prakhars/instagram_captions) | 14,087 rows | `text`, `label` | Caption style clustering and creator-facing caption pack evaluation. |
| P1 | [l3afai/youtube-thumbnails](https://hf.co/datasets/l3afai/youtube-thumbnails) | estimated 163,749 rows | `video_id`, `title`, `image` | First-frame/thumbnail attention pattern extraction and title-hook pairing. License is `other`; use metadata/pattern-only. |
| P1 | [cardiffnlp/tweet_eval](https://hf.co/datasets/cardiffnlp/tweet_eval) | 200,785 rows | `text`, `label`; configs include irony, emotion, hate, offensive, stance, emoji, sentiment | Safety classifier, irony/emotion detection, tone guardrails. |
| P1 | [databoks-irfan/labeled-instagram-comments](https://hf.co/datasets/databoks-irfan/labeled-instagram-comments) | 83,614 rows | comment text + labels | Instagram comment quality/safety signal and comment-trigger evaluation. |
| P1 | [underscore2/bluesky_engagement_posts_kto](https://hf.co/datasets/underscore2/bluesky_engagement_posts_kto) | 12,000 rows | engagement preference text | Engagement preference/eval cases for text posts; use as auxiliary, not Instagram ground truth. |
| P2 | [bhavyagiri/semantic-memes](https://hf.co/datasets/bhavyagiri/semantic-memes) | 5,818 rows | image/text meme semantics | Meme mechanism taxonomy and comedy visual-caption relation. |
| P2 | [oneonlee/Meme-Safety-Bench](https://hf.co/datasets/oneonlee/Meme-Safety-Bench) | 10K-100K category, gated | image/text safety labels | Safety/eval-only benchmark for meme-like content risk. |
| P2 | [PleIAs/YouTube-Commons](https://hf.co/datasets/PleIAs/YouTube-Commons) | very large, CC-BY-4.0 | transcripts, provenance | Speech rhythm, opening lines, educational/explainer pacing. Too broad; sample carefully by category. |
| P2 | [The-data-company/TikTok-10M](https://hf.co/datasets/The-data-company/TikTok-10M) | 1M-10M category | multimodal short-form metadata | Short-form pattern research only. Video training is currently disabled in ViralBox, so do not ingest raw video unless re-enabled. |
| P2 | [larlarHF/TikTok-10M](https://hf.co/datasets/larlarHF/TikTok-10M) | 10M-100M category | multimodal short-form metadata | Same as above; use only metadata/text if needed. |

## Recommended Import Modes

- `hf_social_score_v1`: score-weighted Reddit jokes/questions/confessions/TIFU, promoted as pattern-only `viral_training_examples`.
- `hf_comment_engine_v1`: YouTube comments and Instagram comments, promoted to caption/comment/pinned-comment eval cases.
- `hf_caption_style_v1`: Instagram captions, used for caption structure and tone clusters.
- `hf_safety_eval_v1`: TweetEval, meme safety, cyberbullying/hate datasets, used only for safety classifiers and generator eval cases.
- `hf_visual_hook_metadata_v1`: YouTube thumbnails/title pairs, used for abstract first-frame/title-hook principles.

## Guardrails

- Keep `content_hash` global unique to prevent duplicate training.
- Store HF repo id, config, split, row id/hash, license tag, and source URL only in internal metadata.
- Creator-facing cards must not include exact Reddit jokes, questions, confessions, YouTube titles, captions, comments, usernames, URLs, or dataset names.
- Unknown/license-other datasets should be `pattern_only` or `eval_only`.
- NSFW, hate, toxic, political, minors, medical, finance, and public figure sensitive rows should not promote into production idea generation without review.
- Video training remains disabled. TikTok/YouTube multimodal datasets should not create a raw video pipeline until explicitly re-enabled.

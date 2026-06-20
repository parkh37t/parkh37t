---
name: sns-growth
description: >-
  Analyze an Instagram / SNS account and produce a prioritized growth plan to
  increase reach, views, and likes. Use when the user shares a social profile
  (Instagram, TikTok, YouTube Shorts, Threads, X) or asks how to grow views,
  reach, likes, followers, or engagement; how to improve Reels/short-form;
  what to post; hooks, captions, hashtags, posting schedule, or content
  strategy. Built around the 2026 Instagram ranking signals (watch time,
  sends-per-reach, saves, likes-per-reach, originality). Respond in the user's
  language (Korean for this user).
---

# SNS Growth

Diagnose a social account and hand back a concrete, prioritized action plan to
grow reach / views / likes. Reels-first, 2026-algorithm-aware.

## Hard constraint: you cannot scrape the live account

Instagram (and most SNS) block unauthenticated fetches — a public profile URL
returns `403`/login wall, so `WebFetch` will NOT return real numbers. **Do not
fabricate follower counts, view counts, or post data.** Get real data one of
three ways, in order of preference:

1. Ask the user to paste their **Insights** (Professional Dashboard →
   Insights): reach, views, follower count, top posts, audience times,
   accounts reached vs. engaged. Reels: average watch time / retention,
   shares, saves.
2. Ask the user to paste/describe their **recent 5–10 posts** (format,
   caption, hook, view/like/save/share counts).
3. If they give nothing, proceed with a **niche-based playbook** but say
   explicitly that it's generic until they share numbers.

Always state which mode you're in so advice isn't mistaken for measured fact.

## Workflow

### 1. Gather context (ask only what's missing, batch the questions)
- **Handle + niche** (what the account is about, language, target audience).
- **Goal & timeframe** — more reach? saves? followers? selling something?
- **Current cadence** — how many posts/week, which formats.
- **Data** — Insights screenshot/paste or recent-post list (see constraint above).
- **Constraints** — time per week, can they show their face, on-camera vs. faceless, tools available.

Prefer `AskUserQuestion` for the goal/format/cadence choices; keep it to one round.

### 2. Diagnose against the 2026 ranking signals
Rank-order what's holding the account back. The signals that actually move
distribution in 2026 (most → least weighted for Reels):

1. **Watch time / retention** — especially the **first 3 seconds**. A weak hook
   gets the Reel suppressed before it spreads.
2. **Sends per reach (DM shares)** — the single strongest distribution signal.
   "Would someone DM this to a friend?" is the bar.
3. **Saves per reach** — signals lasting value (carousels, how-tos, lists).
4. **Likes & meaningful comments per reach** — still count, but below the above.
5. **Originality score** — recycled/watermarked/reposted clips get throttled.
   Reposting a TikTok with the watermark tanks reach.

Map the user's symptoms to a cause, e.g. "good reach, low likes" → hook works
but payoff/CTA weak; "low reach on every post" → retention or originality
problem, not a hashtag problem.

### 3. Deliver a prioritized plan (the main output)
Give **3–6 ranked actions**, highest-leverage first. Each action =
*what to change → why (which signal) → how to execute this week*. Be specific
to their niche, not generic. Cover, as relevant:

- **Hooks**: rewrite their first 3 seconds. Provide 3–5 concrete hook options
  (pattern interrupt, bold on-screen text, a stat, a contrarian claim).
- **Format mix**: default starting point ≈ **3–4 Reels + 2–3 carousels +
  1–2 stills per week**; carousels for saves, Reels for discovery.
- **Reel length**: aim **7–90s**, sweet spot ~**30–90s**, only as long as
  retention holds.
- **Instagram SEO > hashtags**: keywords in the first caption line, profile
  name field, and on-screen text drive Explore now. Use **3–5 specific
  hashtags** for categorization only — they do not drive reach.
- **Captions**: keyworded first line, a save/share-worthy payoff, one clear CTA
  ("save this", "send to a friend who…").
- **Accessibility**: subtitles on every Reel + alt text — boosts Explore reach.
- **Consistency**: a realistic posting calendar tied to their audience's active
  times; consistency beats volume.
- **Originality**: original footage + trending audio; never post watermarked
  reposts.
- **Engagement loop**: reply to comments/DMs in the first 60 min; ask questions
  that earn comments and shares.

### 4. Content generation helpers (offer, don't dump)
On request, produce ready-to-use assets:
- A **2-week content calendar** (date · format · topic · hook · caption · CTA).
- **Hook bank** — 10–20 niche hooks.
- **Caption + SEO** drafts with keyworded first line and CTA.
- **A/B test ideas** — one variable at a time (hook, cover, length, CTA).
- **30-day experiment plan** with the one metric to watch per week.

If the user wants visuals (cover frames, carousel layouts, post graphics), an
Adobe Express / design skill is available in this environment — hand off to it.

## Output format
- Lead with a one-paragraph **diagnosis** (and the data-mode caveat).
- Then a **ranked action list** (numbered, highest-leverage first).
- Then a **this-week checklist** of ≤5 concrete to-dos.
- Keep it skimmable. Respond in the user's language (Korean for this user).
- Re-run this skill as a loop: ship → measure Insights → re-diagnose.

## 2026 algorithm cheat sheet (reference figures)
Use as guidance, not guarantees; engagement rates vary by niche/size.
- Reels reach ≈ **2.35×** static images; Reel ER ~**2.33%** vs. carousel
  ~**1.37%** vs. single image ~**0.23%**.
- **Carousels** have the highest ER (~**10%** for some accounts), up to **20**
  frames, and get **re-served** to people who didn't swipe — strong for saves.
- Clear captions + alt text can lift Explore reach by ~**35%**.
- Typical path to ~**10k** followers: clear niche + **4–5 posts/week** +
  active engagement over **6–12 months**.
- Mosseri's stance: **hashtags don't drive reach**; cap at ~**5**.

_Sources (verify periodically — algorithm guidance shifts):_ Buffer, Later,
Creatorflow, TrueFuture Media, Improvado (2026 Instagram algorithm guides).

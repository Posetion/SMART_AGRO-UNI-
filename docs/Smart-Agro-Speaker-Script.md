# Smart Agro Community — Speaker Script

**Team:** NextGen Innovators  
**University:** University of Computer Studies (Meiktila)  
**Members:** Arkar Thet Naing · Khant Zaw · Kaung Myat Tun · Yawai Aung  
**Live site:** smart-agro-ucs.surge.sh  

**How to use this:** Speak the **SAY** lines. Do not read the slide bullets out loud. Glance at **DO** for clicks and pauses. Target **10–12 minutes** of talking, plus the demo video on slide 11.

**Names to practise:** *BaGyi Pyoe* (ဘကြီးပျိုး) · *Meiktila* · *NextGen Innovators*

---

## Before you start

- One person leads. Others stand, smile, and take the video / Q&A if you split roles.
- Open the live site on a phone and keep the QR ready (last slide).
- If the video file is not inserted yet, skip to the “after video” close on slide 11 — do not apologise at length.

---

## Slide 1 — Title

**Time:** ~30 seconds

**SAY**

Good morning. We are **NextGen Innovators**, from the University of Computer Studies, Meiktila.

This is **Smart Agro Community** — smart tools for Myanmar farmers.

A farmer should not have to wait for an officer, guess a pesticide, or lose a season because the answer was in English, or in a PDF, or in another township.

Today we will show you five things working together: **Detect**, **BaGyi Pyoe**, **Community**, **Weather**, and the **Heatmap**.

**DO**  
Pause on the title. Point to the five words at the bottom. Then click.

---

## Slide 2 — Challenges Faced by Farmers

**Time:** ~50 seconds

**SAY**

Picture a yellowing leaf at dawn.

Today, that still means waiting. Waiting for someone who knows blast from blight. Waiting while the field gets worse.

Four problems sit on this slide — and they are all real.

**Late detection.** By the time help arrives, the crop is already paying.

**English-only advice.** The farmer speaks Myanmar. The app does not. The crop names are wrong. The script is wrong.

**Isolated outbreaks.** The next farm over has the same pest this week — but nobody sees it as a map. It stays a private disaster.

**No trusted review.** So people spray first and hope. That is expensive, and it is not IPM.

We did not start with a tech stack. We started with this morning.

**DO**  
Touch each of the four cards as you name them. Slow down on “No trusted review.”

---

## Slide 3 — Our Solution

**Time:** ~55 seconds

**SAY**

So what did we build?

Four pieces. One phone.

**AI disease detection.** Photograph a leaf, a stem, or pest damage. The system names the crop and the disease, gives confidence and severity, and points to a Department of Agriculture treatment — not a random internet recipe.

**Outbreak heatmap.** When neighbours scan the same pest in the same week, the township lights up. That is early warning.

**BaGyi Pyoe.** Think of a farming elder you can actually ask — in Myanmar or English — using live township weather. He does not invent a forecast.

**Farmer community.** Posts, photos, linked diagnoses. Reports go to an admin. Experts can answer on the same card. A network — not a rumour mill.

Detect. Ask. Share. Watch the map. That is the product.

**DO**  
Sweep the four cards left to right. Say “BaGyi Pyoe” clearly once so the judges hear the name.

---

## Slide 4 — Project Objectives

**Time:** ~45 seconds

**SAY**

Our objectives are the same four ideas, written as promises.

One: **same-day diagnosis** from a field photo — and a bilingual lab report the farmer can keep.

Two: **weather-aware advice** in the farmer’s language. IPM first. We do not invent brand dosages.

Three: a **township heatmap** so one farm’s photo can warn the region.

Four: **expert review**. The farmer can ask a specialist to look again. Verify, correct, or reject — with a reason.

The line we want you to remember: **models assist; agronomists confirm.**

**DO**  
Hit that last sentence, then click. Do not list every bullet.

---

## Slide 5 — System Design

**Time:** ~50 seconds

**SAY**

Who is in the system? Four roles.

A **guest** can still see weather, the heatmap, and published knowledge — no login.

A **farmer** signs in to detect, chat, and post.

An **expert** reviews real cases.

An **admin** keeps the platform safe.

The flow is simple enough to say in one breath.

Photo in. Quality check. AI names the disease. We save township and weather with the diagnosis. From there the farmer can share it, ask an expert, or drop a pin on the heatmap.

That loop is the whole architecture, in farming language.

**DO**  
Point at the diagrams. Do not walk every box. If a judge leans in, offer: “We can go box-by-box in questions.”

---

## Slide 6 — Key Features

**Time:** ~40 seconds

**SAY**

Around that loop we built the rest of a real farm app.

A **Knowledge Center** — books, articles, journals, searchable in Myanmar and English.

**Expert review** — a queue of real photos, not a chatbot pretending to be a doctor.

**Messages and friends** — so a farmer can talk to a neighbour or a group, and attach a verified diagnosis.

And **weather** — current conditions, seven-day forecast, township or GPS, with crop tips and severe-weather alerts.

This is not only a model demo. It is a product a farmer can live in.

**DO**  
One sentence per card. Click.

---

## Slide 7 — AI-Powered Disease Detection

**Time:** ~55 seconds

**SAY**

Detection is the first screen that has to work in the field.

The farmer takes a photo. We check it is really a plant image. Then the model names crop and disease across Myanmar crops — rice, onion, chili, cotton, and more.

The Myanmar name comes first. Then English. Confidence. Severity from mild to critical.

Treatment is **IPM first**. Chemicals only with label-use caution. Then they can download a bilingual lab report, share it to Community, or request an expert.

If the internet to Gemini is blocked — which happens — we fall back. The farmer still gets an answer.

**DO**  
If a Detect screenshot is on the left, point at the report / treatment, not the logo.

---

## Slide 8 — Who Uses the Platform

**Time:** ~40 seconds

**SAY**

Same four people. Different jobs.

**Guest** — look around. Weather, map, knowledge.

**Farmer** — this is the hero user. Detect. Ask BaGyi Pyoe. Post. Warn neighbours. Request a second look.

**Expert** — open the queue. Verify, correct, or reject. Send a reason back.

**Admin** — moderate, manage roles, read the audit log.

If it is not on this slide, it is not a free-for-all. Permissions are by role.

**DO**  
Gesture guest → farmer → expert → admin. Click.

---

## Slide 9 — Outbreak Heatmap

**Time:** ~40 seconds

**SAY**

One photo saves one field. Many photos save a township.

The map uses Leaflet and Myanmar state boundaries. Each detection can become a pin and a heat layer. Filter by disease. Filter by date.

When many farmers scan the same pest in the same week, the township lights up **while the crop can still be saved**.

That is GIS with a farming purpose — not a map for the sake of a map.

**DO**  
Name the four labels quickly, then land on “the township lights up.”

---

## Slide 10 — Farmers Learn Together

**Time:** ~40 seconds

**SAY**

Community is where isolation ends.

A farmer posts a field photo — and can link the diagnosis, so it is not just “something is wrong.”

People like, comment, and reply in Myanmar.

If the advice is spam, harmful, or false, they report it. An admin decides: stay or go. Expert answers stay on the card.

The neighbour who has not opened Detect yet can still see: this pest is here, this week.

That is how a private problem becomes public warning — without becoming a rumour page.

**DO**  
This is a good human slide. Look at the judges, not the bullets.

---

## Slide 11 — Product Demo

**Time:** 20–30 seconds of talk **before** play, then the video, then 15 seconds after.

This is the video slide. Do **not** narrate a fake walkthrough if the clip is not ready. Do **not** read “Insert MP4.”

### Before you press play

**SAY**

Now the product, not the slides.

You will see the farmer’s path: open Smart Agro, take or upload a leaf, read the diagnosis, ask BaGyi Pyoe, and see the map.

I will talk with the video — watch the screen, not me.

**DO**  
Stand to the side so you do not block the frame. Click play. Lower your voice slightly so the video is the hero.

---

### VIDEO — talk along with the clip

> **Leave this whole block empty until the MP4 is cut.**  
> Watch the video once with a timer. Write one short line per moment. Speak those lines *with* the picture — do not fight the video.

**Clip length:** ____ : ____  
**What the video shows (one sentence):** _________________________________

| Time | What is on screen | What you say (one breath) |
|---|---|---|
| 0:00 | | |
| 0:10 | | |
| 0:20 | | |
| 0:30 | | |
| 0:40 | | |
| 0:50 | | |
| 1:00 | | |
| 1:15 | | |
| 1:30 | | |
| 1:45 | | |
| 2:00 | | |
| 2:15 | | |
| 2:30 | | |
| 2:45 | | |
| 3:00 | | |

**If something fails on screen:** stay calm. Say “That step is in the live app — I can show it after.” Do not debug out loud.

**If there is no video today:** skip the table. Say: “The live demo is on the QR on our last slide — Detect, BaGyi Pyoe, and the heatmap are running.” Then go to slide 12.

---

### After the video

**SAY**

That is the loop you just saw: **see the leaf, understand the disease, ask, share, watch the map.**

**DO**  
One beat of silence. Then click to the stack.

---

## Slide 12 — Technology Stack

**Time:** ~35 seconds

**SAY**

Under the farm language, this is a real system.

The phone app is a **React 19** progressive web app — it installs, it works like a phone app.

The API is **Node and Express**. Photos and files live in **MongoDB with GridFS**.

Vision and chat go to **Gemini**, with a fallback. There is an optional **FastAPI** rice model if we run it locally.

Judges who want architecture: we can open the diagrams in questions. This slide is only the four names.

**DO**  
Do not turn this into a lecture. Four names, one sentence each.

---

## Slide 13 — Security & Reliability

**Time:** ~40 seconds

**SAY**

Farmers will upload photos of their fields. That data has to be treated like it matters.

Sign-in is email and password, or a guest session. After that, JWT access and refresh tokens. Roles are enforced: guest, farmer, expert, admin.

Passwords are hashed. Uploads are checked by the real file type, not the file name. Every request body is validated before it touches the database.

Helmet, CORS, rate limits. The Python AI service is not public. If a Gemini key hits a quota, we rotate.

Admins have an audit log and a moderation queue. Reports need a reason. If a post is removed, the author is told.

This is how we argue that the community stays safe enough to trust.

**DO**  
If time is short, keep only: roles, hashed passwords, upload checks, audit log.

---

## Slide 14 — Future Roadmap

**Time:** ~35 seconds

**SAY**

What is next — honestly.

**Near:** more DOA crop manuals in the treatment catalog. Cache saved reports for weak connections. Outbreak notices for the farmer’s own township.

**Next:** voice in for BaGyi Pyoe, for farmers who do not want to type.

**Later:** seasonal risk from the heatmap plus weather history.

We are not promising a national ministry platform on this slide. We are promising the next useful thing for the field.

**DO**  
Walk 01 to 05 left to right. Stop after “voice.” Click.

---

## Slide 15 — Thank You

**Time:** ~40 seconds

**SAY**

Smart Agro Community.

**Detect. BaGyi Pyoe. Community. Heatmap.** That is smarter farming.

We are **NextGen Innovators** — Arkar Thet Naing, Khant Zaw, Kaung Myat Tun, and Yawai Aung — University of Computer Studies, Meiktila.

The live demo is on the QR. We would be glad to take your questions.

Thank you.

**DO**  
Smile. Stop talking. Let the QR sit. Hands off the clicker until a judge speaks.

---

## Q&A pocket answers

Keep these short. If you do not know, say you will check — do not invent.

**Why not only a model?**  
Because a model without weather, community, and an expert is another English app. The farmer needs a loop.

**What if Gemini is blocked?**  
We retry, then fall back — including a local AI service when it is running. The farmer should still get a result.

**Is the heatmap real data?**  
It is built from community detections. More scans, clearer map. That is the point of the network.

**Who confirms the AI?**  
An expert. Verify, correct, or reject, with a reason. Models assist; agronomists confirm.

**Is it only rice?**  
Rice is the heart, but detection covers many Myanmar field crops.

**Offline?**  
The PWA caches the app shell. Detection and live weather need a connection. Cached reports are on the roadmap.

---

## Timing cheat sheet

| Slides | Target |
|---|---|
| 1–4  Hook, problem, solution, objectives | 3 min |
| 5–10 Design, features, detect, users, map, community | 4 min |
| 11 Video + talk-along | *(your clip length)* |
| 12–14 Stack, security, roadmap | 2 min |
| 15 Thank you | 40 sec |
| **Talking, without video** | **~10–12 min** |

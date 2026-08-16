# Free cloud (no laptop)

The app is ready to run as **one free website** on Render + free MongoDB Atlas.
Compass still works — you point it at Atlas instead of localhost.

I cannot create these accounts for you. Do this once:

## 1. MongoDB Atlas (free) — keeps Compass

1. Open https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google (`kaungmyattun069@gmail.com` is fine)
3. Create an **M0 Free** cluster
4. Database Access → add a user (save the password)
5. Network Access → **Allow Access from Anywhere** (`0.0.0.0/0`) so Render can connect
6. Database → Connect → Drivers → copy the URI  
   Example: `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/smart_agro?retryWrites=true&w=majority`

In Compass: New Connection → paste that URI → Connect.

On your laptop, seed Atlas once (in `server`, with the Atlas URI):

```bash
$env:MONGODB_URI="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/smart_agro"
npm run seed
```

## 2. GitHub (free)

1. Open https://github.com/new
2. Create a repo (e.g. `SMART-AGRO`), do not add a README
3. In this project folder:

```bash
git init
git add .
git commit -m "Ready for free cloud"
git branch -M main
git remote add origin https://github.com/YOURNAME/SMART-AGRO.git
git push -u origin main
```

## 3. Render (free)

1. Open https://render.com/register
2. Sign up with GitHub
3. New → **Blueprint** → pick the `SMART-AGRO` repo (`render.yaml` is already in the project)
4. When it asks for env vars, paste:
   - **MONGODB_URI** — Atlas string from step 1
   - **GEMINI_API_KEY** — same key as in your local `server/.env`

Wait for the first deploy. The site URL looks like:

`https://smart-agro.onrender.com`

Use **that** URL (or a QR of it) instead of the laptop share script.

## What to expect (free)

- First visitor after idle time may wait ~30–60 seconds (free server sleeps)
- Fine for people far away, including 400 miles
- Not as strong as a paid server for 100–150 people clicking at once
- Your laptop is not in the path after this

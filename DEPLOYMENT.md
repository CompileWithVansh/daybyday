# DayByDay — Free Deployment Guide

Everything here is **completely free** with no credit card required.

---

## 1. Database — Neon (Free PostgreSQL)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Click **"Create a project"** → name it `daybyday`
3. Select the closest region to you
4. Once created, copy the **pooled connection string** from the dashboard
5. It looks like: `postgresql://user:pass@ep-xxxxx.region.aws.neon.tech/daybyday?sslmode=require`

**Free tier:** 0.5GB storage, auto-suspend after 5 min inactivity (auto-resumes on request)

---

## 2. Media Storage — Cloudinary (Free)

1. Go to [cloudinary.com](https://cloudinary.com) and sign up
2. Go to **Settings → Access Keys** (or Dashboard)
3. Copy:
   - **Cloud Name** (shown at the top)
   - **API Key** (numeric)
   - **API Secret** (click "reveal")

**Free tier:** 25GB storage + 25GB bandwidth/month

---

## 3. Backend — Render.com (Free)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) and sign up with GitHub
3. Click **"New Web Service"**
4. Connect your GitHub repo
5. Configure:
   - **Name:** `daybyday-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** Free
6. Add **Environment Variables** (from your .env):
   - `DATABASE_URL` = your Neon connection string
   - `DATABASE_SSL` = `true`
   - `CLOUDINARY_NAME` = your cloud name
   - `CLOUDINARY_KEY` = your api key
   - `CLOUDINARY_SECRET` = your api secret
   - `APP_KEYS` = generate with: `node -e "console.log(Array.from({length:4},()=>require('crypto').randomBytes(32).toString('base64')).join(','))"`
   - `API_TOKEN_SALT` = generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `ADMIN_JWT_SECRET` = generate (same command)
   - `TRANSFER_TOKEN_SALT` = generate (same command)
   - `JWT_SECRET` = generate (same command)
   - `HOST` = `0.0.0.0`
   - `PORT` = `10000` (Render uses this)
   - `FRONTEND_URL` = `https://your-project.vercel.app`
   - `NODE_ENV` = `production`
7. Click **Deploy**

**Free tier:** 750 hours/month, spins down after 15min inactivity (~30s cold start)

**Note:** First time after deploy, visit `https://your-app.onrender.com/admin` to create your Strapi admin account. The two user accounts (user1/user2) are auto-seeded on first boot.

---

## 4. Frontend — Vercel (Free)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"Add New Project"** → Import your repo
3. Set **Root Directory** to: `frontend`
4. Framework: Next.js (auto-detected)
5. Add **Environment Variable:**
   - `NEXT_PUBLIC_STRAPI_URL` = `https://your-app.onrender.com`
6. Click **Deploy**

**Free tier:** Unlimited personal projects, automatic HTTPS, custom domain

---

## Summary

| Service | What | Free Tier | URL |
|---------|------|-----------|-----|
| Neon | PostgreSQL database | 0.5GB forever | neon.tech |
| Cloudinary | Photo/media storage | 25GB | cloudinary.com |
| Render | Strapi backend hosting | 750 hrs/month | render.com |
| Vercel | Next.js frontend hosting | Unlimited | vercel.com |

**Total cost: $0/month** 🎉

---

## Login Credentials

Once deployed, log in with:
- **User 1:** `user1@daybyday.app` / `SecurePass1!`
- **User 2:** `user2@daybyday.app` / `SecurePass2!`

You can change these passwords in the Strapi admin panel after first deployment.

---

## Custom Domain (Optional, Free)

Both Vercel and Render support custom domains on free tier. If you buy a domain later (cheapest is ~$1-10/year), you can point it to your Vercel frontend.

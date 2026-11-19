# Production Deployment Guide: Railway & Vercel

---

## 1. Backend & PostgreSQL Deployment on Railway

### Step 1: Create Railway Project
1. Log in to [Railway.app](https://railway.app).
2. Click **New Project** &rarr; **Provision PostgreSQL**.
3. Railway will provision a dedicated PostgreSQL instance and provide the `DATABASE_URL`.

### Step 2: Deploy Backend Service
1. In the same project, click **New Service** &rarr; **GitHub Repo** &rarr; Select your `sellsy` repository.
2. Under service **Settings**:
   - Set **Root Directory** to `backend`.
   - Railway will automatically detect `Dockerfile` or `railway.json`.
3. Under **Variables**, add:
   ```env
   PORT=8000
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   SECRET_KEY=generate_a_random_64_character_hex_key
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ```
4. Generate a public domain under **Networking** (e.g. `https://sellsy-backend-production.up.railway.app`).
5. Verify health check by visiting:
   `https://sellsy-backend-production.up.railway.app/health`

---

## 2. Frontend Deployment on Vercel

### Step 1: Import Project into Vercel
1. Log in to [Vercel.com](https://vercel.com).
2. Click **Add New** &rarr; **Project** &rarr; Import your `sellsy` repository.
3. In the project configuration:
   - Set **Root Directory** to `frontend`.
   - Framework preset: **Next.js**.

### Step 2: Configure Environment Variables
Under **Environment Variables**, set:
```env
NEXT_PUBLIC_API_URL=https://sellsy-backend-production.up.railway.app
```
*(Point this to your live Railway backend URL)*

### Step 3: Deploy
1. Click **Deploy**.
2. Vercel will build the production Next.js bundle and deploy globally on edge CDN.

---

## 3. Local Development Setup

To run Storsy locally on your workstation:

### Backend:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to interact with the platform. Click **Launch Instant Demo Account** on the login page for immediate zero-friction evaluation!


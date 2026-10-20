# TiffinLink — Complete Free Production Deployment Guide

A step-by-step guide to hosting **TiffinLink** (React + Node.js/Express + Socket.IO + MongoDB) using 100% free, production-ready hosting platforms.

---

## Architecture Overview

| Component | Service | Free Tier Allowance | Purpose |
| :--- | :--- | :--- | :--- |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) | 512 MB Storage, Shared RAM/vCPU (Permanent Free) | Managed MongoDB, daily snapshots, SSL |
| **Backend API** | [Render](https://render.com) | 750 free instance hours/month | Node.js Express server + WebSockets (Socket.IO) |
| **Frontend UI** | [Vercel](https://vercel.com) | 100 GB bandwidth/month, unlimited builds | React (Vite) Single Page App on global Edge CDN |

---

## Phase 1: Deploy MongoDB Database (MongoDB Atlas)

### Step 1: Create an Account & Cluster
1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up / log in.
2. Click **Create a deployment** and select **M0 (Free)**.
3. Choose your Cloud Provider & Region (e.g., **AWS / Mumbai (`ap-south-1`)** for low latency in India).
4. Name your cluster (e.g., `tiffinlink-cluster`) and click **Create Deployment**.

### Step 2: Database User Security
1. In the **Security Quickstart** popup:
   - Create a Username: `tiffinlink_admin`
   - Generate or create a strong Password: (e.g. `YourSecurePassword123`)
   - Click **Create User**.

### Step 3: Configure Network Access (IP Whitelist)
1. In the left sidebar under **Security**, click **Network Access**.
2. Click **+ Add IP Address**.
3. Choose **Allow Access From Anywhere** (`0.0.0.0/0`).
4. Click **Confirm**. *(This allows your Render backend to connect to MongoDB securely).*

### Step 4: Get Your Connection String
1. Under **Deployment**, click **Database**.
2. Click **Connect** next to your cluster.
3. Select **Drivers** (Node.js).
4. Copy the connection string. It will look like this:
   ```
   mongodb+srv://tiffinlink_admin:<password>@tiffinlink-cluster.xxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual database user password and append `/tiffinlink` before `?`:
   ```
   mongodb+srv://tiffinlink_admin:YourSecurePassword123@tiffinlink-cluster.xxxx.mongodb.net/tiffinlink?retryWrites=true&w=majority
   ```
   *(Keep this string ready for the backend setup).*

---

## Phase 2: Deploy Backend Server (Render)

### Step 1: Sign Up & Connect Repository
1. Go to [https://render.com](https://render.com) and sign in with your **GitHub account**.
2. Click **New +** (top right) and select **Web Service**.
3. Select your GitHub repository: `sahal42patel-wq/tiffin-link-final-` (or your repo name).

### Step 2: Configure Web Service Settings
Fill in the following fields:

- **Name**: `tiffinlink-server`
- **Region**: Choose closest (e.g., `Singapore` or `Frankfurt`)
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**:
  ```bash
  npm install
  ```
- **Start Command**:
  ```bash
  node src/server.js
  ```
- **Instance Type**: Select **Free** (0.1 CPU, 512 MB RAM)

### Step 3: Add Environment Variables
Scroll down to **Environment Variables** and add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production security & optimizations |
| `PORT` | `5000` | Port for Express (Render routes traffic automatically) |
| `MONGO_URI` | `mongodb+srv://tiffinlink_admin:...` | Your MongoDB connection string from Phase 1 |
| `JWT_SECRET` | *(Random 32-character string)* | e.g. `tl_jwt_super_secret_production_2026_key` |
| `SESSION_SECRET` | *(Random 32-character string)* | e.g. `tl_session_super_secret_production_2026_key` |
| `CLIENT_URL` | `https://your-tiffinlink.vercel.app` | You can put `*` initially, then update with Vercel URL |

### Step 4: Deploy & Test Backend
1. Click **Create Web Service**.
2. Render will build and deploy your Node.js server.
3. Once the build completes, you will see a green checkmark with your public URL:
   `https://tiffinlink-server.onrender.com`
4. Test by opening `https://tiffinlink-server.onrender.com/` in your browser. You should receive a JSON response confirming the server is live.

---

## Phase 3: Deploy Frontend (Vercel)

### Step 1: Sign In & Import Repository
1. Go to [https://vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** → **Project**.
3. Select your `tiffin-link-final-` repository and click **Import**.

### Step 2: Configure Build & Output
In the **Configure Project** screen:

- **Framework Preset**: `Vite`
- **Root Directory**: Click **Edit** and choose `client` (Click **Continue**).
- **Build Command**: `npm run build` (default)
- **Output Directory**: `dist` (default)
- **Install Command**: `npm install` (default)

### Step 3: Add Environment Variables
Expand the **Environment Variables** section and add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://tiffinlink-server.onrender.com/api` | Your Render backend URL + `/api` |
| `VITE_SOCKET_URL` | `https://tiffinlink-server.onrender.com` | Your Render backend URL (no trailing slash) |

### Step 4: SPA Routing Configuration (Vercel Rewrites)
To prevent `404 Not Found` when refreshing internal routes (like `/provider/orders` or `/delivery/active`), ensure a `vercel.json` file exists in `client/`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Step 5: Deploy
1. Click **Deploy**.
2. In ~40 seconds, Vercel will finish building and present you with your production URL:
   `https://tiffinlink-final.vercel.app`

---

## Phase 4: Final Linkage & CORS Check

Now connect the frontend and backend together:

1. Copy your Vercel URL (e.g. `https://tiffinlink-final.vercel.app`).
2. Go back to **Render Dashboard** → Your Web Service → **Environment**.
3. Update `CLIENT_URL` to `https://tiffinlink-final.vercel.app`.
4. Render will automatically redeploy the backend with the updated CORS origin.

---

## Phase 5: Free-Tier Optimization Tips

### 1. Keep Render Awake (Prevent 15-Minute Cold Starts)
Render's free tier puts backend instances to sleep after 15 minutes of inactivity. To keep your food delivery orders and sockets always active:
1. Create a free account at [https://cron-job.org](https://cron-job.org) or [https://uptimerobot.com](https://uptimerobot.com).
2. Create a new HTTP monitor:
   - **URL**: `https://tiffinlink-server.onrender.com/`
   - **Interval**: Every 10 or 14 minutes.
3. Your server will stay warm 24/7 with 0 delay.

### 2. Export / Import Existing Local Database to Atlas
If you want to migrate your local data to MongoDB Atlas:
1. From your local project terminal:
   ```bash
   npm run db:export --prefix server
   ```
2. Set your `MONGO_URI` in `.env` to your new Atlas connection string.
3. Run:
   ```bash
   npm run db:import --prefix server
   ```
All providers, sample tiffins, and orders will be loaded into MongoDB Atlas.

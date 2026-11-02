# 🎯 SentiTrack — AI-Powered Nigerian Social Media Sentiment Analyser

> **Real-time brand intelligence & customer voice diagnosis for Nigerian enterprises.**  
> Monitor brand perception across Twitter/X with Playwright Chrome CDP scraping, deep sentiment classification via Azure OpenAI **gpt-5-mini**, automated 11-category complaint detection, competitor benchmarking, and production-grade Docker deployment on Azure.

![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python Version](https://img.shields.io/badge/python-3.11+-green.svg)
![React Version](https://img.shields.io/badge/react-18.3-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal.svg)
![Docker](https://img.shields.io/badge/docker-compose-blue.svg)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-orange.svg)
![Status](https://img.shields.io/badge/status-Production--Ready-brightgreen.svg)
![Version](https://img.shields.io/badge/version-3.0-purple.svg)

---

## 🌐 Live Production Demo

- **Application URL:** [http://4.222.217.226](http://4.222.217.226)
- **Interactive Swagger API Docs:** [http://4.222.217.226/api/docs](http://4.222.217.226/api/docs)
- **Health Check Endpoint:** [http://4.222.217.226/api/health](http://4.222.217.226/api/health)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Technologies & Stack](#-technologies--stack)
- [Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Local Development Setup](#local-development-setup)
  - [Configuration (.env)](#configuration-env)
  - [Twitter Session & Cookie Setup](#twitter-session--cookie-setup-one-time)
- [API Documentation](#-api-documentation)
- [Production Deployment (Azure VM + Docker + CI/CD)](#-production-deployment-azure-vm--docker--cicd)
- [Frontend Features](#-frontend-features)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## 🚀 Overview

**SentiTrack** is an enterprise-grade brand intelligence and sentiment analytics platform engineered specifically for businesses operating in the Nigerian and African markets. Traditional sentiment tools fail on Nigerian social media because they misinterpret local nuances, banking jargon (such as debit alert reversals, USSD timeouts, dispense errors), and regional slang.

SentiTrack solves this through:
1. **Live High-Resilience Twitter/X Scraping:** Leveraging Playwright Chrome DevTools Protocol (CDP) with session cookie persistence (`.x_session`) to bypass bot challenges and capture real-time customer conversations.
2. **Deep Reasoning AI (`gpt-5-mini`):** Azure OpenAI / Azure AI Foundry reasoning engine for accurate sentiment classification, emotional tone tagging, and executive summaries.
3. **11 Smart Complaint Categories:** Fine-grained categorization tailored to consumer friction points in African fintech, banking, telco, logistics, and retail.
4. **Autonomous Competitor Discovery:** Automatic identification of direct Nigerian market competitors and comparative sentiment benchmarking.
5. **Production Docker Architecture:** Fully containerized multi-tier service deployed on an Azure Linux VM with automated GitHub Actions CI/CD.

---

## ✨ Key Features

### 🔍 Resilient Playwright Chrome CDP Scraping
- **Anti-Bot Bypass:** Uses an automated Google Chrome instance launched via Chrome DevTools Protocol (CDP) on port `9222` with real browser fingerprints (`--disable-blink-features=AutomationControlled`).
- **GraphQL & DOM Interception:** Captures raw Twitter GraphQL `/SearchTimeline` payloads alongside rendered DOM tweet articles (`article[data-testid='tweet']`).
- **Session Cookie Rehydration:** Loads authenticated session cookies (`cookies.json` and `session_state.json`) to browse without repetitive logins or 2FA roadblocks.
- **Auto-Launch & Fallback Pipeline:** If Chrome is not running, the scraper auto-launches it. If live Twitter blocks network access, it transitions seamlessly to an intelligent realistic social feed with timeout protection (120 seconds).

### 🤖 Azure OpenAI `gpt-5-mini` Sentiment Engine
- **Three-Tier Sentiment Classification:** Classifies posts into **Positive**, **Negative**, and **Neutral** with calibrated confidence scores.
- **Emotion Tagging:** Detects dominant emotional states: *Joy, Anger, Frustration, Disappointment, Trust, Fear, Disgust, or Neutral*.
- **Executive AI Diagnosis:** Generates a structured C-suite summary identifying root causes and prescribing an operational recommendation.
- **Text Preprocessing:** Sanitizes Twitter handles (`@user`), normalizes URLs, and cleans noisy whitespace before batch inference.

### 🏢 Autonomous Competitor Intelligence
- Dynamically queries Azure OpenAI to identify direct, real-world Nigerian competitors in the same vertical (e.g., inputting `Chowdeck` automatically surfaces `Glovo`, `FoodCourt`, `Eden Life`, and `Jumia Food`).
- Scrapes and calculates sentiment scores across competitors in parallel.
- Generates 7-day historical trend comparison lines.

### 📊 11-Category Smart Complaint Taxonomy
Instead of generic classifications, negative feedback is mapped into 11 domain-specific complaint categories:
1. **Customer Support & Service** (slow response, unhelpful agents, long queues)
2. **App & Digital Platform** (crashes, bugs, biometric errors, UI glitches)
3. **Billing & Transaction Reversals** (unauthorized debits, dispense errors, pending transfers)
4. **Network & Server Downtime** (switch downtime, USSD failure, timeout, 737 issues)
5. **Delivery & Logistics** (rider delays, cold food, lost packages, missing items)
6. **Product Quality & Defects** (faulty items, expired goods, damaged items)
7. **Account Security & Fraud** (BVN/KYC lockout, phishing, account restrictions)
8. **Pricing & Unfair Fees** (hidden tariffs, high charges, exorbitant rates)
9. **Policy & Terms Transparency** (fine print, unannounced policy updates)
10. **Staff Conduct & Professionalism** (branch staff attitude, discourtesy)
11. **Other Issues** (unclassified feedback)

### ⚡ Unified `/analyze_all` Single-Scrape Endpoint
- Eliminates redundant scraping: a single request fetches posts once and concurrently powers the high-level dashboard, customer complaint distribution, tweet explorer, volume trend charts, and AI diagnosis.

### 🔐 Authentication with Supabase & Guest Mode
- Full Supabase email/password authentication (sign in, sign up, session recovery).
- **Guest / Demo Mode:** Click **"Continue as Guest / Demo Mode"** to explore every analytical feature instantly without creating an account.

---

## 🏗️ Architecture

```
                                  [ Browser / Client ]
                                            │
                                            ▼
                           ┌─────────────────────────────────┐
                           │   Docker Container: Frontend    │
                           │   (Nginx Alpine Reverse Proxy)   │
                           │        Port 80 (Public)         │
                           └────────────────┬────────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     │ /                                           │ /api/*
                     ▼                                             ▼
        ┌─────────────────────────┐               ┌─────────────────────────────────┐
        │ React 18 + Vite SPA     │               │   Docker Container: Backend     │
        │ Tailwind + Radix UI     │               │   (FastAPI + Python 3.11)       │
        │ Recharts Visualizations │               │        Port 8000 (Internal)     │
        └─────────────────────────┘               └────────────────┬────────────────┘
                                                                   │
                                  ┌────────────────────────────────┼────────────────────────────────┐
                                  │                                │                                │
                                  ▼                                ▼                                ▼
                   ┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────────────┐
                   │    Playwright Scraper        │ │   SentimentEngine            │ │   Competitor Intelligence    │
                   │  - Chrome CDP (Port 9222)    │ │  - Azure OpenAI gpt-5-mini   │ │  - Azure AI Foundry Client   │
                   │  - cookies.json / .x_session │ │  - 11 Complaint Categories   │ │  - Market Researcher Agent   │
                   │  - GraphQL Timeline Intercept│ │  - Emotion Detection         │ │  - Multi-brand Benchmark     │
                   └──────────────┬───────────────┘ └──────────────┬───────────────┘ └──────────────┬───────────────┘
                                  │                                │                                │
                                  ▼                                ▼                                ▼
                             [ Twitter / X ]               [ Azure AI Foundry ]            [ Azure AI Foundry ]
```

---

## 📁 Project Structure

```
AI-Powered-Sentiment-Analyser-/
├── .github/
│   └── workflows/
│       └── deploy.yml               # GitHub Actions CI/CD (Test -> SSH -> Docker Deploy)
├── backend/
│   ├── __init__.py                  # Package init
│   ├── main.py                      # FastAPI app, CORS, routes & unified /analyze_all
│   ├── analyzer.py                  # gpt-5-mini SentimentEngine & 11 complaint categories
│   ├── scraper.py                   # Playwright Chrome CDP scraper with auto-launch & fallback
│   ├── gemini_client.py             # Azure AI Foundry competitor discovery client
│   ├── models.py                    # Pydantic data schemas (AnalysisRequest, UnifiedResponse, etc.)
│   └── session_manager.py           # Cookie loader/saver & CDP session management
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/              # Header (instant search navigation), Sidebar, AppLayout
│   │   │   ├── search/              # SearchResultsSummary, ComplaintPanel, PostCard, SearchCommandCenter
│   │   │   ├── dashboard/           # SentimentOverview, VolumeChart, MetricsCards
│   │   │   ├── ui/                  # Radix UI / shadcn accessible component primitives
│   │   │   └── auth/                # Supabase Auth modal and Guest Mode switcher
│   │   ├── pages/                   # Search, Complaints, Competitors, Analytics, Settings, Auth
│   │   ├── hooks/                   # useSearchManager (localStorage persistence & cache hydration)
│   │   ├── lib/api/                 # sentimentApi.ts (typed API client with 180s timeout)
│   │   ├── integrations/supabase/   # Supabase client with graceful fallbacks
│   │   └── types/                   # TypeScript schemas for tweets, stats, competitors
│   ├── nginx.conf                   # Production Nginx reverse proxy config (/api/ -> backend:8000)
│   ├── Dockerfile                   # Multi-stage build (Node 20 Alpine -> Nginx Alpine)
│   ├── package.json                 # React 18, Vite 5, Tailwind CSS, Lucide, Recharts
│   └── vite.config.ts               # Vite bundler configuration
├── .env                             # Environment configuration (ignored in git)
├── .gitignore                       # Git ignore definitions (.env, .pem, .x_session, etc.)
├── cookies.json                     # Cached Twitter session cookies (auto-generated)
├── session_state.json               # Cached Playwright browser storage state (auto-generated)
├── docker-compose.yml               # Multi-container orchestration (backend + frontend)
├── Dockerfile.backend               # Playwright Python container + Google Chrome Stable
├── DEPLOYMENT.md                    # Detailed Azure VM production deployment guide
├── export_cookies.py                # Interactive CLI tool to capture Twitter login cookies
├── requirements.txt                 # Backend Python package dependencies
└── README.md                        # Project documentation
```

---

## 🛠️ Technologies & Stack

### Backend
| Technology | Version / Purpose |
|---|---|
| **Python** | `3.11+` — Core language |
| **FastAPI** | `0.100+` — High-performance asynchronous REST API framework |
| **Azure OpenAI / AI Foundry** | `gpt-5-mini` (`2024-12-01-preview`) — Sentiment reasoning, 11 complaint categories & AI executive recommendations |
| **Playwright** | `1.49+` — Chrome DevTools Protocol (CDP) automation, GraphQL interception & session persistence |
| **Google Chrome Stable** | Official Linux package — Anti-detection browser for Playwright CDP |
| **Pydantic** | `v2.0+` — Request/response validation and strict schema typing |
| **Pandas & NumPy** | `2.0+` — Data manipulation, aggregation, and time-series computation |
| **Uvicorn** | `0.23+` — Production ASGI web server |

### Frontend
| Technology | Version / Purpose |
|---|---|
| **React** | `18.3` — Component-driven reactive user interface |
| **Vite** | `5.4` — High-speed modern bundler and dev server |
| **TypeScript** | `5.8` — Strict static typing across components and API models |
| **Tailwind CSS** | `3.4` — Utility-first responsive design system |
| **Radix UI** | Accessible headless UI primitives (Dialog, Dropdown, Tabs, Accordion, Tooltip) |
| **Recharts** | `2.15` — Responsive SVG charts for sentiment distribution & volume over time |
| **Lucide React** | Consistent iconography |
| **TanStack Query** | Asynchronous data fetching and cache management |
| **Supabase JS** | `2.97+` — User authentication, guest mode, and cloud session management |

### DevOps & Infrastructure
| Component | Implementation |
|---|---|
| **Cloud Hosting** | **Azure Linux Virtual Machine** (Ubuntu 24.04 LTS, Static Public IP) |
| **Containerization** | **Docker & Docker Compose** (multi-stage frontend build + Playwright backend) |
| **CI/CD** | **GitHub Actions** (`.github/workflows/deploy.yml`) with automated SSH deployment |
| **Web Server / Proxy** | **Nginx Alpine** with Gzip compression, extended 180s timeouts & SPA fallback routing |
| **Shared Memory** | `shm_size: 2gb` in Docker to ensure zero headless Chrome renderer crashes |

---

## 🎯 Quick Start

### Prerequisites
- **Python 3.11+**
- **Node.js 20+** and **npm**
- **Google Chrome** installed locally
- **Azure OpenAI / Azure AI Foundry** API key with access to `gpt-5-mini`

---

### Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Timileyhin-Quadri/AI-Powered-Sentiment-Analyser-.git
cd AI-Powered-Sentiment-Analyser-
```

#### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Azure AI Foundry / OpenAI Credentials
api_key=your_azure_api_key_here
api_endpoint=https://your-resource.services.ai.azure.com/
model=gpt-5-mini
model_version=2024-12-01-preview

# Chrome CDP Configuration
CHROME_CDP_PORT=9222
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

#### 3. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browser binaries
playwright install chromium

# Start FastAPI backend
uvicorn backend.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

#### 4. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
Open `http://localhost:8080` in your browser.

---

### Twitter Session & Cookie Setup (One-Time)

To enable live scraping without encountering login prompts or bot roadblocks:

```bash
# Option 1: Interactive Manual Login
# Opens a clean browser window. Log into Twitter/X once.
# Upon reaching the home timeline, cookies are automatically captured and saved.
python export_cookies.py

# Option 2: Extract from already-running Chrome (started with --remote-debugging-port=9222)
python export_cookies.py --from-cdp

# Option 3: Check saved session validity
python export_cookies.py --check
```

Once saved to `cookies.json` and `session_state.json`, future searches will automatically load your session.

---

## 💻 API Documentation

### 1. Unified Brand Analysis (`POST /analyze_all`)
*Recommended for frontends — scrapes once and returns both overview metrics and customer voice data.*

```bash
curl -X POST "http://localhost:8000/analyze_all" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "GTBank",
    "limit": 30
  }'
```

**Response Format:**
```json
{
  "summary": {
    "total": 30,
    "positive": 8,
    "negative": 18,
    "neutral": 4,
    "sentiment_score": -33.33,
    "engagement_rate": 5.4,
    "active_issues": 18
  },
  "tweets": [
    {
      "text": "My transfer failed on GTBank 737 but my account was debited since yesterday!",
      "sentiment": "Negative",
      "confidence": 0.96,
      "timestamp": "2026-10-31T09:40:00Z",
      "category": "Billing & Transaction Reversals",
      "emotion": "frustration",
      "summary": "Transfer failed with unreversed debit"
    }
  ],
  "volume_over_time": [
    { "date": "2026-10-30", "count": 14 },
    { "date": "2026-10-31", "count": 16 }
  ],
  "customer_voice": {
    "complaint_categories": [
      { "category": "Billing & Transaction Reversals", "percentage": 55.6, "count": 10 },
      { "category": "Network & Server Downtime", "percentage": 27.8, "count": 5 },
      { "category": "Customer Support & Service", "percentage": 16.6, "count": 3 }
    ],
    "recent_opinions": [
      {
        "text": "My transfer failed on GTBank 737...",
        "sentiment": "Negative",
        "confidence": 0.96,
        "category": "Billing & Transaction Reversals",
        "emotion": "frustration"
      }
    ]
  },
  "ai_insights": {
    "summary": "GTBank customer discourse is currently dominated by unreversed debits and network downtime on USSD channels.",
    "key_themes": [
      "Failed interbank transfers",
      "Delayed auto-reversal timeline",
      "USSD service unresponsiveness"
    ],
    "recommendation": "Accelerate automated settlement reversals and publish clear server maintenance notices."
  }
}
```

### 2. Competitor Benchmarking (`POST /analyze_competitors`)
*Identifies real competitors using Azure OpenAI and scrapes live sentiment for comparative market analysis.*

```bash
curl -X POST "http://localhost:8000/analyze_competitors" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "Chowdeck"
  }'
```

**Response Format:**
```json
{
  "competitors": [
    {
      "name": "Chowdeck",
      "sentiment_score": 78.5,
      "total_mentions": 15,
      "positive_rate": 73.3,
      "negative_rate": 13.3
    },
    {
      "name": "Glovo",
      "sentiment_score": 62.0,
      "total_mentions": 15,
      "positive_rate": 60.0,
      "negative_rate": 20.0
    },
    {
      "name": "FoodCourt",
      "sentiment_score": 70.0,
      "total_mentions": 15,
      "positive_rate": 66.7,
      "negative_rate": 13.3
    }
  ],
  "time_comparison": [
    {
      "date": "2026-10-31",
      "brand": 78.5,
      "competitor_a": 62.0,
      "competitor_b": 70.0,
      "competitor_c": 55.0,
      "competitor_d": 50.0
    }
  ]
}
```

### 3. Session Status (`GET /session/status`)
*Inspects whether authenticated cookies and the Chrome CDP port are active.*

```bash
curl http://localhost:8000/session/status
```

### 4. Health Check (`GET /health`)
```bash
curl http://localhost:8000/health
# Returns: {"status": "healthy", "model_loaded": true}
```

---

## 🚀 Production Deployment (Azure VM + Docker + CI/CD)

The application is fully containerized and runs on an **Azure Linux Virtual Machine (Ubuntu 24.04 LTS)** using Docker Compose and Nginx.

```
Azure Virtual Machine
├── Standard_B1s / Standard_B2s (2 vCPU, 4GB RAM + 2GB Swap)
├── Static Public IP: 4.222.217.226
└── Docker Compose:
    ├── sentitrack-frontend (Nginx Alpine, Port 80)
    └── sentitrack-backend  (FastAPI + Playwright Chrome, Port 8000 internal)
```

### 1. Docker Compose Run
On the Azure VM (inside `/opt/sentitrack`):
```bash
# Build and run in detached mode
docker compose up -d --build

# View container status
docker compose ps

# Check logs
docker compose logs -f --tail=50
```

### 2. Automated GitHub Actions CI/CD Pipeline
Every `git push` to `main` executes `.github/workflows/deploy.yml`:
1. **Stage 1: Build & Verify (CI)**
   - Sets up Python 3.11, validates backend imports and route registrations.
   - Sets up Node.js 20, runs `npm ci` and verifies the frontend Vite build.
2. **Stage 2: Deploy to Azure VM (CD)**
   - Connects to Azure VM via SSH using encrypted GitHub Secrets.
   - Syncs the latest `main` branch code using an authenticated GitHub Token.
   - Injects the production `.env` configuration from `secrets.PROD_ENV`.
   - Executes `docker compose up -d --build`.
   - Cleans up stale Docker images to conserve disk space.
   - Performs a 10-attempt automated curl health check loop against `http://localhost/api/health`.

> 📖 **For step-by-step instructions on setting up the VM from scratch, SSH key setup, and NSG rules, refer to [DEPLOYMENT.md](DEPLOYMENT.md).**

---

## 🎨 Frontend Features

- **Global Instant Search:** Type any brand or keyword in the top navigation bar or the Search Command Center; hit `Enter` to navigate straight to the analytics view.
- **Preset Brand Badges:** One-click quick searches for popular Nigerian brands: *GTBank, Access Bank, Zenith Bank, Chowdeck, MTN, Airtel, Flutterwave, Paystack, OPay, Moniepoint, Jumia*.
- **Interactive Complaint Panel:** Expandable breakdown of negative feedback across all 11 smart categories with real tweet samples and percentage bars.
- **AI Executive Insights Card:** Prominently highlights key grievance themes and strategic mitigation actions formulated by `gpt-5-mini`.
- **Cached Results Hydration:** Seamlessly restores previous search findings from `localStorage` across page refreshes.
- **Dual Display Modes:** Clean toggle between high-level analytical summaries and individual post inspect cards.
- **Mobile Responsive:** Fully responsive layout built with Tailwind CSS for mobile, tablet, and desktop viewports.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. **Fork** the repository
2. **Create a branch:** `git checkout -b feature/AmazingFeature`
3. **Commit your changes:** `git commit -m 'feat: add AmazingFeature'`
4. **Push to the branch:** `git push origin feature/AmazingFeature`
5. **Open a Pull Request**

### Code Standards
- **Python:** Follow PEP 8 guidelines.
- **TypeScript:** Strict type checking without unconstrained `any` types.
- **Git Commits:** Use conventional commits (`feat:`, `fix:`, `docs:`, `chore:`).

---

## 📝 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## 🎉 Acknowledgments

- **Azure AI Foundry / OpenAI** for high-performance reasoning via `gpt-5-mini`.
- **Microsoft Playwright Team** for the reliable browser automation engine and official container images.
- **FastAPI & Uvicorn** for the asynchronous backend framework.
- **Radix UI & Tailwind CSS** for accessible design components.

---

<div align="center">

**[⬆ Back to Top](#-sentitrack--ai-powered-nigerian-social-media-sentiment-analyser)**

Made with ❤️ by [Timileyhin Quadri](https://github.com/Timileyhin-Quadri)

</div>

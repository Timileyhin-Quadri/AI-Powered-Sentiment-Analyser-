# 🎯 AI-Powered Sentiment Analyser

> **Real-time brand intelligence at your fingertips** — Monitor what customers are saying about your brand on social media with AI-powered sentiment analysis, competitor comparison, and actionable insights.

![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python Version](https://img.shields.io/badge/python-3.8+-green.svg)
![Status](https://img.shields.io/badge/status-Active-brightgreen.svg)
![Version](https://img.shields.io/badge/version-2.0-blue.svg)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
  - [API Examples](#api-examples)
  - [Mobile App](#mobile-app)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

## 🚀 Overview

The **AI-Powered Sentiment Analyser** is a comprehensive end-to-end solution that empowers businesses to understand public perception of their brand in real-time. By leveraging cutting-edge AI models and real-time social media scraping, this tool automatically collects, analyzes, and categorizes mentions of your brand across Twitter/X.

### Why You Need This

Traditional market research methods are slow, expensive, and outdated. With the Sentiment Analyser, you can:

✅ **Track brand perception** in real-time across social media  
✅ **Identify sentiment trends** with AI-powered classification  
✅ **Compare against competitors** with intelligent competitor detection  
✅ **Categorize complaints** automatically into actionable themes  
✅ **Make data-driven decisions** with structured analytics and visualizations  

---

## ✨ Key Features

### 🔍 Real-Time Twitter Scraping
- Automatically collects tweets mentioning your brand in real-time
- Supports custom keywords and hashtags
- Configurable tweet volume (default: 30 tweets per query)
- English language support

### 🤖 AI-Powered Sentiment Analysis
- Uses **RoBERTa** transformer model, specifically trained on Twitter data
- Three-level sentiment classification: **Positive**, **Negative**, **Neutral**
- Confidence scores for each classification
- Built-in text preprocessing (removes @mentions, URLs, etc.)

### 🏢 Competitor Intelligence
- Automatically identifies real competitors in the Nigerian market
- Scrapes sentiment data for each competitor
- Side-by-side sentiment comparison with visual trends
- Market positioning analysis

### 📊 Smart Complaint Categorization
Automatically categorizes negative feedback into:
- **Service Issues** (support, wait times, responsiveness)
- **Product Quality** (defects, durability, functionality)
- **Pricing Concerns** (expensive, overpriced, fees)
- **Delivery Problems** (late delivery, lost packages)
- **App/Technical Issues** (crashes, bugs, login problems)

### 📱 Mobile-First Experience
- Cross-platform mobile app (iOS & Android)
- Built with React Native and Expo
- Intuitive dashboard for non-technical users
- Real-time data synchronization

### 🎨 REST API
- Fully documented FastAPI backend
- Multiple endpoints for different analysis types
- CORS enabled for cross-origin requests
- Health check and monitoring endpoints

---

## 🎯 Quick Start

### Prerequisites

Before you begin, ensure you have:

- **Python 3.8+** installed
- **Node.js 16+** (for mobile app development)
- **Git** for version control
- **Azure OpenAI Account** (for competitor identification)
- **Chrome/Chromium Browser** (for scraping)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Timileyhin-Quadri/AI-Powered-Sentiment-Analyser-.git
cd "Sentiment Analyser"
```

#### 2. Set Up Backend (Python)

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r senti/requirements.txt

# Install python-dotenv for environment variables
pip install python-dotenv
```

#### 3. Set Up Frontend (React Native)

```bash
cd SentimentApp

# Install dependencies
npm install

# Or with yarn
yarn install
```

### Configuration

#### 1. Create Environment File

Create a `.env` file in the `senti/` directory:

```bash
# Azure OpenAI Credentials
AZURE_OPENAI_API_KEY=your_azure_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-12-01-preview

# Chrome Profile Path (Windows example)
CHROME_PROFILE_PATH=C:\Users\YourUsername\AppData\Local\Google\Chrome\User Data
```

#### 2. Get Your Azure OpenAI Keys

1. Visit [Azure Portal](https://portal.azure.com)
2. Navigate to your OpenAI resource
3. Find "Keys and Endpoints" section
4. Copy your API key and endpoint
5. Add them to your `.env` file

**⚠️ Never commit your `.env` file!** It's already in `.gitignore`

---

## 💻 Usage

### API Examples

#### Analyze Single Brand Sentiment

```bash
curl -X POST "http://localhost:8000/analyze_sentiment" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "Chowdeck",
    "limit": 50
  }'
```

**Response:**
```json
{
  "summary": {
    "total": 50,
    "positive": 32,
    "negative": 10,
    "neutral": 8,
    "sentiment_score": 0.82,
    "engagement_rate": 0.95,
    "active_issues": 3
  },
  "tweets": [
    {
      "text": "Amazing service from Chowdeck!",
      "sentiment": "Positive",
      "confidence": 0.98,
      "timestamp": "2026-01-13T10:30:00Z"
    }
  ],
  "volume_over_time": [
    {
      "date": "2026-01-13",
      "count": 15
    }
  ]
}
```

#### Analyze Competitors

```bash
curl -X POST "http://localhost:8000/analyze_competitors" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "Chowdeck"
  }'
```

#### Get Customer Complaints

```bash
curl -X POST "http://localhost:8000/customer_complaints" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "Chowdeck",
    "limit": 30
  }'
```

### Running the Backend

```bash
cd senti/backend

# Start the FastAPI server
python main.py

# Or using uvicorn directly
uvicorn main:app --reload
```

Server will be available at: `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

### Mobile App

```bash
cd SentimentApp

# For iOS (macOS only)
npm run ios

# For Android
npm run android

# For web preview
npm run web

# Or with Expo Go
expo start
```

---

## 📁 Project Structure

```
Sentiment Analyser/
├── senti/                          # Backend application
│   ├── backend/
│   │   ├── main.py                 # FastAPI application & endpoints
│   │   ├── analyzer.py             # RoBERTa sentiment analysis engine
│   │   ├── scraper.py              # Twitter scraping logic
│   │   ├── gemini_client.py         # Azure OpenAI integration
│   │   └── requirements.txt         # Python dependencies
│   ├── ui/
│   │   └── streamlit.py             # Alternative Streamlit UI
│   └── .env                         # Environment variables (⚠️ Keep secret!)
│
├── SentimentApp/                    # Mobile app (React Native)
│   ├── app/                         # Main screens
│   │   ├── index.tsx
│   │   ├── competitors.tsx
│   │   └── customer-voice.tsx
│   ├── components/                  # Reusable components
│   ├── services/                    # API client services
│   ├── context/                     # State management
│   └── package.json
│
├── .env                             # Environment variables (ignored)
├── .gitignore                       # Git ignore rules
├── README.md                        # This file
└── LICENSE                          # MIT License
```

---

## 🛠️ Technologies

### Backend
| Technology | Purpose |
|-----------|---------|
| **Python 3** | Core language |
| **FastAPI** | REST API framework |
| **Selenium** | Web scraping |
| **Hugging Face Transformers** | RoBERTa sentiment model |
| **Pandas** | Data processing |
| **Azure OpenAI** | Competitor identification (GPT-4o) |
| **Uvicorn** | ASGI server |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React Native** | Cross-platform mobile app |
| **Expo** | React Native development platform |
| **TypeScript** | Type-safe JavaScript |
| **Axios** | HTTP client |

### DevOps & Tools
| Tool | Purpose |
|------|---------|
| **Git** | Version control |
| **Docker** | Containerization (future) |
| **GitHub** | Repository hosting |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Application                        │
│                   (React Native + Expo)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                           │
│  ┌─────────────┬──────────────┬─────────────────────────┐   │
│  │             │              │                         │   │
│  ▼             ▼              ▼                         ▼   │
│ Scraper    Analyzer        Competitors           Data Mgmt  │
│ (Selenium) (RoBERTa)      (Azure OpenAI)        (Pandas)   │
└─────────────────────────────────────────────────────────────┘
       │              │                    │
       ▼              ▼                    ▼
    Twitter/X   ML Model Cache      Azure Services
```

---

## 🤝 Contributing

We love contributions! Whether it's bug fixes, features, or documentation improvements, here's how to get started:

### Steps to Contribute

1. **Fork** the repository
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Code Style

- Follow **PEP 8** for Python code
- Use **TypeScript** for frontend (no `any` types)
- Write descriptive commit messages
- Include docstrings for all functions

### Reporting Issues

Found a bug? Please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Python version, etc.)

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

**You are free to:**
- ✅ Use commercially
- ✅ Modify the code
- ✅ Distribute copies
- ✅ Use privately

**You must:**
- ⚠️ Include the original license and copyright notice

---

## 🆘 Support

### Documentation
- 📖 [Project Documentation](PROJECT_DOCUMENTATION.txt) — Detailed technical specs
- 🔧 [API Docs](http://localhost:8000/docs) — Interactive Swagger UI (when running locally)

### Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/Timileyhin-Quadri/AI-Powered-Sentiment-Analyser-/discussions)
- **Bug Report?** Create a [GitHub Issue](https://github.com/Timileyhin-Quadri/AI-Powered-Sentiment-Analyser-/issues)
- **Want to Contribute?** See the [Contributing](#contributing) section

### Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Hugging Face Transformers](https://huggingface.co/transformers/)
- [React Native Docs](https://reactnative.dev/)
- [Azure OpenAI Docs](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/)

---

## 🎉 Acknowledgments

- **RoBERTa Model** by [Cardiff NLP](https://huggingface.co/cardiffnlp)
- **FastAPI** community for the amazing framework
- **Azure OpenAI** for powerful AI capabilities
- Special thanks to all contributors and users

---

<div align="center">

**[⬆ back to top](#-ai-powered-sentiment-analyser)**

Made with ❤️ by [Timileyhin Quadri](https://github.com/Timileyhin-Quadri)

</div>

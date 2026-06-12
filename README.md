# 🤖 AI Recommendation Logic

> A Content-Based Course Recommendation System powered by TF-IDF Vectorization and Cosine Similarity — built with Python, Flask, and Scikit-learn.

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-black?logo=flask)
![Scikit-learn](https://img.shields.io/badge/Scikit--learn-1.5-orange?logo=scikit-learn)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Setup & Run Locally](#setup--run-locally)
- [API Reference](#api-reference)
- [Deployment on Render](#deployment-on-render)
- [GitHub Upload Steps](#github-upload-steps)
- [Dataset](#dataset)

---

## Project Overview

**AI Recommendation Logic** is a B.Tech internship project that demonstrates a practical, end-to-end machine learning pipeline for recommending online courses based on a user's stated skills and interests.

The system uses **TF-IDF (Term Frequency-Inverse Document Frequency)** to convert course metadata and user queries into numerical vectors, then computes **Cosine Similarity** between the query vector and every course vector to surface the most relevant matches.

---

## Features

| Feature | Description |
|---|---|
| 🔍 Smart Search | Enter skills/interests in natural language |
| 🤖 ML Recommendations | TF-IDF + Cosine Similarity ranking |
| 📊 Match Percentage | Each result shows how well it matches your query |
| 🎨 Beautiful Cards | Animated recommendation cards with skill tags |
| 🌙 Dark / Light Mode | Persistent theme toggle |
| 📂 Category Filter | Filter results by course category |
| 🕒 Search History | Last 10 searches, click to re-run |
| ⚡ Quick Chips | One-click preset queries |
| 📱 Responsive UI | Works on mobile, tablet, and desktop |
| ✅ Error Handling | Input validation and toast notifications |
| 🔄 Loading Animation | Visual feedback while computing |

---

## Tech Stack

### Frontend
- HTML5 + CSS3 (custom properties, CSS Grid, Flexbox)
- Vanilla JavaScript (ES6+)
- Space Grotesk + Inter (Google Fonts)
- Lucide Icons

### Backend
- Python 3.10+
- Flask 3.0 (web framework)
- Gunicorn (production WSGI server)

### Machine Learning
- Scikit-learn — TfidfVectorizer, cosine_similarity
- Pandas — dataset loading and manipulation
- NumPy — vector operations

---

## Project Structure

```
ai-recommendation-logic/
│
├── app.py                        # Flask application entry point
├── requirements.txt              # Python dependencies
├── Procfile                      # Render / Heroku deployment config
├── .gitignore
├── README.md
│
├── dataset/
│   └── courses.csv               # 55-course dataset
│
├── recommendation/
│   ├── __init__.py
│   └── recommender.py            # TF-IDF + Cosine Similarity engine
│
├── templates/
│   └── index.html                # Jinja2 dashboard template
│
└── static/
    ├── css/
    │   └── style.css             # Dark/light theme stylesheet
    ├── js/
    │   └── script.js             # Frontend logic
    └── images/                   # (optional assets)
```

---

## How It Works

```
User Input (skills/interests)
        │
        ▼
  TF-IDF Vectorizer
  ┌──────────────────────────────────────────┐
  │  Converts text → numerical feature       │
  │  vectors (unigrams + bigrams, IDF        │
  │  normalised, sublinear TF scaling)       │
  └──────────────────────────────────────────┘
        │
        ▼
  Cosine Similarity Matrix
  ┌──────────────────────────────────────────┐
  │  similarity(query, course_i) =           │
  │  (query · course_i) / (|query||course_i|)│
  └──────────────────────────────────────────┘
        │
        ▼
  Top-N Ranked Courses  (with match %)
        │
        ▼
  Flask API → JSON → JavaScript → UI
```

### Why TF-IDF?
TF-IDF rewards terms that are *frequent in a document* but *rare across all documents*, making it ideal for distinguishing specialised course content.

### Why Cosine Similarity?
It measures the angle between two vectors regardless of their magnitude, so a short query ("python ML") can still match a long course description accurately.

---

## Setup & Run Locally

### Prerequisites
- Python 3.10 or higher
- pip

### Step 1 — Clone the repository
```bash
git clone https://github.com/<your-username>/ai-recommendation-logic.git
cd ai-recommendation-logic
```

### Step 2 — Create and activate a virtual environment
```bash
# macOS / Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

### Step 3 — Install dependencies
```bash
pip install -r requirements.txt
```

### Step 4 — Run the application
```bash
python app.py
```

### Step 5 — Open in browser
```
http://localhost:5000
```

---

## API Reference

### `POST /api/recommend`
Returns course recommendations for a given query.

**Request body (JSON):**
```json
{
  "query": "python machine learning data science",
  "top_n": 5,
  "category": "all"
}
```

**Response:**
```json
{
  "success": true,
  "query": "python machine learning data science",
  "total_results": 5,
  "recommendations": [
    {
      "course_name": "Python for Data Science",
      "category": "Data Science",
      "skills": "python data analysis pandas numpy matplotlib statistics",
      "description": "...",
      "match_percentage": 87.3
    }
  ]
}
```

### `GET /api/categories`
Returns all unique course categories.

### `GET /api/stats`
Returns dataset statistics (total courses, total categories).

### `GET /health`
Liveness probe endpoint.

---

## Deployment on Render

1. Push your project to GitHub (see steps below).
2. Go to [render.com](https://render.com) and sign up / log in.
3. Click **New → Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name:** `ai-recommendation-logic`
   - **Environment:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2`
6. Click **Create Web Service**.
7. Render will build and deploy automatically. Your app will be live at `https://<your-service-name>.onrender.com`.

---

## GitHub Upload Steps

```bash
# 1. Initialise git (if not already done)
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "feat: initial commit — AI Recommendation Logic"

# 4. Create a new repo on GitHub (via UI), then:
git remote add origin https://github.com/<your-username>/ai-recommendation-logic.git
git branch -M main
git push -u origin main
```

---

## Dataset

The `dataset/courses.csv` contains **55 real-world courses** spanning:

| Category | Count |
|---|---|
| Web Development | 10 |
| Data Science / Analytics | 9 |
| Machine Learning / Deep Learning | 7 |
| DevOps / Cloud | 7 |
| Mobile Development | 4 |
| Data Engineering | 4 |
| Cybersecurity | 2 |
| AI / NLP | 2 |
| … and more | — |

Each row has: `Course Name`, `Category`, `Skills`, `Description`.

---

## License

MIT — free to use for academic and personal projects.

---

*Built with ❤️ as a B.Tech Internship Project — 2024*
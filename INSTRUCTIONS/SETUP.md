# SETUP.md — Environment Setup & Prerequisites

## Prerequisites

### 1. Node.js
- **Version**: 18 or higher
- **Check**: `node -v`
- **Install**: https://nodejs.org/ (LTS recommended)

### 2. Python
- **Version**: 3.10 or higher
- **Check**: `python --version`
- **Install**: https://www.python.org/downloads/

### 3. Google Cloud Setup
You'll need a Google API key with access to the Generative AI (formerly Vertex AI) service.

#### Steps to get your Google API Key:

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"** or **"Get API Key"**
3. Select or create a Google Cloud project
4. Copy the API key (keep it safe, never commit to version control)
5. Paste it into `backend/.env` as `GOOGLE_API_KEY=your-key-here`

**Note**: Ensure the Generative AI API is enabled on your Google Cloud project. You can verify this in the [Google Cloud Console](https://console.cloud.google.com/apis/dashboard).

### 4. Git
- **Check**: `git --version`
- **Install**: https://git-scm.com/

---

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/AI_Flow.git
cd AI_Flow
```

### Step 2: Set Up Backend

```bash
# Navigate to backend directory
cd backend

# Create a Python virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
.\venv\Scripts\activate.bat

# Install Python dependencies
pip install -r requirements.txt
```

### Step 3: Configure Backend Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your Google API key
# Open .env and set:
# GOOGLE_API_KEY=your-key-here
# GEMINI_MODEL=gemini-2.0-flash
# CORS_ORIGINS=http://localhost:5173
```

**macOS/Linux**: `nano .env` or `vi .env` or open with your editor
**Windows**: Create/edit `backend\.env` with Notepad or VSCode

### Step 4: Set Up Frontend

```bash
# Navigate to frontend directory (from root)
cd frontend

# Install npm dependencies
npm install
```

### Step 5: Configure Frontend Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add API URL
# VITE_API_URL=http://localhost:8000
```

**macOS/Linux**: `nano .env` or `vi .env`
**Windows**: Create/edit `frontend\.env` with Notepad or VSCode

---

## Running the Application

### Terminal 1: Start Backend

```bash
cd backend

# Activate venv (if not already active)
# Windows: .\venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Start FastAPI server
uvicorn main:app --reload --port 8000
```

**Expected output**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### Terminal 2: Start Frontend

```bash
cd frontend

# Install dependencies (if not done)
npm install

# Start Vite dev server
npm run dev
```

**Expected output**:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### Test the App

1. Open http://localhost:5173 in your browser
2. You should see:
   - A text input area with a "Generate Diagram" button
   - An empty diagram area below
3. Enter a sample decision tree:
   ```
   Should I go outside? If it's raining, stay inside. If it's sunny, go to the park.
   ```
4. Click **Generate Diagram**
5. Wait for ~2-5 seconds for the AI to process
6. A vertical diagram should appear with colored nodes
7. A PNG file should automatically download

### Test Health Check (Backend)

```bash
# In a new terminal or browser
curl http://localhost:8000/health
```

**Expected response**:
```json
{"status": "ok"}
```

### Test API Endpoint (Backend)

```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"description": "Should I go outside? If raining, stay inside. If sunny, go to park."}'
```

**Expected response**:
```json
{
  "nodes": [
    {"id": "node_1", "type": "decision", "data": {"label": "Should I go outside?"}},
    {"id": "node_2", "type": "outcome", "data": {"label": "Stay inside"}},
    ...
  ],
  "edges": [
    {"id": "edge_1", "source": "node_1", "target": "node_2", "label": "Raining"},
    ...
  ]
}
```

---

## Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'fastapi'`
**Solution**: 
```bash
cd backend
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Issue: `GOOGLE_API_KEY not found`
**Solution**: 
1. Create `backend/.env` file (copy from `.env.example` if it exists)
2. Add `GOOGLE_API_KEY=your-actual-key-here`
3. Restart the backend server

### Issue: Frontend won't connect to backend (CORS error)
**Solution**:
1. Ensure backend is running on `http://localhost:8000`
2. Check `frontend/.env` has `VITE_API_URL=http://localhost:8000`
3. Ensure `backend/.env` has `CORS_ORIGINS=http://localhost:5173`
4. Restart both servers

### Issue: Vite server says port 5173 is in use
**Solution**:
```bash
# Find and kill the process on port 5173
# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
# macOS/Linux:
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9
# Then restart: npm run dev
```

### Issue: `google-generativeai` API error
**Solution**:
1. Verify your API key is valid (copy from https://aistudio.google.com/app/apikey again)
2. Check that Generative AI API is enabled in Google Cloud Console
3. Ensure you're not rate-limited (check Google Cloud quotas)

---

## Port Configuration

By default, the application uses:
- **Backend**: `http://localhost:8000`
- **Frontend**: `http://localhost:5173`

To change ports:
- **Backend**: `uvicorn main:app --port 9000`
- **Frontend**: `npm run dev -- --port 3000`
- Update `frontend/.env` to match: `VITE_API_URL=http://localhost:9000`

---

## Next Steps

1. Read [INSTRUCTIONS/BACKEND.md](BACKEND.md) to understand backend architecture
2. Read [INSTRUCTIONS/FRONTEND.md](FRONTEND.md) to understand frontend architecture
3. Read [INSTRUCTIONS/PROMPT_ENGINEERING.md](PROMPT_ENGINEERING.md) to learn how the LLM prompt works
4. Read [INSTRUCTIONS/API_CONTRACT.md](API_CONTRACT.md) for full API documentation

---

## Project Structure Reference

```
AI_Flow/
├── backend/
│   ├── venv/                  # Python virtual environment (git-ignored)
│   ├── main.py                # FastAPI app entry point
│   ├── config.py              # Environment configuration
│   ├── requirements.txt        # Python dependencies
│   ├── .env                   # Your API keys (git-ignored)
│   ├── .env.example           # Template (committed)
│   ├── services/
│   │   └── gemini_service.py  # Gemini integration
│   ├── prompts/
│   │   └── decision_tree.py   # Prompt template
│   ├── models/
│   │   └── schemas.py         # Data models
│   └── utils/
│       └── json_parser.py     # JSON parsing
│
├── frontend/
│   ├── node_modules/          # npm dependencies (git-ignored)
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── components/
│   │   ├── utils/
│   │   └── api/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env                   # Frontend config (git-ignored)
│   └── .env.example           # Template (committed)
│
├── INSTRUCTIONS/
│   ├── SETUP.md               # This file
│   ├── BACKEND.md
│   ├── FRONTEND.md
│   ├── PROMPT_ENGINEERING.md
│   ├── API_CONTRACT.md
│   └── DEPLOYMENT.md
│
├── .gitignore
└── README.md
```

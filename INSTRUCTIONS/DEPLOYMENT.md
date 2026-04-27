# DEPLOYMENT.md — Running, Building, and Deployment

## Overview

This guide covers how to run the application locally for development, build it for production, and deploy it to various hosting platforms.

---

## Local Development

### Backend

**Terminal 1: Start Backend Server**

```bash
cd backend

# Activate virtual environment
# Windows (PowerShell/CMD):
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Start server
uvicorn main:app --reload --port 8000
```

**Expected Output**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**Flags**:
- `--reload` — Auto-reload on file changes (development only)
- `--port 8000` — Run on port 8000
- `--host 0.0.0.0` — Listen on all interfaces (add if accessing from other machines)

**Verify**:
```bash
curl http://localhost:8000/health
# Expected: {"status": "ok"}
```

### Frontend

**Terminal 2: Start Frontend Dev Server**

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Start dev server
npm run dev
```

**Expected Output**:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

**Browser**:
- Open http://localhost:5173
- You should see the Decision Tree Generator interface
- Backend should be accessible at http://localhost:8000

### Running Both Concurrently

Use a terminal multiplexer:

**Using `tmux` (macOS/Linux)**:
```bash
# Create session
tmux new-session -d -s ai_flow

# Window 1: Backend
tmux send-keys -t ai_flow:0 "cd backend && source venv/bin/activate && uvicorn main:app --reload" C-m

# Window 2: Frontend (new window)
tmux new-window -t ai_flow:1
tmux send-keys -t ai_flow:1 "cd frontend && npm run dev" C-m

# View both
tmux attach -t ai_flow
```

**Using PowerShell (Windows)**:
```powershell
# Start two processes in parallel
Start-Process -NoNewWindow -FilePath powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate; uvicorn main:app --reload"
Start-Process -NoNewWindow -FilePath powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
```

---

## Building for Production

### Frontend Build

**Generate optimized static files**:

```bash
cd frontend

# Build (minified, optimized)
npm run build

# Output location: frontend/dist/
```

**Verify build**:
```bash
# Preview production build locally
npm run preview
# Open http://localhost:4173
```

**Output**:
- `index.html` — Main HTML file
- `assets/` — Bundled JavaScript, CSS (minified)
- Ready to deploy to any static hosting (Vercel, Netlify, AWS S3, etc.)

### Backend Build

No build step needed for Python. Just ensure:
1. `requirements.txt` is up-to-date
2. `.env` file is configured with production secrets
3. Code is tested

**Create production requirements**:
```bash
cd backend
pip freeze > requirements-prod.txt
```

---

## Production Deployment Options

### Option 1: Self-Hosted (VPS/Dedicated Server)

#### Backend (Gunicorn + Uvicorn)

**Install production ASGI server**:
```bash
pip install gunicorn
```

**Start with Gunicorn**:
```bash
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

**Flags**:
- `--workers 4` — Number of worker processes (adjust based on CPU cores)
- `--worker-class uvicorn.workers.UvicornWorker` — Use Uvicorn as ASGI worker
- `--bind 0.0.0.0:8000` — Listen on all interfaces, port 8000

**Systemd Service (Linux)**:

Create `/etc/systemd/system/ai-flow-backend.service`:
```ini
[Unit]
Description=AI Flow Backend
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/opt/ai-flow/backend
Environment="PYTHONUNBUFFERED=1"
EnvironmentFile=/opt/ai-flow/backend/.env
ExecStart=/opt/ai-flow/backend/venv/bin/gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and start**:
```bash
sudo systemctl enable ai-flow-backend
sudo systemctl start ai-flow-backend
sudo systemctl status ai-flow-backend
```

#### Frontend (Nginx)

**Install Nginx**:
```bash
sudo apt-get install nginx
```

**Configure `/etc/nginx/sites-available/ai-flow`**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /opt/ai-flow/frontend/dist;
        try_files $uri /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

**Enable**:
```bash
sudo ln -s /etc/nginx/sites-available/ai-flow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Docker

**Create `backend/Dockerfile`**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

**Create `frontend/Dockerfile`**:
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Build and run**:
```bash
# Backend
docker build -t ai-flow-backend ./backend
docker run -p 8000:8000 --env-file backend/.env ai-flow-backend

# Frontend
docker build -t ai-flow-frontend ./frontend
docker run -p 80:80 ai-flow-frontend
```

**Docker Compose** (`docker-compose.yml`):
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: ./backend/.env
    environment:
      - CORS_ORIGINS=http://localhost

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  db:
```

Run:
```bash
docker-compose up
```

### Option 3: Vercel (Frontend) + Railway (Backend)

**Deploy Frontend to Vercel**:

1. Push frontend code to GitHub
2. Go to https://vercel.com/import
3. Import repository
4. Set build command: `npm run build`
5. Deploy

**Configure environment**:
- Set `VITE_API_URL` in Vercel dashboard

**Deploy Backend to Railway**:

1. Push backend code to GitHub
2. Go to https://railway.app
3. Create new project, connect GitHub
4. Select `backend/` as root directory
5. Add environment variables from `.env` (GOOGLE_API_KEY, GEMINI_MODEL, CORS_ORIGINS)
6. Deploy

### Option 4: AWS

**Backend on EC2 + S3 (Frontend)**:

1. Launch EC2 instance (Ubuntu 22.04, t2.micro)
2. SSH in and follow self-hosted setup above
3. Build frontend: `npm run build`
4. Upload `frontend/dist/` to S3
5. Serve S3 via CloudFront
6. Update API URL in frontend to point to EC2 backend

### Option 5: Heroku (Sunset 2025, but alternatives exist)

Use Render, Fly.io, or Railway instead.

---

## Environment Variables

### Backend (`.env`)

| Variable | Example | Description |
|----------|---------|-------------|
| `GOOGLE_API_KEY` | `AIzaSy...` | Your Google Generative AI API key |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Model to use for generation |
| `CORS_ORIGINS` | `http://localhost:5173,https://yourapp.com` | Allowed CORS origins (comma-separated) |

### Frontend (`.env`)

| Variable | Example | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` or `https://api.yourapp.com` | Backend API URL |

---

## Performance Optimization

### Backend

1. **Enable caching** — Cache identical tree descriptions to reduce Gemini API calls
   ```python
   from functools import lru_cache
   
   @lru_cache(maxsize=100)
   def generate_tree_from_description(description: str):
       # ...
   ```

2. **Use connection pooling** — Reuse connections to Gemini API
   ```python
   import google.generativeai as genai
   genai.configure(api_key=API_KEY)
   # Connection is pooled automatically
   ```

3. **Add request timeouts**
   ```python
   response = model.generate_content(
       prompt,
       generation_config={
           "response_mime_type": "application/json",
           "timeout": 30  # 30 second timeout
       }
   )
   ```

### Frontend

1. **Enable compression** — Gzip JavaScript and CSS
   ```javascript
   // vite.config.js
   import compression from 'vite-plugin-compression';
   
   export default {
     plugins: [compression()]
   }
   ```

2. **Lazy load components** — Split bundles
   ```javascript
   const DecisionTreeDiagram = React.lazy(() => 
     import('./components/DecisionTreeDiagram')
   );
   ```

3. **Use a CDN** — Serve static assets from edge locations (Cloudflare, AWS CloudFront)

---

## Monitoring & Logging

### Backend Logging

```python
import logging

logger = logging.getLogger(__name__)

@app.post("/api/generate")
def generate_diagram(request: GenerateRequest):
    logger.info(f"Generating tree for: {request.description[:100]}")
    try:
        # ...
        logger.info("Successfully generated tree")
    except Exception as e:
        logger.error(f"Failed to generate tree: {str(e)}")
        raise
```

### Frontend Error Tracking

Use Sentry, LogRocket, or similar:
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://yourkey@sentry.io/project",
  environment: process.env.NODE_ENV,
});
```

### Monitoring

- **Uptime monitoring**: Use https://uptimerobot.com/
- **Performance monitoring**: Use https://datadog.com/ or https://newrelic.com/
- **Error tracking**: Use https://sentry.io/

---

## Scaling

### Horizontal Scaling (Multiple Instances)

Use a load balancer (nginx, HAProxy, AWS ALB):

```nginx
upstream ai_flow_backend {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
}

server {
    listen 80;
    location /api/ {
        proxy_pass http://ai_flow_backend;
    }
}
```

### Vertical Scaling (Bigger Machine)

- Increase worker processes: `--workers 8` (for 8-core machine)
- Increase RAM allocation
- Use better GPU if available

### Database (Future)

When you add persistence (saving diagrams):
- Use PostgreSQL or MongoDB
- Consider managed services (AWS RDS, MongoDB Atlas)

---

## Rollback Plan

Keep previous versions available:

```bash
# Production directory structure
/opt/ai-flow/
├── v1.0.0/ (current)
├── v0.9.0/ (previous)
└── v0.8.0/ (backup)

# Symlink to current
ln -s /opt/ai-flow/v1.0.0 /opt/ai-flow/current

# To rollback
ln -sfn /opt/ai-flow/v0.9.0 /opt/ai-flow/current
systemctl restart ai-flow-backend
```

---

## SSL/TLS (HTTPS)

Using Let's Encrypt (free):

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

Update Nginx config:
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
}
```

---

## Backup Strategy

1. **Code**: Use Git (GitHub, GitLab)
2. **Environment**: Backup `.env` files in a safe location (not version control)
3. **Database** (if added): Regular automated backups
4. **Frontend builds**: Keep tagged releases on GitHub

---

## Maintenance

- **Dependency updates**: Run `npm update` and `pip install --upgrade` regularly
- **Security patches**: Monitor alerts from GitHub dependabot
- **Log rotation**: Use `logrotate` on Linux
- **Disk cleanup**: Remove old uploads/logs periodically

---

## Troubleshooting Deployment

### Backend won't start
```bash
# Check for syntax errors
python -m py_compile *.py

# Test imports
python -c "import main"

# Check port is available
lsof -i :8000
```

### CORS errors
1. Verify `CORS_ORIGINS` includes your frontend domain
2. Restart backend after `.env` changes
3. Check browser console for exact error

### Slow responses
- Check Gemini API quota and usage
- Monitor backend response time: `time curl http://localhost:8000/health`
- Check network latency between frontend and backend

### High memory usage
- Reduce worker count: `--workers 2`
- Monitor with `top` or `htop`
- Profile with `py-spy`: `py-spy record -o profile.svg -- python main.py`

---

## Future Enhancements

1. **CI/CD Pipeline**: GitHub Actions, GitLab CI for automated testing/deployment
2. **Caching Layer**: Redis for diagram caching
3. **Database**: Store user diagrams, add authentication
4. **Analytics**: Track usage, popular tree types
5. **WebSocket**: Real-time collaboration on diagrams

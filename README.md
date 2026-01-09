# YT Downloader

A modern, fast, and secure YouTube video downloader built with Next.js and FastAPI. Download videos and audio from YouTube in various formats and qualities up to 4K.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

## ✨ Features

- 🎥 **Multiple Formats**: Download as MP4, WebM, M4A, and more
- 🎬 **High Quality**: Support for HD, Full HD, 2K, and 4K resolution
- 🎵 **Audio Extraction**: Extract audio in MP3, M4A, Opus formats
- ⚡ **Real-time Progress**: Live download progress with speed and ETA
- 🔒 **Rate Limiting**: Built-in protection (30 req/min, 20 downloads/hour)
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🌙 **Dark Theme**: Beautiful dark mode interface with red accents
- 🐳 **Docker Ready**: Easy deployment with Docker Compose
- 🔍 **SEO Optimized**: Comprehensive meta tags and structured data

## 🚀 Tech Stack

**Frontend:**
- [Next.js 16](https://nextjs.org/) - React framework
- [Tailwind CSS 4](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tabler Icons](https://tabler-icons.io/) - Icon library
- TypeScript - Type safety

**Backend:**
- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube download engine
- [FFmpeg](https://ffmpeg.org/) - Media processing
- Python 3.12+ - Runtime

## 📋 Prerequisites

### Local Development
- Node.js 20+ and npm
- Python 3.12+
- FFmpeg (for format merging)
- Git

### Docker Deployment
- Docker and Docker Compose
- (Optional) Domain name for HTTPS

## 🛠️ Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/yt-downloader.git
cd yt-downloader
```

### 2. Install FFmpeg
**Windows:**
```powershell
winget install Gyan.FFmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

### 3. Setup Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Start backend server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`

### 4. Setup Frontend (Next.js)
Open a new terminal:
```bash
cd next-app  # or root directory
npm install
```

Create `.env.local`:
```env
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Start frontend:
```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`

## 🐳 Docker Deployment

### Quick Start
```bash
# Build and start both services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000

### Production Deployment (DigitalOcean Droplet)

#### Step 1: Create Droplet
- Create Ubuntu 22.04/24.04 droplet (2GB+ RAM recommended)
- Add your SSH key
- Note the droplet IP

#### Step 2: Setup Server
```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Install Docker
apt update
apt install -y docker.io docker-compose-plugin git

# Enable Docker
systemctl enable --now docker

# Clone your repo
git clone https://github.com/YOUR_USERNAME/yt-downloader.git
cd yt-downloader

# Create environment file
nano .env
```

Add to `.env`:
```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

```bash
# Start containers
docker-compose up -d --build
```

#### Step 3: Setup Nginx Reverse Proxy
```bash
# Install Nginx
apt install -y nginx

# Configure firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Create Nginx config
nano /etc/nginx/sites-available/ytdownloader
```

Paste this config (replace `yourdomain.com`):
```nginx
server {
  listen 80;
  server_name yourdomain.com www.yourdomain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/ytdownloader /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### Step 4: Add HTTPS with Let's Encrypt
```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get certificate (follow prompts)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
certbot renew --dry-run
```

#### Step 5: Point Domain to Droplet
In your DNS provider:
- Add **A record**: `@` → `YOUR_DROPLET_IP`
- Add **A record**: `www` → `YOUR_DROPLET_IP`

Wait 5-10 minutes for DNS propagation.

Your site is now live at `https://yourdomain.com`! 🎉

### Updating the App
```bash
cd /root/yt-downloader
git pull
docker-compose up -d --build
```

## 📁 Project Structure

```
yt-downloader/
├── app/                      # Next.js app directory
│   ├── api/                  # Server-side API routes
│   │   ├── download/         # Download proxy endpoint
│   │   └── video-info/       # Video info proxy endpoint
│   ├── about/                # About page
│   ├── tos/                  # Terms of Service page
│   ├── download/             # Download page with progress
│   ├── layout.tsx            # Root layout with metadata
│   ├── page.tsx              # Home page
│   ├── sitemap.ts            # Auto-generated sitemap
│   ├── robots.ts             # Auto-generated robots.txt
│   └── manifest.ts           # PWA manifest
├── backend/                  # FastAPI backend
│   ├── main.py               # API server with rate limiting
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Backend container
├── components/               # React components
│   ├── ui/                   # shadcn/ui components
│   ├── JsonLd.tsx            # Structured data for SEO
│   └── Navbar.tsx            # Navigation bar
├── public/                   # Static assets
├── docker-compose.yml        # Multi-container orchestration
├── Dockerfile                # Frontend container
├── .dockerignore             # Docker ignore rules
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind configuration
└── package.json              # Node dependencies
```

## 🔒 Security Features

- **Rate Limiting**: 30 requests/minute per IP
- **Download Limits**: 20 downloads/hour, 3 concurrent max
- **Server-Side API**: Backend not exposed to clients
- **CORS Protection**: Restricted origins
- **Input Validation**: YouTube URL pattern matching
- **Filename Sanitization**: Safe file downloads

## ⚙️ Configuration

### Environment Variables

**Frontend (.env.local):**
```env
BACKEND_URL=http://localhost:8000          # Backend API URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000 # Public site URL for SEO
```

**Backend:**
- Configure rate limits in `backend/main.py`:
  - `RATE_LIMIT_REQUESTS = 30`
  - `RATE_LIMIT_WINDOW = 60`
  - `MAX_DOWNLOADS_PER_HOUR = 20`
  - `MAX_CONCURRENT_DOWNLOADS = 3`

### Disable Debug Throttling

In `app/download/page.tsx`, set:
```typescript
const DEBUG_THROTTLE = false;
```

## 🎨 Customization

### Theme Colors
Edit `app/globals.css` to change the red theme:
```css
--primary: 0 72.2% 50.6%;  /* Red-600 */
```

### Rate Limits
Edit `backend/main.py`:
```python
RATE_LIMIT_REQUESTS = 30
MAX_DOWNLOADS_PER_HOUR = 20
```

## 📝 API Endpoints

### Backend (FastAPI)

- `GET /` - API info
- `GET /health` - Health check
- `POST /api/video-info` - Get video metadata
- `GET /api/download` - Download video/audio stream

### Frontend (Next.js API Routes)

- `POST /api/video-info` - Proxy to backend
- `GET /api/download` - Proxy to backend with filename encoding

## 🐛 Troubleshooting

### FFmpeg Not Found
```bash
# Check FFmpeg installation
ffmpeg -version

# Install if missing (see Prerequisites section)
```

### Docker Build Fails
```bash
# Clean Docker cache
docker system prune -a
docker-compose build --no-cache
```

### CORS Errors
Check `ALLOWED_ORIGINS` in `backend/main.py` includes your frontend URL.

### Download Progress Stuck
Set `DEBUG_THROTTLE = false` in `app/download/page.tsx`.

## 📜 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This tool is for personal use only. Downloading copyrighted content without permission may violate copyright laws in your jurisdiction. Always respect content creators' rights and YouTube's Terms of Service.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/YOUR_USERNAME/yt-downloader/issues) page.

---

Made with ❤️ using Next.js and FastAPI

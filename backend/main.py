from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, field_validator
import yt_dlp
import os
import tempfile
import uuid
import re
import shutil
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio
from typing import Optional

# ==================== SECURITY CONFIGURATION ====================
# Rate limiting settings
RATE_LIMIT_REQUESTS = 30  # Max requests per window
RATE_LIMIT_WINDOW = 60  # Window in seconds (1 minute)

# Download limits
MAX_CONCURRENT_DOWNLOADS = 3  # Max concurrent downloads per IP
MAX_DOWNLOADS_PER_HOUR = 20  # Max downloads per IP per hour

# Allowed origins - only allow requests from your Next.js server
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    # Docker container names
    "http://frontend:3000",
    "http://yt-downloader-frontend:3000",
]
# ================================================================

app = FastAPI(title="YouTube Downloader API")

# ==================== RATE LIMITING & TRACKING ====================
class RateLimiter:
    def __init__(self):
        self.requests: dict[str, list[datetime]] = defaultdict(list)
        self.downloads: dict[str, list[datetime]] = defaultdict(list)
        self.active_downloads: dict[str, int] = defaultdict(int)
        self._lock = asyncio.Lock()
    
    async def is_rate_limited(self, ip: str) -> bool:
        """Check if IP has exceeded request rate limit"""
        async with self._lock:
            now = datetime.now()
            window_start = now - timedelta(seconds=RATE_LIMIT_WINDOW)
            
            # Clean old requests
            self.requests[ip] = [t for t in self.requests[ip] if t > window_start]
            
            if len(self.requests[ip]) >= RATE_LIMIT_REQUESTS:
                return True
            
            self.requests[ip].append(now)
            return False
    
    async def can_download(self, ip: str) -> tuple[bool, str]:
        """Check if IP can start a new download"""
        async with self._lock:
            now = datetime.now()
            hour_ago = now - timedelta(hours=1)
            
            # Clean old download records
            self.downloads[ip] = [t for t in self.downloads[ip] if t > hour_ago]
            
            # Check hourly limit
            if len(self.downloads[ip]) >= MAX_DOWNLOADS_PER_HOUR:
                return False, f"Download limit reached ({MAX_DOWNLOADS_PER_HOUR}/hour). Please try again later."
            
            # # Check concurrent downloads
            # if self.active_downloads[ip] >= MAX_CONCURRENT_DOWNLOADS:
            #     return False, f"Too many concurrent downloads ({MAX_CONCURRENT_DOWNLOADS} max). Please wait for current downloads to finish."
            
            return True, ""
    
    async def start_download(self, ip: str):
        """Record download start"""
        async with self._lock:
            self.downloads[ip].append(datetime.now())
            self.active_downloads[ip] += 1
    
    async def end_download(self, ip: str):
        """Record download end"""
        async with self._lock:
            self.active_downloads[ip] = max(0, self.active_downloads[ip] - 1)
    
    async def get_stats(self, ip: str) -> dict:
        """Get rate limit stats for an IP"""
        async with self._lock:
            now = datetime.now()
            window_start = now - timedelta(seconds=RATE_LIMIT_WINDOW)
            hour_ago = now - timedelta(hours=1)
            
            recent_requests = len([t for t in self.requests[ip] if t > window_start])
            hourly_downloads = len([t for t in self.downloads[ip] if t > hour_ago])
            
            return {
                "requests_remaining": max(0, RATE_LIMIT_REQUESTS - recent_requests),
                "downloads_remaining": max(0, MAX_DOWNLOADS_PER_HOUR - hourly_downloads),
                "active_downloads": self.active_downloads[ip],
            }

rate_limiter = RateLimiter()
# ================================================================

# CORS middleware - restrict to Next.js server only
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length", "X-Filename"],
)

# ==================== HELPER FUNCTIONS ====================
def get_client_ip(request: Request) -> str:
    """Get real client IP from X-Forwarded-For header (set by Next.js)"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

async def check_rate_limit(request: Request) -> str:
    """Rate limit middleware"""
    ip = get_client_ip(request)
    if await rate_limiter.is_rate_limited(ip):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please slow down."
        )
    return ip
# ================================================================

# Temporary directory for downloads
DOWNLOAD_DIR = tempfile.mkdtemp()

# Check if FFmpeg is available
FFMPEG_AVAILABLE = shutil.which("ffmpeg") is not None


def is_valid_youtube_url(url: str) -> bool:
    """Validate if the URL is a valid YouTube video URL"""
    if not url:
        return False
    
    # YouTube URL patterns
    youtube_patterns = [
        r'^(https?://)?(www\.)?youtube\.com/watch\?v=[\w-]+',
        r'^(https?://)?(www\.)?youtube\.com/v/[\w-]+',
        r'^(https?://)?(www\.)?youtube\.com/embed/[\w-]+',
        r'^(https?://)?(www\.)?youtube\.com/shorts/[\w-]+',
        r'^(https?://)?youtu\.be/[\w-]+',
        r'^(https?://)?(www\.)?youtube\.com/live/[\w-]+',
    ]
    
    for pattern in youtube_patterns:
        if re.match(pattern, url):
            return True
    
    return False


def extract_video_id(url: str) -> str | None:
    """Extract video ID from YouTube URL"""
    parsed = urlparse(url)
    
    if parsed.hostname in ['www.youtube.com', 'youtube.com']:
        if parsed.path == '/watch':
            return parse_qs(parsed.query).get('v', [None])[0]
        elif parsed.path.startswith(('/v/', '/embed/', '/shorts/', '/live/')):
            return parsed.path.split('/')[2]
    elif parsed.hostname == 'youtu.be':
        return parsed.path[1:]
    
    return None


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to remove invalid characters and non-ASCII for HTTP headers"""
    # Remove or replace invalid characters
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    # Remove control characters and non-ASCII (emojis, etc.) for HTTP header compatibility
    filename = ''.join(char for char in filename if 32 <= ord(char) < 127)
    # Limit length
    if len(filename) > 200:
        filename = filename[:200]
    result = filename.strip()
    # Ensure we have a valid filename
    return result if result else "video"


class VideoURLRequest(BaseModel):
    url: str
    
    @field_validator('url')
    @classmethod
    def validate_youtube_url(cls, v: str) -> str:
        v = v.strip()
        if not is_valid_youtube_url(v):
            raise ValueError('Invalid YouTube URL. Please provide a valid YouTube video link.')
        return v


class DownloadRequest(BaseModel):
    url: str
    format_id: str
    
    @field_validator('url')
    @classmethod
    def validate_youtube_url(cls, v: str) -> str:
        v = v.strip()
        if not is_valid_youtube_url(v):
            raise ValueError('Invalid YouTube URL. Please provide a valid YouTube video link.')
        return v


@app.get("/")
async def root():
    return {
        "message": "YouTube Downloader API",
        "ffmpeg_available": FFMPEG_AVAILABLE,
        "secured": True
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for Docker"""
    return {"status": "healthy"}


@app.get("/api/status")
async def get_status(
    request: Request,
    ip: str = Depends(check_rate_limit)
):
    """Get API status and capabilities"""
    stats = await rate_limiter.get_stats(ip)
    return {
        "status": "ok",
        "ffmpeg_available": FFMPEG_AVAILABLE,
        "features": {
            "merge_formats": FFMPEG_AVAILABLE,
            "audio_conversion": FFMPEG_AVAILABLE,
        },
        "limits": stats
    }


@app.post("/api/validate-url")
async def validate_url(
    request: VideoURLRequest,
    req: Request,
    ip: str = Depends(check_rate_limit)
):
    """Validate if URL is a valid YouTube URL"""
    return {"valid": True, "video_id": extract_video_id(request.url)}


@app.post("/api/video-info")
async def get_video_info(
    request: VideoURLRequest,
    req: Request,
    ip: str = Depends(check_rate_limit)
):
    """Get video information and available formats"""
    try:
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": False,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(request.url, download=False)
            except yt_dlp.utils.DownloadError as e:
                error_msg = str(e)
                if "Video unavailable" in error_msg:
                    raise HTTPException(status_code=404, detail="Video not found or unavailable. It may be private, deleted, or region-restricted.")
                elif "Sign in" in error_msg or "age" in error_msg.lower():
                    raise HTTPException(status_code=403, detail="This video requires age verification or sign-in.")
                elif "copyright" in error_msg.lower():
                    raise HTTPException(status_code=403, detail="This video is not available due to copyright restrictions.")
                else:
                    raise HTTPException(status_code=400, detail=f"Could not fetch video: {error_msg}")
            
            if not info:
                raise HTTPException(status_code=404, detail="Could not retrieve video information.")
            
            duration = info.get("duration", 0) or 0
            
            # Filter and organize formats
            formats = []
            seen = set()
            
            for f in info.get("formats", []):
                format_id = f.get("format_id", "")
                ext = f.get("ext", "")
                height = f.get("height")
                width = f.get("width")
                filesize = f.get("filesize") or f.get("filesize_approx")
                vcodec = f.get("vcodec", "none")
                acodec = f.get("acodec", "none")
                tbr = f.get("tbr")  # Total bitrate in kbps
                vbr = f.get("vbr")  # Video bitrate
                abr = f.get("abr")  # Audio bitrate
                fps = f.get("fps")
                
                # Skip formats without extension
                if not ext or ext == "mhtml":
                    continue
                
                # Determine format type
                has_video = vcodec and vcodec != "none"
                has_audio = acodec and acodec != "none"
                
                if has_video and has_audio:
                    format_type = "video+audio"
                elif has_video:
                    format_type = "video only"
                elif has_audio:
                    format_type = "audio only"
                else:
                    continue
                
                # Only include common formats
                if ext not in ["mp4", "webm", "m4a", "mp3", "opus", "ogg"]:
                    continue
                
                # Build resolution string
                if has_video and height:
                    resolution = f"{height}p"
                elif not has_video:
                    resolution = "audio only"
                else:
                    resolution = "unknown"
                
                # Create a unique key for deduplication - include more specifics
                key = f"{height}_{ext}_{format_type}_{fps}"
                
                if key in seen:
                    continue
                seen.add(key)
                
                # Calculate estimated filesize if not provided
                estimated_size = filesize
                if not estimated_size and duration > 0:
                    # Estimate based on bitrate
                    bitrate = tbr or (vbr or 0) + (abr or 0)
                    if bitrate:
                        # bitrate is in kbps, duration in seconds
                        # size in bytes = (bitrate * 1000 / 8) * duration
                        estimated_size = int((bitrate * 1000 / 8) * duration)
                
                formats.append({
                    "format_id": format_id,
                    "ext": ext,
                    "resolution": resolution,
                    "height": height or 0,
                    "width": width or 0,
                    "filesize": estimated_size,
                    "format_type": format_type,
                    "quality": height or 0,
                    "format_note": f.get("format_note", ""),
                    "tbr": tbr,
                    "fps": fps,
                    "vcodec": vcodec if has_video else None,
                    "acodec": acodec if has_audio else None,
                })
            
            # Sort: video+audio first, then by quality (resolution)
            formats.sort(key=lambda x: (
                x["format_type"] == "video+audio",
                x["format_type"] == "video only",
                x.get("quality", 0) or 0
            ), reverse=True)
            
            return {
                "title": info.get("title", "Unknown"),
                "thumbnail": info.get("thumbnail", ""),
                "duration": duration,
                "channel": info.get("channel", info.get("uploader", "Unknown")),
                "view_count": info.get("view_count", 0),
                "upload_date": info.get("upload_date", ""),
                "description": info.get("description", ""),
                "formats": formats[:30],
                "ffmpeg_available": FFMPEG_AVAILABLE,
                "video_id": extract_video_id(request.url),
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@app.post("/api/download")
async def download_video(
    request: DownloadRequest,
    req: Request,
    ip: str = Depends(check_rate_limit)
):
    """Download video in specified format with streaming support"""
    # Check download limits
    can_download, error_msg = await rate_limiter.can_download(ip)
    if not can_download:
        raise HTTPException(status_code=429, detail=error_msg)
    
    await rate_limiter.start_download(ip)
    try:
        # Generate unique filename
        file_id = str(uuid.uuid4())
        output_template = os.path.join(DOWNLOAD_DIR, f"{file_id}.%(ext)s")
        
        ydl_opts = {
            "format": request.format_id,
            "outtmpl": output_template,
            "quiet": True,
            "no_warnings": True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(request.url, download=True)
            except yt_dlp.utils.DownloadError as e:
                error_msg = str(e)
                if "ffmpeg" in error_msg.lower():
                    raise HTTPException(
                        status_code=400, 
                        detail="This format requires FFmpeg to process. Please choose a different format or install FFmpeg."
                    )
                raise HTTPException(status_code=400, detail=f"Download failed: {error_msg}")
            
            # Find the downloaded file
            filepath = None
            actual_ext = None
            for f in os.listdir(DOWNLOAD_DIR):
                if f.startswith(file_id):
                    filepath = os.path.join(DOWNLOAD_DIR, f)
                    actual_ext = f.rsplit('.', 1)[-1] if '.' in f else 'mp4'
                    break
            
            if not filepath or not os.path.exists(filepath):
                raise HTTPException(status_code=500, detail="Download failed - file not created.")
            
            # Get file size
            file_size = os.path.getsize(filepath)
            
            # Get original title for download filename
            title = sanitize_filename(info.get("title", "video"))
            download_filename = f"{title}.{actual_ext}"
            
            # Stream the file
            def iterfile():
                with open(filepath, "rb") as f:
                    while chunk := f.read(1024 * 1024):  # 1MB chunks
                        yield chunk
                # Clean up after streaming
                try:
                    os.remove(filepath)
                except:
                    pass
            
            return StreamingResponse(
                iterfile(),
                media_type="application/octet-stream",
                headers={
                    "Content-Disposition": f'attachment; filename="{download_filename}"',
                    "Content-Length": str(file_size),
                    "X-Filename": download_filename,
                }
            )
            
    except HTTPException:
        await rate_limiter.end_download(ip)
        raise
    except Exception as e:
        await rate_limiter.end_download(ip)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
    finally:
        # Note: For streaming, this will run before stream completes
        # Consider using background task for proper cleanup
        pass


@app.post("/api/download-best")
async def download_best(
    request: VideoURLRequest,
    req: Request,
    ip: str = Depends(check_rate_limit)
):
    """Download video in best quality with streaming support"""
    # Check download limits
    can_download, error_msg = await rate_limiter.can_download(ip)
    if not can_download:
        raise HTTPException(status_code=429, detail=error_msg)
    
    await rate_limiter.start_download(ip)
    try:
        file_id = str(uuid.uuid4())
        output_template = os.path.join(DOWNLOAD_DIR, f"{file_id}.%(ext)s")
        
        if FFMPEG_AVAILABLE:
            format_selector = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best[ext=mp4]/best"
            ydl_opts = {
                "format": format_selector,
                "outtmpl": output_template,
                "quiet": True,
                "no_warnings": True,
                "merge_output_format": "mp4",
            }
        else:
            format_selector = "best[ext=mp4]/best"
            ydl_opts = {
                "format": format_selector,
                "outtmpl": output_template,
                "quiet": True,
                "no_warnings": True,
            }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(request.url, download=True)
            except yt_dlp.utils.DownloadError as e:
                error_msg = str(e)
                if "ffmpeg" in error_msg.lower() or "merging" in error_msg.lower():
                    raise HTTPException(
                        status_code=400,
                        detail="FFmpeg is required to download the best quality. Please install FFmpeg or choose a specific format from the list."
                    )
                raise HTTPException(status_code=400, detail=f"Download failed: {error_msg}")
            
            # Find the downloaded file
            filepath = None
            actual_ext = "mp4"
            for f in os.listdir(DOWNLOAD_DIR):
                if f.startswith(file_id):
                    filepath = os.path.join(DOWNLOAD_DIR, f)
                    actual_ext = f.rsplit('.', 1)[-1] if '.' in f else 'mp4'
                    break
            
            if not filepath or not os.path.exists(filepath):
                raise HTTPException(status_code=500, detail="Download failed - file not created.")
            
            file_size = os.path.getsize(filepath)
            title = sanitize_filename(info.get("title", "video"))
            download_filename = f"{title}.{actual_ext}"
            
            def iterfile():
                with open(filepath, "rb") as f:
                    while chunk := f.read(1024 * 1024):
                        yield chunk
                try:
                    os.remove(filepath)
                except:
                    pass
            
            return StreamingResponse(
                iterfile(),
                media_type="application/octet-stream",
                headers={
                    "Content-Disposition": f'attachment; filename="{download_filename}"',
                    "Content-Length": str(file_size),
                    "X-Filename": download_filename,
                }
            )
            
    except HTTPException:
        await rate_limiter.end_download(ip)
        raise
    except Exception as e:
        await rate_limiter.end_download(ip)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@app.post("/api/download-audio")
async def download_audio(
    request: VideoURLRequest,
    req: Request,
    ip: str = Depends(check_rate_limit)
):
    """Download audio only with streaming support"""
    # Check download limits
    can_download, error_msg = await rate_limiter.can_download(ip)
    if not can_download:
        raise HTTPException(status_code=429, detail=error_msg)
    
    await rate_limiter.start_download(ip)
    try:
        file_id = str(uuid.uuid4())
        output_template = os.path.join(DOWNLOAD_DIR, f"{file_id}.%(ext)s")
        
        if FFMPEG_AVAILABLE:
            ydl_opts = {
                "format": "bestaudio/best",
                "outtmpl": output_template,
                "quiet": True,
                "no_warnings": True,
                "postprocessors": [{
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "192",
                }],
            }
        else:
            ydl_opts = {
                "format": "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best",
                "outtmpl": output_template,
                "quiet": True,
                "no_warnings": True,
            }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(request.url, download=True)
            except yt_dlp.utils.DownloadError as e:
                error_msg = str(e)
                if "ffmpeg" in error_msg.lower():
                    raise HTTPException(
                        status_code=400,
                        detail="FFmpeg is required for audio conversion."
                    )
                raise HTTPException(status_code=400, detail=f"Download failed: {error_msg}")
            
            # Find the downloaded file
            filepath = None
            actual_ext = "mp3" if FFMPEG_AVAILABLE else "m4a"
            for f in os.listdir(DOWNLOAD_DIR):
                if f.startswith(file_id):
                    filepath = os.path.join(DOWNLOAD_DIR, f)
                    actual_ext = f.rsplit('.', 1)[-1] if '.' in f else actual_ext
                    break
            
            if not filepath or not os.path.exists(filepath):
                raise HTTPException(status_code=500, detail="Download failed - file not created.")
            
            file_size = os.path.getsize(filepath)
            title = sanitize_filename(info.get("title", "audio"))
            download_filename = f"{title}.{actual_ext}"
            
            media_type = "audio/mpeg" if actual_ext == "mp3" else "audio/mp4" if actual_ext == "m4a" else "application/octet-stream"
            
            def iterfile():
                with open(filepath, "rb") as f:
                    while chunk := f.read(1024 * 1024):
                        yield chunk
                try:
                    os.remove(filepath)
                except:
                    pass
            
            return StreamingResponse(
                iterfile(),
                media_type=media_type,
                headers={
                    "Content-Disposition": f'attachment; filename="{download_filename}"',
                    "Content-Length": str(file_size),
                    "X-Filename": download_filename,
                }
            )
            
    except HTTPException:
        await rate_limiter.end_download(ip)
        raise
    except Exception as e:
        await rate_limiter.end_download(ip)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

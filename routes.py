import logging
import urllib.parse
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import requests
from utils import is_valid_url, sanitize_filename
from services import VideoExtractorService

logger = logging.getLogger("video_downloader")

router = APIRouter()

class DownloadRequest(BaseModel):
    url: str = Field(..., example="https://www.youtube.com/watch?v=dQw4w9WgXcQ")

@router.post("/download")
async def process_video_download(payload: DownloadRequest):
    """
    Process video URL extraction. Returns video details and available resolution links.
    """
    raw_url = payload.url.strip() if payload.url else ""
    
    if not raw_url:
        raise HTTPException(
            status_code=400, 
            detail="Please enter a valid URL."
        )
        
    if not is_valid_url(raw_url):
        raise HTTPException(
            status_code=422, 
            detail="Invalid URL format. Please paste a valid web video link starting with http:// or https://"
        )

    try:
        data = VideoExtractorService.extract_info(raw_url)
        # Platform returned a structured error (e.g. TikTok CDN blocked)
        if not data.get("success", True):
            raise HTTPException(
                status_code=503,
                detail=data.get("error", "Gagal mengambil informasi video. Coba lagi.")
            )
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process video: {str(e)}"
        )

import subprocess
try:
    import imageio_ffmpeg
    FFMPEG_BIN = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FFMPEG_BIN = "ffmpeg"

@router.get("/proxy-download")
async def proxy_download_stream(
    url: str = Query(..., description="Target file URL to download"),
    filename: str = Query("video", description="Desired download filename"),
    ext: str = Query("mp4", description="File extension (mp4, mp3)"),
    referer: str = Query("", description="Optional Referer header for CDN bypass"),
    audio_url: str = Query("", description="Optional standalone audio URL to merge with video stream")
):
    """
    Proxy stream endpoint to trigger browser file download with proper attachment header.
    Supports TikTok Varnish CDN bypass and on-the-fly FFmpeg merging of DASH video + audio streams.
    """
    if not is_valid_url(url):
        raise HTTPException(status_code=400, detail="Invalid target media URL.")

    clean_filename = sanitize_filename(filename) + f".{ext.lower()}"
    encoded_filename = urllib.parse.quote(clean_filename)

    # Detect CDN provider
    is_tiktok = any(d in url for d in ["tiktok.com", "tiktokcdn.com", "tiktokv.com", "muscdn.com", "bytedance"])
    is_youtube = any(d in url for d in ["youtube.com", "googlevideo.com", "youtu.be"])
    is_instagram = any(d in url for d in ["instagram.com", "cdninstagram.com", "fbcdn.net"])

    base_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "identity",  # Avoid compressed stream issues
        "Connection": "keep-alive",
    }

    if is_tiktok:
        base_headers.update({
            "Referer": "https://www.tiktok.com/",
            "Origin": "https://www.tiktok.com",
            "Sec-Fetch-Dest": "video",
            "Sec-Fetch-Mode": "no-cors",
            "Sec-Fetch-Site": "same-site",
        })
    elif is_youtube:
        base_headers.update({
            "Referer": "https://www.youtube.com/",
            "Origin": "https://www.youtube.com",
        })
    elif is_instagram:
        base_headers.update({
            "Referer": "https://www.instagram.com/",
            "Origin": "https://www.instagram.com",
        })
    elif referer:
        base_headers["Referer"] = referer

    # If adaptive video stream + standalone audio stream is requested, merge on-the-fly via FFmpeg
    if audio_url and is_valid_url(audio_url) and ext.lower() == "mp4":
        logger.info(f"Merging video stream and audio stream on-the-fly for {clean_filename}")

        def generate_merged_stream():
            header_str = "".join(f"{k}: {v}\r\n" for k, v in base_headers.items())
            cmd = [
                FFMPEG_BIN, "-y",
                "-headers", header_str, "-i", url,
                "-headers", header_str, "-i", audio_url,
                "-c:v", "copy",
                "-c:a", "aac",
                "-movflags", "frag_keyframe+empty_moov",
                "-f", "mp4",
                "pipe:1"
            ]
            proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=64 * 1024)
            try:
                while True:
                    chunk = proc.stdout.read(64 * 1024)
                    if not chunk:
                        break
                    yield chunk
            except Exception as stream_err:
                logger.error(f"Error during FFmpeg stream merge: {str(stream_err)}")
            finally:
                proc.kill()

        response_headers = {
            "Content-Disposition": f'attachment; filename="{clean_filename}"; filename*=UTF-8\'\'{encoded_filename}',
        }
        return StreamingResponse(
            generate_merged_stream(),
            media_type="video/mp4",
            headers=response_headers
        )

    # Standard direct stream proxy (progressive formats or audio-only downloads)
    try:
        req = requests.get(url, headers=base_headers, stream=True, timeout=30, verify=False)
        
        if req.status_code >= 400:
            logger.warning(f"Proxy download got {req.status_code} from CDN: {url[:80]}")
            # Fallback: redirect client directly to the URL
            return Response(status_code=307, headers={"Location": url})

        media_type = "video/mp4" if ext.lower() == "mp4" else "audio/mpeg"
        
        response_headers = {
            "Content-Disposition": f'attachment; filename="{clean_filename}"; filename*=UTF-8\'\'{encoded_filename}',
        }
        content_length = req.headers.get("Content-Length")
        if content_length:
            response_headers["Content-Length"] = content_length

        return StreamingResponse(
            req.iter_content(chunk_size=64 * 1024),
            media_type=media_type,
            headers=response_headers
        )
    except Exception as e:
        logger.error(f"Proxy download failed: {str(e)}")
        # Fallback to direct download redirection
        return Response(status_code=307, headers={"Location": url})

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "Fast Video Downloader", "version": "2.0.0"}

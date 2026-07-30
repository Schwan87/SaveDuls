import re
import urllib.parse
from config import settings

URL_REGEX = re.compile(
    r'^(?:http|ftp)s?://'  # http:// or https://
    r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # domain...
    r'localhost|'  # localhost...
    r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
    r'(?::\d+)?'  # optional port
    r'(?:/?|[/?]\S+)$', re.IGNORECASE
)

def is_valid_url(url: str) -> bool:
    """Validate if the string is a well-formed HTTP/HTTPS URL."""
    if not url or not isinstance(url, str):
        return False
    url = url.strip()
    return bool(URL_REGEX.match(url))

def detect_platform(url: str) -> str:
    """Detect the video platform name based on the URL domain."""
    if not url:
        return "Generic"
    
    url_lower = url.lower()
    for platform, domains in settings.SUPPORTED_PLATFORMS.items():
        for domain in domains:
            if domain in url_lower:
                return platform.capitalize()
                
    return "Generic"

def format_duration(seconds: int | float | None) -> str:
    """Format duration in seconds to MM:SS or HH:MM:SS format."""
    if seconds is None or seconds <= 0:
        return "N/A"
    
    seconds = int(seconds)
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"

def format_filesize(bytes_num: int | float | None) -> str:
    """Format byte size into human readable string (KB, MB, GB)."""
    if bytes_num is None or bytes_num <= 0:
        return "Unknown Size"
    
    units = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    size = float(bytes_num)
    while size >= 1024 and i < len(units) - 1:
        size /= 1024
        i += 1
    
    return f"{size:.1f} {units[i]}"

def sanitize_filename(name: str) -> str:
    """Sanitize string to be safe for filenames."""
    if not name:
        return "video_download"
    # Remove non-alphanumeric chars except space, hyphen, underscore
    cleaned = re.sub(r'[^\w\s-]', '', name).strip()
    # Replace whitespace with underscore
    cleaned = re.sub(r'[-\s]+', '_', cleaned)
    return cleaned[:100] or "video_download"

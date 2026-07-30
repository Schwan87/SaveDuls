import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "Fast Video Downloader"
    APP_VERSION: str = "2.0.0"
    APP_DESCRIPTION: str = "Modern, ultra-fast SaaS video downloader supporting YouTube, TikTok, Instagram, Twitter, Facebook, and more."
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.abspath(__file__))
    STATIC_DIR: str = os.path.join(BASE_DIR, "static")
    TEMPLATES_DIR: str = os.path.join(BASE_DIR, "templates")

    # Timeouts & Limits
    EXTRACTION_TIMEOUT: int = 25  # seconds
    MAX_FILE_SIZE_MB: int = 500

    # Supported Domains pattern matching
    SUPPORTED_PLATFORMS: dict = {
        "youtube": ["youtube.com", "youtu.be", "m.youtube.com"],
        "tiktok": ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"],
        "instagram": ["instagram.com", "instagr.am"],
        "twitter": ["twitter.com", "x.com"],
        "facebook": ["facebook.com", "fb.watch", "fb.gg", "m.facebook.com"],
        "vimeo": ["vimeo.com"],
        "pinterest": ["pinterest.com", "pin.it"]
    }

settings = Settings()

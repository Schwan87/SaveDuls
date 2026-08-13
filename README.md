# SaveDuls

A modern, fast, professional, and responsive SaaS-style Video Downloader web application built with **Python FastAPI**, **Vanilla JavaScript**, and **Tailwind CSS**.

![Fast Video Downloader](https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop)

---

## 🌟 Key Features

- ⚡ **Ultra Fast Processing**: Instant asynchronous video URL parsing using `yt-dlp` with intelligent fallback parser.
- 🎨 **Modern SaaS Design**: Slate Dark Mode (`#0F172A`), Cyan (`#06B6D4`) & Blue (`#2563EB`) gradients, Glassmorphism, smooth animations.
- 🎬 **Multi-Platform Support**: YouTube, TikTok, Instagram, Twitter / X, Facebook, Vimeo, and more.
- 🎵 **Video & Audio Extraction**: Download MP4 videos in 1080p, 720p, 480p resolutions, or extract 320kbps MP3 audio.
- 📦 **No Page Reload**: Asynchronous `fetch()` API calls with custom dynamic loading state step messages.
- 🛡️ **Built-in Proxy Downloader**: Direct attachments download headers (`Content-Disposition`) avoiding CORS errors.
- 📱 **Fully Responsive**: Optimized for desktop, tablet, and mobile browsers.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn, Jinja2, `yt-dlp`
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla ES6)
- **Styling**: Tailwind CSS, Font Awesome 6 Icons
- **Animations**: AOS (Animate on Scroll) + CSS Keyframes & Ripple Effects

---

## 📂 Project Structure

```text
c:/Projek Genta/Download Video/
├── app.py              # Main FastAPI application entry point & CORS
├── routes.py           # API routes (/download, /proxy-download, /health)
├── services.py         # Video extraction service with yt-dlp & fallback
├── utils.py            # Helpers for URL validation & byte formatting
├── config.py           # App configuration settings & supported platforms
├── requirements.txt    # Python dependencies
├── static/
│   ├── css/
│   │   └── style.css   # Custom glassmorphism, animations & toast styles
│   └── js/
│       └── main.js     # Asynchronous fetch, step progress & UX logic
├── templates/
│   └── index.html      # SEO-friendly Jinja2 HTML5 template
└── README.md           # Documentation
```

---

## 🚀 Getting Started

### 1. Install Dependencies

Open your command prompt or terminal in the project directory:

```bash
pip install -r requirements.txt
```

### 2. Run the Web Server

Start the Uvicorn dev server with hot reload enabled:

```bash
uvicorn app:app --reload
```

### 3. Open in Browser

Navigate to:

```text
http://127.0.0.1:8000
```

---

## 📡 API Reference

### Extract Video Info

- **Endpoint**: `POST /download`
- **Request Body**:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "title": "Never Gonna Give You Up",
    "thumbnail": "https://...",
    "duration": "03:33",
    "platform": "Youtube",
    "author": "Rick Astley",
    "qualities": [
      {
        "quality": "1080p Full HD",
        "format": "MP4",
        "resolution": "1920x1080",
        "size": "45.8 MB",
        "url": "https://...",
        "is_audio": false
      },
      {
        "quality": "MP3 High Quality",
        "format": "MP3",
        "resolution": "320 kbps",
        "size": "8.5 MB",
        "url": "https://...",
        "is_audio": true
      }
    ],
    "download_url": "https://...",
    "audio_url": "https://..."
  }
  ```

---

## 📄 License

This project is open-source and free for personal and educational use.

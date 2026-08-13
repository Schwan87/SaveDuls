import os
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routes import router as api_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION
)

# CORS configuration
allowed_origins = [
    "https://save-duls.vercel.app",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
]
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    allowed_origins.extend([o.strip() for o in env_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static directory
if os.path.exists(settings.STATIC_DIR):
    app.mount("/static", StaticFiles(directory=settings.STATIC_DIR), name="static")

# Jinja2 Templates
templates = Jinja2Templates(directory=settings.TEMPLATES_DIR)

# Include API Routes
app.include_router(api_router)

@app.get("/", include_in_schema=False)
async def render_homepage(request: Request):
    """Render main web application interface."""
    return templates.TemplateResponse(request, "index.html", context={"app_name": settings.APP_NAME})

# Custom Exception Handlers
@app.exception_handler(404)
async def custom_404_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"success": False, "detail": "Resource not found"}
    )

@app.exception_handler(500)
async def custom_500_handler(request: Request, exc):
    return JSONResponse(
        status_code=500,
        content={"success": False, "detail": "An internal server error occurred."}
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    is_dev = os.getenv("ENV", "development").lower() == "development"
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=is_dev)


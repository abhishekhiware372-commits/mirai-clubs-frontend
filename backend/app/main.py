import os
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, Response
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import engine, Base, get_db
from app.api.v1.api import api_router
from app.models.entities import Certificate

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Centralized platform for managing student clubs, Club Days, attendance integrity, and certificates across Mirai School of Technology.",
    openapi_url="/api/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Ensure directories exist
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(settings.CERTIFICATES_DIR, exist_ok=True)

# Static file mounts
uploads_path = os.path.abspath(settings.STORAGE_DIR)
certs_path = os.path.abspath(settings.CERTIFICATES_DIR)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")
app.mount("/certificates-files", StaticFiles(directory=certs_path), name="certificates")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": engine.url.drivername
    }

# Public certificate verification web page
@app.get("/verify/{cert_number}", response_class=HTMLResponse)
def verify_certificate_page(cert_number: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.certificate_number == cert_number).first()
    
    if not cert:
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Mirai Clubs - Certificate Verification</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
          <div class="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl">
            <div class="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">✕</div>
            <h1 class="text-xl font-bold text-white mb-2">Record Not Found</h1>
            <p class="text-sm text-slate-400 mb-6">Certificate ID <code class="text-red-400 font-mono">{cert_number}</code> is not registered in the Mirai School of Technology issuance registry.</p>
            <a href="/" class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-sm font-semibold transition">Return to Mirai Clubs</a>
          </div>
        </body>
        </html>
        """

    student_name = cert.user.full_name if cert.user else "MST Student"
    student_id = cert.user.student_id if cert.user else "MST-STUDENT"
    issuer_name = cert.issuer.full_name if cert.issuer else "Faculty Advisor"
    date_str = cert.issue_date.strftime("%B %d, %Y")

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificate Verification - Mirai School of Technology</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-[#060911] text-slate-100 min-h-screen flex items-center justify-center p-4">
      <div class="max-w-lg w-full bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl mb-3 shadow-lg">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <div class="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold">Authoritatively Verified</div>
          <h1 class="text-2xl font-black text-white mt-1">Official Mirai Certificate</h1>
        </div>

        <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3 mb-6 text-sm">
          <div class="flex justify-between border-b border-slate-800/80 pb-2">
            <span class="text-slate-400">Certificate ID:</span>
            <span class="font-mono font-bold text-sky-400">{cert.certificate_number}</span>
          </div>
          <div class="flex justify-between border-b border-slate-800/80 pb-2">
            <span class="text-slate-400">Awarded To:</span>
            <span class="font-bold text-white">{student_name} ({student_id})</span>
          </div>
          <div class="flex justify-between border-b border-slate-800/80 pb-2">
            <span class="text-slate-400">Achievement Title:</span>
            <span class="font-semibold text-slate-200">{cert.title}</span>
          </div>
          <div class="flex justify-between border-b border-slate-800/80 pb-2">
            <span class="text-slate-400">Certificate Type:</span>
            <span class="px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300 font-bold">{cert.cert_type}</span>
          </div>
          <div class="flex justify-between border-b border-slate-800/80 pb-2">
            <span class="text-slate-400">Date Issued:</span>
            <span class="text-slate-300">{date_str}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Authorized Issuer:</span>
            <span class="text-slate-300">{issuer_name}</span>
          </div>
        </div>

        <div class="text-center text-xs text-slate-500 space-y-3">
          <div>Verified directly against the Mirai School of Technology Central Database Registry.</div>
          <div class="pt-2">
            <a href="/" class="inline-block px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold transition">Back to Mirai Clubs</a>
          </div>
        </div>
      </div>
    </body>
    </html>
    """

# Serve frontend static files
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend"))

@app.get("/", response_class=HTMLResponse)
def serve_index():
    index_file = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>Mirai Clubs Frontend Loading...</h1>")

@app.get("/css/{file_path:path}")
def serve_css(file_path: str):
    full_path = os.path.join(frontend_dir, "css", file_path)
    if os.path.exists(full_path):
        with open(full_path, "r", encoding="utf-8") as f:
            return Response(content=f.read(), media_type="text/css")
    return Response(status_code=404)

@app.get("/js/{file_path:path}")
def serve_js(file_path: str):
    full_path = os.path.join(frontend_dir, "js", file_path)
    if os.path.exists(full_path):
        with open(full_path, "r", encoding="utf-8") as f:
            return Response(content=f.read(), media_type="application/javascript")
    return Response(status_code=404)

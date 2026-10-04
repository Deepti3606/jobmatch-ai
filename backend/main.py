import io, logging, os
from dotenv import load_dotenv
from typing import Optional
from anthropic import (APIConnectionError, AuthenticationError, BadRequestError,
                       PermissionDeniedError, RateLimitError)
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from pypdf import PdfReader

load_dotenv()
from ai_analyzer import analyze_with_ai  # noqa: E402
from demo_analyzer import analyze_offline  # noqa: E402

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("jobmatch")  # never log resume text

MAX_BYTES = 5 * 1024 * 1024
MAX_JD, MIN_JD = 8000, 150
app = FastAPI(title="JobMatch AI")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
                   allow_methods=["*"], allow_headers=["*"])


def resolve_key(user_key: Optional[str]) -> Optional[str]:
    """Key from the user's browser (per request, never stored/logged) or the server's .env."""
    if os.getenv("FORCE_DEMO_MODE") == "1":
        return None
    return (user_key or "").strip() or os.getenv("ANTHROPIC_API_KEY") or None


def demo_mode() -> bool:
    return resolve_key(None) is None


def err(code: int, msg: str):
    raise HTTPException(status_code=code, detail=msg)


def extract_text(data: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            err(422, "This PDF is password-protected. Remove the password and try again.")
        text = "\n".join((p.extract_text() or "") for p in reader.pages[:6]).strip()
    except HTTPException:
        raise
    except Exception:
        err(422, "We couldn't read this file. Upload a valid PDF resume.")
    if len(text) < 80:
        err(422, "No readable text found. Scanned PDFs aren't supported; export a text-based PDF from Word or Google Docs.")
    return text[:15000]


@app.get("/api/health")
def health():
    return {"status": "ok", "mode": "demo" if demo_mode() else "ai"}


@app.post("/api/analyze")
async def analyze(resume: UploadFile = File(...), job_description: str = Form(...),
                  x_api_key: Optional[str] = Header(default=None)):
    if not (resume.filename or "").lower().endswith(".pdf"):
        err(400, "Please upload a PDF file.")
    data = await resume.read(MAX_BYTES + 1)
    if not data:
        err(400, "The uploaded file is empty.")
    if len(data) > MAX_BYTES:
        err(413, "File is too large. Maximum size is 5 MB.")
    jd = job_description.strip()
    if not jd:
        err(400, "Paste a job description to compare against.")
    if len(jd) < MIN_JD:
        err(400, f"The job description is too short. Paste at least {MIN_JD} characters for a useful match.")
    if len(jd) > MAX_JD:
        err(400, f"The job description is too long. Keep it under {MAX_JD} characters.")
    text = extract_text(data)
    del data
    key = resolve_key(x_api_key)
    mode = "ai" if key else "demo"
    try:
        result = analyze_with_ai(text, jd, key) if key else analyze_offline(text, jd)
    except (AuthenticationError, PermissionDeniedError):
        err(401, "Your API key was rejected. Check that it is correct and active, then try again.")
    except RateLimitError:
        err(429, "Rate limit reached on your API key. Wait a minute and try again.")
    except BadRequestError as e:
        log.warning("Bad request: %s", str(e)[:200])
        if "credit" in str(e).lower():
            err(402, "Your Anthropic account has no credits left. Add credits at console.anthropic.com, then try again.")
        err(502, "The AI could not process this request. Try a shorter job description.")
    except APIConnectionError:
        err(503, "Couldn't reach the Anthropic API. Check the server's internet connection.")
    except (ValidationError, ValueError):
        log.warning("Invalid structured response")
        err(502, "The AI returned an unexpected response. Please try again.")
    except HTTPException:
        raise
    except Exception as e:
        log.warning("AI call failed: %s: %s", type(e).__name__, str(e)[:200])
        err(503, f"The AI service failed ({type(e).__name__}). Check the backend terminal for details.")
    return {**result.model_dump(), "mode": mode}

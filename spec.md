# Technical spec — JobMatch AI

## Architecture
React + Vite (port 5173, proxies `/api`) → FastAPI (port 8000) → pypdf extraction → Anthropic API (tool-use for structured JSON) or offline analyzer.

## API
`GET /api/health` → `{status, mode: "ai"|"demo"}`

`POST /api/analyze` (multipart): `resume` (PDF file), `job_description` (string). Optional header `X-API-Key`: the user's Anthropic key (used for that request only; falls back to server `.env` key, then demo mode).

Response (200):
```json
{
  "match_score": 82, "summary": "", "matching_skills": [], "relevant_experience": [],
  "missing_skills": [], "ats_keywords": [], "experience_match": [],
  "qualification_gaps": [], "resume_suggestions": [{"title":"","detail":"","example":""}],
  "learning_recommendations": [{"skill":"","priority":"High|Medium|Low","why":""}],
  "uncertainty_note": "", "mode": "ai"
}
```

## Errors (JSON `{detail}`)
| Status | Cause |
|--------|-------|
| 400 | Not a PDF, empty file, empty/short/long job description |
| 413 | File over 5 MB |
| 422 | Unreadable, encrypted, or text-less PDF |
| 401 | API key rejected |
| 502 | Invalid/unexpected AI output |
| 503 | AI service failure |

## AI design
Forced tool call (`report_analysis`) whose schema is the Pydantic `Analysis` model; output re-validated server-side. System prompt forbids invention, fake-skill advice, and treats document text as data (prompt-injection guard).

## Privacy
Files read in memory only; not written to disk; logs contain error types, never content.

## Testing checklist
Valid PDF+JD; non-PDF; empty/short JD; scanned PDF; no API key (demo mode); wrong key (503); mobile width.

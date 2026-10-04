# JobMatch AI

Understand your resume. Match the opportunity. Improve your chances.

Upload a PDF resume, paste a job description, and get a match score, matching and missing skills, ATS keywords, resume suggestions, and a prioritized learning roadmap.

Built for **Devpost Build With AI: Basics**. Planning docs: [scope.md](scope.md), [prd.md](prd.md), [spec.md](spec.md).

## Features
- PDF upload with validation and server-side text extraction
- Structured AI analysis (Anthropic tool-use + Pydantic validation)
- Dashboard: animated score ring, skill coverage bar, You Match / You Could Improve, ATS chips, suggestion cards, learning roadmap
- **Try with sample data** button for one-click demos
- **Offline demo mode** when no API key is set
- Copy, download (.md), and print the report
- Dark mode, responsive, keyboard accessible
- **Bring your own key:** the site asks for your Anthropic API key on first load (kept in the browser tab only, sent per request, never stored or logged by the server). Skip it to use demo mode.
- Privacy: nothing stored, no resume text in logs

## Quick start
Requires Python 3.10+ and Node 18+.

```bash
# Terminal 1 — backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # optional: a server-side ANTHROPIC_API_KEY; users can also enter their own key in the site
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev                  # open http://localhost:5173
```

## Demo script (1–3 min)
1. Open the app → click **Try with sample data** (or upload `docs/sample-resume.pdf`).
2. Click **Analyze My Match** and show the loading steps.
3. Walk through score, You Match, You Could Improve, ATS keywords, suggestions, roadmap.
4. Click **Download .md**.

## Configuration
| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Optional server default key. A key entered in the site takes priority |
| `ANTHROPIC_MODEL` | Default `claude-sonnet-5-5` |
| `FORCE_DEMO_MODE=1` | Always use offline analysis |

## Limitations
Scanned/image PDFs are not supported (no OCR). The score is an AI estimate, not a guarantee of an interview or job.

---
Made by Deepti Sanjay Shah

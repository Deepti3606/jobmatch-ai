# scope.md — JobMatch AI

**One-line scope:** Resume PDF + Job Description → AI Analysis → Actionable Results.

## In scope (MVP)
- PDF resume upload (type + 5 MB validation), server-side text extraction
- Job description input (150–8000 chars)
- Structured AI analysis: score, matching/missing skills, ATS keywords, experience match, suggestions, learning roadmap, summary
- Results dashboard (score ring, You Match / You Could Improve, chips, cards, roadmap)
- Loading, empty and error states
- Bring-your-own API key prompt on first load (session only, never stored server-side)
- Extras kept tiny: "Try with sample data", offline demo mode (no API key), copy/download/print report

## Out of scope
Auth, payments, job scraping, LinkedIn/email integrations, social features, database, model training, resume generation, job portal, admin dashboard, chatbot, collaboration.

## Principles
- No resume storage; no resume content in logs; API keys are never stored or logged by the server; a user key lives only in the browser tab.
- AI never invents experience and never advises faking skills.
- Score is labelled an estimate.

## Risks and decisions
- Scanned PDFs have no text → clear error, no OCR (out of scope).
- API outage during demo → offline demo mode keeps the flow working.

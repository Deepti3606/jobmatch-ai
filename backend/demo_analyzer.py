"""Offline keyword-based analysis. Used when no API key is set (reliable demo mode)."""
import re
from models import Analysis, Suggestion, Learning

SKILLS = [
    "python", "sql", "java", "javascript", "typescript", "react", "node.js", "fastapi", "flask", "django",
    "machine learning", "deep learning", "nlp", "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy",
    "power bi", "tableau", "excel", "statistics", "data analysis", "data visualization", "etl",
    "aws", "azure", "gcp", "docker", "kubernetes", "git", "github", "ci/cd", "linux", "rest api",
    "mongodb", "postgresql", "mysql", "spark", "airflow", "llm", "prompt engineering", "agile",
    "communication", "teamwork", "problem solving", "c++", "html", "css", "figma", "a/b testing",
]
ACRONYMS = {"nlp", "sql", "aws", "gcp", "llm", "etl", "ci/cd", "css", "html"}


def _has(text: str, skill: str) -> bool:
    return re.search(r"(?<![a-z0-9])" + re.escape(skill) + r"(?![a-z0-9])", text) is not None


NAMES = {"power bi": "Power BI", "postgresql": "PostgreSQL", "mysql": "MySQL", "mongodb": "MongoDB",
         "a/b testing": "A/B Testing", "node.js": "Node.js", "ci/cd": "CI/CD", "github": "GitHub",
         "pytorch": "PyTorch", "tensorflow": "TensorFlow", "javascript": "JavaScript", "typescript": "TypeScript",
         "fastapi": "FastAPI", "rest api": "REST API", "scikit-learn": "scikit-learn", "c++": "C++"}


def _pretty(s: str) -> str:
    return NAMES.get(s) or (s.upper() if s in ACRONYMS else s.title())


def analyze_offline(resume: str, jd: str) -> Analysis:
    r, j = resume.lower(), jd.lower()
    wanted = [s for s in SKILLS if _has(j, s)]
    have = [s for s in wanted if _has(r, s)]
    miss = [s for s in wanted if s not in have]
    score = round(100 * len(have) / len(wanted)) if wanted else 40
    score = max(8, min(96, score))
    years = re.findall(r"(\d+)\+?\s*(?:years|yrs)", j)
    exp = []
    if years:
        exp.append(f"The job mentions {max(map(int, years))}+ years of experience. Check that your internships and projects show comparable depth.")
    if "intern" in r or "experience" in r:
        exp.append("Your resume mentions hands-on experience, which supports the role's experience needs.")
    if re.search(r"b\.?tech|b\.?sc|bachelor|degree|master", r):
        exp.append("A degree appears on your resume. Confirm it matches the field the job asks for.")
    if not exp:
        exp.append("Not enough detail to judge experience fit. Add dates, roles, and project outcomes.")
    have_p, miss_p = [_pretty(s) for s in have], [_pretty(s) for s in miss]
    prio = ["High", "High", "Medium", "Medium"] + ["Low"] * 10
    return Analysis(
        match_score=score,
        summary=(f"Estimated {score}% match from keyword overlap. Strongest areas: {', '.join(have_p[:3]) or 'none detected'}. "
                 f"Biggest gaps: {', '.join(miss_p[:3]) or 'none detected'}. This is an offline estimate; add an API key for deeper analysis."),
        matching_skills=have_p, relevant_experience=[], missing_skills=miss_p,
        ats_keywords=[_pretty(s) for s in wanted],
        experience_match=exp,
        qualification_gaps=[f"No clear evidence of {m}." for m in miss_p[:3]],
        resume_suggestions=[
            Suggestion(title="Quantify your results", detail="Add numbers to project and internship bullets: users, accuracy, time saved.",
                       example="Built a churn model (82% F1) on 50k rows, cutting manual review time by 30%."),
            Suggestion(title="Make skills easy to scan", detail="Keep a dedicated Skills section grouped by category so ATS and recruiters find it quickly."),
            Suggestion(title="Align wording honestly", detail="Use the job's exact terms only for skills you truly have." + (f" Candidates here: {', '.join(have_p[:4])}." if have_p else "")),
        ],
        learning_recommendations=[
            Learning(skill=m, priority=prio[i], why=f"The job description mentions {m}; it is not clearly shown on your resume.")
            for i, m in enumerate(miss_p[:6])
        ],
        uncertainty_note="Offline mode matches keywords only. It cannot judge project quality or context.",
    )

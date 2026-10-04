import { useEffect, useRef, useState } from "react";
import { SAMPLE_JD } from "./samples.js";
import { toMarkdown } from "./report.js";

const MAX_JD = 8000;
const MIN_JD = 150;
const MAX_MB = 5;
const STEPS = ["Reading your PDF", "Comparing with the job", "Writing your plan"];

function Ring({ score }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return setShown(score);
    let n = 0;
    const id = setInterval(() => {
      n = Math.min(score, n + 2);
      setShown(n);
      if (n >= score) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [score]);
  const R = 70, C = 2 * Math.PI * R;
  const tone = score >= 75 ? "var(--good)" : score >= 50 ? "var(--teal)" : "var(--warn)";
  const label = score >= 75 ? "Strong match" : score >= 50 ? "Promising match" : "Early match";
  return (
    <div className="ring" role="img" aria-label={`Match score ${score} percent. ${label}.`}>
      <svg viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={R} fill="none" stroke="var(--line)" strokeWidth="14" />
        <circle cx="90" cy="90" r={R} fill="none" stroke={tone} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - shown / 100)} transform="rotate(-90 90 90)" />
      </svg>
      <div className="ring-text"><strong>{shown}%</strong><span>{label}</span></div>
    </div>
  );
}

const Chips = ({ items, kind }) =>
  items.length ? <ul className="chips">{items.map((s) => <li key={s} className={`chip ${kind}`}>{s}</li>)}</ul>
               : <p className="muted">Nothing to show here.</p>;

function Results({ r, onReset, fileName }) {
  const [copied, setCopied] = useState(false);
  const md = toMarkdown(r, "");
  const total = r.matching_skills.length + r.missing_skills.length;
  const cover = total ? Math.round((r.matching_skills.length / total) * 100) : 0;
  const copy = async () => {
    try { await navigator.clipboard.writeText(md); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    a.download = "jobmatch-report.md"; a.click(); URL.revokeObjectURL(a.href);
  };
  return (
    <section className="results" aria-live="polite">
      {r.mode === "demo" && (
        <p className="banner">Offline demo mode: this estimate comes from keyword matching. Add an API key on the server for full AI analysis.</p>
      )}
      <div className="toolbar">
        <span className="muted">Analysis of <b>{fileName}</b></span>
        <div className="actions">
          <button className="btn ghost" onClick={copy}>{copied ? "Copied" : "Copy report"}</button>
          <button className="btn ghost" onClick={download}>Download .md</button>
          <button className="btn ghost" onClick={() => window.print()}>Print</button>
          <button className="btn" onClick={onReset}>Analyze another</button>
        </div>
      </div>

      <div className="card score">
        <Ring score={r.match_score} />
        <div>
          <h2>Why this match score?</h2>
          <p>{r.summary}</p>
          <div className="cover" aria-label={`Skill coverage ${cover} percent`}>
            <div className="cover-bar"><i style={{ width: `${cover}%` }} /></div>
            <small>{r.matching_skills.length} of {total} job skills found on your resume</small>
          </div>
          <p className="fine">AI-generated estimate. It does not guarantee an interview or job.</p>
        </div>
      </div>

      <div className="two">
        <div className="card">
          <h3 className="good-h">You match</h3>
          <h4>Skills</h4><Chips items={r.matching_skills} kind="good" />
          {r.relevant_experience?.length > 0 && (<><h4>Relevant experience and projects</h4>
            <ul className="list">{r.relevant_experience.map((x) => <li key={x}>{x}</li>)}</ul></>)}
          <h4>Experience and qualifications</h4>
          <ul className="list">{r.experience_match.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div className="card">
          <h3 className="warn-h">You could improve</h3>
          <h4>Missing skills</h4><Chips items={r.missing_skills} kind="warn" />
          {r.qualification_gaps?.length > 0 && (<><h4>Qualification gaps</h4>
            <ul className="list">{r.qualification_gaps.map((x) => <li key={x}>{x}</li>)}</ul></>)}
        </div>
      </div>

      <div className="card">
        <h3>ATS keywords</h3>
        <p className="muted">Add these to your resume only if you genuinely have the skill.</p>
        <Chips items={r.ats_keywords} kind="plain" />
      </div>

      <h3 className="sec">Resume suggestions</h3>
      <div className="grid">
        {r.resume_suggestions.map((s) => (
          <article className="card sug" key={s.title}>
            <h4>{s.title}</h4><p>{s.detail}</p>
            {s.example && <blockquote>{s.example}</blockquote>}
          </article>
        ))}
      </div>

      <div className="card">
        <h3>Learning roadmap</h3>
        {r.learning_recommendations.length === 0 ? <p className="muted">No major gaps found. Nice work.</p> : (
          <ol className="road">
            {r.learning_recommendations.map((l) => (
              <li key={l.skill}>
                <div><b>{l.skill}</b> <span className={`pri ${l.priority.toLowerCase()}`}>{l.priority} priority</span></div>
                <p>{l.why}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
      {r.uncertainty_note && <p className="fine">Note: {r.uncertainty_note}</p>}
    </section>
  );
}

const KEY_STORE = "jobmatch_api_key";
const readKey = () => { try { return sessionStorage.getItem(KEY_STORE) || ""; } catch { return ""; } };

function KeyGate({ onDone }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  const save = () => {
    const k = val.trim();
    if (!k.startsWith("sk-ant-") || k.length < 20) return setErr("That doesn't look like an Anthropic key. It starts with sk-ant-.");
    try { sessionStorage.setItem(KEY_STORE, k); } catch { /* ignore */ }
    onDone(k);
  };
  return (
    <section className="hero">
      <h1>Connect your AI key to get started.</h1>
      <p>JobMatch AI uses your own Anthropic API key to analyze your resume. It stays in this browser tab, is sent only with your analysis request, and is never stored on the server.</p>
      <div className="card form keygate">
        <label htmlFor="key">Anthropic API key</label>
        <input id="key" type="password" autoComplete="off" spellCheck="false" placeholder="sk-ant-..."
          value={val} onChange={(e) => { setVal(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && save()} />
        {err && <p className="error" role="alert">{err}</p>}
        <div className="row">
          <button className="btn big" onClick={save}>Save and continue</button>
          <button className="btn ghost" onClick={() => onDone("")}>Skip: use offline demo mode</button>
        </div>
        <p className="fine">Don't have a key? Create one at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">console.anthropic.com</a>. Demo mode uses simple keyword matching instead of AI.</p>
      </div>
    </section>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState(readKey());
  const [gate, setGate] = useState(!readKey());
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | done
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const [backendUp, setBackendUp] = useState(true);
  useEffect(() => {
    fetch("/api/health").then((r) => setBackendUp(r.ok)).catch(() => setBackendUp(false));
  }, []);

  useEffect(() => {
    if (state !== "loading") return;
    setStep(0);
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2500);
    return () => clearInterval(id);
  }, [state]);

  const pick = (f) => {
    setError("");
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) return setError("Please choose a PDF file.");
    if (f.size > MAX_MB * 1024 * 1024) return setError(`That file is over ${MAX_MB} MB. Upload a smaller PDF.`);
    setFile(f);
  };

  const loadSample = async () => {
    setError("");
    try {
      const blob = await (await fetch("/sample-resume.pdf")).blob();
      setFile(new File([blob], "sample-resume.pdf", { type: "application/pdf" }));
      setJd(SAMPLE_JD);
    } catch { setError("Couldn't load the sample. Check your connection and try again."); }
  };

  const analyze = async () => {
    setError("");
    if (!file) return setError("Upload your resume as a PDF first.");
    if (!jd.trim()) return setError("Paste a job description to compare against.");
    if (jd.trim().length < MIN_JD) return setError(`The job description is short. Paste at least ${MIN_JD} characters.`);
    setState("loading");
    try {
      const body = new FormData();
      body.append("resume", file);
      body.append("job_description", jd);
      const res = await fetch("/api/analyze", { method: "POST", body, headers: apiKey ? { "X-API-Key": apiKey } : {} });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.detail) throw new Error(typeof data.detail === "string" ? data.detail : "Please check your inputs and try again.");
        throw new Error("The backend isn't responding properly. Make sure it is running (uvicorn main:app --port 8000) and check its terminal for errors.");
      }
      setResult(data);
      setState("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setState("idle");
      if (/rejected/.test(e.message)) setError(e.message + " Use Change key at the top to update it.");
      else setError(e instanceof TypeError ? "Can't reach the server. Make sure the backend is running on port 8000." : e.message);
    }
  };

  const changeKey = () => { try { sessionStorage.removeItem(KEY_STORE); } catch { /* ignore */ } setApiKey(""); setGate(true); setState("idle"); setResult(null); };
  const reset = () => { setState("idle"); setResult(null); setError(""); };

  return (
    <>
      <header className="top">
        <div className="brand"><span className="logo" aria-hidden>✓</span> JobMatch AI</div>
        {!gate && <button className="btn ghost small" onClick={changeKey}>{apiKey ? "AI mode on · Change key" : "Demo mode · Add key"}</button>}
      </header>
      <main>
        {!backendUp && <p className="error" role="alert">Backend not reachable. Start it in another terminal: <code>cd backend</code> then <code>uvicorn main:app --reload --port 8000</code>, then refresh this page.</p>}
        {gate ? (
          <KeyGate onDone={(k) => { setApiKey(k); setGate(false); }} />
        ) : state === "done" && result ? (
          <Results r={result} onReset={reset} fileName={file?.name} />
        ) : (
          <>
            <section className="hero">
              <h1>Understand your resume. Match the opportunity. Improve your chances.</h1>
              <p>Upload your PDF resume, paste a job description, and get a clear score, the skills you're missing, and a plan to close the gap.</p>
            </section>

            <section className="card form" aria-busy={state === "loading"}>
              <div className="field">
                <label id="rl">1. Your resume (PDF, up to {MAX_MB} MB)</label>
                <div className={`drop ${drag ? "over" : ""} ${file ? "has" : ""}`} role="button" tabIndex={0}
                  aria-labelledby="rl" onClick={() => inputRef.current?.click()}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                  onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}>
                  <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => pick(e.target.files[0])} />
                  {file ? <><b>{file.name}</b><small>{(file.size / 1024).toFixed(0)} KB · click to replace</small></>
                        : <><b>Drop your resume here</b><small>or click to browse</small></>}
                </div>
              </div>

              <div className="field">
                <label htmlFor="jd">2. Job description</label>
                <textarea id="jd" rows={9} maxLength={MAX_JD} value={jd} onChange={(e) => setJd(e.target.value)}
                  placeholder={"Paste the full job posting here, for example:\n\nData Analyst Intern\nResponsibilities: build dashboards, write SQL...\nRequirements: Python, SQL, Power BI, communication..."} />
                <div className="count"><span>{jd.length < MIN_JD && jd.length > 0 ? `Add ${MIN_JD - jd.length} more characters` : ""}</span><span>{jd.length}/{MAX_JD}</span></div>
              </div>

              {error && <p className="error" role="alert">{error}</p>}
              <div className="row">
                <button className="btn big" onClick={analyze} disabled={state === "loading"}>
                  {state === "loading" ? "Analyzing…" : "Analyze My Match"}
                </button>
                <button className="btn ghost" onClick={loadSample} disabled={state === "loading"}>Try with sample data</button>
              </div>
              {state === "loading" && (
                <ol className="steps" aria-live="polite">
                  {STEPS.map((s, i) => <li key={s} className={i < step ? "done" : i === step ? "now" : ""}>{s}</li>)}
                </ol>
              )}
            </section>
            <p className="fine center">Your resume is processed for this analysis only and is not stored.</p>
          </>
        )}
      </main>
      <footer className="foot">Made by Deepti Sanjay Shah</footer>
    </>
  );
}

# PRD — JobMatch AI

## Problem
Students and fresh graduates apply without knowing how well their resume fits a job, which skills are missing, or which ATS keywords matter.

## Users
College students, fresh graduates, internship applicants (tech, data, AI/ML, software, business).

## User story
As a student, I upload my resume and paste a job description so I can see my strengths, gaps and next steps before applying.

## Requirements
| ID | Requirement | Acceptance criteria |
|----|-------------|--------------------|
| R1 | Upload PDF | Rejects non-PDF and >5 MB; shows filename; clear error if no text |
| R2 | Job description | Textarea, counter, 8000 max, 150 min, helpful placeholder |
| R3 | Analysis | Returns validated JSON with all sections |
| R4 | Dashboard | Score ring, two-column match/improve, ATS chips, suggestion cards, roadmap, summary |
| R5 | States | Loading steps, error banners, empty states |
| R6 | Honesty | Score labelled estimate; no fake-skill advice; uncertainty note |
| R7 | Privacy | No storage, no resume logging, key only on server |
| R8 | Demo | Sample data button; offline mode when no key |
| R10 | API key | Site asks for the user's key at start; can skip to demo mode; key kept in sessionStorage only |
| R9 | Export | Copy, download .md, print |

## Success metrics (hackathon)
Full demo in under 3 minutes without code edits; all sections populate; errors never show stack traces.

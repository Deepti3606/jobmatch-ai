from typing import List, Literal
from pydantic import BaseModel, Field


class Suggestion(BaseModel):
    title: str
    detail: str
    example: str = ""


class Learning(BaseModel):
    skill: str
    priority: Literal["High", "Medium", "Low"]
    why: str


class Analysis(BaseModel):
    match_score: int = Field(ge=0, le=100)
    summary: str
    matching_skills: List[str]
    relevant_experience: List[str] = []
    missing_skills: List[str]
    ats_keywords: List[str]
    experience_match: List[str]
    qualification_gaps: List[str] = []
    resume_suggestions: List[Suggestion]
    learning_recommendations: List[Learning]
    uncertainty_note: str = ""

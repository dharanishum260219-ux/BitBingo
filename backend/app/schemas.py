from datetime import datetime

from pydantic import BaseModel, Field


class QuestionInput(BaseModel):
    prompt: str
    description: str = ""
    category: str = "General"
    difficulty: str = "Medium"
    marks: int = Field(default=1, ge=1)


class CreateSessionRequest(BaseModel):
    name: str
    durationMinutes: int = Field(default=45, ge=1)
    questions: list[QuestionInput]
    teamNames: list[str]


class AddTeamRequest(BaseModel):
    name: str
    station: str | None = None


class AddTimeRequest(BaseModel):
    minutes: int = Field(ge=1)


class ScoreRequest(BaseModel):
    teamId: str
    questionId: str


class SessionSummary(BaseModel):
    id: str
    name: str
    status: str
    durationMinutes: int
    startedAt: datetime
    endsAt: datetime
    endedAt: datetime | None


class TeamOut(BaseModel):
    id: str
    sessionId: str
    name: str
    station: str | None
    score: int
    status: str


class QuestionOut(BaseModel):
    id: str
    sessionId: str
    prompt: str
    description: str
    category: str
    difficulty: str
    marks: int


class ScorePoint(BaseModel):
    step: int
    score: int


class WinnerSeries(BaseModel):
    teamId: str
    teamName: str
    points: list[ScorePoint]


class WinnerOut(BaseModel):
    rank: int
    teamId: str
    name: str
    score: int


class WinnersResponse(BaseModel):
    winners: list[WinnerOut]
    series: list[WinnerSeries]

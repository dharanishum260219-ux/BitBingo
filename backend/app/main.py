from datetime import timedelta
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .db import Base, engine, get_db
from .models import QuestionModel, ScoreEventModel, SessionModel, TeamModel
from .schemas import (
    AddTeamRequest,
    AddTimeRequest,
    CreateSessionRequest,
    QuestionInput,
    QuestionOut,
    ScoreRequest,
    SessionSummary,
    TeamOut,
    WinnersResponse,
)
from .services import create_session_with_content, maybe_end_expired_sessions, now_utc, session_winners

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def to_session_out(model: SessionModel) -> SessionSummary:
    return SessionSummary(
        id=model.id,
        name=model.name,
        status=model.status,
        durationMinutes=model.duration_minutes,
        startedAt=model.started_at,
        endsAt=model.ends_at,
        endedAt=model.ended_at,
    )


def to_team_out(model: TeamModel) -> TeamOut:
    return TeamOut(
        id=model.id,
        sessionId=model.session_id,
        name=model.name,
        station=model.station,
        score=model.score,
        status=model.status,
    )


def to_question_out(model: QuestionModel) -> QuestionOut:
    return QuestionOut(
        id=model.id,
        sessionId=model.session_id,
        prompt=model.prompt,
        description=model.description,
        category=model.category,
        difficulty=model.difficulty,
        marks=model.marks,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/sessions", response_model=list[SessionSummary])
def list_sessions(db: Session = Depends(get_db)) -> list[SessionSummary]:
    maybe_end_expired_sessions(db)
    sessions = db.scalars(select(SessionModel).order_by(SessionModel.created_at.desc())).all()
    return [to_session_out(s) for s in sessions]


@app.get("/sessions/active", response_model=SessionSummary | None)
def active_session(db: Session = Depends(get_db)) -> SessionSummary | None:
    maybe_end_expired_sessions(db)
    active = db.scalar(select(SessionModel).where(SessionModel.status == "Active"))
    return to_session_out(active) if active else None


@app.post("/sessions", response_model=SessionSummary)
def create_session(payload: CreateSessionRequest, db: Session = Depends(get_db)) -> SessionSummary:
    model = create_session_with_content(
        db,
        name=payload.name,
        duration_minutes=payload.durationMinutes,
        questions=[question.model_dump() for question in payload.questions],
        team_names=payload.teamNames,
    )
    return to_session_out(model)


@app.post("/sessions/{session_id}/time", response_model=SessionSummary)
def add_session_time(session_id: str, payload: AddTimeRequest, db: Session = Depends(get_db)) -> SessionSummary:
    maybe_end_expired_sessions(db)
    session = db.get(SessionModel, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.ends_at = session.ends_at + timedelta(minutes=payload.minutes)
    session.duration_minutes += payload.minutes
    db.commit()
    db.refresh(session)
    return to_session_out(session)


@app.post("/sessions/{session_id}/stop", response_model=SessionSummary)
def stop_session(session_id: str, db: Session = Depends(get_db)) -> SessionSummary:
    session = db.get(SessionModel, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "Stopped"
    session.ended_at = now_utc()
    db.commit()
    db.refresh(session)
    return to_session_out(session)


@app.get("/sessions/{session_id}/teams", response_model=list[TeamOut])
def list_teams(session_id: str, db: Session = Depends(get_db)) -> list[TeamOut]:
    teams = db.scalars(select(TeamModel).where(TeamModel.session_id == session_id).order_by(TeamModel.created_at.asc())).all()
    return [to_team_out(t) for t in teams]


@app.post("/sessions/{session_id}/teams", response_model=TeamOut)
def add_team(session_id: str, payload: AddTeamRequest, db: Session = Depends(get_db)) -> TeamOut:
    session = db.get(SessionModel, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    existing = db.scalar(
        select(TeamModel).where(
            TeamModel.session_id == session_id,
            TeamModel.name.ilike(payload.name.strip()),
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="Team already exists for session")

    model = TeamModel(
        id=f"{session_id}-t-{uuid4().hex[:8]}",
        session_id=session_id,
        name=payload.name.strip(),
        station=payload.station,
        score=0,
        status="Active",
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return to_team_out(model)


@app.get("/sessions/{session_id}/questions", response_model=list[QuestionOut])
def list_questions(session_id: str, db: Session = Depends(get_db)) -> list[QuestionOut]:
    questions = db.scalars(select(QuestionModel).where(QuestionModel.session_id == session_id).order_by(QuestionModel.created_at.asc())).all()
    return [to_question_out(q) for q in questions]


@app.post("/sessions/{session_id}/questions", response_model=QuestionOut)
def add_question(session_id: str, payload: QuestionInput, db: Session = Depends(get_db)) -> QuestionOut:
    session = db.get(SessionModel, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    model = QuestionModel(
        id=f"{session_id}-q-{uuid4().hex[:8]}",
        session_id=session_id,
        prompt=payload.prompt.strip(),
        description=payload.description.strip(),
        category=payload.category.strip() or "General",
        difficulty=payload.difficulty.strip() or "Medium",
        marks=max(1, payload.marks),
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return to_question_out(model)


@app.post("/sessions/{session_id}/score", response_model=TeamOut)
def score_completion(session_id: str, payload: ScoreRequest, db: Session = Depends(get_db)) -> TeamOut:
    maybe_end_expired_sessions(db)

    session = db.get(SessionModel, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "Active":
        raise HTTPException(status_code=400, detail="Session is not active")

    team = db.get(TeamModel, payload.teamId)
    question = db.get(QuestionModel, payload.questionId)
    if not team or team.session_id != session_id:
        raise HTTPException(status_code=404, detail="Team not found in this session")
    if not question or question.session_id != session_id:
        raise HTTPException(status_code=404, detail="Question not found in this session")

    already = db.scalar(
        select(ScoreEventModel).where(
            ScoreEventModel.session_id == session_id,
            ScoreEventModel.team_id == team.id,
            ScoreEventModel.question_id == question.id,
        )
    )
    if already:
        raise HTTPException(status_code=400, detail="This question is already completed by team")

    team.score += question.marks
    event = ScoreEventModel(
        id=f"ev-{uuid4().hex[:12]}",
        session_id=session_id,
        team_id=team.id,
        question_id=question.id,
        points_delta=question.marks,
        score_after=team.score,
    )
    db.add(event)
    db.commit()
    db.refresh(team)
    return to_team_out(team)


@app.get("/sessions/{session_id}/winners", response_model=WinnersResponse)
def winners(session_id: str, db: Session = Depends(get_db)) -> WinnersResponse:
    winners_data, series_data = session_winners(db, session_id)
    return WinnersResponse(winners=winners_data, series=series_data)

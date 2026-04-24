from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import QuestionModel, ScoreEventModel, SessionModel, TeamModel


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def maybe_end_expired_sessions(db: Session) -> None:
    current = now_utc()
    active = db.scalars(select(SessionModel).where(SessionModel.status == "Active")).all()
    changed = False
    for session in active:
        if session.ends_at <= current:
            session.status = "Stopped"
            session.ended_at = current
            changed = True
    if changed:
        db.commit()


def create_session_with_content(
    db: Session,
    *,
    name: str,
    duration_minutes: int,
    questions: list[dict],
    team_names: list[str],
) -> SessionModel:
    maybe_end_expired_sessions(db)

    for active in db.scalars(select(SessionModel).where(SessionModel.status == "Active")):
        active.status = "Stopped"
        active.ended_at = now_utc()

    session_id = f"s-{uuid4().hex[:10]}"
    started = now_utc()
    new_session = SessionModel(
        id=session_id,
        name=name.strip(),
        status="Active",
        duration_minutes=duration_minutes,
        started_at=started,
        ends_at=started + timedelta(minutes=duration_minutes),
    )
    db.add(new_session)

    unique_team_names = []
    seen = set()
    for value in team_names:
        key = value.strip().lower()
        if key and key not in seen:
            seen.add(key)
            unique_team_names.append(value.strip())

    for index, team_name in enumerate(unique_team_names, start=1):
        db.add(
            TeamModel(
                id=f"{session_id}-t-{index}",
                session_id=session_id,
                name=team_name,
                score=0,
                status="Active",
            )
        )

    for index, question in enumerate(questions, start=1):
        prompt = question.get("prompt", "").strip()
        if not prompt:
            continue
        db.add(
            QuestionModel(
                id=f"{session_id}-q-{index}",
                session_id=session_id,
                prompt=prompt,
                description=question.get("description", "").strip(),
                category=(question.get("category", "General") or "General").strip(),
                difficulty=(question.get("difficulty", "Medium") or "Medium").strip(),
                marks=max(1, int(question.get("marks", 1))),
            )
        )

    db.commit()
    return db.get(SessionModel, session_id)


def session_winners(db: Session, session_id: str) -> tuple[list[dict], list[dict]]:
    teams = db.scalars(select(TeamModel).where(TeamModel.session_id == session_id)).all()
    ranked = sorted(teams, key=lambda t: t.score, reverse=True)[:3]

    winners = [
        {
            "rank": index + 1,
            "teamId": team.id,
            "name": team.name,
            "score": team.score,
        }
        for index, team in enumerate(ranked)
    ]

    events = db.scalars(
        select(ScoreEventModel)
        .where(ScoreEventModel.session_id == session_id)
        .order_by(ScoreEventModel.created_at.asc())
    ).all()

    winner_ids = {winner["teamId"] for winner in winners}
    series = []
    for winner in winners:
        team_events = [event for event in events if event.team_id == winner["teamId"]]
        points = [{"step": 0, "score": 0}]
        for idx, event in enumerate(team_events, start=1):
            points.append({"step": idx, "score": event.score_after})
        if points[-1]["score"] != winner["score"]:
            points.append({"step": len(points), "score": winner["score"]})

        series.append(
            {
                "teamId": winner["teamId"],
                "teamName": winner["name"],
                "points": points,
            }
        )

    return winners, series

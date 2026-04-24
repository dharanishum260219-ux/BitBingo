"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react"

export interface Team {
  id: string
  sessionId: string
  name: string
  station?: string
  score: number
  status: "Active" | "Disqualified"
}

export interface SessionQuestion {
  id: string
  prompt: string
  description: string
  category: string
  difficulty: string
  marks: number
}

export interface Session {
  id: string
  name: string
  status: "Active" | "Stopped"
  startedAt: Date
  endsAt: Date
  durationMinutes: number
  questions: SessionQuestion[]
  endedAt?: Date
}

export interface CreateSessionInput {
  name: string
  durationMinutes: number
  questions: Array<{
    prompt: string
    description?: string
    category?: string
    difficulty?: string
    marks?: number
  }>
  teamNames: string[]
}

export interface ScoreEvent {
  id: string
  sessionId: string
  teamId: string
  teamName: string
  score: number
  timestamp: number
}

export interface Winner {
  rank: 1 | 2 | 3
  teamId: string
  name: string
  score: number
}

export interface WinnerSeriesPoint {
  step: number
  score: number
}

export interface WinnerSeries {
  teamId: string
  teamName: string
  points: WinnerSeriesPoint[]
}

interface ArenaContextValue {
  teams: Team[]
  sessions: Session[]
  activeSession: Session | null
  remainingTimeMs: number
  isSessionExpired: boolean
  winnersVisible: boolean
  winners: Winner[]
  winnerSeries: WinnerSeries[]
  getTeamsBySession: (sessionId: string) => Team[]
  addTeamToSession: (sessionId: string, name: string, station?: string) => boolean
  addQuestionToSession: (
    sessionId: string,
    question: {
      prompt: string
      description?: string
      category?: string
      difficulty?: string
      marks?: number
    }
  ) => boolean
  registerTeam: (name: string, station?: string) => boolean
  deleteTeam: (id: string) => void
  awardPoint: (id: string, points?: number) => boolean
  createSession: (input: CreateSessionInput) => void
  addSessionTime: (minutes: number) => void
  stopSession: (id: string) => void
  dismissWinners: () => void
}

const ArenaContext = createContext<ArenaContextValue | null>(null)

const INITIAL_TEAMS: Team[] = [
  { id: "1", sessionId: "s1", name: "hinata", score: 1, status: "Active" },
  { id: "2", sessionId: "s1", name: "kakashi", score: 0, status: "Active" },
  { id: "3", sessionId: "s1", name: "naruto", score: 1, status: "Active" },
  { id: "4", sessionId: "s1", name: "sakura", score: 0, status: "Active" },
  { id: "5", sessionId: "s1", name: "sasuke", score: 0, status: "Active" },
]

const initialStart = new Date()
const INITIAL_SESSIONS: Session[] = [
  {
    id: "s1",
    name: "bit",
    status: "Active",
    startedAt: initialStart,
    endsAt: new Date(initialStart.getTime() + 45 * 60 * 1000),
    durationMinutes: 45,
    questions: [
      {
        id: "q1",
        prompt: "Slay Dragon",
        description: "Defeat a dragon-themed coding boss challenge.",
        category: "Algorithm",
        difficulty: "Hard",
        marks: 20,
      },
      {
        id: "q2",
        prompt: "Find Relic",
        description: "Locate and solve a hidden optimization puzzle.",
        category: "Optimization",
        difficulty: "Medium",
        marks: 15,
      },
      {
        id: "q3",
        prompt: "Decode Runes",
        description: "Decode text patterns and transformation logic.",
        category: "Strings",
        difficulty: "Easy",
        marks: 10,
      },
    ],
  },
]

export function ArenaProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS)
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS)
  const [scoreEvents, setScoreEvents] = useState<ScoreEvent[]>([])
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [winnersVisible, setWinnersVisible] = useState(false)
  const [lastEndedSessionId, setLastEndedSessionId] = useState<string | null>(null)

  const activeSession = useMemo(
    () => sessions.find((s) => s.status === "Active") ?? null,
    [sessions]
  )

  useEffect(() => {
    const id = window.setInterval(() => {
      const currentNow = Date.now()
      setNowMs(currentNow)
      setSessions((prev) => {
        const active = prev.find((session) => session.status === "Active")
        if (!active || currentNow < active.endsAt.getTime()) {
          return prev
        }

        setLastEndedSessionId(active.id)
        setWinnersVisible(true)

        return prev.map((session) =>
          session.id === active.id
            ? {
                ...session,
                status: "Stopped",
                endedAt: session.endedAt ?? new Date(currentNow),
              }
            : session
        )
      })
    }, 1000)

    return () => window.clearInterval(id)
  }, [])

  const remainingTimeMs = useMemo(() => {
    if (!activeSession) return 0
    return Math.max(activeSession.endsAt.getTime() - nowMs, 0)
  }, [activeSession, nowMs])

  const isSessionExpired = Boolean(activeSession) && remainingTimeMs <= 0

  const stopSessionInternal = useCallback((id: string, showWinners: boolean) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "Stopped",
              endedAt: s.endedAt ?? new Date(),
            }
          : s
      )
    )
    setLastEndedSessionId(id)
    if (showWinners) {
      setWinnersVisible(true)
    }
  }, [])

  const winners = useMemo<Winner[]>(() => {
    if (!lastEndedSessionId) return []
    const ranked = teams
      .filter((team) => team.sessionId === lastEndedSessionId)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    return ranked.map((team, index) => ({
      rank: (index + 1) as 1 | 2 | 3,
      teamId: team.id,
      name: team.name,
      score: team.score,
    }))
  }, [lastEndedSessionId, teams])

  const winnerSeries = useMemo<WinnerSeries[]>(() => {
    if (!lastEndedSessionId || winners.length === 0) return []

    const winnersById = new Set(winners.map((winner) => winner.teamId))
    const events = scoreEvents
      .filter((event) => event.sessionId === lastEndedSessionId && winnersById.has(event.teamId))
      .sort((a, b) => a.timestamp - b.timestamp)

    return winners.map((winner) => {
      const teamEvents = events.filter((event) => event.teamId === winner.teamId)
      const points: WinnerSeriesPoint[] = [{ step: 0, score: 0 }]

      teamEvents.forEach((event, index) => {
        points.push({ step: index + 1, score: event.score })
      })

      if (points[points.length - 1]?.score !== winner.score) {
        points.push({ step: points.length, score: winner.score })
      }

      return {
        teamId: winner.teamId,
        teamName: winner.name,
        points,
      }
    })
  }, [lastEndedSessionId, scoreEvents, winners])

  const addTeamToSession = useCallback((sessionId: string, name: string, station?: string) => {
    const trimmed = name.trim()
    if (!trimmed) return false

    const sessionExists = sessions.some((session) => session.id === sessionId)
    if (!sessionExists) return false

    const duplicate = teams.some(
      (team) =>
        team.sessionId === sessionId &&
        team.name.toLowerCase() === trimmed.toLowerCase()
    )

    if (duplicate) return false

    setTeams((prev) => [
      ...prev,
      {
        id: `${sessionId}-${Date.now()}`,
        sessionId,
        name: trimmed,
        station,
        score: 0,
        status: "Active",
      },
    ])

    return true
  }, [sessions, teams])

  const registerTeam = useCallback((name: string, station?: string) => {
    const trimmed = name.trim()
    if (!trimmed || !activeSession) return false

    return addTeamToSession(activeSession.id, trimmed, station)
  }, [activeSession, addTeamToSession])

  const addQuestionToSession = useCallback((
    sessionId: string,
    question: {
      prompt: string
      description?: string
      category?: string
      difficulty?: string
      marks?: number
    }
  ) => {
    const prompt = question.prompt.trim()
    if (!prompt) return false

    let added = false
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) {
          return session
        }

        const duplicate = session.questions.some(
          (existing) => existing.prompt.toLowerCase() === prompt.toLowerCase()
        )
        if (duplicate) {
          return session
        }

        added = true
        return {
          ...session,
          questions: [
            ...session.questions,
            {
              id: `${sessionId}-q-${session.questions.length + 1}`,
              prompt,
              description: (question.description ?? "").trim(),
              category: (question.category ?? "General").trim() || "General",
              difficulty: (question.difficulty ?? "Medium").trim() || "Medium",
              marks: Math.max(1, Math.floor(question.marks ?? 1)),
            },
          ],
        }
      })
    )

    return added
  }, [])

  const deleteTeam = useCallback((id: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const awardPoint = useCallback((id: string, points = 1) => {
    if (!activeSession || nowMs >= activeSession.endsAt.getTime()) {
      return false
    }

    const normalizedPoints = Math.max(1, Math.floor(points))

    let awarded = false
    setTeams((prev) =>
      prev.map((team) => {
        if (team.id !== id || team.sessionId !== activeSession.id) {
          return team
        }

        awarded = true
        const nextScore = team.score + normalizedPoints
        setScoreEvents((prevEvents) => [
          ...prevEvents,
          {
            id: `${Date.now()}-${Math.random()}`,
            sessionId: activeSession.id,
            teamId: team.id,
            teamName: team.name,
            score: nextScore,
            timestamp: Date.now(),
          },
        ])
        return { ...team, score: nextScore }
      })
    )

    return awarded
  }, [activeSession, nowMs])

  const createSession = useCallback((input: CreateSessionInput) => {
    const trimmed = input.name.trim()
    const durationMinutes = Math.max(1, Math.floor(input.durationMinutes || 0))

    if (!trimmed) return

    const startedAt = new Date()
    const endsAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000)
    const sessionId = Date.now().toString()

    const questions = input.questions
      .map((question) => ({
        prompt: question.prompt.trim(),
        description: (question.description ?? "").trim(),
        category: (question.category ?? "General").trim(),
        difficulty: (question.difficulty ?? "Medium").trim(),
        marks: Math.max(1, Math.floor(question.marks ?? 1)),
      }))
      .filter((question) => Boolean(question.prompt))
      .map((question, index) => ({
        id: `${sessionId}-q-${index + 1}`,
        prompt: question.prompt,
        description: question.description,
        category: question.category || "General",
        difficulty: question.difficulty || "Medium",
        marks: question.marks,
      }))

    const uniqueTeams = Array.from(
      new Set(input.teamNames.map((name) => name.trim()).filter(Boolean))
    )

    setSessions((prev) =>
      prev.map((s) =>
        s.status === "Active"
          ? {
              ...s,
              status: "Stopped",
              endedAt: s.endedAt ?? new Date(),
            }
          : s
      )
    )

    setSessions((prev) => [
      ...prev,
      {
        id: sessionId,
        name: trimmed,
        status: "Active",
        startedAt,
        endsAt,
        durationMinutes,
        questions,
      },
    ])

    setTeams((prev) => [
      ...prev,
      ...uniqueTeams.map((name, index) => ({
        id: `${sessionId}-t-${index + 1}`,
        sessionId,
        name,
        score: 0,
        status: "Active" as const,
      })),
    ])

    setScoreEvents([])
    setWinnersVisible(false)
    setLastEndedSessionId(null)
  }, [])

  const addSessionTime = useCallback((minutes: number) => {
    if (!activeSession) return

    const extraMinutes = Math.max(1, Math.floor(minutes))
    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSession.id
          ? {
              ...session,
              durationMinutes: session.durationMinutes + extraMinutes,
              endsAt: new Date(session.endsAt.getTime() + extraMinutes * 60 * 1000),
            }
          : session
      )
    )
  }, [activeSession])

  const stopSession = useCallback((id: string) => {
    stopSessionInternal(id, false)
  }, [stopSessionInternal])

  const dismissWinners = useCallback(() => {
    setWinnersVisible(false)
  }, [])

  const scopedTeams = useMemo(() => {
    if (!activeSession) return []
    return teams.filter((team) => team.sessionId === activeSession.id)
  }, [activeSession, teams])

  const getTeamsBySession = useCallback((sessionId: string) => {
    return teams.filter((team) => team.sessionId === sessionId)
  }, [teams])

  return (
    <ArenaContext.Provider
      value={{
        teams: scopedTeams,
        sessions,
        activeSession,
        remainingTimeMs,
        isSessionExpired,
        winnersVisible,
        winners,
        winnerSeries,
        getTeamsBySession,
        addTeamToSession,
        addQuestionToSession,
        registerTeam,
        deleteTeam,
        awardPoint,
        createSession,
        addSessionTime,
        stopSession,
        dismissWinners,
      }}
    >
      {children}
    </ArenaContext.Provider>
  )
}

export function useArena() {
  const ctx = useContext(ArenaContext)
  if (!ctx) throw new Error("useArena must be used within ArenaProvider")
  return ctx
}

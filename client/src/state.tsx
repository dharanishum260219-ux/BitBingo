import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  addQuestion,
  addSessionTime,
  addTeam,
  createSession,
  getActiveSession,
  listQuestions,
  listSessions,
  listTeams,
  scoreCompletion,
  stopSession,
  winners,
  type Question,
  type SessionSummary,
  type Team,
  type Winner,
  type WinnerSeries,
} from "./api"

type ArenaContextValue = {
  sessions: SessionSummary[]
  activeSession: SessionSummary | null
  teams: Team[]
  questions: Question[]
  remainingTimeMs: number
  winnersVisible: boolean
  winnersData: Winner[]
  winnerSeries: WinnerSeries[]
  createFullSession: (payload: {
    name: string
    durationMinutes: number
    questions: Array<{ prompt: string; description: string; category: string; difficulty: string; marks: number }>
    teamNames: string[]
  }) => Promise<void>
  addTeamToSession: (sessionId: string, name: string, station?: string) => Promise<void>
  addQuestionToSession: (
    sessionId: string,
    question: { prompt: string; description: string; category: string; difficulty: string; marks: number }
  ) => Promise<void>
  awardCompletion: (teamId: string, questionId: string) => Promise<void>
  addTime: (minutes: number) => Promise<void>
  stopActive: () => Promise<void>
  refreshSessionData: (sessionId?: string) => Promise<void>
  dismissWinners: () => void
}

const ArenaContext = createContext<ArenaContextValue | null>(null)

export function ArenaProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [activeSession, setActiveSession] = useState<SessionSummary | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [remainingTimeMs, setRemainingTimeMs] = useState(0)
  const [winnersVisible, setWinnersVisible] = useState(false)
  const [winnersData, setWinnersData] = useState<Winner[]>([])
  const [winnerSeries, setWinnerSeries] = useState<WinnerSeries[]>([])
  const lastActiveId = useRef<string | null>(null)

  const refreshSessionData = useCallback(async (sessionId?: string) => {
    const [allSessions, active] = await Promise.all([listSessions(), getActiveSession()])
    setSessions(allSessions)
    setActiveSession(active)

    const targetSessionId = sessionId ?? active?.id
    if (!targetSessionId) {
      setTeams([])
      setQuestions([])
      return
    }

    const [teamRows, questionRows] = await Promise.all([
      listTeams(targetSessionId),
      listQuestions(targetSessionId),
    ])
    setTeams(teamRows)
    setQuestions(questionRows)
  }, [])

  const fetchWinners = useCallback(async (sessionId: string) => {
    const payload = await winners(sessionId)
    setWinnersData(payload.winners)
    setWinnerSeries(payload.series)
    setWinnersVisible(payload.winners.length > 0)
  }, [])

  useEffect(() => {
    void refreshSessionData()
  }, [refreshSessionData])

  useEffect(() => {
    const id = window.setInterval(() => {
      void refreshSessionData()
    }, 2000)
    return () => window.clearInterval(id)
  }, [refreshSessionData])

  useEffect(() => {
    const now = Date.now()
    if (!activeSession) {
      setRemainingTimeMs(0)
      return
    }
    setRemainingTimeMs(Math.max(new Date(activeSession.endsAt).getTime() - now, 0))
  }, [activeSession])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!activeSession) {
        setRemainingTimeMs(0)
        return
      }
      setRemainingTimeMs(Math.max(new Date(activeSession.endsAt).getTime() - Date.now(), 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [activeSession])

  useEffect(() => {
    if (activeSession?.id) {
      lastActiveId.current = activeSession.id
      return
    }

    const stopped = sessions.find((item) => item.status === "Stopped")
    if (lastActiveId.current && stopped?.id === lastActiveId.current) {
      void fetchWinners(stopped.id)
      lastActiveId.current = null
    }
  }, [activeSession, sessions, fetchWinners])

  const createFullSession = useCallback(async (payload: {
    name: string
    durationMinutes: number
    questions: Array<{ prompt: string; description: string; category: string; difficulty: string; marks: number }>
    teamNames: string[]
  }) => {
    setWinnersVisible(false)
    await createSession(payload)
    await refreshSessionData()
  }, [refreshSessionData])

  const addTeamToSession = useCallback(async (sessionId: string, name: string, station?: string) => {
    await addTeam(sessionId, { name, station })
    await refreshSessionData(sessionId)
  }, [refreshSessionData])

  const addQuestionToSession = useCallback(async (
    sessionId: string,
    question: { prompt: string; description: string; category: string; difficulty: string; marks: number }
  ) => {
    await addQuestion(sessionId, question)
    await refreshSessionData(sessionId)
  }, [refreshSessionData])

  const awardCompletion = useCallback(async (teamId: string, questionId: string) => {
    if (!activeSession) return
    await scoreCompletion(activeSession.id, teamId, questionId)
    await refreshSessionData(activeSession.id)
  }, [activeSession, refreshSessionData])

  const addTime = useCallback(async (minutes: number) => {
    if (!activeSession) return
    await addSessionTime(activeSession.id, minutes)
    await refreshSessionData(activeSession.id)
  }, [activeSession, refreshSessionData])

  const stopActive = useCallback(async () => {
    if (!activeSession) return
    await stopSession(activeSession.id)
    await refreshSessionData(activeSession.id)
    await fetchWinners(activeSession.id)
  }, [activeSession, fetchWinners, refreshSessionData])

  const dismissWinners = useCallback(() => setWinnersVisible(false), [])

  const value = useMemo(
    () => ({
      sessions,
      activeSession,
      teams,
      questions,
      remainingTimeMs,
      winnersVisible,
      winnersData,
      winnerSeries,
      createFullSession,
      addTeamToSession,
      addQuestionToSession,
      awardCompletion,
      addTime,
      stopActive,
      refreshSessionData,
      dismissWinners,
    }),
    [
      sessions,
      activeSession,
      teams,
      questions,
      remainingTimeMs,
      winnersVisible,
      winnersData,
      winnerSeries,
      createFullSession,
      addTeamToSession,
      addQuestionToSession,
      awardCompletion,
      addTime,
      stopActive,
      refreshSessionData,
      dismissWinners,
    ]
  )

  return <ArenaContext.Provider value={value}>{children}</ArenaContext.Provider>
}

export function useArena() {
  const context = useContext(ArenaContext)
  if (!context) {
    throw new Error("useArena must be used inside ArenaProvider")
  }
  return context
}

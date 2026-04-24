"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import type { ArenaChallenge, ArenaCompletion, ArenaSession, ArenaSnapshot, ArenaTeam } from "@/lib/arena-types"

interface ArenaContextValue {
  teams: ArenaTeam[]
  sessions: ArenaSession[]
  activeSession: ArenaSession | null
  selectedSessionId: string | null
  challenges: ArenaChallenge[]
  completions: ArenaCompletion[]
  isLoading: boolean
  selectSession: (sessionId: string) => void
  refreshArena: (sessionId?: string | null) => Promise<void>
  registerTeam: (name: string, sessionId?: string) => Promise<void>
  deleteTeam: (id: string) => Promise<void>
  awardPoint: (id: string, sessionId?: string) => Promise<void>
  createSession: (input: {
    name: string
    durationMinutes: number
    challengeIds?: number[]
    teamNames?: string[]
    questionRows?: Array<{ title: string; description: string; difficulty: string; points?: number | null }>
  }) => Promise<void>
  stopSession: (id: string) => Promise<void>
  logCompletion: (input: { participantId: string; challengeId: number; proofUrl: string | null; sessionId?: string }) => Promise<void>
}

const ArenaContext = createContext<ArenaContextValue | null>(null)

const EMPTY_SNAPSHOT: ArenaSnapshot = {
  teams: [],
  sessions: [],
  activeSession: null,
  challenges: [],
  completions: [],
  selectedSessionId: null,
}

export function ArenaProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<ArenaSnapshot>(EMPTY_SNAPSHOT)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshArena = useCallback(async (sessionId?: string | null) => {
    setIsLoading(true)
    const scopedSessionId = sessionId ?? selectedSessionId

    setSnapshot(EMPTY_SNAPSHOT)

    try {
      const search = new URLSearchParams()
      if (scopedSessionId) {
        search.set("session_id", scopedSessionId)
      }

      const response = await fetch(`/api/arena${search.size ? `?${search.toString()}` : ""}`, { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`Failed to load arena data: ${response.status}`)
      }

      const data = (await response.json()) as ArenaSnapshot
      setSnapshot(data)

      if (!selectedSessionId && data.selectedSessionId) {
        setSelectedSessionId(data.selectedSessionId)
      }
    } catch {
      setSnapshot(EMPTY_SNAPSHOT)
    } finally {
      setIsLoading(false)
    }
  }, [selectedSessionId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshArena()
  }, [refreshArena])

  useEffect(() => {
    if (selectedSessionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void refreshArena(selectedSessionId)
    }
  }, [refreshArena, selectedSessionId])

  const callMutation = useCallback(
    async (path: string, init: RequestInit) => {
      const response = await fetch(path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        if (errorText) {
          try {
            const parsed = JSON.parse(errorText) as { error?: string }
            throw new Error(parsed.error || errorText)
          } catch {
            throw new Error(errorText)
          }
        }
        throw new Error(`Request failed with ${response.status}`)
      }

      const data = (await response.json().catch(() => null)) as Record<string, unknown> | null
      await refreshArena()
      return data
    },
    [refreshArena],
  )

  const selectSession = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId)
    void refreshArena(sessionId)
  }, [refreshArena])

  const registerTeam = useCallback(
    async (name: string, sessionId?: string) => {
      const scopedSessionId = sessionId ?? selectedSessionId
      if (!scopedSessionId) {
        throw new Error("Session is required")
      }

      await callMutation("/api/arena/teams", {
        method: "POST",
        body: JSON.stringify({ name, sessionId: scopedSessionId }),
      })
    },
    [callMutation, selectedSessionId],
  )

  const deleteTeam = useCallback(
    async (id: string) => {
      await callMutation(`/api/arena/teams/${id}`, { method: "DELETE" })
    },
    [callMutation],
  )

  const awardPoint = useCallback(
    async (id: string, sessionId?: string) => {
      const scopedSessionId = sessionId ?? selectedSessionId
      if (!scopedSessionId) {
        throw new Error("Session is required")
      }

      await callMutation(`/api/arena/teams/${id}/score`, {
        method: "POST",
        body: JSON.stringify({ sessionId: scopedSessionId }),
      })
    },
    [callMutation, selectedSessionId],
  )

  const createSession = useCallback(
    async (input: {
      name: string
      durationMinutes: number
      challengeIds?: number[]
      teamNames?: string[]
      questionRows?: Array<{ title: string; description: string; difficulty: string; points?: number | null }>
    }) => {
      const result = await callMutation("/api/arena/sessions", {
        method: "POST",
        body: JSON.stringify(input),
      })

      const newSessionId = typeof result?.sessionId === "string" ? result.sessionId : null
      if (newSessionId) {
        setSelectedSessionId(newSessionId)
      }
    },
    [callMutation],
  )

  const stopSession = useCallback(
    async (id: string) => {
      await callMutation(`/api/arena/sessions/${id}`, { method: "PATCH" })
    },
    [callMutation],
  )

  const logCompletion = useCallback(
    async (input: { participantId: string; challengeId: number; proofUrl: string | null; sessionId?: string }) => {
      const scopedSessionId = input.sessionId ?? selectedSessionId
      if (!scopedSessionId) {
        throw new Error("Session is required")
      }

      await callMutation("/api/arena/completions", {
        method: "POST",
        body: JSON.stringify({ ...input, sessionId: scopedSessionId }),
      })
    },
    [callMutation, selectedSessionId],
  )

  const value = useMemo<ArenaContextValue>(
    () => ({
      teams: snapshot.teams,
      sessions: snapshot.sessions,
      activeSession: snapshot.activeSession,
      selectedSessionId,
      challenges: snapshot.challenges,
      completions: snapshot.completions,
      isLoading,
      selectSession,
      refreshArena,
      registerTeam,
      deleteTeam,
      awardPoint,
      createSession,
      stopSession,
      logCompletion,
    }),
    [
      awardPoint,
      createSession,
      deleteTeam,
      isLoading,
      logCompletion,
      refreshArena,
      registerTeam,
      selectSession,
      selectedSessionId,
      snapshot,
      stopSession,
    ],
  )

  return <ArenaContext.Provider value={value}>{children}</ArenaContext.Provider>
}

export function useArena() {
  const ctx = useContext(ArenaContext)
  if (!ctx) throw new Error("useArena must be used within ArenaProvider")
  return ctx
}
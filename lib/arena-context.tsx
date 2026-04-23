"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import type { ArenaChallenge, ArenaCompletion, ArenaSession, ArenaSnapshot, ArenaTeam } from "@/lib/arena-types"

interface ArenaContextValue {
  teams: ArenaTeam[]
  sessions: ArenaSession[]
  activeSession: ArenaSession | null
  challenges: ArenaChallenge[]
  completions: ArenaCompletion[]
  isLoading: boolean
  refreshArena: () => Promise<void>
  registerTeam: (name: string) => Promise<void>
  deleteTeam: (id: string) => Promise<void>
  awardPoint: (id: string) => Promise<void>
  createSession: (name: string) => Promise<void>
  stopSession: (id: string) => Promise<void>
  logCompletion: (input: { participantId: string; challengeId: number; proofUrl: string | null }) => Promise<void>
}

const ArenaContext = createContext<ArenaContextValue | null>(null)

const EMPTY_SNAPSHOT: ArenaSnapshot = {
  teams: [],
  sessions: [],
  activeSession: null,
  challenges: [],
  completions: [],
}

export function ArenaProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<ArenaSnapshot>(EMPTY_SNAPSHOT)
  const [isLoading, setIsLoading] = useState(true)

  const refreshArena = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/arena", { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`Failed to load arena data: ${response.status}`)
      }

      const data = (await response.json()) as ArenaSnapshot
      setSnapshot(data)
    } catch {
      setSnapshot(EMPTY_SNAPSHOT)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshArena()
  }, [refreshArena])

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
        throw new Error(errorText || `Request failed with ${response.status}`)
      }

      await refreshArena()
    },
    [refreshArena],
  )

  const registerTeam = useCallback(
    async (name: string) => {
      await callMutation("/api/arena/teams", {
        method: "POST",
        body: JSON.stringify({ name }),
      })
    },
    [callMutation],
  )

  const deleteTeam = useCallback(
    async (id: string) => {
      await callMutation(`/api/arena/teams/${id}`, { method: "DELETE" })
    },
    [callMutation],
  )

  const awardPoint = useCallback(
    async (id: string) => {
      await callMutation(`/api/arena/teams/${id}/score`, { method: "POST" })
    },
    [callMutation],
  )

  const createSession = useCallback(
    async (name: string) => {
      await callMutation("/api/arena/sessions", {
        method: "POST",
        body: JSON.stringify({ name }),
      })
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
    async (input: { participantId: string; challengeId: number; proofUrl: string | null }) => {
      await callMutation("/api/arena/completions", {
        method: "POST",
        body: JSON.stringify(input),
      })
    },
    [callMutation],
  )

  const value = useMemo<ArenaContextValue>(
    () => ({
      teams: snapshot.teams,
      sessions: snapshot.sessions,
      activeSession: snapshot.activeSession,
      challenges: snapshot.challenges,
      completions: snapshot.completions,
      isLoading,
      refreshArena,
      registerTeam,
      deleteTeam,
      awardPoint,
      createSession,
      stopSession,
      logCompletion,
    }),
    [awardPoint, createSession, deleteTeam, isLoading, logCompletion, refreshArena, registerTeam, snapshot, stopSession],
  )

  return <ArenaContext.Provider value={value}>{children}</ArenaContext.Provider>
}

export function useArena() {
  const ctx = useContext(ArenaContext)
  if (!ctx) throw new Error("useArena must be used within ArenaProvider")
  return ctx
}
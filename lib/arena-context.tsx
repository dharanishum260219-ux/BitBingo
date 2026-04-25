"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import type { ArenaChallenge, ArenaCompletion, ArenaSession, ArenaSnapshot, ArenaTeam } from "@/lib/arena-types"

const ARENA_SYNC_CHANNEL = "bitbingo-arena-sync"
const ARENA_SYNC_STORAGE_KEY = "bitbingo-arena-sync-event"

type ArenaSyncMessage = {
  sourceId: string
  timestamp: number
}

function createSyncSourceId() {
  return globalThis.crypto?.randomUUID?.() ?? `arena-sync-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

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
  deleteSession: (id: string) => Promise<void>
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
  const refreshRequestRef = useRef(0)
  const syncSourceIdRef = useRef("")
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)

  const ensureSyncSourceId = useCallback(() => {
    if (!syncSourceIdRef.current) {
      syncSourceIdRef.current = createSyncSourceId()
    }

    return syncSourceIdRef.current
  }, [])

  const refreshArenaInternal = useCallback(async (sessionId?: string | null, showLoading = true) => {
    const scopedSessionId = sessionId ?? selectedSessionId
    const requestId = refreshRequestRef.current + 1
    refreshRequestRef.current = requestId
    if (showLoading) {
      setIsLoading(true)
    }

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
      if (requestId !== refreshRequestRef.current) {
        return
      }

      setSnapshot(data)

      if (data.selectedSessionId !== selectedSessionId) {
        setSelectedSessionId(data.selectedSessionId)
      }
    } catch {
      if (showLoading && requestId === refreshRequestRef.current) {
        setSnapshot(EMPTY_SNAPSHOT)
      }
    } finally {
      if (showLoading && requestId === refreshRequestRef.current) {
        setIsLoading(false)
      }
    }
  }, [selectedSessionId])

  const refreshArena = useCallback(async (sessionId?: string | null) => {
    await refreshArenaInternal(sessionId, true)
  }, [refreshArenaInternal])

  const refreshArenaSilently = useCallback(async (sessionId?: string | null) => {
    await refreshArenaInternal(sessionId, false)
  }, [refreshArenaInternal])

  const publishArenaRefresh = useCallback(() => {
    const sourceId = ensureSyncSourceId()
    const message: ArenaSyncMessage = {
      sourceId,
      timestamp: Date.now(),
    }

    broadcastChannelRef.current?.postMessage(message)

    if (typeof window !== "undefined") {
      window.localStorage.setItem(ARENA_SYNC_STORAGE_KEY, JSON.stringify(message))
    }
  }, [ensureSyncSourceId])

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    ensureSyncSourceId()

    let cancelled = false

    const handleSyncMessage = (message: ArenaSyncMessage) => {
      if (message.sourceId === syncSourceIdRef.current || cancelled) {
        return
      }

      void refreshArenaSilently()
    }

    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(ARENA_SYNC_CHANNEL)
      broadcastChannelRef.current = channel
      channel.onmessage = (event) => {
        const message = event.data as ArenaSyncMessage | null
        if (!message || typeof message.sourceId !== "string") {
          return
        }

        handleSyncMessage(message)
      }
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ARENA_SYNC_STORAGE_KEY || !event.newValue) {
        return
      }

      try {
        const message = JSON.parse(event.newValue) as ArenaSyncMessage
        if (message && typeof message.sourceId === "string") {
          handleSyncMessage(message)
        }
      } catch {
        // Ignore malformed sync events.
      }
    }

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void refreshArenaSilently()
      }
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshArenaSilently()
      }
    }, 5000)

    window.addEventListener("storage", handleStorage)
    window.addEventListener("focus", handleVisibilityOrFocus)
    document.addEventListener("visibilitychange", handleVisibilityOrFocus)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("focus", handleVisibilityOrFocus)
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus)
      broadcastChannelRef.current?.close()
      broadcastChannelRef.current = null
    }
  }, [ensureSyncSourceId, refreshArenaSilently])

  const callMutation = useCallback(
    async (path: string, init: RequestInit, options?: { refreshSessionId?: string | null }) => {
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
          let message = errorText
          try {
            const parsed = JSON.parse(errorText) as { error?: string }
            message = parsed.error || errorText
          } catch {
            message = errorText
          }

          throw new Error(message)
        }
        throw new Error(`Request failed with ${response.status}`)
      }

      const data = (await response.json().catch(() => null)) as Record<string, unknown> | null
      await refreshArena(options?.refreshSessionId)
      publishArenaRefresh()
      return data
    },
    [publishArenaRefresh, refreshArena],
  )

  const selectSession = useCallback((sessionId: string) => {
    const normalizedSessionId = sessionId.trim() || null
    setSelectedSessionId(normalizedSessionId)
    void refreshArena(normalizedSessionId)
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

  const deleteSession = useCallback(
    async (id: string) => {
      const shouldResetSelection = selectedSessionId === id

      await callMutation(
        `/api/arena/sessions/${id}`,
        { method: "DELETE" },
        { refreshSessionId: shouldResetSelection ? null : undefined },
      )

      if (shouldResetSelection) {
        setSelectedSessionId(null)
      }
    },
    [callMutation, selectedSessionId],
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
      deleteSession,
      awardPoint,
      createSession,
      stopSession,
      logCompletion,
    }),
    [
      awardPoint,
      createSession,
      deleteTeam,
      deleteSession,
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
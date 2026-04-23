"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export interface Team {
  id: string
  name: string
  score: number
  status: "Active" | "Disqualified"
}

export interface Session {
  id: string
  name: string
  status: "Active" | "Stopped"
  startedAt: Date
}

interface ArenaContextValue {
  teams: Team[]
  sessions: Session[]
  activeSession: Session | null
  registerTeam: (name: string) => void
  deleteTeam: (id: string) => void
  awardPoint: (id: string) => void
  createSession: (name: string) => void
  stopSession: (id: string) => void
}

const ArenaContext = createContext<ArenaContextValue | null>(null)

const INITIAL_TEAMS: Team[] = [
  { id: "1", name: "hinata", score: 1, status: "Active" },
  { id: "2", name: "kakashi", score: 0, status: "Active" },
  { id: "3", name: "naruto", score: 1, status: "Active" },
  { id: "4", name: "sakura", score: 0, status: "Active" },
  { id: "5", name: "sasuke", score: 0, status: "Active" },
]

const INITIAL_SESSIONS: Session[] = [
  { id: "s1", name: "bit", status: "Active", startedAt: new Date() },
]

export function ArenaProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS)
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS)

  const activeSession = sessions.find((s) => s.status === "Active") ?? null

  const registerTeam = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setTeams((prev) => [
      ...prev,
      { id: Date.now().toString(), name: trimmed, score: 0, status: "Active" },
    ])
  }, [])

  const deleteTeam = useCallback((id: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const awardPoint = useCallback((id: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, score: t.score + 1 } : t))
    )
  }, [])

  const createSession = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSessions((prev) =>
      prev.map((s) => (s.status === "Active" ? { ...s, status: "Stopped" } : s))
    )
    setSessions((prev) => [
      ...prev,
      { id: Date.now().toString(), name: trimmed, status: "Active", startedAt: new Date() },
    ])
  }, [])

  const stopSession = useCallback((id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "Stopped" } : s))
    )
  }, [])

  return (
    <ArenaContext.Provider
      value={{ teams, sessions, activeSession, registerTeam, deleteTeam, awardPoint, createSession, stopSession }}
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

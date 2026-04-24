const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed: ${response.status}`)
  }

  return response.json()
}

export type SessionSummary = {
  id: string
  name: string
  status: string
  durationMinutes: number
  startedAt: string
  endsAt: string
  endedAt: string | null
}

export type Team = {
  id: string
  sessionId: string
  name: string
  station: string | null
  score: number
  status: string
}

export type Question = {
  id: string
  sessionId: string
  prompt: string
  description: string
  category: string
  difficulty: string
  marks: number
}

export type Winner = {
  rank: number
  teamId: string
  name: string
  score: number
}

export type WinnerSeries = {
  teamId: string
  teamName: string
  points: Array<{ step: number; score: number }>
}

export async function listSessions() {
  return request<SessionSummary[]>("/sessions")
}

export async function getActiveSession() {
  return request<SessionSummary | null>("/sessions/active")
}

export async function createSession(payload: {
  name: string
  durationMinutes: number
  questions: Array<{ prompt: string; description: string; category: string; difficulty: string; marks: number }>
  teamNames: string[]
}) {
  return request<SessionSummary>("/sessions", { method: "POST", body: JSON.stringify(payload) })
}

export async function addTeam(sessionId: string, payload: { name: string; station?: string }) {
  return request<Team>(`/sessions/${sessionId}/teams`, { method: "POST", body: JSON.stringify(payload) })
}

export async function addQuestion(sessionId: string, payload: { prompt: string; description: string; category: string; difficulty: string; marks: number }) {
  return request<Question>(`/sessions/${sessionId}/questions`, { method: "POST", body: JSON.stringify(payload) })
}

export async function addSessionTime(sessionId: string, minutes: number) {
  return request<SessionSummary>(`/sessions/${sessionId}/time`, { method: "POST", body: JSON.stringify({ minutes }) })
}

export async function stopSession(sessionId: string) {
  return request<SessionSummary>(`/sessions/${sessionId}/stop`, { method: "POST" })
}

export async function listTeams(sessionId: string) {
  return request<Team[]>(`/sessions/${sessionId}/teams`)
}

export async function listQuestions(sessionId: string) {
  return request<Question[]>(`/sessions/${sessionId}/questions`)
}

export async function scoreCompletion(sessionId: string, teamId: string, questionId: string) {
  return request<Team>(`/sessions/${sessionId}/score`, { method: "POST", body: JSON.stringify({ teamId, questionId }) })
}

export async function winners(sessionId: string) {
  return request<{ winners: Winner[]; series: WinnerSeries[] }>(`/sessions/${sessionId}/winners`)
}

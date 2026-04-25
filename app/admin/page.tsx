"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useArena } from "@/lib/arena-context"
import { FantasyBackground } from "@/components/fantasy-background"
import {
  ArrowLeft,
  Play,
  Shield,
  Users,
  Trophy,
  Scroll,
  Clock,
  Gem,
  LogOut,
  Plus,
  Square,
  Trash2,
} from "lucide-react"

interface ParsedQuestionRow {
  title: string
  description: string
  difficulty: string
  points?: number | null
}

function parseCsvText(input: string) {
  const rows: string[][] = []
  let current = ""
  let row: string[] = []
  let inQuotes = false

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    const nextChar = input[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim())
      current = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1
      }
      row.push(current.trim())
      current = ""

      if (row.some((cell) => cell.length > 0)) {
        rows.push(row)
      }
      row = []
      continue
    }

    current += char
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim())
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row)
    }
  }

  return rows
}

function parseTeamsCsv(input: string) {
  const rows = parseCsvText(input)
  if (rows.length === 0) return []

  const header = rows[0].map((cell) => cell.toLowerCase())
  const nameIdx = header.findIndex((cell) => cell === "name" || cell === "team" || cell === "team_name")

  if (nameIdx >= 0) {
    return rows
      .slice(1)
      .map((row) => row[nameIdx]?.trim() ?? "")
      .filter(Boolean)
  }

  return rows
    .map((row) => row[0]?.trim() ?? "")
    .filter(Boolean)
}

function parseQuestionsCsv(input: string): ParsedQuestionRow[] {
  const rows = parseCsvText(input)
  if (rows.length === 0) return []

  const header = rows[0].map((cell) => cell.toLowerCase())
  const titleIdx = header.findIndex((cell) => cell === "title")
  const descriptionIdx = header.findIndex((cell) => cell === "description")
  const difficultyIdx = header.findIndex((cell) => cell === "difficulty")
  const pointsIdx = header.findIndex((cell) => cell === "points")

  if (titleIdx < 0 || descriptionIdx < 0 || difficultyIdx < 0) {
    throw new Error("Questions CSV must include title, description, difficulty headers")
  }

  return rows
    .slice(1)
    .map((row) => {
      const title = row[titleIdx]?.trim() ?? ""
      const description = row[descriptionIdx]?.trim() ?? ""
      const difficulty = row[difficultyIdx]?.trim() ?? ""
      const pointsRaw = pointsIdx >= 0 ? row[pointsIdx] : ""
      const points = typeof pointsRaw === "string" && pointsRaw.trim() ? Number(pointsRaw.trim()) : null

      return {
        title,
        description,
        difficulty,
        points: Number.isFinite(points) && Number(points) > 0 ? Number(points) : null,
      }
    })
    .filter((row) => row.title && row.description && row.difficulty)
}

function Btn({
  children,
  variant = "default",
  onClick,
  disabled,
  type = "button",
  className = "",
}: {
  children: React.ReactNode
  variant?: "default" | "gold" | "danger" | "stop"
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit"
  className?: string
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-serif font-bold border-2 rounded-lg px-4 py-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"

  const styles: Record<string, string> = {
    default:
      "border-stone-900 bg-amber-600 text-white shadow-[0_3px_0_rgba(0,0,0,0.6)] hover:shadow-[0_4px_0_rgba(0,0,0,0.6)]",
    gold:
      "border-stone-900 bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-[0_3px_0_rgba(0,0,0,0.6)] hover:shadow-[0_4px_0_rgba(0,0,0,0.6)] w-full text-center uppercase tracking-wider text-sm",
    danger:
      "border-stone-900 bg-red-600 text-white shadow-[0_3px_0_rgba(0,0,0,0.6)] hover:shadow-[0_4px_0_rgba(0,0,0,0.6)] uppercase tracking-wider text-sm",
    stop:
      "border-stone-700 bg-gradient-to-b from-amber-200 to-amber-300 text-stone-800 shadow-[0_2px_0_rgba(0,0,0,0.4)] hover:shadow-[0_3px_0_rgba(0,0,0,0.4)] text-xs uppercase tracking-wider px-3 py-1",
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-amber-100 border-4 border-stone-900 rounded-lg shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

function CardHeader({ icon, title, color = "amber" }: { icon: React.ReactNode; title: string; color?: string }) {
  const gradients: Record<string, string> = {
    amber: "from-amber-600 via-yellow-500 to-amber-600",
    teal: "from-teal-600 via-emerald-500 to-teal-600",
    emerald: "from-emerald-600 via-teal-500 to-emerald-600",
    orange: "from-orange-600 via-orange-500 to-orange-600",
    red: "from-red-600 via-red-500 to-red-600",
  }
  return (
    <>
      <div className="bg-stone-800 px-4 py-3 flex items-center gap-3">
        <span className="text-amber-400">{icon}</span>
        <h2 className="font-serif text-xl font-bold text-amber-100 tracking-wide">{title}</h2>
      </div>
      <div className={`h-2 bg-gradient-to-r ${gradients[color] || gradients.amber}`} />
    </>
  )
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-serif font-bold text-stone-800 text-[10px] uppercase tracking-widest mb-1">
      {children}
    </label>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-white/70 border-b-4 border-stone-900 font-serif text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-amber-100/70 transition-colors"
    />
  )
}

function CurrentSessionPanel() {
  const { sessions, selectedSessionId, stopSession } = useArena()
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null

  return (
    <Card>
      <CardHeader icon={<Clock className="w-6 h-6" />} title="Current Session" color="emerald" />
      <div className="p-5">
        {selectedSession ? (
          <div className="bg-white/50 border-2 border-dashed border-stone-500 rounded-lg p-4">
            <p className="font-cursive text-2xl text-stone-800">{selectedSession.name}</p>
            <p className="text-xs uppercase tracking-widest font-serif font-bold text-emerald-600 mt-1">
              SELECTED
            </p>
            <Btn
              variant="stop"
              onClick={() => void stopSession(selectedSession.id)}
              className="mt-3"
            >
              <Square className="w-3 h-3" />
              STOP SESSION
            </Btn>
          </div>
        ) : (
          <div className="bg-white/50 border-2 border-dashed border-stone-400 rounded-lg p-4">
            <p className="font-serif text-stone-500 text-sm">Select a session to manage.</p>
          </div>
        )}
      </div>
    </Card>
  )
}

function CreateSessionPanel() {
  const { createSession } = useArena()
  const [name, setName] = useState("")
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [challengePool, setChallengePool] = useState<Array<{ id: number; title: string; description: string; difficulty: string; points: number }>>([])
  const [selectedChallengeIds, setSelectedChallengeIds] = useState<number[]>([])
  const [teamCsvNames, setTeamCsvNames] = useState<string[]>([])
  const [questionCsvRows, setQuestionCsvRows] = useState<ParsedQuestionRow[]>([])
  const [csvError, setCsvError] = useState<string | null>(null)
  const [showTeamPreview, setShowTeamPreview] = useState(false)
  const [showQuestionPreview, setShowQuestionPreview] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadChallengePool = async () => {
      const response = await fetch("/api/arena/challenges", { cache: "no-store" })
      if (!response.ok) return

      const data = (await response.json().catch(() => null)) as {
        challenges?: Array<{ id: number; title: string; description: string; difficulty: string; points: number }>
      } | null

      if (!mounted || !data?.challenges) return

      setChallengePool(data.challenges)
    }

    void loadChallengePool()
    return () => {
      mounted = false
    }
  }, [])

  const toggleChallenge = (challengeId: number) => {
    setSelectedChallengeIds((prev) => {
      if (prev.includes(challengeId)) {
        return prev.filter((entry) => entry !== challengeId)
      }
      return [...prev, challengeId]
    })
  }

  const handleTeamCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = parseTeamsCsv(text)
      setTeamCsvNames(parsed)
      setShowTeamPreview(false)
      setCsvError(null)
    } catch {
      setCsvError("Failed to parse teams CSV file")
      setShowTeamPreview(false)
    } finally {
      event.target.value = ""
    }
  }

  const handleQuestionCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = parseQuestionsCsv(text)
      setQuestionCsvRows(parsed)
      setShowQuestionPreview(false)
      setCsvError(null)
    } catch (error) {
      setCsvError(error instanceof Error ? error.message : "Failed to parse questions CSV file")
      setShowQuestionPreview(false)
    } finally {
      event.target.value = ""
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    if (selectedChallengeIds.length === 0 && questionCsvRows.length === 0) {
      setCsvError("Select challenges or upload a questions CSV before creating a session.")
      return
    }

    const importedTeamNames = Array.from(new Set(teamCsvNames))

    try {
      setCsvError(null)
      await createSession({
        name,
        durationMinutes,
        challengeIds: selectedChallengeIds,
        teamNames: importedTeamNames,
        questionRows: questionCsvRows,
      })

      setName("")
      setDurationMinutes(45)
      setTeamCsvNames([])
      setQuestionCsvRows([])
      setShowTeamPreview(false)
      setShowQuestionPreview(false)
      setCsvError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create session"
      setCsvError(message)
    }
  }

  return (
    <Card>
      <CardHeader icon={<Plus className="w-6 h-6" />} title="Create Session" color="teal" />
      <div className="p-5 space-y-4">
        <div>
          <FormLabel>Session Name</FormLabel>
          <TextInput value={name} onChange={setName} placeholder="Spring Sprint" />
        </div>
        <div>
          <FormLabel>Session Duration (Minutes)</FormLabel>
          <input
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(Number(event.target.value || 0))}
            className="w-full px-4 py-3 bg-white/70 border-b-4 border-stone-900 font-serif text-stone-800 focus:outline-none focus:bg-amber-100/70 transition-colors"
          />
        </div>
        <div className="rounded-lg border-2 border-dashed border-stone-700 bg-white/50 p-3">
          <label className="block font-serif text-xs uppercase tracking-widest text-stone-600">Teams CSV Upload (Optional)</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => void handleTeamCsvUpload(event)}
            className="mt-2 w-full text-sm"
          />
          <p className="mt-2 font-serif text-xs text-stone-600">
            CSV headers supported: name, team, or team_name. Parsed teams: {teamCsvNames.length}
          </p>
          <div className="mt-2">
            <Btn
              variant="stop"
              onClick={() => setShowTeamPreview((prev) => !prev)}
              disabled={teamCsvNames.length === 0}
            >
              {showTeamPreview ? "HIDE TEAMS PREVIEW" : "PREVIEW TEAMS CSV"}
            </Btn>
          </div>
          {showTeamPreview && (
            <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border-2 border-stone-700 bg-amber-50 p-2">
              {teamCsvNames.map((teamName, index) => (
                <p key={`${teamName}-${index}`} className="px-2 py-1 font-serif text-sm text-stone-800">
                  {index + 1}. {teamName}
                </p>
              ))}
            </div>
          )}
        </div>
        <div>
          <FormLabel>Questions For This Session ({selectedChallengeIds.length} selected)</FormLabel>
          <div className="mb-3 rounded-lg border-2 border-dashed border-stone-700 bg-white/50 p-3">
            <label className="block font-serif text-xs uppercase tracking-widest text-stone-600">Questions CSV Upload</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => void handleQuestionCsvUpload(event)}
              className="mt-2 w-full text-sm"
            />
            <p className="mt-2 font-serif text-xs text-stone-600">
              Required headers: title, description, difficulty. Optional: points. Parsed questions: {questionCsvRows.length}
            </p>
            <div className="mt-2">
              <Btn
                variant="stop"
                onClick={() => setShowQuestionPreview((prev) => !prev)}
                disabled={questionCsvRows.length === 0}
              >
                {showQuestionPreview ? "HIDE QUESTIONS PREVIEW" : "PREVIEW QUESTIONS CSV"}
              </Btn>
            </div>
            {showQuestionPreview && (
              <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border-2 border-stone-700 bg-amber-50 p-2">
                {questionCsvRows.map((row, index) => (
                  <div key={`${row.title}-${index}`} className="rounded border border-stone-300 bg-white/70 px-2 py-2 mb-2">
                    <p className="font-serif text-sm font-bold text-stone-900">{index + 1}. {row.title}</p>
                    <p className="font-serif text-xs text-stone-700 mt-1">{row.description}</p>
                    <p className="font-serif text-[11px] uppercase tracking-wider text-stone-600 mt-1">
                      {row.difficulty}{typeof row.points === "number" ? ` • ${row.points} pts` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="max-h-52 overflow-y-auto rounded-lg border-2 border-stone-900 bg-white/60 p-2">
            {challengePool.map((challenge) => (
              <label key={challenge.id} className="mb-1 flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-amber-50">
                <input
                  type="checkbox"
                  checked={selectedChallengeIds.includes(challenge.id)}
                  onChange={() => toggleChallenge(challenge.id)}
                />
                <span className="font-serif text-sm text-stone-800">{challenge.title} ({challenge.difficulty}, {challenge.points} pts)</span>
              </label>
            ))}
            {challengePool.length === 0 && (
              <p className="px-2 py-1 font-serif text-sm text-stone-500">No challenges available.</p>
            )}
          </div>
          <p className="mt-2 font-serif text-xs text-stone-600">
            Select at least one challenge, or upload questions CSV.
          </p>
        </div>
        {csvError && (
          <p className="rounded-lg border-2 border-red-700 bg-red-100 px-3 py-2 font-serif text-xs text-red-700">
            {csvError}
          </p>
        )}
        <Btn
          variant="gold"
          onClick={handleCreate}
          disabled={!name.trim() || durationMinutes <= 0 || (selectedChallengeIds.length === 0 && questionCsvRows.length === 0)}
          className="w-full py-3"
        >
          CREATE SESSION WITH SETUP
        </Btn>
      </div>
    </Card>
  )
}

function RegisterTeamPanel() {
  const { registerTeam, selectedSessionId } = useArena()
  const [name, setName] = useState("")

  const handleSubmit = async () => {
    if (!name.trim() || !selectedSessionId) return
    await registerTeam(name, selectedSessionId)
    setName("")
  }

  return (
    <Card>
      <CardHeader icon={<Users className="w-6 h-6" />} title="Register Team" color="amber" />
      <div className="p-5 space-y-4">
        <div>
          <FormLabel>Team Name</FormLabel>
          <TextInput value={name} onChange={setName} placeholder="Neon Kraken Squad" />
        </div>
        <Btn
          variant="gold"
          onClick={handleSubmit}
          disabled={!name.trim() || !selectedSessionId}
          className="w-full py-3"
        >
          REGISTER TEAM
        </Btn>
      </div>
    </Card>
  )
}

function ActiveRosterPanel() {
  const { teams, deleteTeam, selectedSessionId } = useArena()

  return (
    <Card>
      <CardHeader icon={<Trophy className="w-6 h-6" />} title="Active Roster" color="amber" />
      <div className="p-4">
        {teams.length === 0 && (
          <p className="text-center font-serif text-stone-500 py-4 text-sm">
            No teams registered yet.
          </p>
        )}
        <div className="flex flex-col divide-y divide-dashed divide-stone-400">
          {teams.map((team) => (
            <div key={team.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-3 px-2">
              <span className="font-cursive text-lg md:text-xl text-stone-800">{team.name}</span>
              <div className="flex items-center gap-3 sm:ml-auto">
                <span className="text-[10px] uppercase tracking-widest font-serif text-stone-500 whitespace-nowrap">
                  {team.score} PTS
                </span>
                <Btn variant="stop" onClick={() => void deleteTeam(team.id)} disabled={!selectedSessionId}>
                  <Trash2 className="w-3 h-3" />
                  DELETE TEAM
                </Btn>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function SessionHistoryPanel() {
  const { sessions, stopSession } = useArena()

  return (
    <Card>
      <CardHeader icon={<Scroll className="w-6 h-6" />} title="Session History" color="orange" />
      <div className="p-4">
        {sessions.length === 0 && (
          <p className="text-center font-serif text-stone-500 py-4 text-sm">
            No sessions yet.
          </p>
        )}
        <div className="flex flex-col divide-y divide-dashed divide-stone-400">
          {sessions.map((session) => (
            <div key={session.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-3 px-2">
              <span className="font-cursive text-lg md:text-xl text-stone-800">{session.name}</span>
              <div className="flex items-center gap-4 sm:ml-auto">
                <span
                  className={`text-[10px] uppercase tracking-widest font-serif font-bold ${
                    session.status === "Active" ? "text-emerald-600" : "text-stone-500"
                  }`}
                >
                  {session.status}
                </span>
                {session.status === "Active" && (
                  <Btn variant="stop" onClick={() => void stopSession(session.id)}>
                    <Square className="w-3 h-3" />
                    STOP SESSION
                  </Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function MissionControlCard() {
  const { sessions, selectedSessionId, selectSession } = useArena()

  return (
    <Card className="mb-8">
      <CardHeader icon={<Shield className="w-6 h-6" />} title="Mission Control" color="amber" />
      <div className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <p className="text-[10px] uppercase tracking-widest font-serif text-stone-600">
              Session and Roster Management
            </p>
            <select
              value={selectedSessionId ?? ""}
              onChange={(event) => selectSession(event.target.value)}
              className="mt-2 w-full rounded-lg border-2 border-stone-900 bg-white px-3 py-2 font-serif text-stone-900"
            >
              {sessions.length === 0 && <option value="">No sessions available</option>}
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>
          <form action="/admin/logout" method="post" className="w-full sm:w-auto">
            <Btn variant="default" type="submit" className="w-full sm:w-auto">
              <LogOut className="w-4 h-4" />
              SIGN OUT
            </Btn>
          </form>
        </div>
      </div>
    </Card>
  )
}

export default function AdminPage() {
  return (
    <FantasyBackground>
      <header className="sticky top-0 z-40 bg-stone-800 border-b-4 border-stone-900 shadow-[0_4px_0_rgba(0,0,0,0.3)]">
        <div className="max-w-5xl mx-auto px-3 md:px-4 py-3 md:py-4 flex flex-wrap items-center justify-between gap-2 md:gap-3">
          <Link href="/">
            <button
              type="button"
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-amber-600 text-white font-serif font-bold text-xs md:text-base border-2 border-stone-900 rounded-lg hover:-translate-y-0.5 transition-all shadow-[0_2px_0_rgba(0,0,0,0.6)]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Arena</span>
              <span className="sm:hidden">Back</span>
            </button>
          </Link>

          <div className="order-3 w-full md:order-none md:w-auto md:flex-1 text-center">
            <p className="text-[10px] uppercase tracking-widest font-serif text-stone-400">
              Restricted Console
            </p>
            <h1 className="font-cursive text-2xl md:text-4xl font-bold text-amber-100 tracking-wide">
              Mission Control
            </h1>
          </div>

          <Link href="/coordinator">
            <button
              type="button"
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-teal-600 text-white font-serif font-bold text-xs md:text-base border-2 border-stone-900 rounded-lg hover:-translate-y-0.5 transition-all shadow-[0_2px_0_rgba(0,0,0,0.6)]"
            >
              <Play className="w-5 h-5" />
              <span className="hidden sm:inline">Open Coordinator</span>
              <span className="sm:hidden">Coordinator</span>
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-2 sm:px-3 md:px-4 py-5 md:py-8 pb-10 md:pb-12 space-y-5 md:space-y-6">
        <MissionControlCard />

        <div className="grid md:grid-cols-2 gap-6">
          <CurrentSessionPanel />
          <CreateSessionPanel />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <RegisterTeamPanel />
          <ActiveRosterPanel />
        </div>

        <SessionHistoryPanel />
      </main>

      <footer className="mt-8 min-h-16 bg-stone-800 border-t-4 border-stone-900 py-2 px-3 md:px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center leading-tight">
          <Gem className="w-4 h-4 text-teal-400" />
          <span className="font-serif text-[10px] md:text-xs text-stone-400 uppercase tracking-wide md:tracking-widest">BitBingo Admin System</span>
          <span className="text-stone-600">•</span>
          <span className="font-serif text-[10px] md:text-xs text-stone-500">v1.0.0</span>
        </div>
      </footer>
    </FantasyBackground>
  )
}

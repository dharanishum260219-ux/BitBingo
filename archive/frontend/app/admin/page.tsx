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
  Settings,
  LogOut,
  Plus,
  Timer,
  Square,
  Trash2,
} from "lucide-react"

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`
}

function parseCsvLine(line: string) {
  const cells: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]

    if (char === '"') {
      const next = line[i + 1]
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim())
      current = ""
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

function parseCsvFirstColumn(raw: string) {
  const rows = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (rows.length === 0) return []

  const parsedRows = rows.map(parseCsvLine)
  const hasHeader = /name|team|question|prompt/i.test(parsedRows[0]?.[0] ?? "")
  const dataRows = hasHeader ? parsedRows.slice(1) : parsedRows

  return dataRows
    .map((columns) => (columns[0] ?? "").trim())
    .filter(Boolean)
}

type UploadedQuestion = {
  prompt: string
  description: string
  category: string
  difficulty: string
  marks: number
}

function parseQuestionCsv(raw: string): UploadedQuestion[] {
  const rows = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (rows.length === 0) return []

  const parsedRows = rows.map(parseCsvLine)
  const header = parsedRows[0].map((cell) => cell.toLowerCase())
  const hasHeader = header.some((cell) =>
    ["prompt", "question", "description", "category", "difficulty", "marks"].includes(cell)
  )

  const indexOf = (candidates: string[]) =>
    header.findIndex((cell) => candidates.includes(cell))

  const promptIndex = hasHeader ? indexOf(["prompt", "question", "title"]) : 0
  const descriptionIndex = hasHeader ? indexOf(["description", "details"]) : 1
  const categoryIndex = hasHeader ? indexOf(["category", "domain"]) : 2
  const difficultyIndex = hasHeader ? indexOf(["difficulty", "level"]) : 3
  const marksIndex = hasHeader ? indexOf(["marks", "points", "score"]) : 4

  const dataRows = hasHeader ? parsedRows.slice(1) : parsedRows

  return dataRows
    .map((columns) => {
      const prompt = (columns[promptIndex >= 0 ? promptIndex : 0] ?? "").trim()
      const description = (columns[descriptionIndex >= 0 ? descriptionIndex : 1] ?? "").trim()
      const category = (columns[categoryIndex >= 0 ? categoryIndex : 2] ?? "General").trim() || "General"
      const difficulty = (columns[difficultyIndex >= 0 ? difficultyIndex : 3] ?? "Medium").trim() || "Medium"
      const marksRaw = (columns[marksIndex >= 0 ? marksIndex : 4] ?? "1").trim()
      const marks = Number.parseInt(marksRaw, 10)

      return {
        prompt,
        description,
        category,
        difficulty,
        marks: Number.isFinite(marks) && marks > 0 ? marks : 1,
      }
    })
    .filter((question) => Boolean(question.prompt))
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

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-white/70 border-2 border-stone-900 font-serif text-stone-800 focus:outline-none rounded-lg cursor-pointer"
    >
      <option value="">{placeholder ?? "Select..."}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function CurrentSessionPanel() {
  const { activeSession, remainingTimeMs, addSessionTime, stopSession, teams } = useArena()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <Card>
      <CardHeader icon={<Clock className="w-6 h-6" />} title="Current Session" color="emerald" />
      <div className="p-5">
        {activeSession ? (
          <div className="bg-white/50 border-2 border-dashed border-stone-500 rounded-lg p-4 space-y-3">
            <p className="font-cursive text-2xl text-stone-800">{activeSession.name}</p>
            <p className="text-xs uppercase tracking-widest font-serif font-bold text-emerald-600 mt-1">
              ACTIVE
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs uppercase tracking-widest font-serif">
              <div>
                <p className="text-stone-500">Time Left</p>
                <p className="text-stone-900 font-bold text-base normal-case tracking-normal">
                  {isMounted ? formatDuration(remainingTimeMs) : "--:--"}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Teams</p>
                <p className="text-stone-900 font-bold text-base normal-case tracking-normal">
                  {teams.length}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Questions</p>
                <p className="text-stone-900 font-bold text-base normal-case tracking-normal">
                  {activeSession.questions.length}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Duration</p>
                <p className="text-stone-900 font-bold text-base normal-case tracking-normal">
                  {activeSession.durationMinutes} min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Btn variant="stop" onClick={() => addSessionTime(5)}>
                <Timer className="w-3 h-3" />
                +5 MIN
              </Btn>
              <Btn variant="stop" onClick={() => addSessionTime(10)}>
                <Timer className="w-3 h-3" />
                +10 MIN
              </Btn>
            </div>
            <Btn
              variant="stop"
              onClick={() => stopSession(activeSession.id)}
              className="mt-1"
            >
              <Square className="w-3 h-3" />
              STOP SESSION
            </Btn>
          </div>
        ) : (
          <div className="bg-white/50 border-2 border-dashed border-stone-400 rounded-lg p-4">
            <p className="font-serif text-stone-500 text-sm">No active session.</p>
          </div>
        )}
      </div>
    </Card>
  )
}

function CreateSessionPanel() {
  const { createSession } = useArena()
  const [name, setName] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("45")
  const [questionsText, setQuestionsText] = useState("Slay Dragon\nFind Relic\nDecode Runes")
  const [teamsText, setTeamsText] = useState("hinata\nkakashi\nnaruto")
  const [uploadedQuestions, setUploadedQuestions] = useState<UploadedQuestion[]>([])

  const handleQuestionsCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const parsedQuestions = parseQuestionCsv(text)
    if (parsedQuestions.length > 0) {
      setUploadedQuestions(parsedQuestions)
      setQuestionsText(parsedQuestions.map((question) => question.prompt).join("\n"))
    }
    event.target.value = ""
  }

  const handleTeamsCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const values = parseCsvFirstColumn(text)
    if (values.length > 0) {
      setTeamsText(values.join("\n"))
    }
    event.target.value = ""
  }

  const handleCreate = () => {
    if (!name.trim()) return
    const questionPrompts = questionsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
    const teamNames = teamsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

    if (questionPrompts.length === 0 || teamNames.length === 0) return

    const questionMap = new Map(
      uploadedQuestions.map((question) => [question.prompt.toLowerCase(), question])
    )
    const questions = questionPrompts.map((prompt) => {
      const uploaded = questionMap.get(prompt.toLowerCase())
      return {
        prompt,
        description: uploaded?.description ?? "",
        category: uploaded?.category ?? "General",
        difficulty: uploaded?.difficulty ?? "Medium",
        marks: uploaded?.marks ?? 1,
      }
    })

    createSession({
      name,
      durationMinutes: Number.parseInt(durationMinutes, 10) || 45,
      questions,
      teamNames,
    })
    setName("")
    setDurationMinutes("45")
    setQuestionsText("")
    setTeamsText("")
    setUploadedQuestions([])
  }

  const questionCount = questionsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length
  const totalMarks = uploadedQuestions.reduce((sum, question) => sum + question.marks, 0)

  const downloadMockQuestionsCsv = () => {
    const csv = [
      "prompt,description,category,difficulty,marks",
      'API Caching Challenge,"Implement stale-while-revalidate cache",Backend,Hard,25',
      'Responsive Dashboard,"Build adaptive cards and navigation",Frontend,Medium,15',
      'Regex Log Parser,"Parse mixed-format logs into JSON",Tools,Easy,10',
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "mock-questions.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadMockTeamsCsv = () => {
    const csv = [
      "team_name",
      "Code Raiders",
      "Bug Hunters",
      "Stack Masters",
      "Dev Ninjas",
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "mock-teams.csv"
    link.click()
    URL.revokeObjectURL(url)
  }
  const teamCount = teamsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length

  return (
    <Card>
      <CardHeader icon={<Plus className="w-6 h-6" />} title="Create Session" color="teal" />
      <div className="p-5 space-y-4">
        <div>
          <FormLabel>Session Name</FormLabel>
          <TextInput value={name} onChange={setName} placeholder="Spring Sprint" />
        </div>
        <div>
          <FormLabel>Duration (Minutes)</FormLabel>
          <TextInput
            value={durationMinutes}
            onChange={setDurationMinutes}
            placeholder="45"
          />
        </div>
        <div>
          <FormLabel>Custom Questions (One Per Line)</FormLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            <label className="inline-flex items-center justify-center px-3 py-2 text-[11px] uppercase tracking-widest font-serif font-bold border-2 border-stone-800 rounded-lg bg-amber-200 text-stone-800 cursor-pointer hover:-translate-y-0.5 transition-all">
              Upload Questions CSV
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleQuestionsCsvUpload}
                className="hidden"
              />
            </label>
            <Btn variant="stop" onClick={downloadMockQuestionsCsv}>
              DOWNLOAD MOCK QUESTIONS CSV
            </Btn>
          </div>
          <textarea
            value={questionsText}
            onChange={(e) => setQuestionsText(e.target.value)}
            placeholder="Question 1"
            className="w-full px-4 py-3 bg-white/70 border-b-4 border-stone-900 font-serif text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-amber-100/70 transition-colors min-h-24 resize-y"
          />
          <p className="mt-1 text-[11px] uppercase tracking-widest font-serif text-stone-500">
            {questionCount} Questions
          </p>
          {uploadedQuestions.length > 0 && (
            <p className="mt-1 text-[11px] uppercase tracking-widest font-serif text-emerald-700">
              Total Marks From CSV: {totalMarks}
            </p>
          )}
        </div>
        <div>
          <FormLabel>Initial Teams (One Per Line)</FormLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            <label className="inline-flex items-center justify-center px-3 py-2 text-[11px] uppercase tracking-widest font-serif font-bold border-2 border-stone-800 rounded-lg bg-amber-200 text-stone-800 cursor-pointer hover:-translate-y-0.5 transition-all">
              Upload Teams CSV
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleTeamsCsvUpload}
                className="hidden"
              />
            </label>
            <Btn variant="stop" onClick={downloadMockTeamsCsv}>
              DOWNLOAD MOCK TEAMS CSV
            </Btn>
          </div>
          <textarea
            value={teamsText}
            onChange={(e) => setTeamsText(e.target.value)}
            placeholder="Team Alpha"
            className="w-full px-4 py-3 bg-white/70 border-b-4 border-stone-900 font-serif text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-amber-100/70 transition-colors min-h-24 resize-y"
          />
          <p className="mt-1 text-[11px] uppercase tracking-widest font-serif text-stone-500">
            {teamCount} Teams
          </p>
        </div>
        <Btn
          variant="gold"
          onClick={handleCreate}
          disabled={!name.trim() || questionCount === 0 || teamCount === 0}
          className="w-full py-3"
        >
          CREATE AND ACTIVATE SESSION
        </Btn>
      </div>
    </Card>
  )
}

function RegisterTeamPanel() {
  const {
    sessions,
    activeSession,
    getTeamsBySession,
    addTeamToSession,
    addQuestionToSession,
  } = useArena()
  const [selectedSessionId, setSelectedSessionId] = useState(activeSession?.id ?? "")
  const [teamName, setTeamName] = useState("")
  const [questionPrompt, setQuestionPrompt] = useState("")
  const [questionDescription, setQuestionDescription] = useState("")
  const [questionCategory, setQuestionCategory] = useState("General")
  const [questionDifficulty, setQuestionDifficulty] = useState("Medium")
  const [questionMarks, setQuestionMarks] = useState("1")

  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null
  const selectedSessionTeams = selectedSession ? getTeamsBySession(selectedSession.id) : []
  const selectedSessionQuestions = selectedSession?.questions ?? []

  const sessionOptions = sessions
    .slice()
    .reverse()
    .map((session) => ({
      value: session.id,
      label: `${session.name} (${session.id})`,
    }))

  const handleAddTeam = () => {
    if (!selectedSessionId || !teamName.trim()) return
    const added = addTeamToSession(selectedSessionId, teamName)
    if (added) {
      setTeamName("")
    }
  }

  const handleAddQuestion = () => {
    if (!selectedSessionId || !questionPrompt.trim()) return

    const added = addQuestionToSession(selectedSessionId, {
      prompt: questionPrompt,
      description: questionDescription,
      category: questionCategory,
      difficulty: questionDifficulty,
      marks: Number.parseInt(questionMarks, 10) || 1,
    })

    if (added) {
      setQuestionPrompt("")
      setQuestionDescription("")
      setQuestionCategory("General")
      setQuestionDifficulty("Medium")
      setQuestionMarks("1")
    }
  }

  const handleAddTeamsCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedSessionId) return

    const text = await file.text()
    const names = parseCsvFirstColumn(text)
    names.forEach((name) => {
      addTeamToSession(selectedSessionId, name)
    })
    event.target.value = ""
  }

  const handleAddQuestionsCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedSessionId) return

    const text = await file.text()
    const questions = parseQuestionCsv(text)
    questions.forEach((question) => {
      addQuestionToSession(selectedSessionId, question)
    })
    event.target.value = ""
  }

  return (
    <Card>
      <CardHeader icon={<Users className="w-6 h-6" />} title="Session Content Manager" color="amber" />
      <div className="p-5 space-y-4">
        <div>
          <FormLabel>Select Session</FormLabel>
          <SelectInput
            value={selectedSessionId}
            onChange={setSelectedSessionId}
            options={sessionOptions}
            placeholder="Choose Session ID"
          />
          {selectedSession && (
            <p className="mt-2 text-[11px] uppercase tracking-widest font-serif text-stone-600">
              Session ID: {selectedSession.id}
            </p>
          )}
        </div>

        <div className="border-2 border-dashed border-stone-400 rounded-lg p-3 space-y-3 bg-white/40">
          <FormLabel>Add Team To Selected Session</FormLabel>
          <TextInput value={teamName} onChange={setTeamName} placeholder="Neon Kraken Squad" />
          <div className="flex flex-wrap gap-2">
            <Btn
              variant="gold"
              onClick={handleAddTeam}
              disabled={!selectedSessionId || !teamName.trim()}
              className="w-auto"
            >
              ADD TEAM
            </Btn>
            <label className="inline-flex items-center justify-center px-3 py-2 text-[11px] uppercase tracking-widest font-serif font-bold border-2 border-stone-800 rounded-lg bg-amber-200 text-stone-800 cursor-pointer hover:-translate-y-0.5 transition-all">
              Upload Teams CSV
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleAddTeamsCsv}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="border-2 border-dashed border-stone-400 rounded-lg p-3 space-y-3 bg-white/40">
          <FormLabel>Add Question To Selected Session</FormLabel>
          <TextInput value={questionPrompt} onChange={setQuestionPrompt} placeholder="Question prompt" />
          <TextInput value={questionDescription} onChange={setQuestionDescription} placeholder="Question description" />
          <div className="grid grid-cols-3 gap-2">
            <TextInput value={questionCategory} onChange={setQuestionCategory} placeholder="Category" />
            <TextInput value={questionDifficulty} onChange={setQuestionDifficulty} placeholder="Difficulty" />
            <TextInput value={questionMarks} onChange={setQuestionMarks} placeholder="Marks" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn
              variant="gold"
              onClick={handleAddQuestion}
              disabled={!selectedSessionId || !questionPrompt.trim()}
              className="w-auto"
            >
              ADD QUESTION
            </Btn>
            <label className="inline-flex items-center justify-center px-3 py-2 text-[11px] uppercase tracking-widest font-serif font-bold border-2 border-stone-800 rounded-lg bg-amber-200 text-stone-800 cursor-pointer hover:-translate-y-0.5 transition-all">
              Upload Questions CSV
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleAddQuestionsCsv}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {selectedSession && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/60 border-2 border-dashed border-stone-400 rounded-lg p-3">
              <p className="text-[11px] uppercase tracking-widest font-serif text-stone-600 mb-2">
                Teams in Session ({selectedSessionTeams.length})
              </p>
              <div className="max-h-40 overflow-auto space-y-1">
                {selectedSessionTeams.map((team) => (
                  <p key={team.id} className="font-serif text-sm text-stone-800">
                    {team.name}
                  </p>
                ))}
              </div>
            </div>
            <div className="bg-white/60 border-2 border-dashed border-stone-400 rounded-lg p-3">
              <p className="text-[11px] uppercase tracking-widest font-serif text-stone-600 mb-2">
                Questions in Session ({selectedSessionQuestions.length})
              </p>
              <div className="max-h-40 overflow-auto space-y-1">
                {selectedSessionQuestions.map((question) => (
                  <p key={question.id} className="font-serif text-sm text-stone-800">
                    {question.prompt} ({question.marks} pts)
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function ActiveRosterPanel() {
  const { sessions, activeSession, getTeamsBySession, deleteTeam } = useArena()
  const [selectedSessionId, setSelectedSessionId] = useState("")

  useEffect(() => {
    if (selectedSessionId) {
      return
    }

    if (activeSession) {
      setSelectedSessionId(activeSession.id)
      return
    }

    if (sessions.length > 0) {
      setSelectedSessionId(sessions[0].id)
    }
  }, [activeSession, selectedSessionId, sessions])

  const rosterTeams = selectedSessionId ? getTeamsBySession(selectedSessionId) : []
  const sessionOptions = sessions.map((session) => ({
    value: session.id,
    label: `${session.name} (${session.id})`,
  }))

  return (
    <Card>
      <CardHeader icon={<Trophy className="w-6 h-6" />} title="Active Roster" color="amber" />
      <div className="p-4">
        <div className="mb-4">
          <FormLabel>Manage Session Roster</FormLabel>
          <SelectInput
            value={selectedSessionId}
            onChange={setSelectedSessionId}
            options={sessionOptions}
            placeholder="Select Session"
          />
        </div>
        {rosterTeams.length === 0 && (
          <p className="text-center font-serif text-stone-500 py-4 text-sm">
            No teams registered for this session yet.
          </p>
        )}
        <div className="flex flex-col divide-y divide-dashed divide-stone-400">
          {rosterTeams.map((team) => (
            <div key={team.id} className="flex items-center justify-between py-3 px-2">
              <span className="font-cursive text-xl text-stone-800">{team.name}</span>
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-[10px] uppercase tracking-widest font-serif text-stone-500 whitespace-nowrap">
                  {team.score} PTS
                </span>
                <Btn variant="stop" onClick={() => deleteTeam(team.id)}>
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
            <div key={session.id} className="flex items-center justify-between py-3 px-2">
              <span className="font-cursive text-xl text-stone-800">{session.name}</span>
              <div className="flex items-center gap-4 ml-auto">
                <span className="text-[10px] uppercase tracking-widest font-serif text-stone-500 whitespace-nowrap">
                  ID {session.id}
                </span>
                <span className="text-[10px] uppercase tracking-widest font-serif text-stone-500 whitespace-nowrap">
                  {session.durationMinutes} MIN
                </span>
                <span
                  className={`text-[10px] uppercase tracking-widest font-serif font-bold ${
                    session.status === "Active" ? "text-emerald-600" : "text-stone-500"
                  }`}
                >
                  {session.status}
                </span>
                {session.status === "Active" && (
                  <Btn variant="stop" onClick={() => stopSession(session.id)}>
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
  return (
    <Card className="mb-8">
      <CardHeader icon={<Shield className="w-6 h-6" />} title="Mission Control" color="amber" />
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-serif text-stone-600">
              Session and Roster Management
            </p>
          </div>
          <form action="/admin/logout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-2 border-2 rounded-lg px-4 py-2 transition-all cursor-pointer border-[#7a6130] bg-gradient-to-b from-[#e8d48a] to-[#c9a84c] text-[#3d2b00] shadow-[0_3px_0_#7a6130] hover:shadow-[0_4px_0_#7a6130] font-serif font-bold"
            >
              <LogOut className="w-4 h-4" />
              SIGN OUT
            </button>
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
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white font-serif font-bold border-2 border-stone-900 rounded-lg hover:-translate-y-0.5 transition-all shadow-[0_2px_0_rgba(0,0,0,0.6)]"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Arena
            </button>
          </Link>

          <div className="flex-1 text-center">
            <p className="text-[10px] uppercase tracking-widest font-serif text-stone-400">
              Restricted Console
            </p>
            <h1 className="font-cursive text-3xl md:text-4xl font-bold text-amber-100 tracking-wide">
              Mission Control
            </h1>
          </div>

          <Link href="/coordinator">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-serif font-bold border-2 border-stone-900 rounded-lg hover:-translate-y-0.5 transition-all shadow-[0_2px_0_rgba(0,0,0,0.6)]"
            >
              <Play className="w-5 h-5" />
              Open Coordinator
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 pb-24 space-y-6">
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

      <div className="fixed top-20 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 border-4 border-stone-900 flex items-center justify-center shadow-[3px_3px_0_rgba(0,0,0,1)]">
        <Settings className="w-6 h-6 text-amber-100" />
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-stone-800 border-t-4 border-stone-900 py-2 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-2">
          <Gem className="w-4 h-4 text-teal-400" />
          <span className="font-serif text-xs text-stone-400 uppercase tracking-widest">BitBingo Admin System</span>
          <span className="text-stone-600">•</span>
          <span className="font-serif text-xs text-stone-500">v1.0.0</span>
        </div>
      </footer>
    </FantasyBackground>
  )
}

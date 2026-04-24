import { useMemo, useState } from "react"
import { Link, NavLink, Route, Routes } from "react-router-dom"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Clock3, Plus, Trophy, Users } from "lucide-react"
import { useArena } from "./state"

function shellClass(active: boolean) {
  return active
    ? "px-3 py-2 rounded-md bg-amber-700 text-amber-50"
    : "px-3 py-2 rounded-md bg-amber-100 text-stone-800"
}

function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0
    ? `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

function parseCsvLine(line: string) {
  const cells: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
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
  const rows = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (rows.length === 0) return []
  const parsed = rows.map(parseCsvLine)
  const hasHeader = /name|team|prompt|question/i.test(parsed[0]?.[0] ?? "")
  return (hasHeader ? parsed.slice(1) : parsed).map((r) => r[0]?.trim() ?? "").filter(Boolean)
}

type ParsedQuestion = {
  prompt: string
  description: string
  category: string
  difficulty: string
  marks: number
}

function parseQuestionCsv(raw: string): ParsedQuestion[] {
  const rows = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (rows.length === 0) return []
  const parsedRows = rows.map(parseCsvLine)
  const header = parsedRows[0].map((cell) => cell.toLowerCase())
  const hasHeader = header.some((cell) => ["prompt", "question", "description", "category", "difficulty", "marks"].includes(cell))
  const rowsOnly = hasHeader ? parsedRows.slice(1) : parsedRows

  return rowsOnly
    .map((row) => ({
      prompt: (row[0] ?? "").trim(),
      description: (row[1] ?? "").trim(),
      category: (row[2] ?? "General").trim() || "General",
      difficulty: (row[3] ?? "Medium").trim() || "Medium",
      marks: Math.max(1, Number.parseInt((row[4] ?? "1").trim(), 10) || 1),
    }))
    .filter((q) => Boolean(q.prompt))
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen p-4 md:p-6">
      <header className="max-w-6xl mx-auto mb-6 bg-amber-200 border-4 border-stone-900 rounded-lg p-4 flex flex-wrap gap-2 items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">BitBingo Split Stack</h1>
        <nav className="flex gap-2 text-sm">
          <NavLink to="/" className={({ isActive }) => shellClass(isActive)}>Arena</NavLink>
          <NavLink to="/admin" className={({ isActive }) => shellClass(isActive)}>Admin</NavLink>
          <NavLink to="/coordinator" className={({ isActive }) => shellClass(isActive)}>Coordinator</NavLink>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto">{children}</main>
    </div>
  )
}

function WinnersModal() {
  const { winnersVisible, winnersData, winnerSeries, dismissWinners } = useArena()

  const chartRows = useMemo(() => {
    const maxStep = Math.max(
      0,
      ...winnerSeries.flatMap((item) => item.points.map((point) => point.step))
    )
    const rows: Array<Record<string, number | string>> = []
    for (let step = 0; step <= maxStep; step += 1) {
      const row: Record<string, number | string> = { step }
      winnerSeries.forEach((series) => {
        const point = series.points.find((item) => item.step === step)
        row[series.teamName] = point?.score ?? 0
      })
      rows.push(row)
    }
    return rows
  }, [winnerSeries])

  if (!winnersVisible) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-amber-100 border-4 border-stone-900 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-stone-800 text-amber-100">
          <h3 className="text-xl font-bold">Session Winners</h3>
          <button type="button" onClick={dismissWinners} className="px-3 py-1 bg-amber-700 rounded">Close</button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            {winnersData.map((winner) => (
              <div key={winner.teamId} className="border-2 border-stone-700 rounded p-3 bg-amber-50">
                <p className="text-xs uppercase">{winner.rank} place</p>
                <p className="text-xl font-bold">{winner.name}</p>
                <p>{winner.score} pts</p>
              </div>
            ))}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRows}>
                <XAxis dataKey="step" />
                <YAxis />
                <Tooltip />
                {winnerSeries.map((series, index) => (
                  <Line
                    key={series.teamId}
                    type="monotone"
                    dataKey={series.teamName}
                    stroke={["#ef4444", "#0d9488", "#f59e0b"][index % 3]}
                    strokeWidth={3}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

function ArenaPage() {
  const { activeSession, teams, remainingTimeMs } = useArena()
  const ranked = [...teams].sort((a, b) => b.score - a.score)

  return (
    <PageShell>
      <section className="grid md:grid-cols-4 gap-3 mb-6">
        <div className="bg-amber-100 border-2 border-stone-800 rounded p-3"><Users className="inline mr-2" />Teams: {teams.length}</div>
        <div className="bg-amber-100 border-2 border-stone-800 rounded p-3"><Clock3 className="inline mr-2" />Time: {activeSession ? formatDuration(remainingTimeMs) : "--:--"}</div>
        <div className="bg-amber-100 border-2 border-stone-800 rounded p-3">Session: {activeSession?.name ?? "None"}</div>
        <div className="bg-amber-100 border-2 border-stone-800 rounded p-3">Session ID: {activeSession?.id ?? "-"}</div>
      </section>

      <section className="bg-amber-100 border-4 border-stone-900 rounded-lg">
        <div className="p-4 bg-stone-800 text-amber-100 flex items-center gap-2"><Trophy />Leaderboard</div>
        <div className="p-4 space-y-2">
          {ranked.map((team, index) => (
            <div key={team.id} className="flex justify-between bg-amber-50 border border-stone-400 rounded px-3 py-2">
              <span>{index + 1}. {team.name}</span>
              <span>{team.score} pts</span>
            </div>
          ))}
        </div>
      </section>
      <WinnersModal />
    </PageShell>
  )
}

function AdminPage() {
  const {
    sessions,
    activeSession,
    teams,
    questions,
    remainingTimeMs,
    createFullSession,
    addTeamToSession,
    addQuestionToSession,
    addTime,
    stopActive,
    refreshSessionData,
  } = useArena()

  const [name, setName] = useState("")
  const [duration, setDuration] = useState("45")
  const [teamText, setTeamText] = useState("Team A\nTeam B")
  const [uploadedQuestions, setUploadedQuestions] = useState<ParsedQuestion[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState("")
  const [teamName, setTeamName] = useState("")
  const [questionPrompt, setQuestionPrompt] = useState("")
  const [questionMarks, setQuestionMarks] = useState("1")

  const totalMarks = uploadedQuestions.reduce((sum, q) => sum + q.marks, 0)
  const selectedSession = sessions.find((item) => item.id === selectedSessionId)

  const handleCreate = async () => {
    const teamNames = teamText.split("\n").map((v) => v.trim()).filter(Boolean)
    if (!name.trim() || uploadedQuestions.length === 0 || teamNames.length === 0) return
    await createFullSession({
      name,
      durationMinutes: Number.parseInt(duration, 10) || 45,
      questions: uploadedQuestions,
      teamNames,
    })
    await refreshSessionData()
    setName("")
    setUploadedQuestions([])
    setTeamText("")
  }

  const onQuestionCsv = async (file: File) => {
    const text = await file.text()
    setUploadedQuestions(parseQuestionCsv(text))
  }

  const onTeamCsv = async (file: File) => {
    const text = await file.text()
    setTeamText(parseCsvFirstColumn(text).join("\n"))
  }

  const downloadMockQuestions = () => {
    const csv = [
      "prompt,description,category,difficulty,marks",
      "Caching Challenge,Implement cache layer,Backend,Hard,25",
      "UI Polishing,Refine responsive dashboard,Frontend,Medium,15",
      "Regex Parser,Parse logs with regex,Tools,Easy,10",
    ].join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "mock-questions.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadMockTeams = () => {
    const csv = ["team_name", "Code Raiders", "Bug Hunters", "Stack Masters"].join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "mock-teams.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageShell>
      <section className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-amber-100 border-4 border-stone-900 rounded-lg p-4 space-y-2">
          <h2 className="text-xl font-bold">Current Session</h2>
          <p>Name: {activeSession?.name ?? "None"}</p>
          <p>ID: {activeSession?.id ?? "-"}</p>
          <p>Time: {activeSession ? formatDuration(remainingTimeMs) : "--:--"}</p>
          <p>Teams: {teams.length} | Questions: {questions.length}</p>
          <div className="flex gap-2">
            <button onClick={() => void addTime(5)} className="px-3 py-2 bg-amber-700 text-amber-50 rounded">+5 min</button>
            <button onClick={() => void addTime(10)} className="px-3 py-2 bg-amber-700 text-amber-50 rounded">+10 min</button>
            <button onClick={() => void stopActive()} className="px-3 py-2 bg-red-700 text-red-50 rounded">Stop</button>
          </div>
        </div>

        <div className="bg-amber-100 border-4 border-stone-900 rounded-lg p-4 space-y-2">
          <h2 className="text-xl font-bold flex items-center gap-2"><Plus />Create Session</h2>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Session name" className="w-full border p-2 rounded" />
          <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration minutes" className="w-full border p-2 rounded" />

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Question CSV</label>
            <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && void onQuestionCsv(e.target.files[0])} />
            <button type="button" onClick={downloadMockQuestions} className="px-3 py-2 bg-amber-700 text-amber-50 rounded text-sm">Download mock questions csv</button>
            <p className="text-sm">Questions loaded: {uploadedQuestions.length} | Total marks: {totalMarks}</p>

            <label className="text-sm font-semibold">Teams CSV</label>
            <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && void onTeamCsv(e.target.files[0])} />
            <button type="button" onClick={downloadMockTeams} className="px-3 py-2 bg-amber-700 text-amber-50 rounded text-sm">Download mock teams csv</button>
            <textarea value={teamText} onChange={(e) => setTeamText(e.target.value)} className="w-full min-h-20 border p-2 rounded" />
          </div>

          <button onClick={() => void handleCreate()} className="px-3 py-2 bg-emerald-700 text-emerald-50 rounded w-full">Create and Activate</button>
        </div>
      </section>

      <section className="bg-amber-100 border-4 border-stone-900 rounded-lg p-4 space-y-3">
        <h2 className="text-xl font-bold">Session-bound Team and Question Manager</h2>
        <select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} className="w-full border p-2 rounded">
          <option value="">Select session</option>
          {sessions.map((item) => (
            <option key={item.id} value={item.id}>{item.name} ({item.id})</option>
          ))}
        </select>

        {selectedSession && (
          <>
            <p className="text-sm">Selected session ID: {selectedSession.id}</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <h3 className="font-bold">Add Team</h3>
                <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name" className="w-full border p-2 rounded" />
                <button
                  onClick={() => void addTeamToSession(selectedSession.id, teamName).then(() => setTeamName(""))}
                  className="px-3 py-2 bg-amber-700 text-amber-50 rounded"
                >
                  Add Team
                </button>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold">Add Question</h3>
                <input value={questionPrompt} onChange={(e) => setQuestionPrompt(e.target.value)} placeholder="Prompt" className="w-full border p-2 rounded" />
                <input value={questionMarks} onChange={(e) => setQuestionMarks(e.target.value)} placeholder="Marks" className="w-full border p-2 rounded" />
                <button
                  onClick={() => void addQuestionToSession(selectedSession.id, {
                    prompt: questionPrompt,
                    description: "",
                    category: "General",
                    difficulty: "Medium",
                    marks: Number.parseInt(questionMarks, 10) || 1,
                  }).then(() => {
                    setQuestionPrompt("")
                    setQuestionMarks("1")
                  })}
                  className="px-3 py-2 bg-amber-700 text-amber-50 rounded"
                >
                  Add Question
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="bg-amber-100 border-4 border-stone-900 rounded-lg p-4 mt-6">
        <h2 className="text-xl font-bold">Session History</h2>
        <div className="space-y-2 mt-3">
          {sessions.map((item) => (
            <div key={item.id} className="flex justify-between border rounded p-2 bg-amber-50">
              <span>{item.name} ({item.id})</span>
              <span>{item.status}</span>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  )
}

function CoordinatorPage() {
  const { activeSession, teams, questions, awardCompletion } = useArena()
  const [teamId, setTeamId] = useState("")
  const [questionId, setQuestionId] = useState("")
  const [message, setMessage] = useState("")

  const selectedQuestion = questions.find((q) => q.id === questionId)

  const handleStamp = async () => {
    if (!teamId || !questionId) return
    try {
      await awardCompletion(teamId, questionId)
      setMessage("Completion recorded")
      setTeamId("")
      setQuestionId("")
    } catch (error) {
      setMessage((error as Error).message)
    }
  }

  return (
    <PageShell>
      <section className="bg-amber-100 border-4 border-stone-900 rounded-lg p-4 space-y-3">
        <h2 className="text-xl font-bold">Coordinator Deck</h2>
        <p>Active session: {activeSession?.name ?? "None"} ({activeSession?.id ?? "-"})</p>

        <div className="grid md:grid-cols-2 gap-3">
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-full border p-2 rounded">
            <option value="">Select team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>

          <select value={questionId} onChange={(e) => setQuestionId(e.target.value)} className="w-full border p-2 rounded">
            <option value="">Select question</option>
            {questions.map((question) => (
              <option key={question.id} value={question.id}>{question.prompt} ({question.marks} pts)</option>
            ))}
          </select>
        </div>

        {selectedQuestion && <p className="text-sm">Marks for selected question: {selectedQuestion.marks}</p>}

        <button onClick={() => void handleStamp()} className="px-4 py-2 bg-red-700 text-red-50 rounded">Stamp Completion</button>
        {message && <p className="text-sm">{message}</p>}

        <Link to="/" className="inline-block mt-2 text-amber-900 underline">Back to Arena</Link>
      </section>
    </PageShell>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ArenaPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/coordinator" element={<CoordinatorPage />} />
    </Routes>
  )
}

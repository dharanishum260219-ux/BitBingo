"use client"

import { useState } from "react"
import Link from "next/link"
import { useArena } from "@/lib/arena-context"
import { FantasyBackground } from "@/components/fantasy-background"
import {
  ArrowLeft,
  Upload,
  Zap,
  Gem,
  Scroll,
  Stamp,
} from "lucide-react"

function Btn({
  children,
  variant = "default",
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode
  variant?: "default" | "gold" | "stamp"
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-sans font-bold border-2 rounded-lg px-4 py-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
  const styles: Record<string, string> = {
    default:
      "border-[#7a6130] bg-gradient-to-b from-[#e8d48a] to-[#c9a84c] text-[#3d2b00] shadow-[0_3px_0_#7a6130] hover:shadow-[0_4px_0_#7a6130]",
    gold:
      "border-[#7a6130] bg-gradient-to-b from-[#d4a930] to-[#b8860b] text-white shadow-[0_3px_0_#5c4000] hover:shadow-[0_4px_0_#5c4000] w-full text-center uppercase tracking-wider text-sm",
    stamp:
      "border-stone-900 bg-red-600 text-white shadow-[4px_4px_0_rgba(0,0,0,0.7)] hover:shadow-[6px_6px_0_rgba(0,0,0,0.8)] text-xl tracking-wider px-8 py-4 border-4",
  }

  return (
    <button
      type="button"
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
    <div className={`bg-[#e8d9a0] border-4 border-stone-900 rounded-lg shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden ${className}`}>
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
  }
  return (
    <>
      <div className="bg-stone-800 px-4 py-3 flex items-center gap-3">
        <span className="text-amber-400">{icon}</span>
        <h2 className="font-sans text-xl font-bold text-amber-100 tracking-wide">{title}</h2>
      </div>
      <div className={`h-2 bg-gradient-to-r ${gradients[color] || gradients.amber}`} />
    </>
  )
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-sans font-bold text-stone-800 text-[10px] uppercase tracking-widest mb-1">
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
      className="w-full px-4 py-3 bg-white/70 border-b-4 border-stone-900 font-sans text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-amber-100/70 transition-colors"
    />
  )
}

function SelectInput({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-white/70 border-2 border-stone-900 font-sans text-stone-800 focus:outline-none rounded-lg cursor-pointer"
    >
      <option value="">{placeholder ?? "Select..."}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

interface CompletionDetails {
  team: string
  quest: string
  proof: string
  session: string
  stampedAt: string
  newScore: number
}

function CompletionPopup({ details, onClose }: { details: CompletionDetails | null; onClose: () => void }) {
  if (!details) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close completion popup"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <div className="relative w-full max-w-xl bg-amber-100 border-4 border-stone-900 rounded-xl shadow-[8px_8px_0_rgba(0,0,0,1)] overflow-hidden">
        <div className="bg-stone-800 px-5 py-4 flex items-center gap-3">
          <Stamp className="w-6 h-6 text-amber-400" />
          <h3 className="font-sans text-xl font-bold text-amber-100 tracking-wide">Challenge Completed</h3>
        </div>
        <div className="h-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600" />

        <div className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-widest text-stone-600">Team</p>
              <p className="font-sans font-bold text-stone-900 text-lg">{details.team}</p>
            </div>
            <div>
              <p className="font-sans text-[10px] uppercase tracking-widest text-stone-600">Session</p>
              <p className="font-sans font-bold text-stone-900 text-lg">{details.session}</p>
            </div>
            <div>
              <p className="font-sans text-[10px] uppercase tracking-widest text-stone-600">Quest</p>
              <p className="font-sans font-bold text-stone-900 text-lg">{details.quest}</p>
            </div>
            <div>
              <p className="font-sans text-[10px] uppercase tracking-widest text-stone-600">Updated Score</p>
              <p className="font-sans font-bold text-emerald-700 text-lg">{details.newScore} PTS</p>
            </div>
          </div>

          <div>
            <p className="font-sans text-[10px] uppercase tracking-widest text-stone-600 mb-1">Proof / Notes</p>
            <p className="font-sans text-stone-800 bg-orange-50 border-2 border-stone-300 rounded-lg px-3 py-2 min-h-12">
              {details.proof || "No additional proof notes provided."}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs font-sans uppercase tracking-wider text-stone-600">
            <span>Stamped at {details.stampedAt}</span>
            <span className="text-emerald-700 font-bold">Successfully Logged</span>
          </div>
        </div>

        <div className="border-t-2 border-stone-400 bg-amber-200/60 px-5 py-3 flex justify-end">
          <Btn onClick={onClose} className="px-6">Close</Btn>
        </div>
      </div>
    </div>
  )
}

function SessionSummaryPanel() {
  const { activeSession, teams } = useArena()

  return (
    <Card className="mb-8">
      <CardHeader icon={<Zap className="w-6 h-6" />} title="Active Session Summary" color="emerald" />
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="font-sans text-[10px] uppercase tracking-widest text-stone-600">Session</p>
          <p className="font-sans text-lg font-bold text-stone-900">
            {activeSession ? activeSession.name : "-"}
          </p>
        </div>
        <div>
          <p className="font-sans text-[10px] uppercase tracking-widest text-stone-600">Time Remaining</p>
          <p className="font-sans text-lg font-bold text-stone-900">45:00</p>
        </div>
        <div>
          <p className="font-sans text-[10px] uppercase tracking-widest text-stone-600">Live Teams</p>
          <p className="font-sans text-lg font-bold text-stone-900">{teams.length}</p>
        </div>
        <div>
          <p className="font-sans text-[10px] uppercase tracking-widest text-stone-600">Status</p>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-3 h-3 rounded-full ${activeSession ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`} />
            <span className={`font-sans font-bold text-sm ${activeSession ? "text-emerald-700" : "text-stone-500"}`}>
              {activeSession ? "LIVE" : "INACTIVE"}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function ControlDeckPanel() {
  const { teams, challenges, logCompletion, activeSession } = useArena()
  const [selectedTeam, setSelectedTeam] = useState("")
  const [selectedQuest, setSelectedQuest] = useState("")
  const [proof, setProof] = useState("")
  const [completionDetails, setCompletionDetails] = useState<CompletionDetails | null>(null)

  const handleStamp = async () => {
    if (!selectedTeam || !selectedQuest) return
    const team = teams.find((t) => t.name === selectedTeam)
    const challenge = challenges.find((entry) => entry.title === selectedQuest)

    if (team && challenge) {
      await logCompletion({
        participantId: team.id,
        challengeId: challenge.id,
        proofUrl: proof.trim() || null,
      })
      setCompletionDetails({
        team: selectedTeam,
        quest: selectedQuest,
        proof: proof.trim(),
        session: activeSession?.name ?? "No Active Session",
        stampedAt: new Date().toLocaleString(),
        newScore: team.score + challenge.points,
      })
    }
    setSelectedTeam("")
    setSelectedQuest("")
    setProof("")
  }

  const teamNames = teams.map((t) => t.name)
  const questNames = challenges.map((challenge) => challenge.title)

  return (
    <>
      <Card>
        <CardHeader icon={<Scroll className="w-6 h-6" />} title="Control Deck: Log Completions" color="teal" />
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <FormLabel>Select Team</FormLabel>
              <SelectInput value={selectedTeam} onChange={setSelectedTeam} options={teamNames} placeholder="Select Team" />
            </div>
            <div>
              <FormLabel>Select Quest / Tile</FormLabel>
              <SelectInput value={selectedQuest} onChange={setSelectedQuest} options={questNames} placeholder="Select Quest" />
            </div>
          </div>

          <div>
            <FormLabel>Proof of Completion</FormLabel>
            <div className="bg-amber-200/30 border-4 border-dashed border-stone-700 rounded-lg p-6 text-center cursor-pointer hover:bg-amber-200/50 transition-colors">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-orange-200 border-2 border-stone-800 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-stone-700" />
                </div>
                <div>
                  <p className="font-sans font-bold text-stone-800">Upload Intel Dossier</p>
                  <p className="text-sm font-sans text-stone-600">Screenshot, photo, or verification</p>
                </div>
              </div>
            </div>
            <textarea
              placeholder="Add notes or verification details..."
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              className="mt-3 w-full px-4 py-3 bg-amber-50/50 border-2 border-stone-900 font-sans text-stone-800 placeholder-stone-400 focus:outline-none rounded-lg min-h-20 resize-none"
            />
          </div>

          <div className="flex justify-center pt-2">
            <Btn
              variant="stamp"
              onClick={handleStamp}
              disabled={!selectedTeam || !selectedQuest}
            >
              <Stamp className="w-6 h-6" />
              STAMP COMPLETION
            </Btn>
          </div>
        </div>
      </Card>

      <CompletionPopup details={completionDetails} onClose={() => setCompletionDetails(null)} />
    </>
  )
}

export default function CoordinatorDeck() {
  return (
    <FantasyBackground>
      <header className="sticky top-0 z-40 bg-stone-800 border-b-4 border-stone-900 shadow-[0_4px_0_rgba(0,0,0,0.3)]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white font-sans font-bold border-2 border-stone-900 rounded-lg hover:-translate-y-0.5 transition-all shadow-[0_2px_0_rgba(0,0,0,0.6)]"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Arena
            </button>
          </Link>

          <h1 className="font-cursive text-3xl md:text-4xl font-bold text-amber-100 tracking-wide">
            Coordinator Deck
          </h1>

          <div className="w-28" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 pb-24">
        <SessionSummaryPanel />
        <ControlDeckPanel />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-stone-800 border-t-4 border-stone-900 py-2 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-2">
          <Gem className="w-4 h-4 text-teal-400" />
          <span className="font-sans text-xs text-stone-400 uppercase tracking-widest">BitBingo Coordinator System</span>
          <span className="text-stone-600">•</span>
          <span className="font-sans text-xs text-stone-500">v1.0.0</span>
        </div>
      </footer>
    </FantasyBackground>
  )
}

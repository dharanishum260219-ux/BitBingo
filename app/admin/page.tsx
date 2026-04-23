"use client"

import { useState } from "react"
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
  const { activeSession, stopSession } = useArena()

  return (
    <Card>
      <CardHeader icon={<Clock className="w-6 h-6" />} title="Current Session" color="emerald" />
      <div className="p-5">
        {activeSession ? (
          <div className="bg-white/50 border-2 border-dashed border-stone-500 rounded-lg p-4">
            <p className="font-cursive text-2xl text-stone-800">{activeSession.name}</p>
            <p className="text-xs uppercase tracking-widest font-serif font-bold text-emerald-600 mt-1">
              ACTIVE
            </p>
            <Btn
              variant="stop"
              onClick={() => void stopSession(activeSession.id)}
              className="mt-3"
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

  const handleCreate = async () => {
    if (!name.trim()) return
    await createSession(name)
    setName("")
  }

  return (
    <Card>
      <CardHeader icon={<Plus className="w-6 h-6" />} title="Create Session" color="teal" />
      <div className="p-5 space-y-4">
        <div>
          <FormLabel>Session Name</FormLabel>
          <TextInput value={name} onChange={setName} placeholder="Spring Sprint" />
        </div>
        <Btn
          variant="gold"
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full py-3"
        >
          CREATE AND ACTIVATE SESSION
        </Btn>
      </div>
    </Card>
  )
}

function RegisterTeamPanel() {
  const { registerTeam } = useArena()
  const [name, setName] = useState("")

  const handleSubmit = async () => {
    if (!name.trim()) return
    await registerTeam(name)
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
          disabled={!name.trim()}
          className="w-full py-3"
        >
          REGISTER TEAM
        </Btn>
      </div>
    </Card>
  )
}

function ActiveRosterPanel() {
  const { teams, deleteTeam } = useArena()

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
            <div key={team.id} className="flex items-center justify-between py-3 px-2">
              <span className="font-cursive text-xl text-stone-800">{team.name}</span>
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-[10px] uppercase tracking-widest font-serif text-stone-500 whitespace-nowrap">
                  {team.score} PTS
                </span>
                <Btn variant="stop" onClick={() => void deleteTeam(team.id)}>
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
          <Btn variant="default">
            <LogOut className="w-4 h-4" />
            SIGN OUT
          </Btn>
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

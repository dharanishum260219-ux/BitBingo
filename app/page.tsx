"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useArena } from "@/lib/arena-context"
import { FantasyBackground } from "@/components/fantasy-background"
import {
  Trophy,
  Scroll,
  Swords,
  Crown,
  Shield,
  Star,
  Zap,
  Target,
  Flame,
  Gem,
  Map,
  Maximize2,
  Minimize2,
  Play,
  Check,
  Users,
  Clock,
  Award,
  Settings,
} from "lucide-react"

interface BoardTile {
  id: number
  label: string
  description: string
  points: number
  specialType: "center" | "corner" | "diagonal" | "cross" | "edge" | "standard"
  completed: boolean
  completedBy: string | null
  completedAt: string | null
  proofUrl: string | null
  sessionName: string | null
  isFreeSpace: boolean
  icon: React.ReactNode
}

function toImageUrl(value: string | null) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^data:image\//i.test(trimmed)) return trimmed
  return null
}

function getSpecialStyle(tile: BoardTile) {
  if (tile.completed) {
    return "bg-stone-300 shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
  }

  switch (tile.specialType) {
    case "center":
      return "bg-gradient-to-br from-teal-300 to-cyan-300 shadow-[3px_3px_0_rgba(0,0,0,1)]"
    case "corner":
      return "bg-gradient-to-br from-yellow-100 to-orange-200 shadow-[3px_3px_0_rgba(0,0,0,1)]"
    case "diagonal":
      return "bg-gradient-to-br from-emerald-100 to-teal-200 shadow-[3px_3px_0_rgba(0,0,0,1)]"
    case "cross":
      return "bg-gradient-to-br from-sky-100 to-cyan-100 shadow-[3px_3px_0_rgba(0,0,0,1)]"
    case "edge":
      return "bg-gradient-to-br from-amber-100 to-orange-100 shadow-[3px_3px_0_rgba(0,0,0,1)]"
    default:
      return "bg-gradient-to-br from-stone-100 to-amber-100 shadow-[3px_3px_0_rgba(0,0,0,1)]"
  }
}

function getSpecialLabel(type: BoardTile["specialType"]) {
  switch (type) {
    case "center":
      return "Center"
    case "corner":
      return "Corner"
    case "diagonal":
      return "Diagonal"
    case "cross":
      return "Cross Lane"
    case "edge":
      return "Edge"
    default:
      return "Standard"
  }
}

const questIcons = [
  <Swords key="swords" className="w-5 h-5" />,
  <Shield key="shield" className="w-5 h-5" />,
  <Scroll key="scroll" className="w-5 h-5" />,
  <Gem key="gem" className="w-5 h-5" />,
  <Flame key="flame" className="w-5 h-5" />,
  <Target key="target" className="w-5 h-5" />,
  <Zap key="zap" className="w-5 h-5" />,
  <Map key="map" className="w-5 h-5" />,
  <Crown key="crown" className="w-5 h-5" />,
  <Trophy key="trophy" className="w-5 h-5" />,
  <Star key="star" className="w-5 h-5" />,
  <Award key="award" className="w-5 h-5" />,
]

function QuestChip({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 bg-orange-100 border-2 border-stone-800 rounded-full px-3 md:px-4 py-2 shadow-[2px_2px_0_rgba(0,0,0,1)]">
      <span className="text-orange-600">{icon}</span>
      <span className="font-serif text-[10px] md:text-xs uppercase tracking-wider md:tracking-widest text-stone-600 whitespace-nowrap">{label}</span>
      <span className="font-serif font-bold text-sm md:text-base text-stone-900 whitespace-nowrap">{value}</span>
    </div>
  )
}

function ActionButton({
  children,
  variant = "primary",
  icon,
  onClick,
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary"
  icon?: React.ReactNode
  onClick?: () => void
}) {
  const base =
    "inline-flex w-full sm:w-auto items-center justify-center gap-3 px-4 py-3 md:px-6 md:py-4 font-serif font-bold text-base md:text-lg border-4 border-stone-900 rounded-lg transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_rgba(0,0,0,1)] cursor-pointer"
  const variants = {
    primary: "bg-teal-600 text-white shadow-[4px_4px_0_rgba(0,0,0,1)]",
    secondary: "bg-orange-500 text-white shadow-[4px_4px_0_rgba(0,0,0,1)]",
  }
  return (
    <button className={`${base} ${variants[variant]}`} onClick={onClick}>
      {icon}
      {children}
    </button>
  )
}

function RankMedal({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "bg-yellow-400 text-yellow-900 border-yellow-600",
    2: "bg-gray-300 text-gray-700 border-gray-500",
    3: "bg-orange-400 text-orange-900 border-orange-600",
  }
  const def = "bg-stone-200 text-stone-600 border-stone-400"
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-sm border-2 ${colors[rank] || def}`}>
      {rank}
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-3 bg-stone-300 rounded-full border border-stone-500 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

function BountyBoard() {
  const { teams } = useArena()
  const ranked = [...teams]
    .sort((a, b) => b.score - a.score)
    .map((t, i) => ({ ...t, rank: i + 1 }))
  const maxScore = Math.max(...ranked.map((t) => t.score), 1)

  return (
    <div className="bg-amber-100 border-4 border-stone-900 rounded-lg shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden">
      <div className="bg-stone-800 px-4 py-3 flex items-center gap-3">
        <Scroll className="w-6 h-6 text-amber-400" />
        <h2 className="font-serif text-xl font-bold text-amber-100 tracking-wide">Bounty Board</h2>
      </div>
      <div className="h-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600" />

      <div className="p-4 space-y-3">
        {ranked.length === 0 && (
          <p className="text-center font-serif text-stone-500 py-4 text-sm">No teams yet.</p>
        )}
        {ranked.map((team) => (
          <div
            key={team.id}
            className={`flex items-center gap-4 p-3 rounded-lg border-2 border-stone-700 transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_rgba(0,0,0,0.8)] ${
              team.rank === 1 ? "bg-yellow-100" : "bg-orange-50"
            }`}
          >
            <RankMedal rank={team.rank} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-cursive text-lg md:text-xl text-stone-800 truncate">{team.name}</span>
                <span className="font-serif text-xs uppercase tracking-wider text-stone-500 ml-2 whitespace-nowrap">
                  {team.score} pts
                </span>
              </div>
              <ProgressBar value={(team.score / maxScore) * 100} />
            </div>
            {team.rank === 1 && <Crown className="w-5 h-5 text-yellow-600 flex-shrink-0" />}
          </div>
        ))}
      </div>

      <div className="border-t-2 border-stone-400 bg-amber-200/50 px-4 py-2">
        <p className="font-serif text-xs text-stone-600 text-center uppercase tracking-widest">
          Updated in real-time
        </p>
      </div>
    </div>
  )
}

function BingoTileComponent({ tile, onClick }: { tile: BoardTile; onClick: () => void }) {
  const base =
    "relative aspect-square flex flex-col items-center justify-center p-2 border-[3px] border-stone-800 rounded-lg transition-all cursor-pointer"

  const style = `${getSpecialStyle(tile)} ${tile.completed ? "" : "hover:-translate-y-1 hover:shadow-[5px_5px_0_rgba(0,0,0,1)]"}`

  return (
    <button className={`${base} ${style}`} onClick={onClick} aria-label={tile.label}>
      <div className="absolute inset-1 border border-white/40 rounded pointer-events-none" />
      <div className="absolute left-1 top-1 rounded-full border border-stone-800 bg-white/80 px-1.5 py-0.5 font-serif text-[10px] font-bold text-stone-700">
        {tile.points}
      </div>
      <div className={tile.completed ? "text-stone-500" : "text-stone-700"}>{tile.icon}</div>
      <span
        className={`mt-1 hidden w-full overflow-hidden text-ellipsis whitespace-nowrap px-0.5 font-serif text-xs font-bold text-center leading-tight sm:block ${
          tile.completed ? "text-stone-500 line-through" : "text-stone-800"
        }`}
      >
        {tile.label}
      </span>
      <span className="mt-0.5 hidden font-serif text-[9px] uppercase tracking-wider text-stone-500 sm:block">
        {getSpecialLabel(tile.specialType)}
      </span>
      {tile.completed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center border-2 border-red-800 rotate-12 shadow-lg">
            <Check className="w-6 h-6 text-white stroke-[3]" />
          </div>
        </div>
      )}
      {tile.isFreeSpace && (
        <div className="absolute -top-1 -right-1">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
        </div>
      )}
    </button>
  )
}

function QuestGrid({ tiles, onTileClick }: { tiles: BoardTile[]; onTileClick: (id: number) => void }) {
  return (
    <div className="w-full max-w-full bg-amber-100 border-4 border-stone-900 rounded-lg shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden">
      <div className="bg-stone-800 px-4 py-3 flex items-center gap-3">
        <Map className="w-6 h-6 text-teal-400" />
        <h2 className="font-serif text-xl font-bold text-amber-100 tracking-wide">Quest Grid</h2>
      </div>
      <div className="h-2 bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-600" />
      <div className="overflow-x-auto p-3 md:p-4">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {tiles.map((tile) => (
            <BingoTileComponent key={tile.id} tile={tile} onClick={() => onTileClick(tile.id)} />
          ))}
        </div>
      </div>
      <div className="border-t-2 border-stone-400 bg-amber-200/50 px-3 md:px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-serif text-xs text-stone-600 uppercase tracking-widest">
          {tiles.filter((t) => t.completed).length} / 25 Completed
        </p>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="font-serif text-xs text-emerald-700 uppercase tracking-wider">Live</span>
        </div>
      </div>
    </div>
  )
}

export default function HomeArena() {
  const { teams, challenges, sessions, selectedSessionId, selectSession, isLoading } = useArena()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedTile, setSelectedTile] = useState<BoardTile | null>(null)
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    syncFullscreenState()
    document.addEventListener("fullscreenchange", syncFullscreenState)
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState)
  }, [])

  const bingoTiles = useMemo<BoardTile[]>(
    () =>
      challenges.map((challenge) => ({
        id: challenge.position,
        label: challenge.title,
        description: challenge.description,
        points: challenge.points,
        specialType: challenge.specialType,
        completed: challenge.completed,
        completedBy: challenge.completedBy,
        completedAt: challenge.completedAt,
        proofUrl: challenge.proofUrl,
        sessionName: challenge.sessionName ?? selectedSession?.name ?? null,
        isFreeSpace: challenge.position === 12,
        icon: questIcons[challenge.position % questIcons.length],
      })),
    [challenges, selectedSession?.name],
  )

  const handleTileClick = (id: number) => {
    const clickedTile = bingoTiles.find((tile) => tile.id === id)

    if (clickedTile?.completed) {
      setSelectedTile(clickedTile)
    }
  }

  const completedCount = bingoTiles.filter((t) => t.completed).length
  const totalScore = teams.reduce((acc, t) => acc + t.score, 0)
  const proofImageUrl = selectedTile ? toImageUrl(selectedTile.proofUrl) : null

  const handleFullscreenToggle = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
  }

  const closeTileDetails = () => setSelectedTile(null)

  return (
    <FantasyBackground>
      {!isFullscreen && (
        <Link href="/admin">
          <button
            className="fixed top-3 right-3 md:top-4 md:right-4 z-50 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-amber-600 to-orange-700 border-4 border-stone-900 rounded-full flex items-center justify-center shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer"
            aria-label="Admin Panel"
          >
            <Settings className="w-6 h-6 md:w-7 md:h-7 text-amber-100" />
          </button>
        </Link>
      )}

      {!isFullscreen ? (
        <>
          <main className="max-w-7xl mx-auto px-3 md:px-4 py-6 md:py-8 pb-10 md:pb-12">
            <section className="text-center mb-8 md:mb-10">
              <div className="relative inline-block mb-6">
                <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-stone-900 tracking-tight">
                  Live Quest Arena
                </h1>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-600 to-transparent" />
              </div>

              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <QuestChip label="Active" value={`${teams.length} Teams`} icon={<Users className="w-4 h-4" />} />
                <QuestChip label="Quests" value={`${completedCount}/25`} icon={<Target className="w-4 h-4" />} />
                <QuestChip label="Total" value={totalScore.toLocaleString()} icon={<Trophy className="w-4 h-4" />} />
                <QuestChip label="Time" value={selectedSession ? "2:45:30" : "Awaiting"} icon={<Clock className="w-4 h-4" />} />
              </div>

              <div className="mx-auto mb-8 w-full max-w-md rounded-xl border-2 border-stone-900 bg-amber-100 px-4 py-3 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <label className="mb-2 block font-serif text-xs uppercase tracking-[0.2em] text-stone-600">Select Session</label>
                <select
                  value={selectedSessionId ?? ""}
                  onChange={(event) => selectSession(event.target.value)}
                  className="w-full rounded-lg border-2 border-stone-900 bg-white px-3 py-2 font-serif text-stone-900"
                >
                  {sessions.length === 0 && <option value="">No sessions available</option>}
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4">
                <Link href="/coordinator">
                  <ActionButton variant="primary" icon={<Play className="w-5 h-5" />}>
                    Launch Coordinator
                  </ActionButton>
                </Link>
                <ActionButton
                  variant="secondary"
                  icon={<Maximize2 className="w-5 h-5" />}
                  onClick={handleFullscreenToggle}
                >
                  Enter Fullscreen Arena
                </ActionButton>
              </div>
            </section>

            <section className="grid lg:grid-cols-5 gap-6">
              <div className="min-w-0 lg:col-span-2">
                <BountyBoard />
              </div>
              <div className="min-w-0 lg:col-span-3">
                <QuestGrid tiles={bingoTiles} onTileClick={handleTileClick} />
              </div>
            </section>

            {isLoading && (
              <div className="mt-6 rounded-xl border-2 border-stone-800 bg-amber-50 px-4 py-3 font-serif text-sm text-stone-700 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                Loading arena data from the database...
              </div>
            )}
          </main>

          <footer className="mt-8 min-h-16 bg-stone-800 border-t-4 border-stone-900 py-2 px-3 md:px-4">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center leading-tight">
              <Gem className="w-4 h-4 text-teal-400" />
              <span className="font-serif text-[10px] md:text-xs text-stone-400 uppercase tracking-wide md:tracking-widest">BitBingo System</span>
              <span className="text-stone-600">•</span>
              <span className="font-serif text-[10px] md:text-xs text-stone-500">v1.0.0</span>
            </div>
          </footer>
        </>
      ) : (
        <div className="fixed inset-0 z-40 bg-[radial-gradient(circle_at_top,_#f8f1dc_0%,_#ead7a3_42%,_#d3b97b_100%)] overflow-y-auto">
          <div className="mx-auto min-h-full w-full max-w-[1800px] px-3 md:px-6 py-3 md:py-5">
            <div className="sticky top-3 z-50 mb-4 inline-flex">
              <button
                type="button"
                onClick={handleFullscreenToggle}
                className="inline-flex items-center gap-2 rounded-lg border-4 border-stone-900 bg-orange-500 px-4 py-2 font-serif text-sm font-bold text-white shadow-[4px_4px_0_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_rgba(0,0,0,1)]"
              >
                <Minimize2 className="w-4 h-4" />
                Exit Fullscreen
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <div className="flex flex-wrap gap-2">
                <QuestChip label="Active" value={`${teams.length} Teams`} icon={<Users className="w-4 h-4" />} />
                <QuestChip label="Quests" value={`${completedCount}/25`} icon={<Target className="w-4 h-4" />} />
                <QuestChip label="Total" value={totalScore.toLocaleString()} icon={<Trophy className="w-4 h-4" />} />
              </div>
              <div className="min-w-56 rounded-lg border-2 border-stone-900 bg-amber-100 px-3 py-2 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                <label className="mb-1 block font-serif text-[10px] uppercase tracking-[0.2em] text-stone-600">Select Session</label>
                <select
                  value={selectedSessionId ?? ""}
                  onChange={(event) => selectSession(event.target.value)}
                  className="w-full rounded border border-stone-900 bg-white px-2 py-1 font-serif text-sm text-stone-900"
                >
                  {sessions.length === 0 && <option value="">No sessions available</option>}
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <section className="grid items-start gap-4 md:gap-6 xl:grid-cols-5">
              <div className="min-w-0 xl:col-span-2 xl:pt-3">
                <BountyBoard />
              </div>
              <div className="min-w-0 xl:col-span-3">
                <QuestGrid tiles={bingoTiles} onTileClick={handleTileClick} />
              </div>
            </section>

            {isLoading && (
              <div className="mt-6 rounded-xl border-2 border-stone-800 bg-amber-50 px-4 py-3 font-serif text-sm text-stone-700 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                Loading arena data from the database...
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 px-2 sm:px-4 py-4 sm:py-8"
          onClick={closeTileDetails}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border-4 border-stone-900 bg-amber-50 shadow-[10px_10px_0_rgba(0,0,0,1)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="challenge-details-title"
          >
            <div className="flex items-center justify-between gap-2 bg-stone-800 px-3 sm:px-5 py-3 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-300 bg-stone-700 text-amber-300">
                  {selectedTile.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-serif text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-amber-300">Completed Challenge</p>
                  <h2 id="challenge-details-title" className="font-serif text-lg sm:text-2xl font-bold text-amber-50 break-words">
                    {selectedTile.label}
                  </h2>
                </div>
              </div>
              <button
                className="shrink-0 rounded-full border-2 border-amber-300 px-2 sm:px-3 py-1 font-serif text-xs sm:text-sm font-bold text-amber-100 transition hover:bg-stone-700"
                onClick={closeTileDetails}
              >
                Close
              </button>
            </div>

            <div className="grid max-h-[70vh] gap-4 sm:gap-5 overflow-y-auto p-3 sm:p-5 md:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div className="rounded-xl border-2 border-stone-800 bg-white/80 p-4">
                  <p className="font-serif text-xs uppercase tracking-widest text-stone-500">Challenge Details</p>
                  <div className="mt-3 space-y-3 font-serif text-stone-800">
                    <div className="flex items-start justify-between gap-4 border-b border-stone-300 pb-2">
                      <span className="text-sm uppercase tracking-wide text-stone-500">Tile ID</span>
                      <span className="text-lg font-bold text-right break-words">#{selectedTile.id + 1}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4 border-b border-stone-300 pb-2">
                      <span className="text-sm uppercase tracking-wide text-stone-500">Status</span>
                      <span className="text-lg font-bold text-emerald-700 text-right break-words">Completed</span>
                    </div>
                    <div className="flex items-start justify-between gap-4 border-b border-stone-300 pb-2">
                      <span className="text-sm uppercase tracking-wide text-stone-500">Points</span>
                      <span className="text-lg font-bold text-orange-700 text-right break-words">+{selectedTile.points}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4 border-b border-stone-300 pb-2">
                      <span className="text-sm uppercase tracking-wide text-stone-500">Tier</span>
                      <span className="text-lg font-bold text-right break-words">{getSpecialLabel(selectedTile.specialType)}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4 border-b border-stone-300 pb-2">
                      <span className="text-sm uppercase tracking-wide text-stone-500">Challenge</span>
                      <span className="text-lg font-bold text-right break-words">{selectedTile.label}</span>
                    </div>
                    <div className="border-b border-stone-300 pb-2">
                      <span className="block text-sm uppercase tracking-wide text-stone-500">Description</span>
                      <p className="mt-1 text-base leading-6 text-stone-700">{selectedTile.description}</p>
                    </div>
                    <div className="flex items-start justify-between gap-4 border-b border-stone-300 pb-2">
                      <span className="text-sm uppercase tracking-wide text-stone-500">Completed By</span>
                      <span className="text-lg font-bold text-right break-words">{selectedTile.completedBy ?? "Unknown"}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm uppercase tracking-wide text-stone-500">Session</span>
                      <span className="text-lg font-bold text-right break-words">{selectedTile.sessionName ?? "Unknown"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-stone-800 bg-amber-100 p-4">
                  <p className="font-serif text-xs uppercase tracking-widest text-stone-600">Output Proof</p>
                  {proofImageUrl ? (
                    <div className="mt-3 overflow-hidden rounded-lg border-2 border-stone-800 bg-white">
                      <img
                        src={proofImageUrl}
                        alt={`${selectedTile.label} output proof`}
                        className="h-auto w-full max-h-80 object-contain"
                      />
                    </div>
                  ) : selectedTile.proofUrl ? (
                    <p className="mt-3 rounded-lg border-2 border-stone-800 bg-white/80 px-3 py-2 font-serif text-sm leading-6 text-stone-700 break-all">
                      {selectedTile.proofUrl}
                    </p>
                  ) : (
                    <p className="mt-3 font-serif text-sm text-stone-600">No proof attached.</p>
                  )}
                  {selectedTile.completedAt && (
                    <p className="mt-3 font-serif text-xs uppercase tracking-[0.2em] text-stone-500">
                      Completed at {new Date(selectedTile.completedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border-2 border-stone-800 bg-amber-100 p-4">
                <p className="font-serif text-xs uppercase tracking-widest text-stone-500">Visual Mark</p>
                <div className="mt-3 flex aspect-square items-center justify-center rounded-2xl border-2 border-stone-800 bg-gradient-to-br from-amber-50 to-orange-100 p-4 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <div className="relative flex h-full w-full flex-col items-center justify-center rounded-xl border-[3px] border-stone-800 bg-stone-300 p-4 text-center">
                    <div className="text-stone-600">{selectedTile.icon}</div>
                    <span className="mt-3 font-serif text-lg font-bold text-stone-800">{selectedTile.label}</span>
                    <span className="mt-2 rounded-full border-2 border-emerald-700 bg-emerald-100 px-3 py-1 font-serif text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
                      Completed
                    </span>
                    {selectedTile.isFreeSpace && (
                      <span className="mt-3 font-serif text-xs uppercase tracking-[0.25em] text-stone-500">
                        Center Free Space
                      </span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-16 w-16 rotate-12 items-center justify-center rounded-full border-4 border-red-800 bg-red-600 shadow-lg">
                        <Check className="h-10 w-10 stroke-[3] text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </FantasyBackground>
  )
}

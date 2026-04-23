"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useArena } from "@/lib/arena-context"
import { FantasyBackground } from "@/components/fantasy-background"
import {
  Compass,
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
} from "lucide-react"

interface BingoTile {
  id: number
  label: string
  completed: boolean
  isFreeSpace: boolean
  icon: React.ReactNode
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

const generateBingoBoard = (): BingoTile[] => {
  const quests = [
    "Slay Dragon", "Find Relic", "Save Village", "Decode Runes", "Cross Chasm",
    "Defeat Boss", "Gather Herbs", "Forge Sword", "Unlock Gate", "Find Map",
    "Heal Ally", "Free Quest", "Cast Spell", "Build Camp", "Scout Area",
    "Trade Gold", "Climb Peak", "Solve Puzzle", "Tame Beast", "Light Beacon",
    "Find Scroll", "Brew Potion", "Guard Post", "Hunt Prey", "Claim Throne",
  ]
  return quests.map((quest, index) => ({
    id: index,
    label: quest,
    completed: [2, 7, 12, 15, 20].includes(index),
    isFreeSpace: index === 12,
    icon: questIcons[index % questIcons.length],
  }))
}

function QuestChip({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 bg-orange-100 border-2 border-stone-800 rounded-full px-4 py-2 shadow-[2px_2px_0_rgba(0,0,0,1)]">
      <span className="text-orange-600">{icon}</span>
      <span className="font-serif text-xs uppercase tracking-widest text-stone-600">{label}</span>
      <span className="font-serif font-bold text-stone-900">{value}</span>
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
    "inline-flex items-center gap-3 px-6 py-4 font-serif font-bold text-lg border-4 border-stone-900 rounded-lg transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_rgba(0,0,0,1)] cursor-pointer"
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
                <span className="font-cursive text-xl text-stone-800 truncate">{team.name}</span>
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

function BingoTileComponent({ tile, onClick }: { tile: BingoTile; onClick: () => void }) {
  const base =
    "relative aspect-square flex flex-col items-center justify-center p-2 border-[3px] border-stone-800 rounded-lg transition-all cursor-pointer"

  const style = tile.isFreeSpace
    ? "bg-gradient-to-br from-teal-200 to-teal-300 shadow-[3px_3px_0_rgba(0,0,0,1)]"
    : tile.completed
    ? "bg-stone-300 shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
    : "bg-gradient-to-br from-amber-100 to-orange-100 shadow-[3px_3px_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[5px_5px_0_rgba(0,0,0,1)]"

  return (
    <button className={`${base} ${style}`} onClick={onClick}>
      <div className="absolute inset-1 border border-white/40 rounded pointer-events-none" />
      <div className={tile.completed ? "text-stone-500" : "text-stone-700"}>{tile.icon}</div>
      <span
        className={`mt-1 font-serif text-xs font-bold text-center leading-tight ${
          tile.completed ? "text-stone-500 line-through" : "text-stone-800"
        }`}
      >
        {tile.label}
      </span>
      {tile.completed && !tile.isFreeSpace && (
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

function QuestGrid({ tiles, onTileClick }: { tiles: BingoTile[]; onTileClick: (id: number) => void }) {
  return (
    <div className="bg-amber-100 border-4 border-stone-900 rounded-lg shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden">
      <div className="bg-stone-800 px-4 py-3 flex items-center gap-3">
        <Map className="w-6 h-6 text-teal-400" />
        <h2 className="font-serif text-xl font-bold text-amber-100 tracking-wide">Quest Grid</h2>
      </div>
      <div className="h-2 bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-600" />
      <div className="p-4">
        <div className="grid grid-cols-5 gap-2">
          {tiles.map((tile) => (
            <BingoTileComponent key={tile.id} tile={tile} onClick={() => onTileClick(tile.id)} />
          ))}
        </div>
      </div>
      <div className="border-t-2 border-stone-400 bg-amber-200/50 px-4 py-2 flex items-center justify-between">
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
  const { teams } = useArena()
  const [bingoTiles, setBingoTiles] = useState<BingoTile[]>(generateBingoBoard())
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    syncFullscreenState()
    document.addEventListener("fullscreenchange", syncFullscreenState)
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState)
  }, [])

  const handleTileClick = (id: number) => {
    setBingoTiles((prev) =>
      prev.map((tile) =>
        tile.id === id && !tile.isFreeSpace ? { ...tile, completed: !tile.completed } : tile
      )
    )
  }

  const completedCount = bingoTiles.filter((t) => t.completed).length
  const totalScore = teams.reduce((acc, t) => acc + t.score, 0)

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

  return (
    <FantasyBackground>
      <Link href="/admin">
        <button
          className="fixed top-4 right-4 z-50 w-14 h-14 bg-gradient-to-br from-amber-600 to-orange-700 border-4 border-stone-900 rounded-full flex items-center justify-center shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer"
          aria-label="Admin Panel"
        >
          <Compass className="w-7 h-7 text-amber-100" />
        </button>
      </Link>

      <main className="max-w-7xl mx-auto px-4 py-8 pb-20">
        <section className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-stone-900 tracking-tight">
              Live Quest Arena
            </h1>
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-600 to-transparent" />
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <QuestChip label="Active" value={`${teams.length} Teams`} icon={<Users className="w-4 h-4" />} />
            <QuestChip label="Quests" value={`${completedCount}/25`} icon={<Target className="w-4 h-4" />} />
            <QuestChip label="Total" value={totalScore.toLocaleString()} icon={<Trophy className="w-4 h-4" />} />
            <QuestChip label="Time" value="2:45:30" icon={<Clock className="w-4 h-4" />} />
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/coordinator">
              <ActionButton variant="primary" icon={<Play className="w-5 h-5" />}>
                Launch Coordinator
              </ActionButton>
            </Link>
            <ActionButton
              variant="secondary"
              icon={isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              onClick={handleFullscreenToggle}
            >
              {isFullscreen ? "Exit Fullscreen Arena" : "Enter Fullscreen Arena"}
            </ActionButton>
          </div>
        </section>

        <section className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <BountyBoard />
          </div>
          <div className="lg:col-span-3">
            <QuestGrid tiles={bingoTiles} onTileClick={handleTileClick} />
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-stone-800 border-t-4 border-stone-900 py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <Gem className="w-4 h-4 text-teal-400" />
          <span className="font-serif text-xs text-stone-400 uppercase tracking-widest">BitBingo System</span>
          <span className="text-stone-600">•</span>
          <span className="font-serif text-xs text-stone-500">v1.0.0</span>
        </div>
      </footer>
    </FantasyBackground>
  )
}

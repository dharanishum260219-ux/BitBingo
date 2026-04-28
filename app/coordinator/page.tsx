"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import NextImage from "next/image"
import { useArena } from "@/lib/arena-context"
import { FantasyBackground } from "@/components/fantasy-background"
import { ArrowLeft, Upload, Zap, Gem, Scroll, Stamp, LogOut } from "lucide-react"

const MAX_UPLOAD_FILE_BYTES = 12 * 1024 * 1024
const MAX_PROCESSED_IMAGE_BYTES = 1_500_000
const TARGET_UPLOAD_MAX_EDGE = 1280
const TARGET_UPLOAD_QUALITY = 0.68

function loadImageElement(objectUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to process image."))
    image.src = objectUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to compress this image."))
          return
        }
        resolve(blob)
      },
      "image/jpeg",
      quality,
    )
  })
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      if (!result) {
        reject(new Error("Failed to finalize image."))
        return
      }
      resolve(result)
    }
    reader.onerror = () => reject(new Error("Failed to finalize image."))
    reader.readAsDataURL(blob)
  })
}

async function compressImageDataUrl(file: File) {
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await loadImageElement(objectUrl)
    const largestEdge = Math.max(image.width, image.height)
    const scale = largestEdge > TARGET_UPLOAD_MAX_EDGE ? TARGET_UPLOAD_MAX_EDGE / largestEdge : 1
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("Failed to prepare image compression.")
    }

    context.drawImage(image, 0, 0, width, height)
    const compressedBlob = await canvasToBlob(canvas, TARGET_UPLOAD_QUALITY)

    if (compressedBlob.size > MAX_PROCESSED_IMAGE_BYTES) {
      throw new Error("Compressed image is still too large. Try a smaller photo.")
    }

    return await blobToDataUrl(compressedBlob)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

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
      "border-stone-900 bg-red-600 text-white shadow-[4px_4px_0_rgba(0,0,0,0.7)] hover:shadow-[6px_6px_0_rgba(0,0,0,0.8)] text-base md:text-xl tracking-wider px-5 py-3 md:px-8 md:py-4 border-4 w-full sm:w-auto",
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>
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

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: Array<string | { value: string; label: string }>
  placeholder?: string
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 bg-white/70 border-2 border-stone-900 font-sans text-stone-800 focus:outline-none rounded-lg cursor-pointer">
      <option value="">{placeholder ?? "Select..."}</option>
      {options.map((option) => {
        const optionValue = typeof option === "string" ? option : option.value
        const optionLabel = typeof option === "string" ? option : option.label

        return (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        )
      })}
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <button type="button" aria-label="Close completion popup" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-xl bg-amber-100 border-4 border-stone-900 rounded-xl shadow-[8px_8px_0_rgba(0,0,0,1)] overflow-hidden">
        <div className="bg-stone-800 px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
          <Stamp className="w-6 h-6 text-amber-400" />
          <h3 className="font-sans text-base sm:text-xl font-bold text-amber-100 tracking-wide">Challenge Completed</h3>
        </div>
        <div className="h-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600" />
        <div className="p-3 sm:p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><p className="font-sans text-[10px] uppercase tracking-widest text-stone-600">Team</p><p className="font-sans font-bold text-stone-900 text-lg">{details.team}</p></div>
            <div><p className="font-sans text-[10px] uppercase tracking-widest text-stone-600">Session</p><p className="font-sans font-bold text-stone-900 text-lg">{details.session}</p></div>
            <div><p className="font-sans text-[10px] uppercase tracking-widest text-stone-600">Quest</p><p className="font-sans font-bold text-stone-900 text-lg">{details.quest}</p></div>
            <div><p className="font-sans text-[10px] uppercase tracking-widest text-stone-600">Updated Score</p><p className="font-sans font-bold text-emerald-700 text-lg">{details.newScore} PTS</p></div>
          </div>
          <div>
            <p className="font-sans text-[10px] uppercase tracking-widest text-stone-600 mb-1">Proof / Notes</p>
            <p className="font-sans text-stone-800 bg-orange-50 border-2 border-stone-300 rounded-lg px-3 py-2 min-h-12 break-all">{details.proof || "No additional proof notes provided."}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-sans uppercase tracking-wider text-stone-600">
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
  const { sessions, selectedSessionId, selectSession, teams } = useArena()
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null
  return (
    <Card className="mb-8">
      <CardHeader icon={<Zap className="w-6 h-6" />} title="Session Summary" color="emerald" />
      <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="sm:col-span-2 md:col-span-4">
          <FormLabel>Select Session</FormLabel>
          <select value={selectedSessionId ?? ""} onChange={(event) => selectSession(event.target.value)} className="mt-1 w-full rounded-lg border-2 border-stone-900 bg-white px-3 py-2 font-sans text-stone-900">
            {sessions.length === 0 && <option value="">No sessions available</option>}
            {sessions.map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}
          </select>
        </div>
        <div><p className="font-sans text-[10px] uppercase tracking-widest text-stone-600">Session</p><p className="font-sans text-lg font-bold text-stone-900">{selectedSession ? selectedSession.name : "-"}</p></div>
        <div><p className="font-sans text-[10px] uppercase tracking-widest text-stone-600">Time Remaining</p><p className="font-sans text-lg font-bold text-stone-900">45:00</p></div>
        <div><p className="font-sans text-[10px] uppercase tracking-widest text-stone-600">Live Teams</p><p className="font-sans text-lg font-bold text-stone-900">{teams.length}</p></div>
        <div><p className="font-sans text-[10px] uppercase tracking-widest text-stone-600">Status</p><div className="flex items-center gap-2 mt-1"><div className={`w-3 h-3 rounded-full ${selectedSession ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`} /><span className={`font-sans font-bold text-sm ${selectedSession ? "text-emerald-700" : "text-stone-500"}`}>{selectedSession ? "SELECTED" : "INACTIVE"}</span></div></div>
      </div>
    </Card>
  )
}

function ControlDeckPanel() {
  const { teams, challenges, logCompletion, sessions, selectedSessionId, isLoading } = useArena()
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null
  const [selectedTeamId, setSelectedTeamId] = useState("")
  const [selectedQuest, setSelectedQuest] = useState("")
  const [proof, setProof] = useState("")
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null)
  const [proofFileName, setProofFileName] = useState("")
  const [completionDetails, setCompletionDetails] = useState<CompletionDetails | null>(null)
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedTeamId("")
      setSelectedQuest("")
      setSubmitError("")
    })
  }, [selectedSessionId])

  useEffect(() => {
    if (selectedTeamId && !teams.some((team) => team.id === selectedTeamId)) {
      queueMicrotask(() => setSelectedTeamId(""))
    }
  }, [selectedTeamId, teams])

  useEffect(() => {
    if (selectedQuest && !challenges.some((challenge) => challenge.title === selectedQuest)) {
      queueMicrotask(() => setSelectedQuest(""))
    }
  }, [challenges, selectedQuest])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSubmitError("")

    if (!file.type.startsWith("image/")) {
      setSubmitError("Please select an image file.")
      event.target.value = ""
      return
    }

    if (file.size > MAX_UPLOAD_FILE_BYTES) {
      setSubmitError("Image is too large. Please choose one under 12MB.")
      event.target.value = ""
      return
    }

    try {
      const compressedDataUrl = await compressImageDataUrl(file)
      setProofImageUrl(compressedDataUrl)
      setProofFileName(file.name)
      setProof("")
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      setSubmitError(
        message || "Unable to process this image on this device. Try a smaller image or submit notes/URL instead.",
      )
    }

    event.target.value = ""
  }

  const handleStamp = async () => {
    if (!selectedTeamId || !selectedQuest || !selectedSessionId || isLoading) return
    const team = teams.find((t) => t.id === selectedTeamId)
    const challenge = challenges.find((entry) => entry.title === selectedQuest)
    const proofPayload = proofImageUrl ?? (proof.trim() || null)

    if (!team || !challenge) {
      setSubmitError("Choose a valid team and challenge for the selected session.")
      return
    }

    const teamSessionId = team.sessionId ?? null
    if (!teamSessionId || teamSessionId !== selectedSessionId) {
      setSubmitError("Selected team is not in the current session. Please reselect team after switching session.")
      setSelectedTeamId("")
      return
    }

    try {
      setSubmitError("")
      await logCompletion({
        participantId: team.id,
        challengeId: challenge.id,
        proofUrl: proofPayload,
        sessionId: teamSessionId,
      })
      setCompletionDetails({
        team: team.name,
        quest: selectedQuest,
        proof: proofImageUrl ? `Image attached${proofFileName ? `: ${proofFileName}` : ""}` : (proofPayload ?? ""),
        session: selectedSession?.name ?? "No Session Selected",
        stampedAt: new Date().toLocaleString(),
        newScore: team.score + challenge.points,
      })
      setSelectedTeamId("")
      setSelectedQuest("")
      setProof("")
      setProofImageUrl(null)
      setProofFileName("")
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Unable to log completion"
      try {
        const parsed = JSON.parse(raw) as { error?: string }
        setSubmitError(parsed.error ?? raw)
      } catch {
        setSubmitError(raw)
      }
    }
  }

  const teamOptions = teams.map((team) => ({ value: team.id, label: team.name }))
  const questNames = challenges.filter((challenge) => !challenge.completed).map((challenge) => challenge.title)

  return (
    <>
      <Card>
        <CardHeader icon={<Scroll className="w-6 h-6" />} title="Control Deck: Log Completions" color="teal" />
        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <FormLabel>Select Team</FormLabel>
              <SelectInput value={selectedTeamId} onChange={setSelectedTeamId} options={teamOptions} placeholder="Select Team" />
            </div>
            <div>
              <FormLabel>Select Quest / Tile</FormLabel>
              <SelectInput value={selectedQuest} onChange={setSelectedQuest} options={questNames} placeholder="Select Quest" />
            </div>
          </div>

          <div>
            <FormLabel>Proof of Completion</FormLabel>
            <label className="block bg-amber-200/30 border-4 border-dashed border-stone-700 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:bg-amber-200/50 transition-colors">
              <input type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-orange-200 border-2 border-stone-800 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-stone-700" />
                </div>
                <div>
                  <p className="font-sans font-bold text-stone-800">Upload Intel Dossier</p>
                  <p className="text-sm font-sans text-stone-600">Screenshot, camera photo, or verification</p>
                </div>
                {proofFileName && <p className="text-xs font-sans font-bold text-emerald-700">Selected: {proofFileName}</p>}
              </div>
            </label>
            {proofImageUrl && (
              <div className="mt-3 overflow-hidden rounded-lg border-2 border-stone-900 bg-white">
                <NextImage
                  src={proofImageUrl}
                  alt="Proof preview"
                  width={1280}
                  height={720}
                  unoptimized
                  className="h-auto w-full max-h-64 object-contain"
                />
              </div>
            )}
            {proofImageUrl && (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setProofImageUrl(null)
                    setProofFileName("")
                  }}
                  className="rounded-lg border-2 border-stone-900 bg-amber-100 px-3 py-1 font-sans text-xs font-bold uppercase tracking-wider text-stone-800"
                >
                  Remove Image
                </button>
              </div>
            )}
            <textarea
              placeholder="Or add proof URL / notes..."
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              className="mt-3 w-full px-4 py-3 bg-amber-50/50 border-2 border-stone-900 font-sans text-stone-800 placeholder-stone-400 focus:outline-none rounded-lg min-h-20 resize-none"
            />
          </div>

          <div className="flex justify-center pt-2">
            <Btn variant="stamp" onClick={handleStamp} disabled={!selectedTeamId || !selectedQuest || !selectedSessionId || isLoading}>
              <Stamp className="w-6 h-6" />
              STAMP COMPLETION
            </Btn>
          </div>

          {submitError && (
            <p className="rounded-lg border-2 border-red-800 bg-red-100 px-3 py-2 font-sans text-sm font-bold text-red-900">
              {submitError}
            </p>
          )}
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
        <div className="max-w-5xl mx-auto px-3 md:px-4 py-3 md:py-4 flex flex-wrap items-center justify-between gap-2 md:gap-3">
          <Link href="/">
            <button
              type="button"
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-amber-600 text-white font-sans font-bold text-xs md:text-base border-2 border-stone-900 rounded-lg hover:-translate-y-0.5 transition-all shadow-[0_2px_0_rgba(0,0,0,0.6)]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Arena</span>
              <span className="sm:hidden">Back</span>
            </button>
          </Link>

          <h1 className="order-3 w-full text-center md:order-none md:w-auto font-cursive text-2xl md:text-4xl font-bold text-amber-100 tracking-wide">
            Coordinator Deck
          </h1>

          <form action="/coordinator/logout" method="post" className="w-full order-4 md:order-none md:w-auto md:min-w-28 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-teal-600 text-white font-sans font-bold text-xs md:text-base border-2 border-stone-900 rounded-lg hover:-translate-y-0.5 transition-all shadow-[0_2px_0_rgba(0,0,0,0.6)]"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Out</span>
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-2 sm:px-3 md:px-4 py-5 md:py-8 pb-10 md:pb-12">
        <SessionSummaryPanel />
        <ControlDeckPanel />
      </main>

      <footer className="mt-8 min-h-16 bg-stone-800 border-t-4 border-stone-900 py-2 px-3 md:px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center leading-tight">
          <Gem className="w-4 h-4 text-teal-400" />
          <span className="font-sans text-[10px] md:text-xs text-stone-400 uppercase tracking-wide md:tracking-widest">BitBingo Coordinator System</span>
          <span className="text-stone-600">•</span>
          <span className="font-sans text-[10px] md:text-xs text-stone-500">v1.0.0</span>
        </div>
      </footer>
    </FantasyBackground>
  )
}

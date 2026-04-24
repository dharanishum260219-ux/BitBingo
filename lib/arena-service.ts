import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { getChallengePoints } from "@/lib/challenge-scoring"

import {
  buildSnapshot,
  cloneDemoStore,
  DEMO_CHALLENGES,
  type ArenaSnapshot,
  type ArenaStore,
  type SessionChallengeRow,
} from "@/lib/arena-types"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
const IS_PRODUCTION = process.env.NODE_ENV === "production"

function getMissingSupabaseEnv(serviceRole = false) {
  const missing: string[] = []

  if (!SUPABASE_URL) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL")
  }

  if (!SUPABASE_ANON_KEY) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }

  if (serviceRole && !SUPABASE_SERVICE_ROLE_KEY) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY")
  }

  return missing
}

function createSupabaseClient(serviceRole = false): SupabaseClient | null {
  const missing = getMissingSupabaseEnv(serviceRole)
  if (missing.length > 0) {
    if (IS_PRODUCTION) {
      throw new Error(`Missing Supabase environment configuration: ${missing.join(", ")}`)
    }
    return null
  }

  return createClient(SUPABASE_URL, serviceRole ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

const demoState: ArenaStore = cloneDemoStore()

const DEFAULT_DIFFICULTY = "medium"

const DIFFICULTY_DEFAULT_POINTS: Record<string, number> = {
  easy: 55,
  medium: 70,
  hard: 90,
}

export interface ChallengeImportRow {
  title: string
  description: string
  difficulty: string
  points?: number | null
}

function getDemoState() {
  return demoState
}

function normalizeDifficulty(value: string) {
  const trimmed = value.trim().toLowerCase()
  return trimmed || DEFAULT_DIFFICULTY
}

function pointsFromDifficulty(difficulty: string) {
  const normalized = normalizeDifficulty(difficulty)
  return DIFFICULTY_DEFAULT_POINTS[normalized] ?? DIFFICULTY_DEFAULT_POINTS[DEFAULT_DIFFICULTY]
}

function normalizeChallengeImportRows(rows: ChallengeImportRow[]) {
  return rows
    .map((row) => {
      const title = row.title.trim()
      const description = row.description.trim()
      const difficulty = normalizeDifficulty(row.difficulty)
      const numericPoints = Number(row.points)
      const points = Number.isFinite(numericPoints) && numericPoints > 0
        ? numericPoints
        : pointsFromDifficulty(difficulty)

      return {
        title,
        description,
        difficulty,
        points,
      }
    })
    .filter((row) => row.title && row.description)
}

function challengeKey(title: string) {
  return title.trim().toLowerCase()
}

function normalizeTeamNames(teamNames: string[]) {
  return Array.from(
    new Set(
      teamNames
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  )
}

function pickSessionChallengeSet(challengeIds: number[], preferredChallengeIds: number[] = []) {
  const pool = challengeIds.slice().sort((a, b) => a - b)
  const preferred = preferredChallengeIds.filter((id) => pool.includes(id))
  const dedupedPreferred = Array.from(new Set(preferred))
  const remaining = pool.filter((id) => !dedupedPreferred.includes(id))
  const selected = [...dedupedPreferred, ...remaining].slice(0, 25)

  if (selected.length < 25) {
    throw new Error("Need at least 25 challenges to create a session board")
  }

  return selected.map((challengeId, position) => ({ challenge_id: challengeId, position }))
}

async function incrementParticipantScore(client: SupabaseClient, participantId: string, delta: number) {
  const { data, error } = await client
    .from("participants")
    .select("score")
    .eq("id", participantId)
    .maybeSingle()

  if (error || !data) {
    return
  }

  await client
    .from("participants")
    .update({ score: Number(data.score ?? 0) + delta })
    .eq("id", participantId)
}

export async function getArenaSnapshot(sessionId?: string | null): Promise<ArenaSnapshot> {
  const client = createSupabaseClient(true)

  if (!client) {
    return buildSnapshot(getDemoState(), sessionId ?? null)
  }

  const scopedSessionId = sessionId ?? null

  const participantsQuery = client
    .from("participants")
    .select("id,name,score,session_id,created_at")
    .order("score", { ascending: false })

  const completionsQuery = client
    .from("completions")
    .select("id,participant_id,challenge_id,proof_url,session_id,created_at")
    .order("created_at", { ascending: false })

  const sessionChallengesQuery = client
    .from("session_challenges")
    .select("id,session_id,challenge_id,position,created_at")
    .order("position", { ascending: true })

  const [sessionsResult, participantsResult, challengesResult, sessionChallengesResult, completionsResult] = await Promise.all([
    client.from("sessions").select("id,name,is_active,duration_minutes,created_at").order("created_at", { ascending: false }),
    scopedSessionId ? participantsQuery.eq("session_id", scopedSessionId) : participantsQuery,
    client.from("challenges").select("id,title,description,difficulty,points").order("id", { ascending: true }),
    scopedSessionId ? sessionChallengesQuery.eq("session_id", scopedSessionId) : sessionChallengesQuery,
    scopedSessionId ? completionsQuery.eq("session_id", scopedSessionId) : completionsQuery,
  ])

  if (sessionsResult.error || participantsResult.error || challengesResult.error || sessionChallengesResult.error || completionsResult.error) {
    return buildSnapshot(getDemoState(), sessionId ?? null)
  }

  const store: ArenaStore = {
    sessions: sessionsResult.data ?? [],
    participants: participantsResult.data ?? [],
    challenges: challengesResult.data ?? [],
    session_challenges: sessionChallengesResult.data ?? [],
    completions: completionsResult.data ?? [],
  }

  return buildSnapshot(store, sessionId ?? null)
}

export async function getTeams(sessionId: string): Promise<ArenaSnapshot["teams"]> {
  const snapshot = await getArenaSnapshot(sessionId)
  return snapshot.teams
}

export async function getChallenges(sessionId: string): Promise<ArenaSnapshot["challenges"]> {
  const snapshot = await getArenaSnapshot(sessionId)
  return snapshot.challenges
}

export async function getChallengePool() {
  const client = createSupabaseClient(true)
  if (!client) {
    return DEMO_CHALLENGES
  }

  const { data, error } = await client
    .from("challenges")
    .select("id,title,description,difficulty,points")
    .order("id", { ascending: true })

  if (error || !data) {
    return DEMO_CHALLENGES
  }

  return data
}

export async function upsertChallengePool(rows: ChallengeImportRow[]) {
  const normalizedRows = normalizeChallengeImportRows(rows)
  if (normalizedRows.length === 0) {
    return { challengeIds: [] as number[], importedCount: 0 }
  }

  const client = createSupabaseClient(true)
  if (!client) {
    const store = getDemoState()
    const existingByKey = new Map(store.challenges.map((challenge) => [challengeKey(challenge.title), challenge]))
    const challengeIds: number[] = []

    for (const row of normalizedRows) {
      const key = challengeKey(row.title)
      const existing = existingByKey.get(key)

      if (existing) {
        existing.title = row.title
        existing.description = row.description
        existing.difficulty = row.difficulty
        existing.points = row.points
        challengeIds.push(existing.id)
      } else {
        const nextId = store.challenges.reduce((max, challenge) => Math.max(max, challenge.id), 0) + 1
        const created = {
          id: nextId,
          title: row.title,
          description: row.description,
          difficulty: row.difficulty,
          points: row.points,
        }
        store.challenges.push(created)
        existingByKey.set(key, created)
        challengeIds.push(created.id)
      }
    }

    return { challengeIds, importedCount: normalizedRows.length }
  }

  const { data: existingRows } = await client
    .from("challenges")
    .select("id,title")

  const existingByKey = new Map((existingRows ?? []).map((challenge) => [challengeKey(challenge.title), Number(challenge.id)]))
  const challengeIds: number[] = []

  for (const row of normalizedRows) {
    const key = challengeKey(row.title)
    const existingId = existingByKey.get(key)

    if (existingId) {
      const { error: updateError } = await client
        .from("challenges")
        .update({
          title: row.title,
          description: row.description,
          difficulty: row.difficulty,
          points: row.points,
        })
        .eq("id", existingId)

      if (updateError) {
        throw updateError
      }

      challengeIds.push(existingId)
      continue
    }

    const { data: created, error: createError } = await client
      .from("challenges")
      .insert({
        title: row.title,
        description: row.description,
        difficulty: row.difficulty,
        points: row.points,
      })
      .select("id")
      .single()

    if (createError || !created) {
      throw createError ?? new Error("Failed to create challenge")
    }

    const createdId = Number(created.id)
    existingByKey.set(key, createdId)
    challengeIds.push(createdId)
  }

  return { challengeIds, importedCount: normalizedRows.length }
}

export async function registerTeam(name: string, sessionId: string) {
  const trimmed = name.trim()
  if (!trimmed || !sessionId) return

  const client = createSupabaseClient(true)
  if (!client) {
    getDemoState().participants.push({
      id: crypto.randomUUID(),
      name: trimmed,
      score: 0,
      session_id: sessionId,
      created_at: new Date().toISOString(),
    })
    return
  }

  await client.from("participants").insert({ name: trimmed, score: 0, session_id: sessionId })
}

export async function deleteTeam(id: string, sessionId?: string) {
  const client = createSupabaseClient(true)
  if (!client) {
    const store = getDemoState()
    store.participants = store.participants.filter(
      (participant) => participant.id !== id || (sessionId ? participant.session_id !== sessionId : false),
    )
    store.completions = store.completions.filter((completion) => completion.participant_id !== id)
    return
  }

  const query = client.from("participants").delete().eq("id", id)
  if (sessionId) {
    query.eq("session_id", sessionId)
  }
  await query
}

export async function awardPoint(id: string, sessionId: string) {
  if (!sessionId) return

  const client = createSupabaseClient(true)
  if (!client) {
    const store = getDemoState()
    const participant = store.participants.find((entry) => entry.id === id && entry.session_id === sessionId)
    if (participant) {
      participant.score += 10
    }
    return
  }

  const { data } = await client.from("participants").select("id").eq("id", id).eq("session_id", sessionId).maybeSingle()
  if (!data) {
    throw new Error("Team does not belong to selected session")
  }

  await incrementParticipantScore(client, id, 10)
}

async function seedSessionChallenges(client: SupabaseClient, sessionId: string, preferredChallengeIds: number[] = []) {
  const { data: challengeRows, error: challengesError } = await client
    .from("challenges")
    .select("id")
    .order("id", { ascending: true })
    .limit(25)

  if (challengesError || !challengeRows) {
    throw challengesError ?? new Error("Unable to fetch challenges")
  }

  const selected = pickSessionChallengeSet(
    challengeRows.map((row) => Number(row.id)),
    preferredChallengeIds,
  )

  const { error: insertError } = await client
    .from("session_challenges")
    .insert(selected.map((entry) => ({ ...entry, session_id: sessionId })))

  if (insertError) {
    throw insertError
  }
}

export async function createSession(input: {
  name: string
  durationMinutes: number
  challengeIds?: number[]
  teamNames?: string[]
  questionRows?: ChallengeImportRow[]
}) {
  const trimmed = input.name.trim()
  const durationMinutes = Number(input.durationMinutes)
  const challengeIds = (input.challengeIds ?? []).map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
  const teamNames = normalizeTeamNames(input.teamNames ?? [])
  const questionRows = input.questionRows ?? []

  if (!trimmed) return
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error("Duration must be a positive number")
  }

  const client = createSupabaseClient(true)
  if (!client) {
    const store = getDemoState()
    let importedChallengeIds: number[] = []
    if (questionRows.length > 0) {
      importedChallengeIds = (await upsertChallengePool(questionRows)).challengeIds
    }

    const sessionId = crypto.randomUUID()
    store.sessions.unshift({
      id: sessionId,
      name: trimmed,
      is_active: false,
      duration_minutes: durationMinutes,
      created_at: new Date().toISOString(),
    })
    const selected = pickSessionChallengeSet(
      store.challenges.map((challenge) => challenge.id),
      [...importedChallengeIds, ...challengeIds],
    )
    const now = new Date().toISOString()
    const demoRows: SessionChallengeRow[] = selected.map((entry) => ({
      id: crypto.randomUUID(),
      session_id: sessionId,
      challenge_id: entry.challenge_id,
      position: entry.position,
      created_at: now,
    }))
    store.session_challenges.push(...demoRows)

    for (const teamName of teamNames) {
      store.participants.push({
        id: crypto.randomUUID(),
        name: teamName,
        score: 0,
        session_id: sessionId,
        created_at: now,
      })
    }

    return sessionId
  }

  let importedChallengeIds: number[] = []
  if (questionRows.length > 0) {
    importedChallengeIds = (await upsertChallengePool(questionRows)).challengeIds
  }

  const { data: createdSession, error: sessionError } = await client
    .from("sessions")
    .insert({ name: trimmed, is_active: false, duration_minutes: durationMinutes })
    .select("id")
    .single()

  if (sessionError || !createdSession) {
    throw sessionError ?? new Error("Unable to create session")
  }

  await seedSessionChallenges(client, createdSession.id, [...importedChallengeIds, ...challengeIds])

  if (teamNames.length > 0) {
    const teamRows = teamNames.map((teamName) => ({
      name: teamName,
      score: 0,
      session_id: createdSession.id,
    }))
    await client.from("participants").insert(teamRows)
  }

  return createdSession.id
}

export async function stopSession(id: string) {
  const client = createSupabaseClient(true)
  if (!client) {
    const session = getDemoState().sessions.find((entry) => entry.id === id)
    if (session) {
      session.is_active = false
    }
    return
  }

  await client.from("sessions").update({ is_active: false }).eq("id", id)
}

export async function logCompletion(input: {
  participantId: string
  challengeId: number
  proofUrl: string | null
  sessionId: string
}) {
  const client = createSupabaseClient(true)
  const isDemoPayload = input.sessionId.startsWith("session-demo-") || /^\d+$/.test(input.participantId)

  if (!client || isDemoPayload) {
    const store = getDemoState()
    const participant = store.participants.find(
      (entry) => entry.id === input.participantId && entry.session_id === input.sessionId,
    )
    const session = store.sessions.find((entry) => entry.id === input.sessionId)
    if (!participant || !session) {
      throw new Error("Missing participant or selected session")
    }

    const existing = store.completions.find(
      (completion) =>
        completion.participant_id === input.participantId &&
        completion.challenge_id === input.challengeId &&
        completion.session_id === input.sessionId,
    )
    if (existing) {
      return
    }

    store.completions.unshift({
      id: crypto.randomUUID(),
      participant_id: participant.id,
      challenge_id: input.challengeId,
      proof_url: input.proofUrl,
      session_id: input.sessionId,
      created_at: new Date().toISOString(),
    })
    const sessionChallenge = store.session_challenges.find(
      (entry) => entry.session_id === input.sessionId && entry.challenge_id === input.challengeId,
    )
    const challenge = store.challenges.find((entry) => entry.id === input.challengeId)
    const challengePoints = challenge?.points ?? (sessionChallenge ? getChallengePoints(sessionChallenge.position) : 0)
    participant.score += challengePoints
    return
  }

  const { data: participant } = await client
    .from("participants")
    .select("id")
    .eq("id", input.participantId)
    .eq("session_id", input.sessionId)
    .maybeSingle()

  if (!participant) {
    throw new Error("Team does not belong to selected session")
  }

  const { data: boardEntry } = await client
    .from("session_challenges")
    .select("position")
    .eq("session_id", input.sessionId)
    .eq("challenge_id", input.challengeId)
    .maybeSingle()

  if (!boardEntry) {
    throw new Error("Challenge is not mapped to selected session")
  }

  const { error } = await client.from("completions").insert({
    participant_id: input.participantId,
    challenge_id: input.challengeId,
    proof_url: input.proofUrl,
    session_id: input.sessionId,
  })

  if (error) {
    throw error
  }

  const { data: challenge } = await client
    .from("challenges")
    .select("points")
    .eq("id", input.challengeId)
    .maybeSingle()

  const challengePoints = Number(challenge?.points ?? getChallengePoints(Number(boardEntry.position)))
  await incrementParticipantScore(client, input.participantId, challengePoints)
}
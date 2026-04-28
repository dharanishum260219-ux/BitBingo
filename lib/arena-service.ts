import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { getChallengePoints } from "@/lib/challenge-scoring"
import { hashCoordinatorPassword, normalizeCoordinatorUsn, verifyCoordinatorPassword } from "@/lib/coordinator-auth"

import {
  COORDINATOR_AUTH_PARTICIPANT_PREFIX,
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
const ENABLE_DEMO_DATA = process.env.ENABLE_DEMO_DATA === "true"

interface CoordinatorAuthPayload {
  passwordHash: string
  usns: string[]
}

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

function getEmptyStore(): ArenaStore {
  return {
    sessions: [],
    participants: [],
    challenges: [],
    session_challenges: [],
    completions: [],
  }
}

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

function normalizeCoordinatorNames(usns: string[]) {
  return Array.from(
    new Set(
      usns
        .map((usn) => normalizeCoordinatorUsn(usn))
        .filter(Boolean),
    ),
  )
}

function encodeCoordinatorAuthPayload(payload: CoordinatorAuthPayload) {
  return JSON.stringify({
    passwordHash: payload.passwordHash,
    usns: normalizeCoordinatorNames(payload.usns),
  })
}

function buildCoordinatorAuthParticipantName(payload: CoordinatorAuthPayload) {
  return `${COORDINATOR_AUTH_PARTICIPANT_PREFIX}:${encodeCoordinatorAuthPayload(payload)}`
}

function decodeCoordinatorAuthParticipantName(rawName: string | null | undefined) {
  if (!rawName || !rawName.startsWith(`${COORDINATOR_AUTH_PARTICIPANT_PREFIX}:`)) {
    return null
  }

  try {
    const rawPayload = rawName.slice(COORDINATOR_AUTH_PARTICIPANT_PREFIX.length + 1)
    const parsed = JSON.parse(rawPayload) as Partial<CoordinatorAuthPayload>
    if (typeof parsed.passwordHash !== "string" || !Array.isArray(parsed.usns)) {
      return null
    }

    return {
      passwordHash: parsed.passwordHash,
      usns: normalizeCoordinatorNames(parsed.usns.filter((usn): usn is string => typeof usn === "string")),
    }
  } catch {
    return null
  }
}

function pickSessionChallengeSet(challengeIds: number[], preferredChallengeIds: number[] = [], allowAutoFill = true) {
  const pool = challengeIds.slice().sort((a, b) => a - b)
  const preferred = preferredChallengeIds.filter((id) => pool.includes(id))
  const dedupedPreferred = Array.from(new Set(preferred))
  const remaining = pool.filter((id) => !dedupedPreferred.includes(id))
  const selected = allowAutoFill
    ? [...dedupedPreferred, ...remaining].slice(0, 25)
    : dedupedPreferred.slice(0, 25)

  if (selected.length < 25) {
    throw new Error("Need 25 selected/imported challenges to create a session board")
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
  const client = createSupabaseClient(false)

  if (!client) {
    return buildSnapshot(ENABLE_DEMO_DATA ? getDemoState() : getEmptyStore(), sessionId ?? null)
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
    if (IS_PRODUCTION) {
      const details = [
        sessionsResult.error?.message,
        participantsResult.error?.message,
        challengesResult.error?.message,
        sessionChallengesResult.error?.message,
        completionsResult.error?.message,
      ].filter(Boolean).join(" | ")

      throw new Error(`Failed to load arena snapshot from Supabase${details ? `: ${details}` : ""}`)
    }

    return buildSnapshot(ENABLE_DEMO_DATA ? getDemoState() : getEmptyStore(), sessionId ?? null)
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
  const client = createSupabaseClient(false)
  if (!client) {
    return ENABLE_DEMO_DATA ? DEMO_CHALLENGES : []
  }

  const { data, error } = await client
    .from("challenges")
    .select("id,title,description,difficulty,points")
    .order("id", { ascending: true })

  if (error || !data) {
    if (IS_PRODUCTION) {
      throw error ?? new Error("Unable to fetch challenge pool from Supabase")
    }

    return ENABLE_DEMO_DATA ? DEMO_CHALLENGES : []
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

  let legacyPositionMode = false
  const usedLegacyPositions = new Set<number>()

  const { data: existingRowsWithPosition, error: existingRowsWithPositionError } = await client
    .from("challenges")
    .select("id,title,position")

  let existingRows: Array<{ id: number; title: string }> = []

  if (!existingRowsWithPositionError && Array.isArray(existingRowsWithPosition)) {
    legacyPositionMode = true
    existingRows = existingRowsWithPosition.map((row) => ({
      id: Number(row.id),
      title: String(row.title),
    }))

    for (const row of existingRowsWithPosition) {
      const position = Number((row as { position?: unknown }).position)
      if (Number.isInteger(position) && position >= 0 && position <= 24) {
        usedLegacyPositions.add(position)
      }
    }
  } else {
    const { data: existingRowsBase, error: existingRowsBaseError } = await client
      .from("challenges")
      .select("id,title")

    if (existingRowsBaseError) {
      throw existingRowsBaseError
    }

    existingRows = (existingRowsBase ?? []).map((row) => ({
      id: Number(row.id),
      title: String(row.title),
    }))
  }

  const existingByKey = new Map(existingRows.map((challenge) => [challengeKey(challenge.title), Number(challenge.id)]))
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

    const insertPayload: {
      title: string
      description: string
      difficulty: string
      points: number
      position?: number
    } = {
      title: row.title,
      description: row.description,
      difficulty: row.difficulty,
      points: row.points,
    }

    if (legacyPositionMode) {
      let nextPosition = -1
      for (let position = 0; position <= 24; position += 1) {
        if (!usedLegacyPositions.has(position)) {
          nextPosition = position
          break
        }
      }

      if (nextPosition < 0) {
        throw new Error(
          "Your database is using the legacy challenge schema (position 0-24 only). Apply supabase/migrations/002_session_scoped_challenges.sql to support importing more questions.",
        )
      }

      insertPayload.position = nextPosition
      usedLegacyPositions.add(nextPosition)
    }

    const { data: created, error: createError } = await client
      .from("challenges")
      .insert(insertPayload)
      .select("id")
      .single()

    if (createError || !created) {
      if (createError?.code === "23502" && createError?.message?.includes("position")) {
        throw new Error(
          "Your database schema is out of date (challenges.position is still required). Apply supabase/migrations/002_session_scoped_challenges.sql.",
        )
      }
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

async function seedSessionChallenges(client: SupabaseClient, sessionId: string, preferredChallengeIds: number[] = [], allowAutoFill = true) {
  const { data: challengeRows, error: challengesError } = await client
    .from("challenges")
    .select("id")
    .order("id", { ascending: true })

  if (challengesError || !challengeRows) {
    throw challengesError ?? new Error("Unable to fetch challenges")
  }

  const selected = pickSessionChallengeSet(
    challengeRows.map((row) => Number(row.id)),
    preferredChallengeIds,
    allowAutoFill,
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
  coordinatorUsns: string[]
  sessionPassword: string
}) {
  const trimmed = input.name.trim()
  const durationMinutes = Number(input.durationMinutes)
  const challengeIds = (input.challengeIds ?? []).map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
  const teamNames = normalizeTeamNames(input.teamNames ?? [])
  const questionRows = input.questionRows ?? []
  const coordinatorUsns = normalizeCoordinatorNames(input.coordinatorUsns ?? [])
  const sessionPassword = input.sessionPassword.trim()

  if (!trimmed) return
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error("Duration must be a positive number")
  }
  if (!sessionPassword) {
    throw new Error("Session password is required")
  }
  if (coordinatorUsns.length === 0) {
    throw new Error("Add at least one coordinator USN before creating a session")
  }

  const coordinatorPasswordHash = await hashCoordinatorPassword(sessionPassword)

  const client = createSupabaseClient(true)
  if (!client) {
    const store = getDemoState()
    let importedChallengeIds: number[] = []
    if (questionRows.length > 0) {
      importedChallengeIds = (await upsertChallengePool(questionRows)).challengeIds
    }

    const sessionId = crypto.randomUUID()
    for (const session of store.sessions) {
      session.is_active = false
    }
    store.sessions.unshift({
      id: sessionId,
      name: trimmed,
      is_active: true,
      duration_minutes: durationMinutes,
      created_at: new Date().toISOString(),
    })

    const requestedChallengeIds = [...importedChallengeIds, ...challengeIds]
    if (requestedChallengeIds.length === 0) {
      throw new Error("Select at least one challenge or upload questions before creating a session")
    }

    const selected = pickSessionChallengeSet(
      store.challenges.map((challenge) => challenge.id),
      requestedChallengeIds,
      true,
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

    for (const usn of coordinatorUsns) {
      store.session_coordinators.push({
        id: crypto.randomUUID(),
        session_id: sessionId,
        usn,
        created_at: now,
      })
    }

    store.participants.push({
      id: crypto.randomUUID(),
      name: buildCoordinatorAuthParticipantName({
        passwordHash: coordinatorPasswordHash,
        usns: coordinatorUsns,
      }),
      score: 0,
      session_id: sessionId,
      created_at: now,
    })

    return sessionId
  }

  let importedChallengeIds: number[] = []
  if (questionRows.length > 0) {
    importedChallengeIds = (await upsertChallengePool(questionRows)).challengeIds
  }

  const requestedChallengeIds = [...importedChallengeIds, ...challengeIds]
  if (requestedChallengeIds.length === 0) {
    throw new Error("Select at least one challenge or upload questions before creating a session")
  }

  await client.from("sessions").update({ is_active: false }).eq("is_active", true)

  const { data: createdSession, error: sessionError } = await client
    .from("sessions")
    .insert({
      name: trimmed,
      is_active: true,
      duration_minutes: durationMinutes,
    })
    .select("id")
    .single()

  if (sessionError || !createdSession) {
    throw sessionError ?? new Error("Unable to create session")
  }

  await seedSessionChallenges(client, createdSession.id, requestedChallengeIds, true)

  if (teamNames.length > 0) {
    const teamRows = teamNames.map((teamName) => ({
      name: teamName,
      score: 0,
      session_id: createdSession.id,
    }))
    await client.from("participants").insert(teamRows)
  }

  if (coordinatorUsns.length > 0) {
    const coordinatorAuthRow = {
      name: buildCoordinatorAuthParticipantName({
        passwordHash: coordinatorPasswordHash,
        usns: coordinatorUsns,
      }),
      score: 0,
      session_id: createdSession.id,
    }

    const { error: authInsertError } = await client
      .from("participants")
      .insert(coordinatorAuthRow)

    if (authInsertError) {
      throw authInsertError
    }
  }

  return createdSession.id
}

export async function authenticateCoordinator(input: { sessionId: string; usn: string; password: string }) {
  const normalizedUsn = normalizeCoordinatorUsn(input.usn)
  const trimmedSessionId = input.sessionId.trim()
  const trimmedPassword = input.password.trim()

  if (!trimmedSessionId) {
    throw new Error("Session is required")
  }

  if (!normalizedUsn) {
    throw new Error("Coordinator USN is required")
  }

  if (!trimmedPassword) {
    throw new Error("Session password is required")
  }

  const client = createSupabaseClient(true)
  if (!client) {
    const store = getDemoState()
    const session = store.sessions.find((entry) => entry.id === trimmedSessionId)
    if (!session) {
      throw new Error("Session not found")
    }

    const passwordValid = await verifyCoordinatorPassword(trimmedPassword, session.coordinator_password_hash ?? "")
    if (!passwordValid) {
      throw new Error("Invalid session password")
    }

    const linked = store.session_coordinators.some(
      (entry) => entry.session_id === trimmedSessionId && entry.usn === normalizedUsn,
    )
    if (!linked) {
      throw new Error("Coordinator USN is not linked to this session")
    }

    return {
      sessionId: trimmedSessionId,
      usn: normalizedUsn,
      sessionName: session.name,
    }
  }

  const { data: authRow, error: authRowError } = await client
    .from("participants")
    .select("name")
    .eq("session_id", trimmedSessionId)
    .like("name", `${COORDINATOR_AUTH_PARTICIPANT_PREFIX}:%`)
    .maybeSingle()

  if (authRowError) {
    throw authRowError
  }

  const authPayload = decodeCoordinatorAuthParticipantName(String(authRow?.name ?? ""))
  if (!authPayload) {
    throw new Error("Coordinator auth is not configured for this session")
  }

  const passwordValid = await verifyCoordinatorPassword(trimmedPassword, authPayload.passwordHash)
  if (!passwordValid) {
    throw new Error("Invalid session password")
  }

  if (!authPayload.usns.includes(normalizedUsn)) {
    throw new Error("Coordinator USN is not linked to this session")
  }

  const { data: session, error: sessionError } = await client
    .from("sessions")
    .select("id,name")
    .eq("id", trimmedSessionId)
    .maybeSingle()

  if (sessionError) {
    throw sessionError
  }

  if (!session) {
    throw new Error("Session not found")
  }

  return {
    sessionId: trimmedSessionId,
    usn: normalizedUsn,
    sessionName: String(session.name ?? ""),
  }
}

export async function isCoordinatorLinkedToSession(sessionId: string, usn: string) {
  const normalizedUsn = normalizeCoordinatorUsn(usn)
  const client = createSupabaseClient(true)

  if (!client) {
    const store = getDemoState()
    return store.session_coordinators.some((entry) => entry.session_id === sessionId && entry.usn === normalizedUsn)
  }

  const { data: authRow, error: authRowError } = await client
    .from("participants")
    .select("name")
    .eq("session_id", sessionId)
    .like("name", `${COORDINATOR_AUTH_PARTICIPANT_PREFIX}:%`)
    .maybeSingle()

  if (authRowError) {
    throw authRowError
  }

  const authPayload = decodeCoordinatorAuthParticipantName(String(authRow?.name ?? ""))
  return Boolean(authPayload?.usns.includes(normalizedUsn))
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

export async function deleteSession(id: string) {
  const client = createSupabaseClient(true)
  if (!client) {
    const store = getDemoState()
    store.sessions = store.sessions.filter((session) => session.id !== id)
    store.participants = store.participants.filter((participant) => participant.session_id !== id)
    store.session_challenges = store.session_challenges.filter((entry) => entry.session_id !== id)
    store.completions = store.completions.filter((completion) => completion.session_id !== id)
    return
  }

  await client.from("sessions").delete().eq("id", id)
}

export async function logCompletion(input: {
  participantId: string
  challengeId: number
  proofUrl: string | null
  sessionId: string
}) {
  const client = createSupabaseClient(true)
  const isDemoPayload = !IS_PRODUCTION && (input.sessionId.startsWith("session-demo-") || /^\d+$/.test(input.participantId))

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
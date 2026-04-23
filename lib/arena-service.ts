import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { getChallengePoints } from "@/lib/challenge-scoring"

import {
  buildSnapshot,
  cloneDemoStore,
  type ArenaSnapshot,
  type ArenaStore,
} from "@/lib/arena-types"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

function createSupabaseClient(serviceRole = false): SupabaseClient | null {
  if (!hasSupabaseConfig()) {
    return null
  }

  if (serviceRole && !SUPABASE_SERVICE_ROLE_KEY) {
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

function getDemoState() {
  return demoState
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

export async function getArenaSnapshot(): Promise<ArenaSnapshot> {
  const client = createSupabaseClient(true)

  if (!client) {
    return buildSnapshot(getDemoState())
  }

  const [sessionsResult, participantsResult, challengesResult, completionsResult] = await Promise.all([
    client.from("sessions").select("id,name,is_active,created_at").order("created_at", { ascending: false }),
    client.from("participants").select("id,name,score,session_id,created_at").order("score", { ascending: false }),
    client.from("challenges").select("id,title,description,position").order("position", { ascending: true }),
    client.from("completions").select("id,participant_id,challenge_id,proof_url,session_id,created_at").order("created_at", { ascending: false }),
  ])

  if (sessionsResult.error || participantsResult.error || challengesResult.error || completionsResult.error) {
    return buildSnapshot(getDemoState())
  }

  const store: ArenaStore = {
    sessions: sessionsResult.data ?? [],
    participants: participantsResult.data ?? [],
    challenges: challengesResult.data ?? [],
    completions: completionsResult.data ?? [],
  }

  return buildSnapshot(store)
}

async function getActiveSessionId(client: SupabaseClient): Promise<string | null> {
  const { data, error } = await client
    .from("sessions")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return null
  }

  return data?.id ?? null
}

export async function registerTeam(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return

  const client = createSupabaseClient(true)
  if (!client) {
    getDemoState().participants.push({
      id: crypto.randomUUID(),
      name: trimmed,
      score: 0,
      session_id: getDemoState().sessions.find((session) => session.is_active)?.id ?? null,
      created_at: new Date().toISOString(),
    })
    return
  }

  const sessionId = await getActiveSessionId(client)
  await client.from("participants").insert({ name: trimmed, score: 0, session_id: sessionId })
}

export async function deleteTeam(id: string) {
  const client = createSupabaseClient(true)
  if (!client) {
    const store = getDemoState()
    store.participants = store.participants.filter((participant) => participant.id !== id)
    store.completions = store.completions.filter((completion) => completion.participant_id !== id)
    return
  }

  await client.from("participants").delete().eq("id", id)
}

export async function awardPoint(id: string) {
  const client = createSupabaseClient(true)
  if (!client) {
    const store = getDemoState()
    const participant = store.participants.find((entry) => entry.id === id)
    if (participant) {
      participant.score += 10
    }
    return
  }

  await incrementParticipantScore(client, id, 10)
}

export async function createSession(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return

  const client = createSupabaseClient(true)
  if (!client) {
    const store = getDemoState()
    store.sessions = store.sessions.map((session) => ({ ...session, is_active: false }))
    store.sessions.unshift({
      id: crypto.randomUUID(),
      name: trimmed,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    return
  }

  await client.from("sessions").update({ is_active: false }).eq("is_active", true)
  await client.from("sessions").insert({ name: trimmed, is_active: true })
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
}) {
  const client = createSupabaseClient(true)
  if (!client) {
    const store = getDemoState()
    const participant = store.participants.find((entry) => entry.id === input.participantId)
    const session = store.sessions.find((entry) => entry.is_active)
    if (!participant || !session) {
      throw new Error("Missing participant or active session")
    }

    const existing = store.completions.find(
      (completion) => completion.participant_id === input.participantId && completion.challenge_id === input.challengeId,
    )
    if (existing) {
      return
    }

    store.completions.unshift({
      id: crypto.randomUUID(),
      participant_id: participant.id,
      challenge_id: input.challengeId,
      proof_url: input.proofUrl,
      session_id: session.id,
      created_at: new Date().toISOString(),
    })
    const challenge = store.challenges.find((entry) => entry.id === input.challengeId)
    const challengePoints = challenge ? getChallengePoints(challenge.position) : 0
    participant.score += challengePoints
    return
  }

  const sessionId = await getActiveSessionId(client)
  if (!sessionId) {
    throw new Error("No active session")
  }

  const { error } = await client.from("completions").insert({
    participant_id: input.participantId,
    challenge_id: input.challengeId,
    proof_url: input.proofUrl,
    session_id: sessionId,
  })

  if (error) {
    throw error
  }

  const { data: challenge } = await client
    .from("challenges")
    .select("position")
    .eq("id", input.challengeId)
    .maybeSingle()

  const challengePoints = challenge ? getChallengePoints(Number(challenge.position)) : 0
  await incrementParticipantScore(client, input.participantId, challengePoints)
}
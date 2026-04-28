import { getChallengePoints, getChallengeSpecialType, type ChallengeSpecialType } from "@/lib/challenge-scoring"

export const COORDINATOR_AUTH_PARTICIPANT_PREFIX = "__bitbingo_coordinator_auth__"

export type TeamStatus = "Active" | "Disqualified"
export type SessionStatus = "Active" | "Stopped"

export interface ArenaTeam {
  id: string
  name: string
  score: number
  status: TeamStatus
  sessionId: string | null
}

export interface ArenaSession {
  id: string
  name: string
  status: SessionStatus
  startedAt: string
  durationMinutes: number
}

export interface ArenaCompletion {
  id: string
  participantId: string
  participantName: string
  challengeId: number
  challengeTitle: string
  challengePoints: number
  proofUrl: string | null
  sessionId: string
  sessionName: string
  createdAt: string
}

export interface ArenaChallenge {
  id: number
  title: string
  description: string
  difficulty: string
  position: number
  sessionId: string
  points: number
  specialType: ChallengeSpecialType
  completed: boolean
  completedBy: string | null
  completedAt: string | null
  proofUrl: string | null
  sessionName: string | null
}

export interface ArenaSnapshot {
  teams: ArenaTeam[]
  sessions: ArenaSession[]
  activeSession: ArenaSession | null
  challenges: ArenaChallenge[]
  completions: ArenaCompletion[]
  selectedSessionId: string | null
}

export interface ParticipantRow {
  id: string
  name: string
  score: number
  session_id: string | null
  created_at: string
}

export interface SessionRow {
  id: string
  name: string
  is_active: boolean
  duration_minutes: number
  created_at: string
  coordinator_password_hash?: string
}

export interface ChallengeRow {
  id: number
  session_id?: string | null
  title: string
  description: string
  difficulty: string
  points: number
}

export interface SessionChallengeRow {
  id: string
  session_id: string
  challenge_id: number
  position: number
  created_at: string
}

export interface SessionCoordinatorRow {
  id: string
  session_id: string
  usn: string
  created_at: string
}

export interface CompletionRow {
  id: string
  participant_id: string
  challenge_id: number
  proof_url: string | null
  session_id: string
  created_at: string
}

export interface ArenaStore {
  sessions: SessionRow[]
  participants: ParticipantRow[]
  challenges: ChallengeRow[]
  session_challenges: SessionChallengeRow[]
  session_coordinators: SessionCoordinatorRow[]
  completions: CompletionRow[]
}

const DEMO_CHALLENGE_DATA = [
  ["Two Sum", "Given an array of integers and a target, return indices of the two numbers that add up to the target.", "easy", 55],
  ["Reverse String", "Write a function that reverses a string in-place without using built-in reverse utilities.", "easy", 55],
  ["FizzBuzz", "Print numbers 1-100. For multiples of 3 print Fizz, for multiples of 5 print Buzz, and for both print FizzBuzz.", "easy", 55],
  ["Palindrome Check", "Determine whether a string reads the same forwards and backwards, ignoring case and spaces.", "easy", 55],
  ["Fibonacci Sequence", "Generate the first N numbers of the Fibonacci sequence using iterative and recursive approaches.", "medium", 70],
  ["Binary Search", "Implement binary search on a sorted array and return the index of the target element, or -1 if not found.", "medium", 70],
  ["Bubble Sort", "Sort an array of integers using the bubble sort algorithm and explain its time complexity.", "easy", 55],
  ["Stack Implementation", "Implement a Stack class with push, pop, peek, and isEmpty operations using an array.", "medium", 70],
  ["Queue Implementation", "Implement a Queue class with enqueue, dequeue, front, and isEmpty operations using a linked list.", "medium", 70],
  ["Anagram Check", "Given two strings, determine whether they are anagrams of each other.", "easy", 55],
  ["Linked List Reversal", "Reverse a singly linked list in-place and return the new head node.", "medium", 70],
  ["Valid Parentheses", "Given a string containing only brackets, check if the bracket sequence is valid and balanced.", "medium", 70],
  ["X Marks the Spot", "Implement a circle printing logic based on coordinate geometry using all integer pairs within a radius.", "hard", 90],
  ["Matrix Rotation", "Rotate an N x N matrix 90 degrees clockwise in-place without using extra matrix space.", "hard", 90],
  ["Hash Map from Scratch", "Build a simple hash map with set, get, and delete methods using buckets and a hash function.", "hard", 90],
  ["String Compression", "Implement basic string compression such as aaabbc -> a3b2c1 and return the original string if compression does not shrink it.", "medium", 70],
  ["Merge Sort", "Sort an array using the merge sort algorithm and demonstrate the divide, conquer, and merge phases.", "hard", 90],
  ["Tree In-order Traversal", "Perform in-order traversal of a binary search tree and return the nodes in sorted ascending order.", "medium", 70],
  ["Graph BFS", "Implement Breadth-First Search on an adjacency-list graph and return the traversal order from a given start node.", "hard", 90],
  ["Graph DFS", "Implement Depth-First Search on an adjacency-list graph both iteratively and recursively.", "hard", 90],
  ["Power of Two", "Determine whether a given integer is a power of two using bitwise operations.", "easy", 55],
  ["Coin Change", "Given coin denominations and a target amount, find the minimum number of coins needed.", "hard", 90],
  ["Longest Common Subsequence", "Find the length of the longest common subsequence between two strings using dynamic programming.", "hard", 90],
  ["Regex: Count Vowels", "Use regular expressions to count the total number of vowels in a given paragraph of text.", "medium", 70],
  ["Quick Sort", "Sort an array using the quick sort algorithm with a pivot strategy of your choice.", "hard", 90],
] as const

export const DEMO_CHALLENGES: ChallengeRow[] = DEMO_CHALLENGE_DATA.map(([title, description, difficulty, points], idx) => ({
  id: idx + 1,
  session_id: null,
  title,
  description,
  difficulty,
  points,
}))

export const DEMO_SESSION_CHALLENGES: SessionChallengeRow[] = DEMO_CHALLENGES.map((challenge, idx) => ({
  id: `session-challenge-${idx + 1}`,
  session_id: "session-demo-1",
  challenge_id: challenge.id,
  position: idx,
  created_at: new Date().toISOString(),
}))

export const DEMO_SESSIONS: SessionRow[] = [
  {
    id: "session-demo-1",
    name: "bit",
    is_active: true,
    duration_minutes: 45,
    created_at: new Date().toISOString(),
  },
]

export const DEMO_SESSION_COORDINATORS: SessionCoordinatorRow[] = []

export const DEMO_PARTICIPANTS: ParticipantRow[] = [
  { id: "1", name: "hinata", score: 1, session_id: "session-demo-1", created_at: new Date().toISOString() },
  { id: "2", name: "kakashi", score: 0, session_id: "session-demo-1", created_at: new Date().toISOString() },
  { id: "3", name: "naruto", score: 1, session_id: "session-demo-1", created_at: new Date().toISOString() },
  { id: "4", name: "sakura", score: 0, session_id: "session-demo-1", created_at: new Date().toISOString() },
  { id: "5", name: "sasuke", score: 0, session_id: "session-demo-1", created_at: new Date().toISOString() },
]

export const DEMO_COMPLETIONS: CompletionRow[] = [
  {
    id: "completion-demo-1",
    participant_id: "1",
    challenge_id: 3,
    proof_url: "FizzBuzz completed during warm-up.",
    session_id: "session-demo-1",
    created_at: new Date().toISOString(),
  },
  {
    id: "completion-demo-2",
    participant_id: "3",
    challenge_id: 8,
    proof_url: "Stack implementation verified.",
    session_id: "session-demo-1",
    created_at: new Date().toISOString(),
  },
  {
    id: "completion-demo-3",
    participant_id: "1",
    challenge_id: 13,
    proof_url: "Center tile solved.",
    session_id: "session-demo-1",
    created_at: new Date().toISOString(),
  },
]

export const DEMO_STORE: ArenaStore = {
  sessions: DEMO_SESSIONS,
  participants: DEMO_PARTICIPANTS,
  challenges: DEMO_CHALLENGES,
  session_challenges: DEMO_SESSION_CHALLENGES,
  session_coordinators: DEMO_SESSION_COORDINATORS,
  completions: DEMO_COMPLETIONS,
}

export function cloneDemoStore(): ArenaStore {
  return {
    sessions: DEMO_STORE.sessions.map((session) => ({ ...session })),
    participants: DEMO_STORE.participants.map((participant) => ({ ...participant })),
    challenges: DEMO_STORE.challenges.map((challenge) => ({ ...challenge })),
    session_challenges: DEMO_STORE.session_challenges.map((sessionChallenge) => ({ ...sessionChallenge })),
    session_coordinators: DEMO_STORE.session_coordinators.map((sessionCoordinator) => ({ ...sessionCoordinator })),
    completions: DEMO_STORE.completions.map((completion) => ({ ...completion })),
  }
}

export function buildSnapshot(store: ArenaStore, selectedSessionId: string | null = null): ArenaSnapshot {
  const visibleParticipants = store.participants.filter(
    (participant) => !participant.name.startsWith(COORDINATOR_AUTH_PARTICIPANT_PREFIX),
  )

  const sessions: ArenaSession[] = store.sessions
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((session) => ({
      id: session.id,
      name: session.name,
      status: session.is_active ? "Active" : "Stopped",
      startedAt: session.created_at,
      durationMinutes: Number(session.duration_minutes ?? 45),
    }))

  const activeSession = sessions.find((session) => session.status === "Active") ?? null
  const effectiveSessionId = selectedSessionId ?? activeSession?.id ?? sessions[0]?.id ?? null

  const challengeLookup = new Map(store.challenges.map((challenge) => [challenge.id, challenge]))
  const participantLookup = new Map(visibleParticipants.map((participant) => [participant.id, participant]))
  const sessionLookup = new Map(store.sessions.map((session) => [session.id, session]))

  const scopedParticipants = effectiveSessionId
    ? visibleParticipants.filter((participant) => participant.session_id === effectiveSessionId)
    : []

  const scopedSessionChallenges = effectiveSessionId
    ? store.session_challenges.filter((entry) => entry.session_id === effectiveSessionId)
    : []

  const completions = store.completions
    .slice()
    .filter((completion) => (effectiveSessionId ? completion.session_id === effectiveSessionId : false))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((completion) => {
      const participant = participantLookup.get(completion.participant_id)
      const session = sessionLookup.get(completion.session_id)
      const challenge = challengeLookup.get(completion.challenge_id)
      const position = scopedSessionChallenges.find((entry) => entry.challenge_id === completion.challenge_id)?.position

      return {
        id: completion.id,
        participantId: completion.participant_id,
        participantName: participant?.name ?? "Unknown Crew",
        challengeId: completion.challenge_id,
        challengeTitle: challenge?.title ?? "Unknown Challenge",
        challengePoints: challenge?.points ?? (typeof position === "number" ? getChallengePoints(position) : 0),
        proofUrl: completion.proof_url,
        sessionId: completion.session_id,
        sessionName: session?.name ?? "Unknown Session",
        createdAt: completion.created_at,
      }
    })

  const challengeCompletions = new Map<number, ArenaCompletion>()

  if (effectiveSessionId) {
    for (const completion of completions) {
      if (!challengeCompletions.has(completion.challengeId)) {
        challengeCompletions.set(completion.challengeId, completion)
      }
    }
  }

  const challenges = scopedSessionChallenges
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((sessionChallenge) => {
      const challenge = challengeLookup.get(sessionChallenge.challenge_id)
      const completion = challenge ? challengeCompletions.get(challenge.id) ?? null : null

      if (!challenge) {
        return null
      }

      return {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        difficulty: challenge.difficulty,
        position: sessionChallenge.position,
        sessionId: sessionChallenge.session_id,
        points: challenge.points,
        specialType: getChallengeSpecialType(sessionChallenge.position),
        completed: Boolean(completion),
        completedBy: completion?.participantName ?? null,
        completedAt: completion?.createdAt ?? null,
        proofUrl: completion?.proofUrl ?? null,
        sessionName: completion?.sessionName ?? null,
      }
    })
    .filter((challenge): challenge is ArenaChallenge => Boolean(challenge))

  const teams = scopedParticipants.map((participant) => ({
    id: participant.id,
    name: participant.name,
    score: participant.score,
    status: "Active" as const,
    sessionId: participant.session_id,
  }))

  return {
    teams,
    sessions,
    activeSession,
    challenges,
    completions,
    selectedSessionId: effectiveSessionId,
  }
}
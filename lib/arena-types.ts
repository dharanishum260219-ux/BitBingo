import { getChallengePoints, getChallengeSpecialType, type ChallengeSpecialType } from "@/lib/challenge-scoring"

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
  position: number
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
  created_at: string
}

export interface ChallengeRow {
  id: number
  title: string
  description: string
  position: number
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
  completions: CompletionRow[]
}

const DEMO_CHALLENGE_DATA = [
  ["Two Sum", "Given an array of integers and a target, return indices of the two numbers that add up to the target."],
  ["Reverse String", "Write a function that reverses a string in-place without using built-in reverse utilities."],
  ["FizzBuzz", "Print numbers 1-100. For multiples of 3 print Fizz, for multiples of 5 print Buzz, and for both print FizzBuzz."],
  ["Palindrome Check", "Determine whether a string reads the same forwards and backwards, ignoring case and spaces."],
  ["Fibonacci Sequence", "Generate the first N numbers of the Fibonacci sequence using iterative and recursive approaches."],
  ["Binary Search", "Implement binary search on a sorted array and return the index of the target element, or -1 if not found."],
  ["Bubble Sort", "Sort an array of integers using the bubble sort algorithm and explain its time complexity."],
  ["Stack Implementation", "Implement a Stack class with push, pop, peek, and isEmpty operations using an array."],
  ["Queue Implementation", "Implement a Queue class with enqueue, dequeue, front, and isEmpty operations using a linked list."],
  ["Anagram Check", "Given two strings, determine whether they are anagrams of each other."],
  ["Linked List Reversal", "Reverse a singly linked list in-place and return the new head node."],
  ["Valid Parentheses", "Given a string containing only brackets, check if the bracket sequence is valid and balanced."],
  ["X Marks the Spot", "Implement a circle printing logic based on coordinate geometry using all integer pairs within a radius."],
  ["Matrix Rotation", "Rotate an N x N matrix 90 degrees clockwise in-place without using extra matrix space."],
  ["Hash Map from Scratch", "Build a simple hash map with set, get, and delete methods using buckets and a hash function."],
  ["String Compression", "Implement basic string compression such as aaabbc -> a3b2c1 and return the original string if compression does not shrink it."],
  ["Merge Sort", "Sort an array using the merge sort algorithm and demonstrate the divide, conquer, and merge phases."],
  ["Tree In-order Traversal", "Perform in-order traversal of a binary search tree and return the nodes in sorted ascending order."],
  ["Graph BFS", "Implement Breadth-First Search on an adjacency-list graph and return the traversal order from a given start node."],
  ["Graph DFS", "Implement Depth-First Search on an adjacency-list graph both iteratively and recursively."],
  ["Power of Two", "Determine whether a given integer is a power of two using bitwise operations."],
  ["Coin Change", "Given coin denominations and a target amount, find the minimum number of coins needed."],
  ["Longest Common Subsequence", "Find the length of the longest common subsequence between two strings using dynamic programming."],
  ["Regex: Count Vowels", "Use regular expressions to count the total number of vowels in a given paragraph of text."],
  ["Quick Sort", "Sort an array using the quick sort algorithm with a pivot strategy of your choice."],
] as const

export const DEMO_CHALLENGES: ChallengeRow[] = DEMO_CHALLENGE_DATA.map(([title, description], position) => ({
  id: position + 1,
  title,
  description,
  position,
}))

export const DEMO_SESSIONS: SessionRow[] = [
  {
    id: "session-demo-1",
    name: "bit",
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

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
  completions: DEMO_COMPLETIONS,
}

export function cloneDemoStore(): ArenaStore {
  return {
    sessions: DEMO_STORE.sessions.map((session) => ({ ...session })),
    participants: DEMO_STORE.participants.map((participant) => ({ ...participant })),
    challenges: DEMO_STORE.challenges.map((challenge) => ({ ...challenge })),
    completions: DEMO_STORE.completions.map((completion) => ({ ...completion })),
  }
}

export function buildSnapshot(store: ArenaStore): ArenaSnapshot {
  const sessions = store.sessions
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((session) => ({
      id: session.id,
      name: session.name,
      status: session.is_active ? "Active" : "Stopped",
      startedAt: session.created_at,
    }))

  const activeSession = sessions.find((session) => session.status === "Active") ?? null

  const challengeLookup = new Map(store.challenges.map((challenge) => [challenge.id, challenge]))
  const participantLookup = new Map(store.participants.map((participant) => [participant.id, participant]))
  const sessionLookup = new Map(store.sessions.map((session) => [session.id, session]))

  const completions = store.completions
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((completion) => {
      const participant = participantLookup.get(completion.participant_id)
      const session = sessionLookup.get(completion.session_id)
      const challenge = challengeLookup.get(completion.challenge_id)

      return {
        id: completion.id,
        participantId: completion.participant_id,
        participantName: participant?.name ?? "Unknown Crew",
        challengeId: completion.challenge_id,
        challengeTitle: challenge?.title ?? "Unknown Challenge",
        challengePoints: challenge ? getChallengePoints(challenge.position) : 0,
        proofUrl: completion.proof_url,
        sessionId: completion.session_id,
        sessionName: session?.name ?? "Unknown Session",
        createdAt: completion.created_at,
      }
    })

  const activeSessionId = activeSession?.id ?? null
  const challengeCompletions = new Map<number, ArenaCompletion>()

  if (activeSessionId) {
    for (const completion of completions) {
      if (completion.sessionId === activeSessionId && !challengeCompletions.has(completion.challengeId)) {
        challengeCompletions.set(completion.challengeId, completion)
      }
    }
  }

  const challenges = store.challenges
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((challenge) => {
      const completion = challengeCompletions.get(challenge.id) ?? null

      return {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        position: challenge.position,
        points: getChallengePoints(challenge.position),
        specialType: getChallengeSpecialType(challenge.position),
        completed: Boolean(completion),
        completedBy: completion?.participantName ?? null,
        completedAt: completion?.createdAt ?? null,
        proofUrl: completion?.proofUrl ?? null,
        sessionName: completion?.sessionName ?? null,
      }
    })

  const teams = store.participants.map((participant) => ({
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
  }
}
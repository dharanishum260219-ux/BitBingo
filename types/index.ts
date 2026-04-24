export type Session = {
  id: string;
  name: string;
  is_active: boolean;
  status: "scheduled" | "active" | "stopped" | "ended";
  duration_minutes: number;
  starts_at: string;
  ends_at: string;
  ended_at: string | null;
  created_at: string;
};

export type Participant = {
  id: string;
  name: string;
  score: number;
  session_id: string;
  created_at: string;
};

export type Challenge = {
  id: number;
  title: string;
  description: string;
  position: number;
};

export type Completion = {
  id: string;
  participant_id: string;
  challenge_id: number;
  proof_url: string | null;
  session_id: string;
  created_at: string;
};

export type SessionQuestion = {
  id: string;
  session_id: string;
  prompt: string;
  description: string | null;
  position: number;
  created_at: string;
};

export type Team = {
  id: string;
  session_id: string;
  name: string;
  score: number;
  status: string;
  created_at: string;
};

export type ScoreEvent = {
  id: string;
  session_id: string;
  team_id: string;
  points_delta: number;
  score_after: number;
  source: string;
  created_at: string;
};

export type Session = {
  id: string;
  name: string;
  is_active: boolean;
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

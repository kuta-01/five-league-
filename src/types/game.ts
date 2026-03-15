export type GameState =
  | 'waiting'
  | 'countdown'
  | 'drawing'
  | 'reveal'
  | 'judge'
  | 'result'
  | 'next'
  | 'finished';

export interface PlayerSlot {
  slot: number;
  name: string;
  joined: boolean;
}

export interface QuestionDisplay {
  question_text: string;
  answer: string;
  index: number;
}

export interface RevealSlot {
  slot: number;
  char: string | null;
  imageData: string | null;
  revealed: boolean;
}

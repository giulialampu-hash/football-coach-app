export type Player = { id: string; firstName: string; lastName: string };
export type Zone = 'board' | 'reserve';
export type Token = {
  id: string;
  playerId: string | null;
  label: string;
  color: string;
  note: string;
  zone: Zone;
  x: number;
  y: number;
};
export type Revision = { id: string; name: string; createdAt: string; tokens: Token[] };
export type Board = { id: string; title: string; draftTokens: Token[]; revisions: Revision[] };
export type Exercise = { id: string; label: string; minutes: number };
export type Training = { id: string; date: string; notes: string; exercises: Exercise[] };
export type AppState = { players: Player[]; board: Board; trainings: Training[] };

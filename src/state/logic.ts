import { AppState, Training } from './types';
import { demoState } from './demo';

export const STORAGE_KEY = 'coachboard:v1';
export const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
export const clamp = (value: number) => Math.max(0, Math.min(1, Number(value) || 0));
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
export const trainingDuration = (training: Training) => training.exercises.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
export const matchesTraining = (training: Training, query: string) => {
  const needle = query.trim().toLocaleLowerCase('it');
  const formattedDate = new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(new Date(`${training.date}T12:00:00`));
  return !needle || [training.date, formattedDate, training.notes, ...training.exercises.map((item) => item.label)]
    .join(' ').toLocaleLowerCase('it').includes(needle);
};
export const serializeState = (state: AppState) => JSON.stringify(state);
export const deserializeState = (raw: string | null): AppState => {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!isAppState(parsed)) return demoState();
    return {
      ...parsed,
      trainings: parsed.trainings.map((training) => {
        const { title: _discarded, ...rest } = training as Training & { title?: unknown };
        return rest;
      }),
    };
  } catch {
    return demoState();
  }
};
export const isAppState = (value: unknown): value is AppState => {
  const state = value as AppState;
  return !!state && Array.isArray(state.players) && !!state.board
    && Array.isArray(state.board.draftTokens) && Array.isArray(state.board.revisions)
    && Array.isArray(state.trainings);
};

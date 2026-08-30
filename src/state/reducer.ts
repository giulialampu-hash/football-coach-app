import { clone, clamp } from './logic';
import { AppState, Player, Token, Training } from './types';

export type Store = { data: AppState; past: Token[][]; future: Token[][]; hydrated: boolean };
export type Action =
  | { type: 'HYDRATE'; data: AppState }
  | { type: 'SAVE_PLAYER'; player: Player }
  | { type: 'DELETE_PLAYER'; id: string }
  | { type: 'SAVE_TOKEN'; token: Token }
  | { type: 'MOVE_TOKEN'; id: string; x: number; y: number }
  | { type: 'NUDGE_TOKEN'; id: string; dx: number; dy: number }
  | { type: 'DELETE_TOKEN'; id: string }
  | { type: 'SNAPSHOT'; id: string; name: string; createdAt: string }
  | { type: 'RESTORE'; id: string }
  | { type: 'UNDO' | 'REDO' }
  | { type: 'SAVE_TRAINING'; training: Training }
  | { type: 'DELETE_TRAINING'; id: string };

const replace = <T extends { id: string }>(items: T[], item: T) => {
  const found = items.some((current) => current.id === item.id);
  return found ? items.map((current) => current.id === item.id ? item : current) : [...items, item];
};

const tokenChange = (store: Store, tokens: Token[]): Store => ({
  ...store,
  data: { ...store.data, board: { ...store.data.board, draftTokens: tokens } },
  past: [...store.past.slice(-59), clone(store.data.board.draftTokens)],
  future: [],
});

export function reducer(store: Store, action: Action): Store {
  const { data } = store;
  switch (action.type) {
    case 'HYDRATE': return { data: action.data, past: [], future: [], hydrated: true };
    case 'SAVE_PLAYER': return { ...store, data: { ...data, players: replace(data.players, action.player) } };
    case 'DELETE_PLAYER': return {
      ...store,
      data: {
        ...data,
        players: data.players.filter((player) => player.id !== action.id),
        board: { ...data.board, draftTokens: data.board.draftTokens.map((token) => token.playerId === action.id ? { ...token, playerId: null } : token) },
      },
    };
    case 'SAVE_TOKEN': return tokenChange(store, replace(data.board.draftTokens, { ...action.token, x: clamp(action.token.x), y: clamp(action.token.y) }));
    case 'MOVE_TOKEN': return tokenChange(store, data.board.draftTokens.map((token) => token.id === action.id ? { ...token, x: clamp(action.x), y: clamp(action.y) } : token));
    case 'NUDGE_TOKEN': return tokenChange(store, data.board.draftTokens.map((token) => token.id === action.id ? { ...token, x: clamp(token.x + action.dx), y: clamp(token.y + action.dy) } : token));
    case 'DELETE_TOKEN': return tokenChange(store, data.board.draftTokens.filter((token) => token.id !== action.id));
    case 'SNAPSHOT': return {
      ...store,
      data: { ...data, board: { ...data.board, revisions: [...data.board.revisions, { id: action.id, name: action.name, createdAt: action.createdAt, tokens: clone(data.board.draftTokens) }] } },
    };
    case 'RESTORE': {
      const revision = data.board.revisions.find((item) => item.id === action.id);
      return revision ? tokenChange(store, clone(revision.tokens)) : store;
    }
    case 'UNDO': {
      const previous = store.past.at(-1);
      return previous ? { ...store, data: { ...data, board: { ...data.board, draftTokens: clone(previous) } }, past: store.past.slice(0, -1), future: [clone(data.board.draftTokens), ...store.future] } : store;
    }
    case 'REDO': {
      const next = store.future[0];
      return next ? { ...store, data: { ...data, board: { ...data.board, draftTokens: clone(next) } }, past: [...store.past, clone(data.board.draftTokens)], future: store.future.slice(1) } : store;
    }
    case 'SAVE_TRAINING': return { ...store, data: { ...data, trainings: replace(data.trainings, action.training) } };
    case 'DELETE_TRAINING': return { ...store, data: { ...data, trainings: data.trainings.filter((item) => item.id !== action.id) } };
  }
}

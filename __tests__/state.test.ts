import { demoState } from '@/state/demo';
import { clamp, deserializeState, matchesTraining, serializeState, trainingDuration } from '@/state/logic';
import { reducer, Store } from '@/state/reducer';

const store = (): Store => ({ data: demoState(), past: [], future: [], hydrated: true });

describe('stato Football Coach', () => {
  test('serializza, recupera e usa demo con archivio corrotto', () => {
    const state = demoState();
    expect(deserializeState(serializeState(state))).toEqual(state);
    expect(deserializeState('{rotto').players).toHaveLength(8);
  });

  test('confina coordinate tra zero e uno', () => {
    expect([clamp(-4), clamp(.42), clamp(9)]).toEqual([0, .42, 1]);
  });

  test('snapshot resta immutabile dopo movimento', () => {
    const snap = reducer(store(), { type: 'SNAPSHOT', id: 'r1', name: 'Prima', createdAt: '2026-08-30T12:00:00Z' });
    const moved = reducer(snap, { type: 'MOVE_TOKEN', id: 't1', x: .1, y: .2 });
    expect(moved.data.board.revisions[0].tokens.find((item) => item.id === 't1')?.x).toBe(.5);
  });

  test('undo e redo ripristinano movimento', () => {
    const moved = reducer(store(), { type: 'MOVE_TOKEN', id: 't1', x: .1, y: .2 });
    const undone = reducer(moved, { type: 'UNDO' });
    expect(undone.data.board.draftTokens.find((item) => item.id === 't1')?.x).toBe(.5);
    const redone = reducer(undone, { type: 'REDO' });
    expect(redone.data.board.draftTokens.find((item) => item.id === 't1')?.x).toBe(.1);
  });

  test('calcola durata e cerca in ogni campo', () => {
    const training = demoState().trainings[0];
    expect(trainingDuration(training)).toBe(70);
    for (const query of ['2026-08-31', '31 ago', 'progressione', 'rondo']) expect(matchesTraining(training, query)).toBe(true);
    expect(matchesTraining(training, 'uscita')).toBe(false);
    expect(matchesTraining(training, 'portieri')).toBe(false);
  });

  test('migra vecchi allenamenti scartando il titolo', () => {
    const legacy = demoState() as ReturnType<typeof demoState> & { trainings: Array<ReturnType<typeof demoState>['trainings'][number] & { title?: string }> };
    legacy.trainings[0].title = 'Titolo vecchio';
    const migrated = deserializeState(JSON.stringify(legacy));
    expect(migrated.trainings[0]).not.toHaveProperty('title');
    expect(migrated.trainings[0].notes).toBe('Progressione: analitico, situazionale, partita.');
  });

  test('eliminare giocatore scollega bozza ma non cronologia', () => {
    const snap = reducer(store(), { type: 'SNAPSHOT', id: 'r1', name: 'Prima', createdAt: '2026-08-30T12:00:00Z' });
    const removed = reducer(snap, { type: 'DELETE_PLAYER', id: 'p1' });
    expect(removed.data.board.draftTokens.find((item) => item.id === 't1')?.playerId).toBeNull();
    expect(removed.data.board.revisions[0].tokens.find((item) => item.id === 't1')?.playerId).toBe('p1');
  });
});

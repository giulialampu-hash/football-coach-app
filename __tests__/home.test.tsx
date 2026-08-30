import { fireEvent, render } from '@testing-library/react-native';
import HomeScreen, { formatTrainingDay, getNextTraining } from '@/../app/(tabs)/index';
import { toIsoDate } from '@/components/MonthCalendar';
import { AppState } from '@/state/types';

const mockPush = jest.fn();
let mockData: AppState;

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 390, height: 844 }),
}));
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));
jest.mock('@/state/StateProvider', () => ({ useAppState: () => ({ data: mockData }) }));

const training = (id: string, date: string, labels = ['Rondo', 'Possesso', 'Partita']) => ({
  id, date, notes: `Seduta ${id}`,
  exercises: labels.map((label, index) => ({ id: `${id}-${index}`, label, minutes: 10 + index * 5 })),
});
const localDate = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toIsoDate(date);
};

beforeEach(() => {
  mockPush.mockClear();
  mockData = {
    players: [{ id: '1', firstName: 'A', lastName: 'A' }, { id: '2', firstName: 'B', lastName: 'B' }],
    board: { id: 'board', title: 'Schema gara', draftTokens: [], revisions: [] },
    trainings: [training('future-2', localDate(4)), training('past', localDate(-1)), training('future-1', localDate(1))],
  };
});

test('sceglie prima seduta non passata e mostra riepilogo compatto', async () => {
  const view = await render(<HomeScreen />);
  expect(view.getByText('Seduta future-1')).toBeTruthy();
  expect(view.queryByText('Seduta past')).toBeNull();
  expect(view.getByText('Domani')).toBeTruthy();
  expect(view.getByText('45 min')).toBeTruthy();
  expect(view.getByText('• Rondo')).toBeTruthy();
  expect(view.getByText('• Possesso')).toBeTruthy();
  expect(view.getByText('+1')).toBeTruthy();

  await fireEvent.press(view.getByRole('button', { name: 'Prossimo allenamento' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/training-editor', params: { trainingId: 'future-1' } });
});

test('azioni rapide e nuova seduta mantengono rotte accessibili', async () => {
  const view = await render(<HomeScreen />);
  await fireEvent.press(view.getByRole('button', { name: 'Continua lavagnetta' }));
  expect(mockPush).toHaveBeenLastCalledWith('/board');
  await fireEvent.press(view.getByRole('button', { name: 'Squadra' }));
  expect(mockPush).toHaveBeenLastCalledWith('/team');
  await fireEvent.press(view.getByRole('button', { name: 'Nuova seduta' }));
  expect(mockPush).toHaveBeenLastCalledWith('/training-editor');
});

test('stato vuoto espone un solo comando di creazione', async () => {
  mockData.trainings = [training('past', localDate(-1))];
  const view = await render(<HomeScreen />);
  expect(view.getByText('Nessuna seduta pianificata')).toBeTruthy();
  expect(view.queryByRole('button', { name: 'Nuova seduta' })).toBeNull();
  await fireEvent.press(view.getByRole('button', { name: 'Crea seduta' }));
  expect(mockPush).toHaveBeenCalledWith('/training-editor');
});

test('helper usa calendario locale per selezione ed etichette', () => {
  const now = new Date(2026, 7, 30, 23, 30);
  expect(getNextTraining([training('past', '2026-08-29'), training('today', '2026-08-30')], now)?.id).toBe('today');
  expect(formatTrainingDay('2026-08-30', now)).toBe('Oggi');
  expect(formatTrainingDay('2026-08-31', now)).toBe('Domani');
});

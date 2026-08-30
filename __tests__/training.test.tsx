import { fireEvent, render, screen } from '@testing-library/react-native';
import TrainingScreen from '@/../app/(tabs)/training';
import TrainingEditorScreen from '@/../app/training-editor';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockDispatch = jest.fn();
let mockParams: { trainingId?: string } = {};

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('expo-haptics', () => ({ notificationAsync: jest.fn(), NotificationFeedbackType: { Success: 'Success' } }));
jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    back: () => mockBack(),
    replace: (...args: unknown[]) => mockReplace(...args),
    canGoBack: () => mockCanGoBack(),
  },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/state/StateProvider', () => ({ useAppState: () => ({ data: jest.requireActual('@/state/demo').demoState(), dispatch: mockDispatch }) }));

beforeEach(() => {
  mockPush.mockClear();
  mockBack.mockClear();
  mockReplace.mockClear();
  mockCanGoBack.mockReset().mockReturnValue(true);
  mockDispatch.mockClear();
  mockParams = {};
});

test('mostra agenda compatta e passa tra tre viste', async () => {
  await render(<TrainingScreen />);
  expect(screen.queryByText('Programmazione')).toBeNull();
  expect(screen.getByRole('tab', { name: 'Agenda' }).props.accessibilityState.selected).toBe(true);
  expect(screen.getByText('Progressione: analitico, situazionale, partita.')).toBeTruthy();
  expect(screen.getByText('70 min')).toBeTruthy();

  await fireEvent.press(screen.getByRole('tab', { name: 'Settimana' }));
  expect(screen.getByRole('tab', { name: 'Settimana' }).props.accessibilityState.selected).toBe(true);
  await fireEvent.press(screen.getByRole('tab', { name: 'Mese' }));
  expect(screen.getByRole('button', { name: 'Vai a oggi' })).toBeTruthy();
  await fireEvent.press(screen.getByLabelText(/31 agosto 2026/));
  expect(screen.getByText('Progressione: analitico, situazionale, partita.')).toBeTruthy();
});

test('nuova seduta usa route fullscreen', async () => {
  await render(<TrainingScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Seduta' }));
  expect(mockPush).toHaveBeenCalledWith('/training-editor');
});

test('editor non ha titolo, richiede data e salva esercizi', async () => {
  await render(<TrainingEditorScreen />);
  expect(screen.queryByText('Titolo')).toBeNull();
  expect(screen.getByRole('button', { name: 'Salva' })).toBeDisabled();
  await fireEvent.press(screen.getAllByLabelText(/^Seleziona /)[10]);
  await fireEvent.changeText(screen.getByLabelText('Nome esercizio'), 'Rondo');
  await fireEvent.press(screen.getByRole('button', { name: 'Salva' }));
  expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
    type: 'SAVE_TRAINING',
    training: expect.not.objectContaining({ title: expect.anything() }),
  }));
  expect(mockBack).toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
});

test('editor esistente carica dati e abilita Salva', async () => {
  mockParams = { trainingId: 'tr2' };
  await render(<TrainingEditorScreen />);
  expect(screen.getByDisplayValue('Alta intensità, recuperi completi.')).toBeTruthy();
  expect(screen.getByDisplayValue('Attivazione a coppie')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Salva' })).toBeEnabled();
});

test('Annulla torna indietro quando cronologia disponibile', async () => {
  await render(<TrainingEditorScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Annulla modifica' }));
  expect(mockBack).toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
});

test('Annulla usa lista Allenamenti quando editor è root', async () => {
  mockCanGoBack.mockReturnValue(false);
  await render(<TrainingEditorScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Annulla modifica' }));
  expect(mockBack).not.toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith('/training');
});

test('Salva usa lista Allenamenti quando editor è root', async () => {
  mockCanGoBack.mockReturnValue(false);
  mockParams = { trainingId: 'tr2' };
  await render(<TrainingEditorScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Salva' }));
  expect(mockDispatch).toHaveBeenCalled();
  expect(mockBack).not.toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith('/training');
});

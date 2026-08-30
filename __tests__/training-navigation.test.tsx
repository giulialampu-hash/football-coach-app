import { render } from '@testing-library/react-native';
import TrainingScreen from '@/../app/(tabs)/training';

const mockPush = jest.fn();
const mockSetParams = jest.fn();
let mockParams: { action?: string; id?: string } = {};

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    setParams: (...args: unknown[]) => mockSetParams(...args),
  },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/state/StateProvider', () => ({
  useAppState: () => ({ data: jest.requireActual('@/state/demo').demoState(), dispatch: jest.fn() }),
}));

beforeEach(() => {
  mockPush.mockClear();
  mockSetParams.mockClear();
  mockParams = {};
});

test('parametro new apre editor e viene consumato', async () => {
  mockParams = { action: 'new' };
  const view = await render(<TrainingScreen />);
  expect(mockSetParams).toHaveBeenCalledWith({ action: undefined, id: undefined });
  expect(mockPush).not.toHaveBeenCalled();
  mockParams = {};
  await view.rerender(<TrainingScreen />);
  expect(mockPush).toHaveBeenCalledWith('/training-editor');
});

test('parametro edit valido apre seduta corretta', async () => {
  mockParams = { action: 'edit', id: 'tr2' };
  const view = await render(<TrainingScreen />);
  expect(mockPush).not.toHaveBeenCalled();
  mockParams = {};
  await view.rerender(<TrainingScreen />);
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/training-editor', params: { trainingId: 'tr2' } });
});

test('ID edit invalido viene consumato e lascia lista aperta', async () => {
  mockParams = { action: 'edit', id: 'missing' };
  const view = await render(<TrainingScreen />);
  expect(mockSetParams).toHaveBeenCalledWith({ action: undefined, id: undefined });
  mockParams = {};
  await view.rerender(<TrainingScreen />);
  expect(mockPush).not.toHaveBeenCalled();
});

test('azione sconosciuta lascia lista aperta', async () => {
  mockParams = { action: 'unknown', id: 'tr1' };
  await render(<TrainingScreen />);
  expect(mockSetParams).not.toHaveBeenCalled();
  expect(mockPush).not.toHaveBeenCalled();
});

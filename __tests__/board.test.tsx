import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';
import BoardScreen from '@/../app/(tabs)/board';
import { demoState } from '@/state/demo';

const mockDispatch = jest.fn();
const mockData = demoState();
const mockDimensions = { width: 390, height: 844 };

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => mockDimensions,
}));
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: { View },
    runOnJS: (callback: (...args: unknown[]) => unknown) => callback,
    useAnimatedStyle: (callback: () => object) => callback(),
    useReducedMotion: () => true,
    useSharedValue: (value: unknown) => ({ value }),
    withTiming: (value: unknown) => value,
  };
});
jest.mock('react-native-gesture-handler', () => {
  const pan = {
    minDistance: () => pan,
    onBegin: () => pan,
    onUpdate: () => pan,
    onEnd: () => pan,
    onFinalize: () => pan,
  };
  return { Gesture: { Pan: () => pan }, GestureDetector: ({ children }: { children: ReactNode }) => children };
});
jest.mock('@/components/AppModal', () => {
  const React = jest.requireActual('react');
  const { Text, View } = jest.requireActual('react-native');
  return {
    AppModal: ({ visible, title, children }: { visible: boolean; title: string; children: ReactNode }) => visible
      ? React.createElement(View, null, React.createElement(Text, null, title), children)
      : null,
  };
});
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light' },
  NotificationFeedbackType: { Success: 'Success' },
}));
jest.mock('expo-router', () => ({
  Tabs: { Screen: ({ options }: { options: { headerRight: () => React.ReactNode } }) => options.headerRight() },
}));
jest.mock('@/state/StateProvider', () => ({
  useAppState: () => ({ data: mockData, dispatch: mockDispatch, past: [], future: [] }),
}));

beforeEach(() => {
  mockDispatch.mockClear();
  mockDimensions.width = 390;
  mockDimensions.height = 844;
});

test('espone toolbar compatta e apre cronologia dall’header', async () => {
  await render(<BoardScreen />);

  expect(screen.queryByText('Schema gara')).toBeNull();
  expect(screen.getByRole('button', { name: 'Annulla' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Ripeti' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Aggiungi pallino' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Salva posizione' })).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'Cronologia' }));
  expect(screen.getByText('Nessuna posizione salvata.')).toBeTruthy();
});

test('occupa il 75% dello schermo in verticale', async () => {
  await render(<BoardScreen />);

  expect(screen.getByLabelText('Campo da calcio')).toHaveStyle({ width: 374, height: 633 });
});

test('mantiene proporzione orizzontale entro il 75% dello schermo', async () => {
  mockDimensions.width = 844;
  mockDimensions.height = 390;
  await render(<BoardScreen />);

  expect(screen.getByLabelText('Campo da calcio')).toHaveStyle({ width: 406.25, height: 292.5 });
});

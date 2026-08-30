import { fireEvent, render, screen } from '@testing-library/react-native';
import TeamScreen from '@/../app/(tabs)/team';
import { Player } from '@/state/types';

let mockPlayers: Player[] = [];

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('@/state/StateProvider', () => ({
  useAppState: () => ({
    data: { players: mockPlayers, board: { draftTokens: [] } },
    dispatch: jest.fn(),
  }),
}));

const players = Array.from({ length: 12 }, (_, index) => ({ id: String(index + 1), firstName: `Nome${index + 1}`, lastName: `Cognome${index + 1}` }));

beforeEach(() => { mockPlayers = players; });

test('mostra dieci giocatori per pagina e naviga', async () => {
  await render(<TeamScreen />);
  expect(screen.getByText('Pagina 1 di 2')).toBeTruthy();
  expect(screen.queryByText('Nome11 Cognome11')).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Successiva' }));

  expect(screen.getByText('Pagina 2 di 2')).toBeTruthy();
  expect(screen.getByText('Nome11 Cognome11')).toBeTruthy();
});

test('cerca nome completo, ignora maiuscole e torna alla prima pagina', async () => {
  await render(<TeamScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Successiva' }));
  await fireEvent.changeText(screen.getByLabelText('Cerca giocatore per nome o cognome'), 'NOME2 COGNOME2');

  expect(screen.getByText('Nome2 Cognome2')).toBeTruthy();
  expect(screen.queryByText(/Pagina/)).toBeNull();
});

test('distingue rosa vuota da ricerca senza risultati e mantiene azione accessibile', async () => {
  const view = await render(<TeamScreen />);
  expect(screen.getByRole('button', { name: 'Aggiungi giocatore' })).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Cerca giocatore per nome o cognome'), 'inesistente');
  expect(screen.getByText('Nessun giocatore trovato.')).toBeTruthy();

  mockPlayers = [];
  await view.rerender(<TeamScreen />);
  expect(screen.getByText('Nessun giocatore.')).toBeTruthy();
});

import { fireEvent, render } from '@testing-library/react-native';
import { Button } from '@/components/ui';

test('pulsante espone etichetta e azione accessibili', async () => {
  const onPress = jest.fn();
  const screen = await render(<Button label="Salva" onPress={onPress} />);
  fireEvent.press(screen.getByRole('button', { name: 'Salva' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

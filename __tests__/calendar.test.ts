import { addDays, monthDays, startOfWeek, toIsoDate } from '@/components/MonthCalendar';

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');

test('calendario parte lunedì e copre cambi mese e anno', () => {
  expect(toIsoDate(startOfWeek(new Date(2026, 7, 30, 12)))).toBe('2026-08-24');
  const january = monthDays(new Date(2027, 0, 1, 12));
  expect(january).toHaveLength(42);
  expect(toIsoDate(january[0])).toBe('2026-12-28');
  expect(toIsoDate(addDays(january[0], 41))).toBe('2027-02-07');
});

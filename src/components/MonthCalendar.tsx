import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

const pad = (value: number) => String(value).padStart(2, '0');
export const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const fromIsoDate = (date: string) => new Date(`${date}T12:00:00`);
export const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
export const startOfWeek = (date: Date) => addDays(date, -((date.getDay() + 6) % 7));
export const monthDays = (month: Date) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
};

type Props = {
  selected?: string;
  onSelect: (date: string) => void;
  counts?: Record<string, number>;
};

export function MonthCalendar({ selected, onSelect, counts = {} }: Props) {
  const initial = selected ? fromIsoDate(selected) : new Date();
  const [month, setMonth] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1, 12));
  const days = useMemo(() => monthDays(month), [month]);
  const today = toIsoDate(new Date());
  const move = (offset: number) => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + offset, 1, 12));
  const select = (value: string) => {
    const next = fromIsoDate(value);
    if (next.getMonth() !== month.getMonth() || next.getFullYear() !== month.getFullYear()) setMonth(new Date(next.getFullYear(), next.getMonth(), 1, 12));
    onSelect(value);
  };

  return <View style={styles.calendar}>
    <View style={styles.navigation}>
      <IconButton label="Mese precedente" icon="chevron-back" onPress={() => move(-1)} />
      <Text style={styles.month}>{new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(month)}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Vai a oggi" onPress={() => select(today)} style={styles.today}><Text style={styles.todayText}>Oggi</Text></Pressable>
      <IconButton label="Mese successivo" icon="chevron-forward" onPress={() => move(1)} />
    </View>
    <View style={styles.grid}>
      {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>)}
      {days.map((day) => {
        const value = toIsoDate(day);
        const active = value === selected;
        const outside = day.getMonth() !== month.getMonth();
        return <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Seleziona ${formatDate(value)}`} onPress={() => select(value)} style={[styles.day, active && styles.activeDay]}>
          <Text style={[styles.dayText, outside && styles.outside, value === today && styles.current, active && styles.activeText]}>{day.getDate()}</Text>
          {!!counts[value] && <View style={[styles.marker, active && styles.activeMarker]}><Text style={[styles.markerText, active && styles.activeMarkerText]}>{counts[value]}</Text></View>}
        </Pressable>;
      })}
    </View>
  </View>;
}

function IconButton({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={6} onPress={onPress} style={styles.icon}><Ionicons name={icon} size={20} color={colors.ink} /></Pressable>;
}

const formatDate = (date: string) => new Intl.DateTimeFormat('it-IT', { dateStyle: 'long' }).format(fromIsoDate(date));
const styles = StyleSheet.create({
  calendar: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: spacing.sm },
  navigation: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  month: { flex: 1, color: colors.ink, fontFamily: 'Manrope_800ExtraBold', fontSize: 16, textTransform: 'capitalize' },
  icon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  today: { minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.sm },
  todayText: { color: colors.accent, fontFamily: 'Manrope_700Bold', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.285%', textAlign: 'center', color: colors.muted, fontFamily: 'Manrope_700Bold', fontSize: 11, paddingVertical: 5 },
  day: { width: '14.285%', minHeight: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  activeDay: { backgroundColor: colors.accent },
  dayText: { color: colors.ink, fontFamily: 'Manrope_700Bold', fontSize: 13 },
  outside: { color: colors.line }, current: { color: colors.accent }, activeText: { color: colors.white },
  marker: { minWidth: 15, height: 15, borderRadius: 8, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  markerText: { color: colors.white, fontFamily: 'Manrope_700Bold', fontSize: 9 },
  activeMarker: { backgroundColor: colors.white }, activeMarkerText: { color: colors.accent },
});

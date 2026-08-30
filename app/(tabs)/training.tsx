import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { addDays, fromIsoDate, MonthCalendar, startOfWeek, toIsoDate } from '@/components/MonthCalendar';
import { Button, Empty } from '@/components/ui';
import { useAppState } from '@/state/StateProvider';
import { matchesTraining, trainingDuration } from '@/state/logic';
import { Training } from '@/state/types';
import { colors, common, radius, spacing } from '@/theme';

type CalendarView = 'agenda' | 'week' | 'month';
const today = () => toIsoDate(new Date());

export default function TrainingScreen() {
  const { data, dispatch } = useAppState();
  const { action, id } = useLocalSearchParams<{ action?: string; id?: string }>();
  const pendingAction = useRef<{ action: 'new' | 'edit'; id?: string } | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<CalendarView>('agenda');
  const [selectedDate, setSelectedDate] = useState(today);
  const [week, setWeek] = useState(() => startOfWeek(new Date()));
  const filtered = useMemo(() => data.trainings.filter((item) => matchesTraining(item, query)).sort((a, b) => a.date.localeCompare(b.date)), [data.trainings, query]);
  const grouped = useMemo(() => Object.entries(filtered.reduce<Record<string, Training[]>>((all, item) => { (all[item.date] ??= []).push(item); return all; }, {})), [filtered]);
  const counts = useMemo(() => filtered.reduce<Record<string, number>>((all, item) => ({ ...all, [item.date]: (all[item.date] ?? 0) + 1 }), {}), [filtered]);
  const edit = (training?: Training) => router.push(training ? { pathname: '/training-editor', params: { trainingId: training.id } } : '/training-editor');

  useEffect(() => {
    if (action === 'new' || action === 'edit') {
      pendingAction.current = { action, id };
      router.setParams({ action: undefined, id: undefined });
    }
  }, [action, id]);

  useEffect(() => {
    if (action !== undefined) return;
    const pending = pendingAction.current;
    if (!pending) return;
    pendingAction.current = null;
    if (pending.action === 'new') router.push('/training-editor');
    else {
      const training = data.trainings.find((item) => item.id === pending.id);
      if (training) router.push({ pathname: '/training-editor', params: { trainingId: training.id } });
    }
  }, [action, data.trainings]);
  const remove = (training: Training) => Alert.alert('Eliminare allenamento?', formatDate(training.date), [
    { text: 'Annulla', style: 'cancel' }, { text: 'Elimina', style: 'destructive', onPress: () => dispatch({ type: 'DELETE_TRAINING', id: training.id }) },
  ]);

  return <ScrollView style={common.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>Allenamenti</Text>
    <View style={styles.searchRow}>
      <TextInput accessibilityLabel="Cerca per data, note o esercizio" placeholder="Cerca allenamenti…" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} style={[common.input, styles.search]} />
      <Button label="Seduta" icon={<Ionicons name="add" size={19} color="white" />} onPress={() => edit()} style={styles.addButton} />
    </View>
    <View accessibilityRole="tablist" style={styles.tabs}>
      {([['agenda', 'Agenda'], ['week', 'Settimana'], ['month', 'Mese']] as const).map(([value, label]) => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: view === value }} onPress={() => setView(value)} style={[styles.tab, view === value && styles.activeTab]}><Text style={[styles.tabText, view === value && styles.activeTabText]}>{label}</Text></Pressable>)}
    </View>

    {view === 'agenda' && <Agenda groups={grouped} onEdit={edit} onRemove={remove} />}
    {view === 'week' && <Week trainings={filtered} week={week} setWeek={setWeek} onEdit={edit} onRemove={remove} />}
    {view === 'month' && <>
      <MonthCalendar selected={selectedDate} onSelect={setSelectedDate} counts={counts} />
      <Text style={styles.selectedTitle}>{formatFullDate(selectedDate)}</Text>
      <View style={styles.dayList}>{filtered.filter((item) => item.date === selectedDate).map((item) => <TrainingRow key={item.id} training={item} onEdit={edit} onRemove={remove} />)}</View>
      {!filtered.some((item) => item.date === selectedDate) && <Empty>Nessun allenamento in questo giorno.</Empty>}
    </>}
  </ScrollView>;
}

function Agenda({ groups, onEdit, onRemove }: { groups: [string, Training[]][]; onEdit: (training: Training) => void; onRemove: (training: Training) => void }) {
  if (!groups.length) return <Empty>Nessun allenamento trovato.</Empty>;
  return <View style={styles.agenda}>{groups.map(([date, trainings]) => <View key={date} style={styles.dayGroup}>
    <Text style={styles.dayHeading}>{formatFullDate(date)}</Text>
    <View style={styles.dayList}>{trainings.map((item) => <TrainingRow key={item.id} training={item} onEdit={onEdit} onRemove={onRemove} />)}</View>
  </View>)}</View>;
}

function Week({ trainings, week, setWeek, onEdit, onRemove }: { trainings: Training[]; week: Date; setWeek: (date: Date) => void; onEdit: (training: Training) => void; onRemove: (training: Training) => void }) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(week, index));
  return <>
    <View style={styles.weekNav}>
      <IconButton label="Settimana precedente" icon="chevron-back" onPress={() => setWeek(addDays(week, -7))} />
      <Text style={styles.weekRange}>{formatShort(days[0])} – {formatShort(days[6])}</Text>
      <Pressable accessibilityRole="button" onPress={() => setWeek(startOfWeek(new Date()))} style={styles.todayButton}><Text style={styles.todayText}>Oggi</Text></Pressable>
      <IconButton label="Settimana successiva" icon="chevron-forward" onPress={() => setWeek(addDays(week, 7))} />
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekGrid}>
      {days.map((day) => {
        const date = toIsoDate(day);
        const items = trainings.filter((item) => item.date === date);
        return <View key={date} style={[styles.weekDay, date === today() && styles.currentWeekDay]}>
          <Text style={styles.weekDayName}>{new Intl.DateTimeFormat('it-IT', { weekday: 'short' }).format(day)}</Text>
          <Text style={styles.weekDayNumber}>{day.getDate()}</Text>
          {items.map((item) => <WeekTraining key={item.id} training={item} onEdit={onEdit} onRemove={onRemove} />)}
          {!items.length && <Text style={styles.noTraining}>—</Text>}
        </View>;
      })}
    </ScrollView>
  </>;
}

function TrainingRow({ training, onEdit, onRemove }: { training: Training; onEdit: (training: Training) => void; onRemove: (training: Training) => void }) {
  return <View style={styles.trainingRow}>
    <View style={styles.rowBody}>
      <Text numberOfLines={2} style={styles.notes}>{training.notes || 'Nessuna nota'}</Text>
      <Text style={styles.duration}>{trainingDuration(training)} min</Text>
    </View>
    <IconButton label={`Modifica allenamento del ${formatDate(training.date)}`} icon="pencil" onPress={() => onEdit(training)} />
    <IconButton label={`Elimina allenamento del ${formatDate(training.date)}`} icon="trash-outline" danger onPress={() => onRemove(training)} />
  </View>;
}

function WeekTraining({ training, onEdit, onRemove }: { training: Training; onEdit: (training: Training) => void; onRemove: (training: Training) => void }) {
  return <View style={styles.weekTraining}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Modifica allenamento del ${formatDate(training.date)}`} onPress={() => onEdit(training)}>
      <Text numberOfLines={2} style={styles.weekNotes}>{training.notes || 'Nessuna nota'}</Text><Text style={styles.weekDuration}>{trainingDuration(training)} min</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`Elimina allenamento del ${formatDate(training.date)}`} onPress={() => onRemove(training)} style={styles.weekDelete}><Ionicons name="trash-outline" size={16} color={colors.danger} /></Pressable>
  </View>;
}

function IconButton({ label, icon, danger, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; danger?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={6} onPress={onPress} style={styles.iconButton}><Ionicons name={icon} size={20} color={danger ? colors.danger : colors.ink} /></Pressable>;
}

const formatDate = (date: string) => new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(fromIsoDate(date));
const formatFullDate = (date: string) => new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(fromIsoDate(date));
const formatShort = (date: Date) => new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(date);
const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  title: { color: colors.ink, fontFamily: 'Manrope_800ExtraBold', fontSize: 24, letterSpacing: -.7 },
  searchRow: { flexDirection: 'row', gap: spacing.sm }, search: { flex: 1 }, addButton: { minHeight: 48, paddingHorizontal: 12 },
  tabs: { flexDirection: 'row', padding: 3, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm },
  tab: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }, activeTab: { backgroundColor: colors.accent },
  tabText: { color: colors.muted, fontFamily: 'Manrope_700Bold', fontSize: 12 }, activeTabText: { color: colors.white },
  agenda: { gap: spacing.md }, dayGroup: { gap: spacing.xs }, dayHeading: { color: colors.ink, fontFamily: 'Manrope_800ExtraBold', fontSize: 14, textTransform: 'capitalize' },
  dayList: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, overflow: 'hidden' },
  trainingRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, paddingLeft: 12 },
  rowBody: { flex: 1, paddingVertical: spacing.sm }, notes: { color: colors.ink, fontFamily: 'Manrope_500Medium', fontSize: 13, lineHeight: 18 }, duration: { color: colors.accent, fontFamily: 'Manrope_800ExtraBold', fontSize: 12, marginTop: 3 },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, selectedTitle: { color: colors.ink, fontFamily: 'Manrope_800ExtraBold', fontSize: 14, textTransform: 'capitalize', marginTop: spacing.xs },
  weekNav: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs }, weekRange: { flex: 1, color: colors.ink, fontFamily: 'Manrope_800ExtraBold', fontSize: 14 },
  todayButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: spacing.sm }, todayText: { color: colors.accent, fontFamily: 'Manrope_700Bold', fontSize: 12 },
  weekGrid: { gap: spacing.sm, paddingBottom: spacing.xs }, weekDay: { width: 136, minHeight: 240, padding: spacing.sm, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.surface }, currentWeekDay: { borderColor: colors.accent, borderWidth: 2 },
  weekDayName: { color: colors.muted, fontFamily: 'Manrope_700Bold', fontSize: 11, textTransform: 'uppercase' }, weekDayNumber: { color: colors.ink, fontFamily: 'Manrope_800ExtraBold', fontSize: 22, marginBottom: spacing.sm },
  weekTraining: { position: 'relative', padding: spacing.sm, paddingRight: 27, marginBottom: spacing.xs, borderRadius: 8, backgroundColor: colors.background, borderLeftWidth: 3, borderLeftColor: colors.accent },
  weekNotes: { color: colors.ink, fontFamily: 'Manrope_500Medium', fontSize: 11, lineHeight: 15 }, weekDuration: { color: colors.accent, fontFamily: 'Manrope_800ExtraBold', fontSize: 10, marginTop: 3 },
  weekDelete: { position: 'absolute', right: 3, top: 3, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }, noTraining: { color: colors.line, textAlign: 'center', marginTop: spacing.lg },
});

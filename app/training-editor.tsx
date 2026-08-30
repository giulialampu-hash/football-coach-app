import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fromIsoDate, MonthCalendar } from '@/components/MonthCalendar';
import { Button } from '@/components/ui';
import { useAppState } from '@/state/StateProvider';
import { clone, uid } from '@/state/logic';
import { Exercise, Training } from '@/state/types';
import { colors, common, radius, spacing } from '@/theme';

const newTraining = (): Training => ({ id: uid('tr'), date: '', notes: '', exercises: [{ id: uid('e'), label: '', minutes: 10 }] });

export default function TrainingEditorScreen() {
  const { trainingId } = useLocalSearchParams<{ trainingId?: string }>();
  const { data, dispatch } = useAppState();
  const existing = data.trainings.find((item) => item.id === trainingId);
  const [editing, setEditing] = useState<Training>(() => existing ? clone(existing) : newTraining());
  const [calendarOpen, setCalendarOpen] = useState(!existing);
  const { height } = useWindowDimensions();
  const noteHeight = Math.max(180, Math.min(440, height * .45));
  const patchExercise = (id: string, patch: Partial<Exercise>) => setEditing((value) => ({ ...value, exercises: value.exercises.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(editing.date) && editing.exercises.length > 0 && editing.exercises.every((item) => item.label.trim());
  const exit = () => router.canGoBack() ? router.back() : router.replace('/training');
  const save = () => {
    if (!valid) return;
    dispatch({ type: 'SAVE_TRAINING', training: { ...editing, notes: editing.notes.trim(), exercises: editing.exercises.map((item) => ({ ...item, label: item.label.trim(), minutes: Math.max(0, Number(item.minutes) || 0) })) } });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    exit();
  };

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Annulla modifica" onPress={exit} style={styles.headerButton}><Ionicons name="close" size={25} color={colors.ink} /></Pressable>
        <Text style={styles.title}>{existing ? 'Modifica seduta' : 'Nuova seduta'}</Text>
        <Button label="Salva" disabled={!valid} onPress={save} style={styles.saveButton} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={common.label}>Data allenamento</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Scegli data allenamento" onPress={() => setCalendarOpen((value) => !value)} style={styles.dateField}>
          <Ionicons name="calendar-outline" size={21} color={colors.accent} />
          <Text style={[styles.dateText, !editing.date && styles.placeholder]}>{editing.date ? formatDate(editing.date) : 'Scegli una data'}</Text>
          <Ionicons name={calendarOpen ? 'chevron-up' : 'chevron-down'} size={19} color={colors.muted} />
        </Pressable>
        {calendarOpen && <MonthCalendar selected={editing.date || undefined} onSelect={(date) => { setEditing((value) => ({ ...value, date })); setCalendarOpen(false); }} />}

        <Text style={common.label}>Note</Text>
        <TextInput accessibilityLabel="Note allenamento" placeholder="Scrivi note, obiettivi e indicazioni…" placeholderTextColor={colors.muted} value={editing.notes} onChangeText={(notes) => setEditing((value) => ({ ...value, notes }))} multiline scrollEnabled textAlignVertical="top" style={[common.input, styles.notes, { height: noteHeight, maxHeight: height * .6 }]} />

        <Text style={styles.exerciseTitle}>Esercizi</Text>
        <View style={styles.table}>
          <View style={styles.tableHead}><Text style={[styles.columnHead, styles.exerciseColumn]}>Esercizio</Text><Text style={[styles.columnHead, styles.minutesColumn]}>Minuti</Text><View style={styles.removeColumn} /></View>
          {editing.exercises.map((exercise) => <View key={exercise.id} style={styles.exerciseRow}>
            <TextInput accessibilityLabel="Nome esercizio" placeholder="Esercizio" placeholderTextColor={colors.muted} value={exercise.label} onChangeText={(label) => patchExercise(exercise.id, { label })} style={[styles.cellInput, styles.exerciseColumn]} />
            <TextInput accessibilityLabel="Minuti" value={String(exercise.minutes)} onChangeText={(minutes) => patchExercise(exercise.id, { minutes: Number(minutes.replace(/\D/g, '')) })} keyboardType="number-pad" style={[styles.cellInput, styles.minutesColumn]} />
            <Pressable accessibilityRole="button" accessibilityLabel="Rimuovi esercizio" disabled={editing.exercises.length === 1} onPress={() => setEditing((value) => ({ ...value, exercises: value.exercises.filter((item) => item.id !== exercise.id) }))} style={[styles.removeColumn, styles.removeButton, editing.exercises.length === 1 && styles.disabled]}><Ionicons name="close" size={20} color={colors.danger} /></Pressable>
          </View>)}
        </View>
        <Button label="Aggiungi esercizio" tone="quiet" icon={<Ionicons name="add" size={20} color={colors.ink} />} onPress={() => setEditing((value) => ({ ...value, exercises: [...value.exercises, { id: uid('e'), label: '', minutes: 10 }] }))} />
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const formatDate = (date: string) => new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(fromIsoDate(date));
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, scroll: { flex: 1 },
  header: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, title: { flex: 1, color: colors.ink, fontFamily: 'Manrope_800ExtraBold', fontSize: 19 }, saveButton: { minHeight: 42, paddingHorizontal: 14 },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  dateField: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.surface },
  dateText: { flex: 1, color: colors.ink, fontFamily: 'Manrope_500Medium', textTransform: 'capitalize' }, placeholder: { color: colors.muted },
  notes: { paddingTop: 12, paddingBottom: 12 }, exerciseTitle: { color: colors.ink, fontFamily: 'Manrope_800ExtraBold', fontSize: 18, marginTop: spacing.sm },
  table: { overflow: 'hidden', borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.surface },
  tableHead: { minHeight: 34, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.line },
  columnHead: { color: colors.muted, fontFamily: 'Manrope_700Bold', fontSize: 11, textTransform: 'uppercase' }, exerciseColumn: { flex: 1 }, minutesColumn: { width: 65 }, removeColumn: { width: 38 },
  exerciseRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  cellInput: { minHeight: 45, color: colors.ink, fontFamily: 'Manrope_500Medium', fontSize: 13, paddingVertical: 4, paddingHorizontal: 4 }, removeButton: { height: 45, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: .25 },
});

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { fromIsoDate, toIsoDate } from '@/components/MonthCalendar';
import { Button } from '@/components/ui';
import { useAppState } from '@/state/StateProvider';
import { trainingDuration } from '@/state/logic';
import { Training } from '@/state/types';
import { colors, common, radius, shadow, spacing } from '@/theme';

export const getNextTraining = (trainings: Training[], now = new Date()) => {
  const today = toIsoDate(now);
  return [...trainings].filter((item) => item.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
};

export const formatTrainingDay = (date: string, now = new Date()) => {
  const today = toIsoDate(now);
  const tomorrow = toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12));
  if (date === today) return 'Oggi';
  if (date === tomorrow) return 'Domani';
  return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(fromIsoDate(date));
};

export default function HomeScreen() {
  const { data } = useAppState();
  const { width } = useWindowDimensions();
  const next = getNextTraining(data.trainings);
  const openTraining = () => router.push(next
    ? { pathname: '/training-editor', params: { trainingId: next.id } }
    : '/training-editor');

  return (
    <ScrollView style={common.screen} contentContainerStyle={styles.content}>
      <View style={styles.container}>
        <Text style={styles.today}>{formatToday()}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={next ? 'Prossimo allenamento' : 'Crea seduta'}
          accessibilityHint={next ? 'Apre la seduta in modifica.' : 'Apre una nuova seduta.'}
          onPress={openTraining}
          style={({ pressed }) => [styles.trainingCard, pressed && styles.pressed]}
        >
          <View style={styles.trainingHeading}>
            <Text style={styles.eyebrow}>Prossimo allenamento</Text>
            <Ionicons name="arrow-forward" size={22} color={colors.white} />
          </View>
          {next ? <TrainingSummary training={next} /> : <>
            <Text style={styles.emptyTitle}>Nessuna seduta pianificata</Text>
            <Text style={styles.cardAction}>Crea seduta</Text>
          </>}
        </Pressable>

        <View style={[styles.quickRow, width < 360 && styles.quickColumn]}>
          <QuickCard icon="grid-outline" title="Continua lavagnetta" detail={data.board.title} onPress={() => router.push('/board')} />
          <QuickCard icon="people-outline" title="Squadra" detail={`${data.players.length} giocatori`} onPress={() => router.push('/team')} />
        </View>

        {next && <Button label="Nuova seduta" icon={<Ionicons name="add" size={20} color={colors.white} />} onPress={() => router.push('/training-editor')} style={styles.newButton} />}
      </View>
    </ScrollView>
  );
}

function TrainingSummary({ training }: { training: Training }) {
  const visible = training.exercises.slice(0, 2);
  const extra = training.exercises.length - visible.length;
  return <>
    <Text numberOfLines={2} style={styles.trainingTitle}>{training.notes || 'Allenamento'}</Text>
    <View style={styles.metaRow}>
      <Text style={styles.meta}>{formatTrainingDay(training.date)}</Text>
      <View style={styles.dot} />
      <Text style={styles.meta}>{trainingDuration(training)} min</Text>
    </View>
    {!!visible.length && <View style={styles.exercises}>
      {visible.map((exercise) => <Text key={exercise.id} numberOfLines={1} style={styles.exercise}>• {exercise.label}</Text>)}
      {extra > 0 && <Text style={styles.more}>+{extra}</Text>}
    </View>}
  </>;
}

function QuickCard({ icon, title, detail, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; detail: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}>
    <Ionicons name={icon} size={24} color={colors.accent} />
    <View style={styles.quickCopy}>
      <Text numberOfLines={2} style={styles.quickTitle}>{title}</Text>
      <Text numberOfLines={1} style={styles.quickDetail}>{detail}</Text>
    </View>
  </Pressable>;
}

const formatToday = () => new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: spacing.md },
  today: { color: colors.muted, fontFamily: 'Manrope_700Bold', fontSize: 14, textTransform: 'capitalize' },
  trainingCard: { minHeight: 224, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.accent, ...shadow },
  pressed: { opacity: .82, transform: [{ scale: .98 }] },
  trainingHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  eyebrow: { color: '#D8F2E6', fontFamily: 'Manrope_800ExtraBold', fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase' },
  trainingTitle: { color: colors.white, fontFamily: 'Manrope_800ExtraBold', fontSize: 24, lineHeight: 30, letterSpacing: -.6 },
  emptyTitle: { flex: 1, color: colors.white, fontFamily: 'Manrope_800ExtraBold', fontSize: 24, lineHeight: 31 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  meta: { color: colors.white, fontFamily: 'Manrope_700Bold', fontSize: 14, textTransform: 'capitalize' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#A9D6C2' },
  exercises: { marginTop: spacing.md, gap: 3 },
  exercise: { color: '#E5F5ED', fontFamily: 'Manrope_500Medium', fontSize: 13, lineHeight: 19 },
  more: { color: colors.white, fontFamily: 'Manrope_800ExtraBold', fontSize: 12, marginTop: 2 },
  cardAction: { color: colors.white, fontFamily: 'Manrope_800ExtraBold', fontSize: 14, textDecorationLine: 'underline' },
  quickRow: { flexDirection: 'row', gap: spacing.sm },
  quickColumn: { flexDirection: 'column' },
  quickCard: { flex: 1, minHeight: 96, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md },
  quickCopy: { flex: 1, gap: 3 },
  quickTitle: { color: colors.ink, fontFamily: 'Manrope_800ExtraBold', fontSize: 14, lineHeight: 18 },
  quickDetail: { color: colors.muted, fontFamily: 'Manrope_500Medium', fontSize: 12 },
  newButton: { width: '100%' },
});

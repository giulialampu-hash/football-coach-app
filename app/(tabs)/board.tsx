import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppModal } from '@/components/AppModal';
import { Button, Card, Empty, text } from '@/components/ui';
import { useAppState } from '@/state/StateProvider';
import { clamp, clone, uid } from '@/state/logic';
import { Token } from '@/state/types';
import { colors, common, radius, spacing } from '@/theme';

const TOKEN_SIZE = 52;
const palette = ['#1756A9', '#B22626', '#D18B00', '#176B4B', '#6F3CA0', '#222222'];
const blankToken = (playerId: string | null): Token => ({ id: uid('t'), playerId, label: '', color: palette[0], note: '', zone: 'board', x: .5, y: .5 });

export default function BoardScreen() {
  const { data, dispatch, past, future } = useAppState();
  const { width: viewport, height: viewportHeight } = useWindowDimensions();
  const [editing, setEditing] = useState<Token | null>(null);
  const [snapshot, setSnapshot] = useState(false);
  const [history, setHistory] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const isLandscape = viewport > viewportHeight;
  const boardRatio = .72;
  const boardHeight = isLandscape ? Math.min((viewport - 16) * boardRatio, viewportHeight * .75) : viewportHeight * .75;
  const boardWidth = isLandscape ? boardHeight / boardRatio : viewport - 16;
  const boardTokens = data.board.draftTokens.filter((item) => item.zone === 'board');
  const reserveTokens = data.board.draftTokens.filter((item) => item.zone === 'reserve');
  const playerName = (id: string | null) => {
    const player = data.players.find((item) => item.id === id);
    return player ? `${player.firstName} ${player.lastName}` : 'Giocatore non collegato';
  };
  const saveToken = () => {
    if (!editing) return;
    dispatch({ type: 'SAVE_TOKEN', token: { ...editing, label: editing.label.trim(), note: editing.note.trim() } });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditing(null);
  };
  const saveSnapshot = () => {
    if (!snapshotName.trim()) return;
    dispatch({ type: 'SNAPSHOT', id: uid('rev'), name: snapshotName.trim(), createdAt: new Date().toISOString() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSnapshot(false); setSnapshotName('');
  };
  return (
    <>
      <Tabs.Screen options={{ headerRight: () => <Pressable accessibilityRole="button" accessibilityLabel="Cronologia" hitSlop={8} onPress={() => setHistory(true)} style={styles.historyButton}><Ionicons name="time-outline" size={27} color={colors.ink} /></Pressable> }} />
      <ScrollView style={common.screen} contentContainerStyle={styles.content}>
        <View style={styles.toolbar}>
          <ToolbarButton label="Annulla" icon="arrow-undo" disabled={!past.length} onPress={() => dispatch({ type: 'UNDO' })} />
          <ToolbarButton label="Ripeti" icon="arrow-redo" disabled={!future.length} onPress={() => dispatch({ type: 'REDO' })} />
          <ToolbarButton label="Aggiungi pallino" icon="add" primary onPress={() => setEditing(blankToken(data.players[0]?.id ?? null))} />
          <ToolbarButton label="Salva posizione" icon="save-outline" onPress={() => setSnapshot(true)} />
        </View>
        <View style={[styles.pitch, { width: boardWidth, height: boardHeight }]} accessibilityLabel="Campo da calcio">
          <FieldLines />
          {boardTokens.map((token) => <DraggableToken key={token.id} token={token} width={boardWidth} height={boardHeight} name={playerName(token.playerId)} onMove={(x, y) => dispatch({ type: 'MOVE_TOKEN', id: token.id, x, y })} onPress={() => setEditing(clone(token))} />)}
        </View>
        <Card style={styles.reserve}><Text style={styles.reserveTitle}>Riserve</Text><View style={styles.reserveList}>{reserveTokens.map((token) => <Pressable key={token.id} accessibilityRole="button" accessibilityLabel={`Modifica ${playerName(token.playerId)}`} onPress={() => setEditing(clone(token))} style={styles.reserveTokenTouch}><View style={[styles.reserveToken, { backgroundColor: token.color }]}><Text style={styles.reserveTokenText}>{token.label || initials(playerName(token.playerId))}</Text></View></Pressable>)}</View></Card>
        <TokenEditor token={editing} players={data.players} onChange={setEditing} onClose={() => setEditing(null)} onSave={saveToken} onDelete={() => { if (editing) dispatch({ type: 'DELETE_TOKEN', id: editing.id }); setEditing(null); }} onNudge={(dx, dy) => editing && setEditing({ ...editing, x: clamp(editing.x + dx), y: clamp(editing.y + dy) })} />
        <AppModal visible={snapshot} title="Salva posizione" onClose={() => setSnapshot(false)}><View><Text style={common.label}>Nome versione</Text><TextInput autoFocus value={snapshotName} onChangeText={setSnapshotName} placeholder="es. Pressing alto" style={common.input} maxLength={80} /></View><View style={styles.modalActions}><Button label="Annulla" tone="quiet" onPress={() => setSnapshot(false)} /><Button label="Salva versione" onPress={saveSnapshot} disabled={!snapshotName.trim()} /></View></AppModal>
        <AppModal visible={history} title="Cronologia" fullScreen onClose={() => setHistory(false)}>{data.board.revisions.length ? [...data.board.revisions].reverse().map((revision) => <View key={revision.id} style={styles.revision}><MiniPitch tokens={revision.tokens} /><View style={styles.revisionText}><Text style={text.heading}>{revision.name}</Text><Text style={text.muted}>{new Date(revision.createdAt).toLocaleString('it-IT')}</Text><Button label="Ripristina" tone="quiet" onPress={() => { dispatch({ type: 'RESTORE', id: revision.id }); setHistory(false); }} /></View></View>) : <Empty>Nessuna posizione salvata.</Empty>}</AppModal>
      </ScrollView>
    </>
  );
}

function DraggableToken({ token, width, height, name, onMove, onPress }: { token: Token; width: number; height: number; name: string; onMove: (x: number, y: number) => void; onPress: () => void }) {
  const x = useSharedValue(token.x * width); const y = useSharedValue(token.y * height);
  const startX = useSharedValue(0); const startY = useSharedValue(0); const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  useEffect(() => { x.value = token.x * width; y.value = token.y * height; }, [token.x, token.y, width, height, x, y]);
  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const gesture = useMemo(() => Gesture.Pan().minDistance(5)
    .onBegin(() => { startX.value = x.value; startY.value = y.value; scale.value = reduceMotion ? 1 : withTiming(1.08, { duration: 100 }); runOnJS(haptic)(); })
    .onUpdate((event) => { x.value = Math.max(TOKEN_SIZE / 2, Math.min(width - TOKEN_SIZE / 2, startX.value + event.translationX)); y.value = Math.max(TOKEN_SIZE / 2, Math.min(height - TOKEN_SIZE / 2, startY.value + event.translationY)); })
    .onEnd(() => runOnJS(onMove)(x.value / width, y.value / height))
    .onFinalize(() => { scale.value = reduceMotion ? 1 : withTiming(1, { duration: 100 }); }), [height, onMove, reduceMotion, scale, startX, startY, width, x, y]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateX: x.value - TOKEN_SIZE / 2 }, { translateY: y.value - TOKEN_SIZE / 2 }, { scale: scale.value }] }));
  return <GestureDetector gesture={gesture}><Animated.View style={[styles.token, { backgroundColor: token.color }, animated]}><Pressable accessibilityRole="button" accessibilityLabel={`${token.label || initials(name)}. ${name}. Trascina o tocca per modificare.`} onPress={onPress} style={styles.tokenPress}><Text style={styles.tokenText}>{token.label || initials(name)}</Text>{!!token.note && <View style={styles.noteDot} />}</Pressable></Animated.View></GestureDetector>;
}

function TokenEditor({ token, players, onChange, onClose, onSave, onDelete, onNudge }: { token: Token | null; players: { id: string; firstName: string; lastName: string }[]; onChange: (token: Token | null) => void; onClose: () => void; onSave: () => void; onDelete: () => void; onNudge: (dx: number, dy: number) => void }) {
  if (!token) return <AppModal visible={false} title="Pallino" onClose={onClose} />;
  return <AppModal visible title="Modifica pallino" onClose={onClose}>
    <View><Text style={common.label}>Giocatore</Text><View style={styles.choices}><Choice active={!token.playerId} label="Nessuno" onPress={() => onChange({ ...token, playerId: null })} />{players.map((player) => <Choice key={player.id} active={token.playerId === player.id} label={`${player.firstName} ${player.lastName}`} onPress={() => onChange({ ...token, playerId: player.id })} />)}</View></View>
    <View><Text style={common.label}>Etichetta</Text><TextInput value={token.label} onChangeText={(label) => onChange({ ...token, label })} placeholder="es. CEN" style={common.input} maxLength={12} /></View>
    <View><Text style={common.label}>Colore</Text><View style={styles.palette}>{palette.map((color) => <Pressable key={color} accessibilityRole="radio" accessibilityState={{ checked: token.color === color }} accessibilityLabel={`Colore ${color}`} onPress={() => onChange({ ...token, color })} style={[styles.swatch, { backgroundColor: color }, token.color === color && styles.swatchActive]} />)}</View></View>
    <View><Text style={common.label}>Nota</Text><TextInput value={token.note} onChangeText={(note) => onChange({ ...token, note })} multiline style={[common.input, styles.notes]} maxLength={240} /></View>
    <View><Text style={common.label}>Area</Text><View style={styles.actionRow}><Choice active={token.zone === 'board'} label="Campo" onPress={() => onChange({ ...token, zone: 'board' })} /><Choice active={token.zone === 'reserve'} label="Riserve" onPress={() => onChange({ ...token, zone: 'reserve' })} /></View></View>
    {token.zone === 'board' && <View><Text style={common.label}>Sposta pallino</Text><View style={styles.directions}><View /><Direction icon="arrow-up" label="Sposta su" onPress={() => onNudge(0, -.01)} /><View /><Direction icon="arrow-back" label="Sposta a sinistra" onPress={() => onNudge(-.01, 0)} /><Direction icon="arrow-down" label="Sposta giù" onPress={() => onNudge(0, .01)} /><Direction icon="arrow-forward" label="Sposta a destra" onPress={() => onNudge(.01, 0)} /></View></View>}
    <View style={styles.modalActions}><Button label="Elimina" tone="danger" onPress={onDelete} /><View style={{ flex: 1 }} /><Button label="Annulla" tone="quiet" onPress={onClose} /><Button label="Salva" onPress={onSave} /></View>
  </AppModal>;
}

function Choice({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) { return <Pressable accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={onPress} style={[styles.choice, active && styles.choiceActive]}><Text style={[text.body, active && styles.choiceText]}>{label}</Text></Pressable>; }
function Direction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.direction}><Ionicons name={icon} size={24} color={colors.ink} /></Pressable>; }
function ToolbarButton({ label, icon, primary = false, disabled = false, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; primary?: boolean; disabled?: boolean; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.toolbarButton, primary && styles.toolbarButtonPrimary, pressed && styles.pressed, disabled && styles.disabled]}><Ionicons name={icon} size={28} color={primary ? colors.white : colors.ink} /></Pressable>; }
function FieldLines() { return <><View style={styles.halfLine} /><View style={styles.circle} /><View style={[styles.box, styles.boxTop]} /><View style={[styles.box, styles.boxBottom]} /></>; }
function MiniPitch({ tokens }: { tokens: Token[] }) { return <View style={styles.miniPitch}>{tokens.filter((item) => item.zone === 'board').map((token) => <View key={token.id} style={[styles.miniDot, { backgroundColor: token.color, left: `${token.x * 100}%`, top: `${token.y * 100}%` }]} />)}</View>; }
const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

const styles = StyleSheet.create({
  content: { padding: spacing.sm, gap: spacing.sm, paddingBottom: spacing.sm },
  historyButton: { width: 48, height: 48, marginRight: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  toolbar: { flexDirection: 'row', gap: spacing.xs }, toolbarButton: { flex: 1, height: 56, borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line }, toolbarButtonPrimary: { backgroundColor: colors.accent, borderColor: colors.accent }, pressed: { opacity: .8, transform: [{ scale: .98 }] }, disabled: { opacity: .35 },
  pitch: { alignSelf: 'center', backgroundColor: colors.field, borderRadius: radius.md, borderWidth: 4, borderColor: colors.white, overflow: 'hidden', position: 'relative' },
  halfLine: { position: 'absolute', left: 0, right: 0, top: '50%', height: 2, backgroundColor: 'rgba(255,255,255,.8)' }, circle: { position: 'absolute', width: '38%', aspectRatio: 1, borderRadius: 999, borderWidth: 2, borderColor: 'rgba(255,255,255,.8)', left: '31%', top: '38%' },
  box: { position: 'absolute', width: '56%', height: '16%', borderWidth: 2, borderColor: 'rgba(255,255,255,.8)', left: '22%' }, boxTop: { top: -2 }, boxBottom: { bottom: -2 },
  token: { position: 'absolute', width: TOKEN_SIZE, height: TOKEN_SIZE, borderRadius: TOKEN_SIZE / 2, borderWidth: 3, borderColor: colors.white, elevation: 6 }, tokenPress: { flex: 1, alignItems: 'center', justifyContent: 'center' }, tokenText: { color: colors.white, fontFamily: 'Manrope_800ExtraBold', fontSize: 12, textShadowColor: '#000', textShadowRadius: 2 }, noteDot: { position: 'absolute', right: -3, top: -3, width: 11, height: 11, borderRadius: 6, backgroundColor: colors.yellow, borderWidth: 2, borderColor: colors.white },
  reserve: { gap: spacing.xs, padding: 10 }, reserveTitle: { color: colors.ink, fontFamily: 'Manrope_800ExtraBold', fontSize: 16, textAlign: 'center' }, reserveList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs, minHeight: 44 }, reserveTokenTouch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, reserveToken: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center', elevation: 3 }, reserveTokenText: { color: colors.white, fontFamily: 'Manrope_800ExtraBold', fontSize: 10, textShadowColor: '#000', textShadowRadius: 2 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, revision: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md }, revisionText: { flex: 1, gap: spacing.xs }, miniPitch: { width: 92, height: 68, backgroundColor: colors.field, overflow: 'hidden' }, miniDot: { position: 'absolute', width: 7, height: 7, marginLeft: -3, marginTop: -3, borderRadius: 4, borderWidth: 1, borderColor: colors.white },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }, choice: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line }, choiceActive: { backgroundColor: colors.accent, borderColor: colors.accent }, choiceText: { color: colors.white },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, swatch: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: colors.white }, swatchActive: { borderColor: colors.focus, borderWidth: 4 }, notes: { height: 88, paddingTop: 12, textAlignVertical: 'top' }, directions: { width: 152, flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'center' }, direction: { width: 48, height: 48, margin: 1, borderRadius: radius.sm, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }, modalActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
});

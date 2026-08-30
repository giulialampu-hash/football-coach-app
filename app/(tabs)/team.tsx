import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppModal } from '@/components/AppModal';
import { Button, Card, Empty, text } from '@/components/ui';
import { useAppState } from '@/state/StateProvider';
import { uid } from '@/state/logic';
import { Player } from '@/state/types';
import { colors, common, spacing } from '@/theme';

const blank = (): Player => ({ id: uid('p'), firstName: '', lastName: '' });
const PAGE_SIZE = 10;

export default function TeamScreen() {
  const { data, dispatch } = useAppState();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Player | null>(null);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('it');
    return data.players.filter((player) => `${player.firstName} ${player.lastName}`.toLocaleLowerCase('it').includes(needle));
  }, [data.players, query]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const players = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const search = (value: string) => { setQuery(value); setPage(0); };
  const save = () => {
    if (!editing?.firstName.trim() || !editing.lastName.trim()) return;
    dispatch({ type: 'SAVE_PLAYER', player: { ...editing, firstName: editing.firstName.trim(), lastName: editing.lastName.trim() } });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditing(null);
  };
  const remove = (player: Player) => Alert.alert('Rimuovere giocatore?', 'Pallini correnti restano senza collegamento. Versioni salvate non cambiano.', [
    { text: 'Annulla', style: 'cancel' },
    { text: 'Rimuovi', style: 'destructive', onPress: () => dispatch({ type: 'DELETE_PLAYER', id: player.id }) },
  ]);

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
      <View style={styles.toolbar}>
        <TextInput accessibilityLabel="Cerca giocatore per nome o cognome" placeholder="Cerca giocatore…" placeholderTextColor={colors.muted} returnKeyType="search" value={query} onChangeText={search} style={[common.input, styles.search]} />
        <Pressable accessibilityRole="button" accessibilityLabel="Aggiungi giocatore" hitSlop={6} onPress={() => setEditing(blank())} style={styles.addButton}><Ionicons name="add" size={17} color={colors.white} /></Pressable>
      </View>
      <View style={styles.list}>
        {players.length ? players.map((player) => {
          const used = data.board.draftTokens.some((token) => token.playerId === player.id);
          return (
            <Card key={player.id} style={styles.person}>
              <View style={styles.avatar}><Text style={styles.initials}>{player.firstName[0]}{player.lastName[0]}</Text></View>
              <View style={styles.name}><Text numberOfLines={1} style={styles.playerName}>{player.firstName} {player.lastName}</Text><Text style={text.muted}>{used ? 'Presente in lavagnetta' : 'Non schierato'}</Text></View>
              <View style={styles.playerActions}>
                <IconButton label={`Modifica ${player.firstName} ${player.lastName}`} icon="pencil" onPress={() => setEditing({ ...player })} />
                <IconButton label={`Rimuovi ${player.firstName} ${player.lastName}`} icon="trash-outline" danger onPress={() => remove(player)} />
              </View>
            </Card>
          );
        }) : <Empty>{data.players.length ? 'Nessun giocatore trovato.' : 'Nessun giocatore.'}</Empty>}
      </View>
      {totalPages > 1 && <View style={styles.pagination}>
        <Button label="Precedente" tone="quiet" disabled={currentPage === 0} hitSlop={6} style={styles.pageButton} onPress={() => setPage(currentPage - 1)} />
        <Text style={styles.pageLabel}>Pagina {currentPage + 1} di {totalPages}</Text>
        <Button label="Successiva" tone="quiet" disabled={currentPage === totalPages - 1} hitSlop={6} style={styles.pageButton} onPress={() => setPage(currentPage + 1)} />
      </View>}
      <AppModal visible={!!editing} title="Giocatore" onClose={() => setEditing(null)}>
        <View><Text style={common.label}>Nome</Text><TextInput autoFocus value={editing?.firstName ?? ''} onChangeText={(firstName) => setEditing((value) => value && { ...value, firstName })} style={common.input} maxLength={40} /></View>
        <View><Text style={common.label}>Cognome</Text><TextInput value={editing?.lastName ?? ''} onChangeText={(lastName) => setEditing((value) => value && { ...value, lastName })} style={common.input} maxLength={40} /></View>
        <View style={styles.actions}><Button label="Annulla" tone="quiet" onPress={() => setEditing(null)} /><Button label="Salva" onPress={save} disabled={!editing?.firstName.trim() || !editing.lastName.trim()} /></View>
      </AppModal>
    </ScrollView>
  );
}

function IconButton({ label, icon, danger, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; danger?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={6} onPress={onPress} style={styles.iconButton}><Ionicons name={icon} size={17} color={danger ? colors.danger : colors.ink} /></Pressable>;
}
const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  search: { flex: 1, minHeight: 40 },
  addButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  list: { gap: spacing.xs },
  person: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.white, fontFamily: 'Manrope_800ExtraBold' },
  name: { flex: 1, minWidth: 0 },
  playerName: { ...text.heading, fontSize: 16 },
  playerActions: { flexDirection: 'row', gap: spacing.xs },
  iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.background },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  pageButton: { minHeight: 36, paddingHorizontal: 12 },
  pageLabel: { color: colors.muted, fontFamily: 'Manrope_700Bold', fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});

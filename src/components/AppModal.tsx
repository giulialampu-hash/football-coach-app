import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, common, radius, spacing } from '@/theme';

export function AppModal({ visible, title, fullScreen = false, onClose, children }: PropsWithChildren<{ visible: boolean; title: string; fullScreen?: boolean; onClose: () => void }>) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={[styles.backdrop, fullScreen && styles.fullBackdrop]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, fullScreen && styles.fullScreen]}>
          <View style={common.sectionHead}>
            <Text style={styles.title}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Chiudi" hitSlop={8} onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={26} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,15,11,.58)', justifyContent: 'center', padding: spacing.md },
  fullBackdrop: { padding: 0 },
  sheet: { maxHeight: '90%', width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  fullScreen: { height: '100%', maxHeight: '100%', maxWidth: '100%', borderRadius: 0 },
  title: { color: colors.ink, fontFamily: 'Manrope_800ExtraBold', fontSize: 21 },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  body: { gap: spacing.md, paddingBottom: spacing.sm },
});

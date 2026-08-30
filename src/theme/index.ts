import { Platform, StyleSheet } from 'react-native';

export const colors = {
  accent: '#176B4B', accentDark: '#10543A', surface: '#FFFFFF', background: '#F2F5F2',
  ink: '#17221C', muted: '#5B675F', line: '#CBD5CE', danger: '#A52D2D', field: '#267654',
  focus: '#0A62C8', white: '#FFFFFF', yellow: '#F4C430',
};
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 10, md: 16, pill: 999 };
export const shadow = Platform.select({
  ios: { shadowColor: '#1C3024', shadowOpacity: .1, shadowRadius: 15, shadowOffset: { width: 0, height: 8 } },
  android: { elevation: 3 }, default: {},
});

export const common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 32 },
  eyebrow: { color: colors.accent, fontFamily: 'Manrope_800ExtraBold', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { color: colors.ink, fontFamily: 'Manrope_800ExtraBold', fontSize: 30, letterSpacing: -1 },
  subtitle: { color: colors.muted, fontFamily: 'Manrope_500Medium', fontSize: 16, lineHeight: 24 },
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: 12, color: colors.ink, backgroundColor: colors.surface, fontFamily: 'Manrope_500Medium' },
  label: { color: colors.ink, fontFamily: 'Manrope_700Bold', marginBottom: 6 },
});


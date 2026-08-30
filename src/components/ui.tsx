import { PropsWithChildren, ReactNode } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';

type ButtonProps = PressableProps & { label: string; icon?: ReactNode; tone?: 'primary' | 'quiet' | 'danger'; style?: StyleProp<ViewStyle> };
export function Button({ label, icon, tone = 'primary', disabled, style, ...props }: ButtonProps) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} style={({ pressed }) => [styles.button, styles[tone], pressed && styles.pressed, disabled && styles.disabled, style]} {...props}>
      {icon}<Text style={[styles.buttonText, tone === 'quiet' && styles.quietText]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Empty({ children }: PropsWithChildren) {
  return <View style={styles.empty}><Text style={styles.emptyText}>{children}</Text></View>;
}

export const text = StyleSheet.create({
  heading: { color: colors.ink, fontFamily: 'Manrope_800ExtraBold', fontSize: 19 },
  body: { color: colors.ink, fontFamily: 'Manrope_500Medium', fontSize: 15 },
  muted: { color: colors.muted, fontFamily: 'Manrope_500Medium', fontSize: 13 },
});

const styles = StyleSheet.create({
  button: { minHeight: 48, paddingHorizontal: 16, borderRadius: radius.sm, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primary: { backgroundColor: colors.accent }, quiet: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line }, danger: { backgroundColor: colors.danger },
  buttonText: { color: colors.white, fontFamily: 'Manrope_700Bold', fontSize: 14 }, quietText: { color: colors.ink },
  pressed: { opacity: .8, transform: [{ scale: .98 }] }, disabled: { opacity: .4 },
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  empty: { minHeight: 88, padding: spacing.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.muted, fontFamily: 'Manrope_500Medium', textAlign: 'center' },
});


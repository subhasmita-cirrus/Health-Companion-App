import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore, type ThemePreference } from '../stores/settingsStore';
import { darkColors, lightColors, type ThemeColors } from './colors';

export type AppTypography = ReturnType<typeof getTypography>;
export type AppShadow = ReturnType<typeof getShadow>;

export function getTypography(c: ThemeColors) {
  return {
    h1: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: c.text,
      letterSpacing: -0.4,
    },
    h2: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: c.text,
      letterSpacing: -0.2,
    },
    h3: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: c.text,
    },
    body: {
      fontSize: 15,
      color: c.textSecondary,
      lineHeight: 22,
    },
    small: {
      fontSize: 13,
      color: c.textMuted,
      letterSpacing: 0.1,
    },
  };
}

export function getShadow(isDark: boolean) {
  return {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.45 : 0.06,
      shadowRadius: 14,
      elevation: isDark ? 6 : 3,
    },
  };
}

export function resolveIsDark(preference: ThemePreference, system: string | null | undefined) {
  if (preference === 'dark') return true;
  if (preference === 'light') return false;
  return system === 'dark';
}

export function useAppTheme() {
  const preference = useSettingsStore((s) => s.settings.theme);
  const system = useColorScheme();
  const isDark = resolveIsDark(preference, system);
  const colors = isDark ? darkColors : lightColors;

  return useMemo(
    () => ({
      colors,
      isDark,
      preference,
      typography: getTypography(colors),
      shadow: getShadow(isDark),
      statusBar: (isDark ? 'light-content' : 'dark-content') as 'light-content' | 'dark-content',
    }),
    [colors, isDark, preference],
  );
}

export function useThemedStyles<T>(
  factory: (c: ThemeColors, extra: { shadow: AppShadow; typography: AppTypography }) => T,
): T {
  const { colors, shadow, typography } = useAppTheme();
  return useMemo(() => factory(colors, { shadow, typography }), [colors, shadow, typography]);
}

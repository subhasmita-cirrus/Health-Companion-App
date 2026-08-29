import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Radius } from '../constants';
import { useSettingsStore, type ThemePreference } from '../stores/settingsStore';
import { useAppTheme } from '../theme/useAppTheme';

const OPTIONS: { key: ThemePreference; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'system', label: 'System' },
];

export function ThemePicker() {
  const { colors } = useAppTheme();
  const theme = useSettingsStore((s) => s.settings.theme);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const on = theme === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.chip,
              {
                backgroundColor: on ? colors.primary : colors.surface,
                borderColor: on ? colors.primary : colors.border,
              },
            ]}
            onPress={() => updateSettings({ theme: opt.key })}
            activeOpacity={0.85}
          >
            <Text style={[styles.text, { color: on ? colors.onPrimary : colors.textSecondary }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  text: { fontWeight: '700', fontSize: 13 },
});

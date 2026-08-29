import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Radius } from '../constants';
import { useAppTheme, useThemedStyles } from '../theme/useAppTheme';
import type { ThemeColors } from '../theme/colors';
import type { AppShadow, AppTypography } from '../theme/useAppTheme';

type Props = {
  title: string;
  labels: string[];
  values: number[];
  color?: string;
  suffix?: string;
};

export function WeeklyChart({ title, labels, values, color, suffix = '' }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const line = color ?? colors.primary;
  const width = Math.max(280, Dimensions.get('window').width - 48);
  const safeValues = values.length ? values.map((v) => (Number.isFinite(v) ? v : 0)) : [0, 0];
  const safeLabels = labels.length >= 2 ? labels : ['–', '–'];
  const max = Math.max(...safeValues, 1);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <LineChart
        data={{
          labels: safeLabels,
          datasets: [{ data: safeValues.length === 1 ? [...safeValues, ...safeValues] : safeValues }],
        }}
        width={width}
        height={196}
        yAxisSuffix={suffix}
        fromZero
        chartConfig={{
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) =>
            line.startsWith('#')
              ? hexToRgba(line, opacity)
              : `rgba(45, 212, 191, ${opacity})`,
          labelColor: () => colors.textSecondary,
          propsForDots: { r: '4', strokeWidth: '2', stroke: line },
          propsForBackgroundLines: { stroke: colors.border },
        }}
        bezier
        style={styles.chart}
        segments={4}
      />
      <Text style={styles.caption}>Peak {Math.round(max).toLocaleString()}{suffix}</Text>
    </View>
  );
}

function hexToRgba(hex: string, opacity: number) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function createStyles(c: ThemeColors, extra: { shadow: AppShadow; typography: AppTypography }) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      paddingTop: 16,
      paddingBottom: 8,
      marginBottom: 16,
      overflow: 'hidden',
      ...extra.shadow.card,
    },
    title: {
      ...extra.typography.h3,
      paddingHorizontal: 16,
      marginBottom: 4,
    },
    chart: { marginLeft: -8 },
    caption: { ...extra.typography.small, paddingHorizontal: 16, marginTop: -8, marginBottom: 8 },
  });
}

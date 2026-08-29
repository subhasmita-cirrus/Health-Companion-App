import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors, Radius, Shadow, Typography } from '../constants';

type Props = {
  title: string;
  labels: string[];
  values: number[];
  color?: string;
  suffix?: string;
};

export function WeeklyChart({ title, labels, values, color = Colors.primary, suffix = '' }: Props) {
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
          backgroundGradientFrom: Colors.white,
          backgroundGradientTo: Colors.white,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(15, 118, 110, ${opacity})`,
          labelColor: () => Colors.darkGray,
          propsForDots: { r: '4', strokeWidth: '2', stroke: color },
          propsForBackgroundLines: { stroke: Colors.lightGray },
        }}
        bezier
        style={styles.chart}
        segments={4}
      />
      <Text style={styles.caption}>Peak {Math.round(max).toLocaleString()}{suffix}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingTop: 16,
    paddingBottom: 8,
    marginBottom: 16,
    overflow: 'hidden',
    ...Shadow.card,
  },
  title: {
    ...Typography.h3,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  chart: { marginLeft: -8 },
  caption: { ...Typography.small, paddingHorizontal: 16, marginTop: -8, marginBottom: 8 },
});

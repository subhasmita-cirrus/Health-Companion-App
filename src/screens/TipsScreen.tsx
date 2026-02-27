import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../constants';

const TipsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health Tips</Text>
      <Text style={styles.subtitle}>AI-powered health recommendations</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  title: {
    ...Typography.h1,
    marginBottom: 10,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
});

export default TipsScreen;




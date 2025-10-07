import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography } from '../constants';

const LoadingScreen: React.FC = () => {
  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animatable.View
        animation="bounceIn"
        duration={1500}
        style={styles.logoContainer}
      >
        <Icon name="heart-pulse" size={100} color={Colors.white} />
        <Animatable.Text
          animation="fadeInUp"
          delay={500}
          style={styles.appName}
        >
          HealthCompanion
        </Animatable.Text>
      </Animatable.View>
      <ActivityIndicator size="large" color={Colors.white} style={styles.indicator} />
      <Animatable.Text
        animation="fadeIn"
        delay={1000}
        style={styles.loadingText}
      >
        Loading your journey...
      </Animatable.Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appName: {
    ...Typography.h1,
    color: Colors.white,
    marginTop: 10,
  },
  indicator: {
    marginTop: 20,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.white,
    marginTop: 10,
  },
});

export default LoadingScreen;




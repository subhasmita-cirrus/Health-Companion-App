import React from 'react';
import { Text, StyleSheet, ActivityIndicator, StatusBar, Image } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../constants';

const LoadingScreen: React.FC = () => {
  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.gradientEnd} />
      <Animatable.View animation="fadeIn" duration={700} style={styles.logoContainer}>
        <Image source={require('../assets/app-icon.png')} style={styles.mark} />
        <Text style={styles.appName}>HealthCompanion</Text>
        <Text style={styles.tagline}>Your daily wellness companion</Text>
      </Animatable.View>
      <ActivityIndicator size="large" color={Colors.white} style={styles.indicator} />
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
    marginBottom: 28,
  },
  mark: {
    width: 88,
    height: 88,
    borderRadius: 22,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.4,
  },
  tagline: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
  },
  indicator: {
    marginTop: 8,
  },
});

export default LoadingScreen;

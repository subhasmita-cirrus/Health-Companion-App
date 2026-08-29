import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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
        <View style={styles.mark}>
          <Icon name="heart-pulse" size={44} color={Colors.white} />
        </View>
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
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
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

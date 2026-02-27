import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography } from '../constants';
import { useUserStore } from '../stores/userStore';
import { useActivityStore } from '../stores/activityStore';

const HomeScreen: React.FC = () => {
  const { user } = useUserStore();
  const { todayActivity } = useActivityStore();

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
          </View>
          <Icon name="heart-pulse" size={40} color={Colors.white} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Today's Progress</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="walk" size={30} color={Colors.primary} />
            <Text style={styles.statNumber}>{todayActivity?.steps || 0}</Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icon name="cup-water" size={30} color={Colors.info} />
            <Text style={styles.statNumber}>{todayActivity?.waterIntake || 0}ml</Text>
            <Text style={styles.statLabel}>Water</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icon name="fire" size={30} color={Colors.error} />
            <Text style={styles.statNumber}>{todayActivity?.caloriesBurned || 0}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="plus" size={24} color={Colors.white} />
            <Text style={styles.actionButtonText}>Add Water</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="walk" size={24} color={Colors.white} />
            <Text style={styles.actionButtonText}>Start Walk</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="lightbulb-on" size={24} color={Colors.white} />
            <Text style={styles.actionButtonText}>Health Tip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipCard}>
          <Icon name="lightbulb-on" size={24} color={Colors.warning} />
          <Text style={styles.tipTitle}>Today's Health Tip</Text>
          <Text style={styles.tipText}>
            Stay hydrated! Aim for 8 glasses of water per day to maintain optimal health and energy levels.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    ...Typography.h3,
    color: Colors.white,
  },
  userName: {
    ...Typography.h1,
    color: Colors.white,
    marginTop: 5,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    ...Typography.h2,
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    ...Typography.h2,
    marginTop: 10,
  },
  statLabel: {
    ...Typography.small,
    marginTop: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  tipCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipTitle: {
    ...Typography.h3,
    marginTop: 10,
    marginBottom: 10,
  },
  tipText: {
    ...Typography.body,
    lineHeight: 22,
  },
});

export default HomeScreen;




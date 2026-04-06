import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MoreHorizontal, Activity, MapPin, Zap, Clock, HeartPulse } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const StatCard = ({ label, value, unit }: any) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value} <Text style={styles.statUnit}>{unit}</Text></Text>
  </View>
);

const AnimalDetailsScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color={COLORS.primary} size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Зорька #01</Text>
          <TouchableOpacity style={styles.moreBtn}>
            <MoreHorizontal color={COLORS.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Info Card */}
          <View style={styles.heroSection}>
            <View style={styles.avatarWrapper}>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarEmoji}>🐄</Text>
                </View>
            </View>
            <View style={styles.heroText}>
                <View style={styles.nameRow}>
                    <Text style={styles.animalName}>Зорька</Text>
                    <View style={styles.healthBadge}>
                        <Text style={styles.healthTagText}>Здорова</Text>
                    </View>
                </View>
                <Text style={styles.animalMeta}>Корова • 4 года • #01</Text>
            </View>
          </View>

          {/* Health Bar Section */}
          <View style={styles.healthSection}>
            <View style={styles.healthLabelRow}>
                <Text style={styles.healthTitle}>Здоровье • <Text style={styles.healthValue}>78%</Text></Text>
            </View>
            <View style={styles.progressBarBg}>
                <LinearGradient 
                    colors={['#FF6B00', '#FFBD39']} 
                    start={{x: 0, y: 0}} 
                    end={{x: 1, y: 0}}
                    style={[styles.progressBarFill, { width: '78%' }]} 
                />
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard label="Пройдено" value="6.2" unit="км" />
            <StatCard label="Активность" value="8.5" unit="ч" />
            <StatCard label="Скорость" value="2.1" unit="км/ч" />
            <StatCard label="Сигнал" value="1" unit="мин" />
          </View>

          {/* AI Analysis Button */}
          <TouchableOpacity style={styles.aiButton}>
            <LinearGradient
                colors={['#FF6B00', '#FFBD39']}
                start={{x: 0, y: 0.5}}
                end={{x: 1, y: 0.5}}
                style={styles.aiGradient}
            >
                <HeartPulse color="#000" size={24} />
                <Text style={styles.aiBtnText}>AI Анализ поведения</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#FFF',
  },
  moreBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#CC5500',
    padding: 2,
  },
  avatarCircle: {
    flex: 1,
    borderRadius: 40,
    backgroundColor: '#1A1410',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  heroText: {
    marginLeft: 20,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  animalName: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#FFF',
  },
  healthBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  healthTagText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: '700',
  },
  animalMeta: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  healthSection: {
    marginBottom: 30,
  },
  healthLabelRow: {
    marginBottom: 10,
  },
  healthTitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  healthValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    width: (width - SPACING.lg * 2 - 12) / 2,
    height: 90,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statUnit: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: 'normal',
  },
  chartSection: {
    marginBottom: 40,
  },
  chartLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 20,
  },
  chartContainer: {
    height: 120,
    width: '100%',
    justifyContent: 'center',
  },
  chartLineView: {
    height: 60,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    zIndex: 2,
  },
  line: {
    height: 3,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    opacity: 0.8,
  },
  aiButton: {
    width: '100%',
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
  },
  aiGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  aiBtnText: {
    color: '#000',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default AnimalDetailsScreen;

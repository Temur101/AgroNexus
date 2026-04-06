import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const AlertItem = ({ title, desc, time, color, icon, border }: any) => (
  <TouchableOpacity style={[styles.alertItem, border && { borderColor: color, borderWidth: 1 }]}>
    <View style={styles.alertIconWrapper}>
      <Text style={styles.alertEmoji}>{icon}</Text>
    </View>
    <View style={styles.alertContent}>
      <View style={styles.alertHeaderRow}>
          <Text style={styles.alertTitle}>{title}</Text>
          {border && <View style={[styles.statusDot, { backgroundColor: color }]} />}
      </View>
      <Text style={styles.alertDesc}>{desc}</Text>
      <Text style={styles.alertTime}>{time}</Text>
    </View>
  </TouchableOpacity>
);

const AlertsScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Алерты</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>3 новых</Text>
          </View>
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <AlertItem 
            icon="🚨"
            title="Геофенс нарушен"
            desc="Буян #04 вышел за пастбище"
            time="2 мин назад"
            color={COLORS.red}
            border={true}
          />
          <AlertItem 
            icon="⚠️"
            title="AI: Низкая активность"
            desc="Отара #2 стоит 3+ часов"
            time="18 мин назад"
            color={COLORS.primary}
            border={true}
          />
          <AlertItem 
            icon="✅"
            title="Ежедневный отчёт"
            desc="11 из 12 животных здоровы"
            time="1 ч назад"
          />
          <AlertItem 
            icon="🔋"
            title="Заряд трекера низкий"
            desc="Зорька #01 — заряд 15%"
            time="3 ч назад"
          />
          <AlertItem 
            icon="🐣"
            title="AI: Возможные роды"
            desc="Машка #07 ищет место"
            time="5 ч назад"
          />
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
    paddingVertical: SPACING.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#FFF',
  },
  countBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  countText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: SPACING.lg,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  alertItem: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  alertIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertEmoji: {
    fontSize: 24,
  },
  alertContent: {
    flex: 1,
    marginLeft: 15,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#FFF',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
});

export default AlertsScreen;

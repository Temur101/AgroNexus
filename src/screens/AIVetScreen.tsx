import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, HeartPulse, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { CustomButton } from '../components/Button';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const AIVetScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color={COLORS.primary} size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Ветеринар</Text>
          <View style={styles.robotIconWrapper}>
            <Text style={styles.robotEmoji}>🤖</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Last Analysis Card */}
          <View style={styles.analysisCard}>
            <Text style={styles.analysisLabel}>Анализ • последние 6 часов</Text>
            <Text style={styles.animalInfo}>Буян #04 • Лошадь</Text>
          </View>

          {/* Warning Card */}
          <View style={styles.warningCard}>
            <View style={styles.warningBadge}>
                <Text style={styles.warningBadgeText}>⚠️ Внимание</Text>
            </View>
            <Text style={styles.warningTitle}>Аномальное поведение</Text>
            <Text style={styles.warningDesc}>
                Животное двигалось хаотично 2 часа. Скорость выше нормы на 40%. Возможен стресс или хищник в зоне.
            </Text>
          </View>


          {/* Recommendation Card */}
          <View style={styles.recommendCard}>
            <View style={styles.recommendBadge}>
                <Text style={styles.recommendBadgeText}>Рекомендация</Text>
            </View>
            <Text style={styles.recommendDesc}>
                Проверьте периметр. Осмотрите животное. Если продолжится — вызовите ветеринара.
            </Text>
          </View>

          {/* Buttons Section */}
          <View style={styles.btnGroup}>
            <TouchableOpacity style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Всё в порядке</Text>
            </TouchableOpacity>
          </View>
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
  robotIconWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  robotEmoji: {
    fontSize: 24,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  analysisCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  analysisLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  animalInfo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  warningCard: {
    backgroundColor: '#1A1410',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  warningBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  warningBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  warningDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  recommendCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  recommendBadge: {
    marginBottom: 12,
  },
  recommendBadgeText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: 'bold',
  },
  recommendDesc: {
    fontSize: 16,
    color: COLORS.green,
    fontWeight: '500',
    lineHeight: 22,
  },
  btnGroup: {
    gap: 12,
  },
  secondaryBtn: {
    width: '100%',
    height: 64,
    borderRadius: 20,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  secondaryBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default AIVetScreen;

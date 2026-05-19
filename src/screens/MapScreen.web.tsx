import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../theme/theme';
import { Map as MapIcon, ChevronLeft, AlertTriangle } from 'lucide-react-native';

const MapScreenWeb = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
           onPress={() => navigation.goBack()}
           style={styles.backBtn}
        >
          <ChevronLeft color={COLORS.white} size={24} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Карта</Text>
          <Text style={styles.subtitle}>Версия для браузера</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.placeholderContainer}>
          <MapIcon color={COLORS.primary} size={64} style={{ marginBottom: 20 }} />
          <Text style={styles.placeholderTitle}>Карта не поддерживается в вещании</Text>
          <Text style={styles.placeholderSubtitle}>
             Полноценная GPS навигация и геозоны доступны в мобильном приложении. 
             В браузерной версии эта функция временно ограничена.
          </Text>
          
          <View style={styles.alertBox}>
            <AlertTriangle color={COLORS.primary} size={20} />
            <Text style={styles.alertText}>
              Используйте Android или iOS приложение для отслеживания скота в реальном времени.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderContainer: {
    backgroundColor: COLORS.surface,
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.1)',
    ...SHADOWS.medium,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  placeholderSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  alertBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    padding: 16,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    gap: 12,
  },
  alertText: {
    flex: 1,
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default MapScreenWeb;

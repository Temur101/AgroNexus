import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MapPin, Activity, ShieldAlert } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import { ScreenHeader } from '../components/Header';
import { CustomButton } from '../components/Button';
import { supabase } from '../../supabase';

const FeatureCard = ({ icon: Icon, title, description }: any) => (
  <View style={styles.card}>
    <View style={styles.iconContainer}>
      <Icon color={COLORS.primary} size={32} />
    </View>
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </View>
  </View>
);

const AboutScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthAction = async () => {
    if (user) {
      await supabase.auth.signOut();
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="О приложении" onBack={() => navigation.goBack()} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <FeatureCard 
          icon={MapPin}
          title="GPS Мониторинг"
          description="Все животные на карте в реальном времени"
        />
        <FeatureCard 
          icon={Activity}
          title="AI Ветеринар"
          description="Анализ поведения и ранняя диагностика болезней"
        />
        <FeatureCard 
          icon={ShieldAlert}
          title="Геозоны"
          description="Уведомления, если животное вышло за пределы пастбища"
        />
      </ScrollView>
      
      <View style={styles.footer}>
        <CustomButton 
          title={user ? "Выйти из аккаунта" : "Войти"} 
          onPress={handleAuthAction}
          variant={user ? "secondary" : "primary"}
          style={user ? { backgroundColor: '#FF3B30', width: '100%' } : { width: '100%' }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    gap: SPACING.lg,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xl + 20,
  },
  button: {
    width: '100%',
  },
});

export default AboutScreen;

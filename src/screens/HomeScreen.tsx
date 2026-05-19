import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Activity, Bell, Map as MapIcon, Plus, LogOut, ChevronRight } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import { supabase } from '../../supabase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data: animalsData } = await supabase
        .from('animals')
        .select('*, locations(updated_at)')
        .eq('owner_id', user.id)
        .limit(4);

      if (animalsData) {
        const now = new Date();
        const formatted = animalsData.map((a: any) => {
          const lastLoc = a.locations?.[0]?.updated_at;
          const isRecent = lastLoc && (now.getTime() - new Date(lastLoc).getTime() < 600000);
          
          let status = 'offline';
          const isPhone = a.tracker_id && (a.tracker_id.includes('-') || a.tracker_id.length > 15);

          if (isPhone) {
            status = 'demo';
          } else if (a.tracker_id) {
            status = isRecent ? 'online' : 'offline';
          }

          return { ...a, status, last_updated: lastLoc || 'нет данных' };
        });
        setAnimals(formatted);
        setActiveCount(formatted.filter(a => a.status === 'online' || a.status === 'demo').length);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleLogout = async () => {
    Alert.alert('Выход', 'Выйти из системы?', [
      { text: 'Отмена' },
      { text: 'Выйти', style: 'destructive', onPress: async () => {
          await supabase.auth.signOut({ scope: 'local' });
      }}
    ]);
  };

  const getEmoji = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('коров') || t.includes('бык')) return '🐄';
    if (t.includes('лошад') || t.includes('конь')) return '🐎';
    if (t.includes('овц') || t.includes('баран')) return '🐑';
    if (t.includes('коз')) return '🐐';
    return '🐄';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Привет,</Text>
              <Text style={styles.userName}>{user?.email?.split('@')[0] || 'Фермер'}</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
                <Bell size={22} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
                <LogOut size={22} color={COLORS.red} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Card */}
          <LinearGradient colors={['#FF6B00', '#FFBD39']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.mainStatsCard}>
            <View>
                <Text style={styles.statsLabel}>Активные объекты</Text>
                <Text style={styles.statsValue}>{activeCount}</Text>
            </View>
            <TouchableOpacity style={styles.statsMapBtn} onPress={() => navigation.navigate('Map')}>
                <MapIcon color="#000" size={20} />
                <Text style={styles.statsMapText}>Карта</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Animals Quick Access */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Мои животные</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Herd')}>
              <Text style={styles.seeAll}>Все</Text>
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : (
            animals.map(animal => (
              <TouchableOpacity 
                key={animal.id} 
                style={styles.animalCard}
                onPress={() => navigation.navigate('AnimalDetails', { animal })}
              >
                <View style={styles.animalCardLeft}>
                    <View style={styles.emojiCircle}>
                        <Text style={{ fontSize: 20 }}>{getEmoji(animal.type)}</Text>
                    </View>
                    <View>
                        <Text style={styles.animalName}>{animal.name}</Text>
                        <Text style={styles.animalType}>{animal.type}</Text>
                    </View>
                </View>
                <View style={styles.animalCardRight}>
                    <View style={[styles.statusTag, { backgroundColor: animal.status === 'online' ? 'rgba(16,185,129,0.1)' : animal.status === 'demo' ? 'rgba(255,189,57,0.1)' : 'rgba(255,255,255,0.05)' }]}>
                        <Text style={[styles.statusText, { color: animal.status === 'online' ? '#10B981' : animal.status === 'demo' ? COLORS.secondary : COLORS.textSecondary }]}>
                            {animal.status === 'online' ? 'В сети' : animal.status === 'demo' ? 'Демо' : 'Офлайн'}
                        </Text>
                    </View>
                    <ChevronRight size={20} color={COLORS.textSecondary} />
                </View>
              </TouchableOpacity>
            ))
          )}

          {animals.length === 0 && !loading && (
              <TouchableOpacity style={styles.addFirstBtn} onPress={() => navigation.navigate('AddAnimal')}>
                  <Plus color={COLORS.primary} size={24} />
                  <Text style={styles.addFirstText}>Добавить первое животное</Text>
              </TouchableOpacity>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: Platform.OS === 'android' ? 20 : 0 },
  greeting: { color: COLORS.textSecondary, fontSize: 16 },
  userName: { color: COLORS.white, fontSize: 28, fontWeight: 'bold' },
  headerButtons: { flexDirection: 'row', gap: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  mainStatsCard: { padding: 24, borderRadius: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, ...SHADOWS.medium },
  statsLabel: { color: 'rgba(0,0,0,0.6)', fontSize: 14, fontWeight: '600' },
  statsValue: { color: '#000', fontSize: 36, fontWeight: 'bold' },
  statsMapBtn: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statsMapText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  seeAll: { color: COLORS.primary, fontWeight: 'bold' },
  animalCard: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  animalCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center' },
  animalName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  animalType: { color: COLORS.textSecondary, fontSize: 12 },
  animalCardRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  addFirstBtn: { height: 80, borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 20 },
  addFirstText: { color: COLORS.primary, fontWeight: 'bold' }
});

export default HomeScreen;

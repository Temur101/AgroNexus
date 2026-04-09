import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Activity, Bell, Map, Plus, LogOut } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import { supabase } from '../../supabase';
import { useNavigation } from '@react-navigation/native';

interface Animal {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'gps_dead' | 'demo';
  last_updated: string;
}

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [activeTracking, setActiveTracking] = useState({ count: 0, lastUpdate: 'never' });

  useEffect(() => {
    fetchUser();
    fetchAnimals();
    
    const interval = setInterval(fetchAnimals, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Ошибка', 'Не удалось выйти из системы');
    }
  };

  const fetchAnimals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('animals')
      .select('*, locations(updated_at)')
      .eq('owner_id', user.id)
      .limit(5);

    if (data) {
      const now = new Date();
      const formatted: Animal[] = data.map((a: any) => {
        const lastLoc = a.locations?.[0]?.updated_at;
        const isRecent = lastLoc && (now.getTime() - new Date(lastLoc).getTime() < 600000); // 10 mins threshold
        
        let status: 'online' | 'offline' | 'gps_dead' | 'demo' = 'offline';
        
        // Checking if it's a Demo mode (trackerId is a UUID / User ID)
        const isDemo = a.tracker_id?.length === 36; 

        if (isDemo) {
          status = 'demo';
        } else if (a.tracker_id) {
          status = isRecent ? 'online' : 'gps_dead';
        }

        return {
          id: a.id,
          name: a.name,
          tracker_id: a.tracker_id,
          status,
          last_updated: lastLoc || 'нет данных',
        };
      });
      setAnimals(formatted);
      setActiveTracking({
        count: formatted.filter(a => a.status === 'online' || a.status === 'demo').length,
        lastUpdate: '5 секунд назад',
      });
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'В сети';
      case 'demo': return 'Демо-режим';
      case 'gps_dead': return 'GPS не отвечает';
      default: return 'Офлайн';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return COLORS.green;
      case 'demo': return COLORS.secondary;
      case 'gps_dead': return COLORS.red;
      default: return COLORS.textSecondary;
    }
  };

  const renderAnimalItem = ({ item }: { item: Animal }) => (
    <View style={styles.animalCard}>
      <View style={styles.animalInfo}>
        <View style={[styles.statusDot, { backgroundColor: item.status === 'online' ? COLORS.green : COLORS.textSecondary }]} />
        <Text style={styles.animalName}>{item.name}</Text>
      </View>
      <Text style={styles.animalStatusText}>{item.status}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.greeting}>Привет,</Text>
              <Text style={styles.userName}>{user?.email?.split('@')[0] || 'Фермер'}</Text>
            </View>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.profileButton} 
              onPress={() => navigation.navigate('Notifications')}
            >
              <Bell size={22} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
              <LogOut size={22} color={COLORS.red} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Tracking Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Активное отслеживание</Text>
          <View style={styles.trackingCard}>
            <View style={styles.trackingIconContainer}>
              <Activity size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.trackingCount}>{activeTracking.count} сейчас активно</Text>
            </View>
          </View>
        </View>

        {/* Animals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Мои животные</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddAnimal')}>
              <Text style={styles.seeAll}>+ Добавить</Text>
            </TouchableOpacity>
          </View>
          {animals.length > 0 ? (
            animals.map(animal => (
              <View key={animal.id} style={styles.animalCard}>
                <View style={styles.animalInfo}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(animal.status) }]} />
                  <Text style={styles.animalName}>{animal.name}</Text>
                </View>
                {animal.status !== 'offline' && (
                  <Text style={[styles.animalStatusText, { color: getStatusColor(animal.status) }]}>
                    {getStatusText(animal.status)}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Пока нет животных</Text>
            </View>
          )}
        </View>


        {/* Map Button */}
        <TouchableOpacity 
          style={styles.mapButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Map size={20} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.mapButtonText}>Открыть карту</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: Platform.OS === 'ios' ? 0 : 40,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  greeting: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  userName: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  seeAll: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  trackingCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.card,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  trackingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  trackingCount: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  trackingUpdate: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  animalCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  animalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  animalName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  animalStatusText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  requestCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.card,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderStyle: 'dashed',
  },
  requestText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginLeft: SPACING.sm,
  },
  mapButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.button,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.medium,
  },
  mapButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});

export default HomeScreen;

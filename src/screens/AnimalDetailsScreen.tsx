import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MoreHorizontal, Sparkles, Clock, Navigation2, Activity, Signal } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../supabase';

const { width } = Dimensions.get('window');

const StatCard = ({ label, value, unit, icon: Icon }: any) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <Text style={styles.statLabel}>{label}</Text>
      {Icon && <Icon size={16} color={COLORS.textSecondary} />}
    </View>
    <Text style={styles.statValue}>{value} <Text style={styles.statUnit}>{unit}</Text></Text>
  </View>
);

const AnimalDetailsScreen = ({ route, navigation }: any) => {
  const { animal } = route.params;
  const [stats, setStats] = useState({
    distance: '0.0',
    activeHours: '0.0',
    avgSpeed: '0.0',
    lastSignal: '...'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // 1. Get history for distance and speed (last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data: locs } = await supabase
        .from('animal_locations')
        .select('*')
        .eq('animal_id', animal.id)
        .gte('timestamp', oneDayAgo);

      // 2. Get last signal from locations table
      const { data: lastLoc } = await supabase
        .from('locations')
        .select('updated_at')
        .eq('animal_id', animal.id)
        .maybeSingle();

      if (locs && locs.length > 0) {
        let totalDist = 0;
        let totalSpeed = 0;
        let activeCount = 0;

        for (let i = 1; i < locs.length; i++) {
          const p1 = locs[i - 1];
          const p2 = locs[i];
          const d = getDistance(p1.lat, p1.lon, p2.lat, p2.lon);
          totalDist += d;
          totalSpeed += p2.speed || 0;
          if (p2.speed > 0.1) activeCount++;
        }

        setStats({
          distance: (totalDist / 1000).toFixed(1),
          activeHours: (activeCount * 5 / 60).toFixed(1), // assuming 5s intervals
          avgSpeed: (totalSpeed / locs.length).toFixed(1),
          lastSignal: lastLoc?.updated_at ? formatTime(lastLoc.updated_at) : '?'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatTime = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return 'сейчас';
    if (diff < 60) return `${diff} мин`;
    return `${Math.floor(diff / 60)} ч`;
  };

  const statusLabel = animal?.status === 'demo' ? 'Демо'
    : animal?.status === 'online' ? 'Онлайн'
    : 'Офлайн';

  const statusColor = animal?.status === 'demo' ? COLORS.secondary
    : animal?.status === 'online' ? '#10B981'
    : COLORS.textSecondary;

  const getEmoji = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('коров') || t.includes('бык')) return '🐄';
    if (t.includes('лошад') || t.includes('конь')) return '🐎';
    if (t.includes('овц') || t.includes('баран')) return '🐑';
    if (t.includes('коз')) return '🐐';
    return '🐄';
  };

  const tag = animal?.tag || (animal?.tracker_id ? '#' + animal.tracker_id.slice(-4).toUpperCase() : '');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color={COLORS.primary} size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{animal.name}</Text>
          <TouchableOpacity style={styles.moreBtn}>
            <MoreHorizontal color={COLORS.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Info Card */}
          <View style={styles.heroSection}>
            <View style={styles.avatarWrapper}>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarEmoji}>{getEmoji(animal.type)}</Text>
                </View>
            </View>
            <View style={styles.heroText}>
                <View style={styles.nameRow}>
                    <Text style={styles.animalName}>{animal.name}</Text>
                    <View style={[styles.statusBadge, { borderColor: statusColor + '40' }]}>
                        <Text style={[styles.statusTagText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                </View>
                <Text style={styles.animalMeta}>{animal.type} • {tag}</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard label="Пройдено" value={stats.distance} unit="км" icon={Navigation2} />
            <StatCard label="Активность" value={stats.activeHours} unit="ч" icon={Activity} />
            <StatCard label="Скорость" value={stats.avgSpeed} unit="км/ч" icon={Clock} />
            <StatCard label="Сигнал" value={stats.lastSignal} unit="" icon={Signal} />
          </View>

          {/* AI Analysis Button */}
          <TouchableOpacity 
            style={styles.aiButton}
            onPress={() => navigation.navigate('AIVet', { animal })}
          >
            <LinearGradient
                colors={['#FF6B00', '#FFBD39']}
                start={{x: 0, y: 0.5}}
                end={{x: 1, y: 0.5}}
                style={styles.aiGradient}
            >
                <Sparkles color="#000" size={24} />
                <Text style={styles.aiBtnText}>Анализ состояния AI</Text>
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
    marginBottom: 30,
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
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 13,
    fontWeight: '700',
  },
  animalMeta: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    width: (width - SPACING.lg * 2 - 12) / 2,
    height: 100,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statUnit: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: 'normal',
  },
  aiButton: {
    width: '100%',
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 10,
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

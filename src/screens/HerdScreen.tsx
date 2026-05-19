import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Plus, Info, Trash2, MapPin, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../supabase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const AnimalCard = ({ item, onPress, onDelete }: { item: any; onPress: () => void, onDelete: () => void }) => {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'Онлайн';
      case 'demo': return 'Демо';
      default: return 'Офлайн';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10B981';
      case 'demo': return COLORS.secondary;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'online': return 'rgba(16,185,129,0.1)';
      case 'demo': return 'rgba(255,189,57,0.1)';
      default: return 'rgba(255,255,255,0.05)';
    }
  };

  const getEmoji = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('коров') || t.includes('бык')) return '🐄';
    if (t.includes('лошад') || t.includes('конь')) return '🐎';
    if (t.includes('овц') || t.includes('баран')) return '🐑';
    if (t.includes('коз')) return '🐐';
    return '🐄';
  };

  const timeStr = item.updated_at && item.updated_at !== '---'
    ? new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '---';

  return (
    <View style={styles.cardWrapper}>
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
            <View style={styles.cardLeftSide}>
                <View style={styles.emojiContainer}>
                    <Text style={styles.emojiText}>{getEmoji(item.type)}</Text>
                </View>
            </View>
            
            <View style={styles.cardCenter}>
                <View style={styles.nameRow}>
                    <Text style={styles.animalName} numberOfLines={1}>{item.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
                    </View>
                </View>
                
                <Text style={styles.animalSub}>{item.type} • {item.tag || '#' + (item.tracker_id?.slice(-4).toUpperCase() || 'NONE')}</Text>
                
                <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                        <Clock size={12} color={COLORS.textSecondary} />
                        <Text style={styles.footerText}>{timeStr}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteAction} onPress={onDelete}>
            <Trash2 size={20} color={COLORS.red} />
        </TouchableOpacity>
    </View>
  );
};

const HerdScreen = () => {
  const navigation = useNavigation<any>();
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAnimals();
    }, [])
  );

  const fetchAnimals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: animalsData } = await supabase
        .from('animals')
        .select('*')
        .eq('owner_id', user.id);

      if (animalsData) {
        const animalIds = animalsData.map(a => a.id);
        const trackerIds = animalsData.filter(a => a.tracker_id).map(a => a.tracker_id);

        const conditions = [];
        if (animalIds.length > 0) conditions.push(`animal_id.in.(${animalIds.join(',')})`);
        if (trackerIds.length > 0) conditions.push(`user_id.in.(${trackerIds.join(',')})`);
        
        const { data: locs } = conditions.length > 0 
          ? await supabase.from('locations').select('*').or(conditions.join(','))
          : { data: [] };

        const now = new Date();
        const formatted = animalsData.map((a: any) => {
          const loc = locs?.find(l => 
            (l.animal_id === a.id) || (l.user_id === a.tracker_id)
          );
          
          const lastLoc = loc?.updated_at;
          const isRecent = lastLoc && (now.getTime() - new Date(lastLoc).getTime() < 300000); // 5 min
          
          let status = 'offline';
          const isPhone = a.tracker_id && (a.tracker_id.includes('-') || a.tracker_id.length > 15);

          if (isPhone) {
            status = 'demo';
          } else if (a.tracker_id) {
            status = isRecent ? 'online' : 'offline';
          }

          return { ...a, status, updated_at: lastLoc || '---' };
        });
        setAnimals(formatted);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>Моё стадо</Text>
                <Text style={styles.subtitle}>{animals.length} животных отслеживается</Text>
            </View>
            <TouchableOpacity style={styles.addIconBtn} onPress={() => navigation.navigate('AddAnimal')}>
                <Plus color={COLORS.primary} size={28} />
            </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
        ) : (
          <FlatList
            data={animals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AnimalCard 
                item={item} 
                onPress={() => navigation.navigate('AnimalDetails', { animal: item })} 
                onDelete={() => {
                   Alert.alert('Удаление', `Удалить ${item.name}?`, [
                       { text: 'Отмена' },
                       { text: 'Да', style: 'destructive', onPress: async () => {
                           await supabase.from('animals').delete().eq('id', item.id);
                           fetchAnimals();
                       }}
                   ]);
                }}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnimals(); }} tintColor={COLORS.primary} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Info size={48} color={COLORS.surface} />
                <Text style={styles.emptyTitle}>Стадо пусто</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddAnimal')}>
                    <Text style={styles.addBtnText}>Добавить животное</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </SafeAreaView>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddAnimal')}>
        <LinearGradient colors={COLORS.gradient as any} style={styles.fabGradient}>
            <Plus color="#000" size={30} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  addIconBtn: { width: 48, height: 48, backgroundColor: COLORS.surface, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  cardWrapper: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  card: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 28, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', ...SHADOWS.medium },
  emojiContainer: { width: 64, height: 64, backgroundColor: '#1A1410', borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,107,0,0.1)' },
  emojiText: { fontSize: 32 },
  cardCenter: { flex: 1, marginLeft: 16 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  animalName: { fontSize: 18, fontWeight: 'bold', color: '#FFF', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  animalSub: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: COLORS.textSecondary },
  deleteAction: { width: 56, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,59,48,0.2)' },
  fab: { position: 'absolute', right: 24, bottom: 24, width: 64, height: 64, borderRadius: 32, ...SHADOWS.medium },
  fabGradient: { flex: 1, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  addBtn: { marginTop: 24, backgroundColor: 'rgba(255,107,0,0.1)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: COLORS.primary },
  addBtnText: { color: COLORS.primary, fontWeight: 'bold' },
});

export default HerdScreen;

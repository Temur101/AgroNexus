import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, ChevronRight, Plus, Activity, Zap, Info, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../supabase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');

interface Animal {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'gps_dead' | 'demo';
  updated_at: string;
  tracker_id?: string;
}

const AnimalCard = ({ item, onPress, onDelete }: { item: Animal; onPress: () => void, onDelete: () => void }) => {
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

  const lastUpdated = item.updated_at !== '---' 
    ? new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : '---';

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.cardHeader}>
          <View style={styles.nameRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={styles.name}>{item.name}</Text>
          </View>
          {item.status !== 'offline' && (
            <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoItem}>
            <Activity size={14} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{item.type || 'Животное'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Zap size={14} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              {item.status === 'demo' ? 'Режим: Телефон' : `Трекер: ${item.tracker_id ? 'Подключен' : 'Нет'}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Trash2 size={20} color={COLORS.red} />
      </TouchableOpacity>
    </View>
  );
};

const HerdScreen = () => {
  const navigation = useNavigation<any>();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchAnimals();
    }, [])
  );

  const fetchAnimals = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: animalsData, error } = await supabase
        .from('animals')
        .select('*')
        .eq('owner_id', user.id);

      if (error) throw error;

      if (animalsData) {
        // Get all possible location sources
        const animalIds = animalsData.map(a => a.id);
        const trackerIds = animalsData.filter(a => a.tracker_id).map(a => a.tracker_id);

        let locQuery = supabase.from('locations').select('animal_id, user_id, updated_at');
        let conditions = [];
        if (animalIds.length > 0) conditions.push(`animal_id.in.(${animalIds.join(',')})`);
        if (trackerIds.length > 0) conditions.push(`user_id.in.(${trackerIds.join(',')})`);
        
        const { data: locs } = conditions.length > 0 
          ? await locQuery.or(conditions.join(','))
          : { data: [] };

        const now = new Date();
        const formatted: Animal[] = animalsData.map((a: any) => {
          // Find location for this animal
          const loc = locs?.find(l => 
            (l.animal_id === a.id) || 
            (l.tracker_id === a.tracker_id) || 
            (l.user_id === a.tracker_id)
          );
          
          const lastLoc = loc?.updated_at;
          const isRecent = lastLoc && (now.getTime() - new Date(lastLoc).getTime() < 300000); // 5 minutes
          
          let status: 'online' | 'offline' | 'gps_dead' | 'demo' = 'offline';
          const isDemo = a.tracker_id && a.tracker_id.length === 36; // UUID check

          if (isDemo) {
            status = isRecent ? 'demo' : 'offline';
          } else if (a.tracker_id) {
            status = isRecent ? 'online' : 'gps_dead';
          }

          return {
            ...a,
            status,
            updated_at: lastLoc || '---'
          };
        });
        setAnimals(formatted);
      }
    } catch (e) {
      console.log('Error fetching animals:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnimals();
    setRefreshing(false);
  };

  const handleDelete = async (animalId: string, name: string) => {
    Alert.alert(
      'Удалить животное',
      `Вы уверены, что хотите удалить ${name}? Все данные отслеживания будут потеряны.`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('animals')
                .delete()
                .eq('id', animalId);

              if (error) throw error;
              
              // Refresh list
              fetchAnimals();
              Alert.alert('Успешно', 'Животное удалено');
            } catch (e) {
              console.error('Delete error:', e);
              Alert.alert('Ошибка', 'Не удалось удалить животное');
            }
          } 
        }
      ]
    );
  };

  const filteredAnimals = animals.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Ваше стадо</Text>
            <Text style={styles.subtitle}>{animals.length} голов всего</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Filter color={COLORS.primary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search color={COLORS.textSecondary} size={20} />
            <TextInput 
              placeholder="Поиск животного..." 
              placeholderTextColor={COLORS.textSecondary}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* List */}
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={filteredAnimals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AnimalCard 
                item={item} 
                onPress={() => navigation.navigate('AnimalDetails', { animalId: item.id })} 
                onDelete={() => handleDelete(item.id, item.name)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Info size={48} color={COLORS.surface} strokeWidth={1} />
                <Text style={styles.emptyTitle}>Нет животных</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'Ничего не найдено по вашему запросу' : 'Вы еще не добавили ни одного животного'}
                </Text>
                {!searchQuery && (
                   <TouchableOpacity 
                    style={styles.addBtn}
                    onPress={() => navigation.navigate('AddAnimal')}
                  >
                    <Text style={styles.addBtnText}>Добавить первое животное</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}

        {/* Floating Add Button */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('AddAnimal')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={COLORS.gradient as any}
            style={styles.fabGradient}
          >
            <Plus color="#000" size={30} strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  searchBar: {
    height: 52,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#FFF',
    fontSize: 15,
  },
  filterBtn: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    ...SHADOWS.medium,
  },
  deleteBtn: {
    width: 48,
    height: '100%',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: RADIUS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  updateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    ...SHADOWS.medium,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  addBtn: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  }
});

export default HerdScreen;

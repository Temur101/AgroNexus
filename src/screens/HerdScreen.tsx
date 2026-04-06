import React from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ANIMALS = [
  { id: '1', name: 'Зорька #01', type: 'Корова', status: 'Здорова', color: COLORS.green, icon: '🐄' },
  { id: '2', name: 'Буян #04', type: 'Лошадь', status: 'Вне зоны!', color: COLORS.red, icon: '🐎' },
  { id: '3', name: 'Отара #2', type: 'Овца', status: 'Сонливость', color: COLORS.primary, icon: '🐑' },
  { id: '4', name: 'Милка #09', type: 'Корова', status: 'Здорова', color: COLORS.green, icon: '🐄' },
  { id: '5', name: 'Борис #12', type: 'Бык', status: 'Здоров', color: COLORS.green, icon: '🐂' },
];

const AnimalCard = ({ item, onPress }: any) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.contentRow}>
      <View style={styles.iconCircle}>
        <Text style={styles.emoji}>{item.icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.type}>{item.type}</Text>
      </View>
      <View style={styles.statusCol}>
        <View style={[styles.statusBadge, { backgroundColor: item.color + '10', borderColor: item.color + '30' }]}>
          <Text style={[styles.statusText, { color: item.color }]}>{item.status}</Text>
        </View>
        <ChevronRight color="rgba(255,255,255,0.1)" size={20} />
      </View>
    </View>
  </TouchableOpacity>
);

const HerdScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ваше стадо</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>12 голов</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search color={COLORS.textSecondary} size={20} />
            <TextInput 
              placeholder="Поиск животного..." 
              placeholderTextColor={COLORS.textSecondary}
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Filter color={COLORS.primary} size={20} />
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={ANIMALS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AnimalCard 
              item={item} 
              onPress={() => navigation.navigate('AnimalDetails')} 
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

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
            <Text style={styles.fabIcon}>+</Text>
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
  badge: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.2)',
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: 12,
    marginBottom: SPACING.lg,
  },
  searchBar: {
    flex: 1,
    height: 52,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#FFF',
    fontSize: 15,
  },
  filterBtn: {
    width: 52,
    height: 52,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 26,
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  type: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statusCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    color: '#000',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -2,
  },
});

export default HerdScreen;

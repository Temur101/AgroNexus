import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Bell, Users, HeartPulse, Leaf, AppWindow } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const AnimalStatusItem = ({ name, status, color, icon }: any) => (
  <TouchableOpacity style={styles.statusItem}>
    <View style={styles.statusIconWrapper}>
      <Text style={styles.emojiIcon}>{icon}</Text>
    </View>
    <View style={styles.statusContent}>
      <Text style={styles.statusName}>{name}</Text>
      <Text style={[styles.statusText, { color }]}>{status}</Text>
    </View>
    <View style={[styles.statusDot, { backgroundColor: color }]} />
  </TouchableOpacity>
);

const AnimalPin = ({ x, y, icon, color }: any) => (
  <View style={[styles.pinContainer, { left: x, top: y }]}>
    <View style={[styles.pinCircle, { borderColor: color }]}>
       <Text style={styles.pinEmoji}>{icon}</Text>
    </View>
  </View>
);

const MapScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
                <Leaf color={COLORS.green} size={24} fill={COLORS.green} />
                <Text style={styles.headerTitle}>AgroNexus</Text>
            </View>
            <View style={styles.animalsBadge}>
                <Text style={styles.badgeText}>12 животных</Text>
            </View>
        </View>

        {/* Map Area */}
        <View style={styles.mapContainer}>
          <View style={styles.mapGrid}>
            {/* Grid Pattern */}
            <View style={styles.gridOverlay}>
                {[...Array(10)].map((_, i) => (
                    <View key={`v-${i}`} style={[styles.gridLine, { left: `${i * 11}%`, width: 1, height: '100%' }]} />
                ))}
                {[...Array(10)].map((_, i) => (
                    <View key={`h-${i}`} style={[styles.gridLine, { top: `${i * 11}%`, height: 1, width: '100%' }]} />
                ))}
            </View>

            {/* Geofence Dashed Area */}
            <View style={styles.geofenceArea}>
                <View style={styles.dashedBorder} />
            </View>

            {/* Animal Pins */}
            <AnimalPin x={70} y={120} icon="🐄" color={COLORS.green} />
            <AnimalPin x={width - 150} y={50} icon="🐑" color={COLORS.primary} />
            <AnimalPin x={width - 240} y={180} icon="🐖" color={COLORS.green} />
            <AnimalPin x={width - 100} y={230} icon="🐂" color={COLORS.red} />
            <AnimalPin x={80} y={260} icon="🐐" color={COLORS.green} />
          </View>
        </View>

        {/* Status List Label */}
        <Text style={styles.listLabel}>СТАТУС СТАДА</Text>
        
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          <AnimalStatusItem 
            name="Буян #04" 
            status="Вышел за геофенс!" 
            color={COLORS.red} 
            icon="🐂"
          />
          <AnimalStatusItem 
            name="Отара #2" 
            status="Низкая активность" 
            color={COLORS.primary} 
            icon="🐑"
          />
          <AnimalStatusItem 
            name="Зорька #01" 
            status="Всё в норме" 
            color={COLORS.green} 
            icon="🐄"
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  animalsBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  mapContainer: {
    width: width - SPACING.lg * 2,
    height: 340,
    backgroundColor: '#0A0E0A',
    alignSelf: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: SPACING.lg,
  },
  mapGrid: {
    flex: 1,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: COLORS.green,
  },
  geofenceArea: {
    width: '80%',
    height: '60%',
    alignSelf: 'center',
    marginTop: 60,
  },
  dashedBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 30,
  },
  geofenceBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#CC5500',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderTopLeftRadius: 15,
  },
  geofenceText: {
    color: '#000',
    fontSize: 13,
    fontWeight: 'bold',
  },
  pinContainer: {
    position: 'absolute',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinEmoji: {
    fontSize: 18,
  },
  listLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  listContainer: {
    paddingHorizontal: SPACING.lg,
  },
  statusItem: {
    height: 80,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  statusIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiIcon: {
    fontSize: 24,
  },
  statusContent: {
    flex: 1,
    marginLeft: 15,
  },
  statusName: {
    fontSize: 17,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
});

export default MapScreen;

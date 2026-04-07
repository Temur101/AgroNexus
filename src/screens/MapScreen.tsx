import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../../supabase';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../theme/theme';
import { Shield, Navigation2, Map as MapIcon, Check, X, AlertTriangle, UserMinus, Trash2 } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface TrackerItem {
  id: string;
  lat: number;
  lng: number;
  heading?: number;
  name: string;
  type: string;
  isAnimal: boolean;
  updated_at: string;
}

const isPointInPolygon = (point: { lat: number, lng: number }, polygon: any[]) => {
  let x = point.lat, y = point.lng;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i].latitude, yi = polygon[i].longitude;
    let xj = polygon[j].latitude, yj = polygon[j].longitude;
    let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [items, setItems] = useState<TrackerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<TrackerItem | null>(null);

  // ГЕОЗОНЫ
  const [isDrawing, setIsDrawing] = useState(false);
  const [newFencePoints, setNewFencePoints] = useState<any[]>([]);
  const [savedFences, setSavedFences] = useState<any[]>([]);
  const [alertItems, setAlertItems] = useState<string[]>([]);
  const [selectedFence, setSelectedFence] = useState<any | null>(null);

  useEffect(() => {
    startTracking();
    fetchFences();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('map-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [savedFences]);

  const startTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    setUserLoc(loc.coords);
    setLoading(false);
  };

  const fetchFences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('geofences').select('*').eq('owner_id', user.id);
    if (data) setSavedFences(data);
  };

  const handleMapPress = (e: any) => {
    if (isDrawing) {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setNewFencePoints([...newFencePoints, { latitude, longitude }]);
    } else {
        setSelectedItem(null);
        setSelectedFence(null);
    }
  };

  const saveGeofence = async () => {
    if (newFencePoints.length < 3) {
      Alert.alert('Ошибка', 'Нужно минимум 3 точки');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('geofences').insert({
      owner_id: user?.id,
      name: `Зона ${savedFences.length + 1}`,
      coordinates: newFencePoints
    });
    setIsDrawing(false);
    setNewFencePoints([]);
    fetchFences();
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: animals } = await supabase.from('animals').select(`id, name, type`).eq('owner_id', user.id);
      const { data: permissions } = await supabase.from('tracking_permissions').select('owner_id').eq('viewer_id', user.id);
      const animalIds = animals?.map(a => a.id) || [];
      const userIds = permissions?.map(p => p.owner_id) || [];
      userIds.push(user.id);

      let queryParts = [];
      if (animalIds.length > 0) queryParts.push(`animal_id.in.(${animalIds.join(',')})`);
      if (userIds.length > 0) queryParts.push(`user_id.in.(${userIds.join(',')})`);
      const { data: locs } = await supabase.from('locations').select('*').or(queryParts.join(','));
      
      const currentItems: TrackerItem[] = [];
      const newAlerts: string[] = [];

      locs?.forEach(l => {
        const isAnml = !!l.animal_id;
        const itemName = isAnml ? animals?.find(a => a.id === l.animal_id)?.name || 'Объект' : (l.user_id === user.id ? 'Я (Вы)' : 'Друг');
        const trackerItem: TrackerItem = { id: isAnml ? l.animal_id : l.user_id, name: itemName, lat: l.lat, lng: l.lng, heading: l.heading || 0, type: isAnml ? 'Animal' : 'User', isAnimal: isAnml, updated_at: l.updated_at };
        currentItems.push(trackerItem);

        if (savedFences.length > 0) {
            const isInside = savedFences.some(f => isPointInPolygon({ lat: l.lat, lng: l.lng }, f.coordinates));
            if (!isInside) newAlerts.push(trackerItem.name);
        }
      });
      setItems(currentItems);
      setAlertItems(newAlerts);
    } catch (e) { console.log(e); }
  };

  const getEmoji = (type: string, isAnimal: boolean) => {
    if (!isAnimal) return '👤';
    switch (type.toLowerCase()) {
      case 'корова': return '🐄';
      case 'лошадь': return '🐎';
      case 'овца': return '🐑';
      case 'коза': return '🐐';
      default: return '🐾';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{isDrawing ? 'Режим зон' : 'Карта'}</Text>
          <Text style={styles.subtitle}>{isDrawing ? 'Ставьте точки на карте' : `${items.length} объекта в сети`}</Text>
        </View>
        <TouchableOpacity style={[styles.iconBtn, isDrawing && { backgroundColor: COLORS.primary }]} onPress={() => { setIsDrawing(!isDrawing); setNewFencePoints([]); setSelectedFence(null); }}>
          {isDrawing ? <X color="#000" size={20} /> : <MapIcon color={COLORS.primary} size={20} />}
        </TouchableOpacity>
      </View>

      {alertItems.length > 0 && !isDrawing && (
        <View style={styles.dangerAlert}>
          <AlertTriangle color="#FFF" size={20} />
          <Text style={styles.dangerText}>Выход из зоны: {alertItems.join(', ')}</Text>
        </View>
      )}

      <View style={styles.mapWrapper}>
        <MapView ref={mapRef} provider={PROVIDER_GOOGLE} style={styles.map} mapType="hybrid" onPress={handleMapPress} initialRegion={{ latitude: 41.2995, longitude: 69.2401, latitudeDelta: 0.1, longitudeDelta: 0.1 }}>
          {savedFences.map(f => (
            <Polygon key={f.id} coordinates={f.coordinates} fillColor={selectedFence?.id === f.id ? "rgba(255, 30, 0, 0.3)" : "rgba(255,107,0,0.2)"} strokeColor={selectedFence?.id === f.id ? "#FF3B30" : COLORS.primary} strokeWidth={2} tappable={true} onPress={() => setSelectedFence(f)} />
          ))}
          {isDrawing && newFencePoints.length > 0 && <Polygon coordinates={newFencePoints} fillColor="rgba(59,130,246,0.3)" strokeColor="#3B82F6" strokeWidth={3} />}
          {isDrawing && newFencePoints.map((p, i) => <Marker key={i} coordinate={p}><View style={styles.drawPoint} /></Marker>)}
          {items.map(item => (
            <Marker key={item.id} coordinate={{ latitude: item.lat, longitude: item.lng }} onPress={() => setSelectedItem(item)} anchor={{ x: 0.5, y: 0.5 }}>
              {item.id === currentUserId ? (
                <View style={styles.meMarkerWrapper}><View style={[styles.directionArrow, { transform: [{ rotate: `${item.heading}deg` }] }]}><View style={styles.arrowPointer} /></View><View style={styles.mePulse} /><View style={styles.meDot} /></View>
              ) : (
                <View style={[styles.markerContainer, item.isAnimal ? styles.animalBorder : styles.userBorder, selectedItem?.id === item.id && { backgroundColor: '#FFF' }]}><Text style={styles.markerText}>{getEmoji(item.type, item.isAnimal)}</Text></View>
              )}
            </Marker>
          ))}
        </MapView>
        
        {isDrawing && newFencePoints.length >= 3 && <TouchableOpacity style={styles.saveFenceBtn} onPress={saveGeofence}><Check color="#000" size={24} /><Text style={styles.saveFenceText}>Сохранить зону</Text></TouchableOpacity>}
        <TouchableOpacity style={styles.myLocationBtn} onPress={() => { if (userLoc) mapRef.current?.animateToRegion({ latitude: userLoc.latitude, longitude: userLoc.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 1000); }}><Navigation2 color={COLORS.primary} size={24} fill={COLORS.primary} /></TouchableOpacity>
      </View>

      {selectedFence && (
          <TouchableOpacity style={styles.deleteFenceBtn} onPress={async () => {
              Alert.alert('Удаление', 'Удалить эту геозону?', [{ text: 'Отмена' }, { text: 'Да', style: 'destructive', onPress: async () => {
                  await supabase.from('geofences').delete().eq('id', selectedFence.id);
                  fetchFences(); setSelectedFence(null);
              }}]);
          }}><Trash2 color="#FFF" size={20} /><Text style={styles.deleteFenceText}>Удалить зону</Text></TouchableOpacity>
      )}

      {selectedItem && selectedItem.id !== currentUserId && (
          <TouchableOpacity style={styles.disconnectBtn} onPress={async () => {
              Alert.alert('Отключение', `Разорвать связь с ${selectedItem.name}?`, [{ text: 'Отмена' }, { text: 'Да', style: 'destructive', onPress: async () => {
                  await supabase.from('tracking_permissions').delete().or(`owner_id.eq.${selectedItem.id},viewer_id.eq.${selectedItem.id}`);
                  setSelectedItem(null); fetchData();
              }}]);
          }}><UserMinus color="#FFF" size={20} /><Text style={styles.disconnectText}>Отключить доступ</Text></TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  mapWrapper: { flex: 1, marginHorizontal: 16, marginBottom: 20, borderRadius: 32, overflow: 'hidden', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,107,0,0.1)', ...SHADOWS.medium },
  map: { flex: 1 },
  dangerAlert: { position: 'absolute', top: 120, left: 24, right: 24, zIndex: 10, backgroundColor: '#FF3B30', padding: 12, borderRadius: RADIUS.card, flexDirection: 'row', alignItems: 'center', gap: 10, ...SHADOWS.medium },
  dangerText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  markerContainer: { width: 42, height: 42, borderRadius: RADIUS.card, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, ...SHADOWS.small },
  animalBorder: { borderColor: COLORS.primary },
  userBorder: { borderColor: '#FFA500' },
  meMarkerWrapper: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  meDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#3B82F6', borderWidth: 2, borderColor: '#FFF', zIndex: 2 },
  mePulse: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(59, 130, 246, 0.2)', zIndex: 1 },
  directionArrow: { position: 'absolute', width: 50, height: 50, justifyContent: 'center', alignItems: 'center', zIndex: 0 },
  arrowPointer: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 15, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(59, 130, 246, 0.8)', transform: [{ translateY: -20 }] },
  markerText: { fontSize: 22 },
  myLocationBtn: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary, ...SHADOWS.medium },
  drawPoint: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#3B82F6' },
  saveFenceBtn: { position: 'absolute', bottom: 24, left: 24, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 8, ...SHADOWS.medium, zIndex: 100 },
  saveFenceText: { color: '#000', fontWeight: 'bold' },
  disconnectBtn: { backgroundColor: '#FF3B30', marginHorizontal: 24, marginBottom: 20, padding: 16, borderRadius: RADIUS.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...SHADOWS.medium },
  disconnectText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  deleteFenceBtn: { position: 'absolute', top: 120, alignSelf: 'center', backgroundColor: '#FF3B30', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8, ...SHADOWS.medium, zIndex: 100 },
  deleteFenceText: { color: '#FFF', fontWeight: 'bold' }
});

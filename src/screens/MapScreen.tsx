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
import MapView, { Marker, Polygon, UrlTile, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../../supabase';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../theme/theme';
import { Shield, Navigation2, Map as MapIcon, Check, X, AlertTriangle, UserMinus, Trash2, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

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

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const [items, setItems] = useState<TrackerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<TrackerItem | null>(null);

  const [drawMode, setDrawMode] = useState(false);
  const [geofencePoints, setGeofencePoints] = useState<any[]>([]);
  const [savedGeofence, setSavedGeofence] = useState<any[]>([]);
  const [isFenceSelected, setIsFenceSelected] = useState(false);
  const [alertItems, setAlertItems] = useState<string[]>([]);
  const locationWatcher = useRef<any>(null);

  const locationHistory = useRef<any[]>([]);
  const lastConfirmedLoc = useRef<any>(null);

  useEffect(() => {
    startTracking();
    fetchFences();
    fetchData(); // Fetch initial data

    const interval = setInterval(fetchData, 10000);

    const channelId = `locations-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'locations' }, 
        (payload) => {
          // Мгновенное обновление позиции животного из пришедших данных (True Realtime)
          const newLoc = payload.new as any;
          if (newLoc) {
            setItems(prev => prev.map(item => {
              // Проверяем совпадение по animal_id или tracker_id/user_id
              const isMatch = (newLoc.animal_id && item.id === newLoc.animal_id) || 
                            (newLoc.tracker_id && item.id === newLoc.tracker_id) ||
                            (newLoc.user_id && item.id === newLoc.user_id);
              
              if (isMatch) {
                return { ...item, lat: newLoc.lat, lng: newLoc.lng, updated_at: newLoc.updated_at };
              }
              return item;
            }));
          }
          // Периодическая полная синхронизация для обновления имен/типов
          fetchData(); 
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to ${channelId}`);
        }
      });

    return () => { 
      clearInterval(interval);
      supabase.removeChannel(channel);
      if (locationWatcher.current) locationWatcher.current.remove();
    };
  }, []);

  const startTracking = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      // Пытаемся получить координаты быстро
      try {
        const initialLoc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]) as any;
        setUserLoc(initialLoc.coords);
        lastConfirmedLoc.current = initialLoc.coords;
      } catch (e) {
        console.log('Initial location timeout, skipped');
      }
      
      setLoading(false);

      // Запускаем точное слежение с фильтрацией и сглаживанием
      locationWatcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 1 },
        (loc) => {
          const { latitude, longitude, accuracy, heading } = loc.coords;

          // 1. Фильтр точности (Accuracy Filter): Игнорируем если ошибка > 25 метров
          if (accuracy && accuracy > 25) {
            console.log('Location ignored: low accuracy', accuracy);
            return;
          }

          // 2. Сглаживание (Smoothing): Усреднение последних 5 позиций
          locationHistory.current = [...locationHistory.current, { latitude, longitude }].slice(-5);
          
          const avgLat = locationHistory.current.reduce((sum, p) => sum + p.latitude, 0) / locationHistory.current.length;
          const avgLng = locationHistory.current.reduce((sum, p) => sum + p.longitude, 0) / locationHistory.current.length;

          // 3. Фильтр дистанции (Distance Filter): Обновляем только если сдвинулись > 10 метров
          if (lastConfirmedLoc.current) {
            const dist = getDistance(
              lastConfirmedLoc.current.latitude, 
              lastConfirmedLoc.current.longitude, 
              avgLat, 
              avgLng
            );
            
            if (dist < 10) return; // Игнорируем микро-дрейф
          }

          const smoothedCoords = {
            latitude: avgLat,
            longitude: avgLng,
            accuracy,
            heading
          };

          setUserLoc(smoothedCoords);
          lastConfirmedLoc.current = smoothedCoords;
        }
      );
    } catch (e) {
      console.log('Location error:', e);
      setLoading(false);
    }
  };

  const fetchFences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('geofences').select('*').eq('owner_id', user.id);
    if (data && data.length > 0) {
      setSavedGeofence(data[0].coordinates); 
    } else {
      setSavedGeofence([]);
    }
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: animals } = await supabase.from('animals').select(`id, name, type, tracker_id`).eq('owner_id', user.id);
      const { data: permissions } = await supabase.from('tracking_permissions').select('owner_id').eq('viewer_id', user.id);
      const animalIds = animals?.map(a => a.id) || [];
      const userIds = permissions?.map(p => p.owner_id) || [];
      userIds.push(user.id);

      let queryParts = [];
      if (animalIds.length > 0) queryParts.push(`animal_id.in.("${animalIds.join('","')}")`);
      if (userIds.length > 0) queryParts.push(`user_id.in.("${userIds.join('","')}")`);
      const { data: locs } = await supabase.from('locations').select('*').or(queryParts.join(',')).order('updated_at', { ascending: false });
      
      const currentItemsMap = new Map<string, TrackerItem>();
      const newAlerts: string[] = [];

      locs?.forEach(l => {
        let animal = null;
        if (l.animal_id) {
          animal = animals?.find(a => a.id === l.animal_id);
        }
        
        if (!animal) {
          animal = animals?.find(a => a.tracker_id === l.tracker_id || a.tracker_id === l.user_id);
        }

        const isAnml = !!animal;
        const id = isAnml ? (animal?.id || '') : l.user_id;
        
        // Skip if we already have a newer location for this ID
        if (currentItemsMap.has(id)) return;

        const itemName = animal ? animal.name : (l.user_id === user.id ? 'Я (Вы)' : 'Друг');
        
        const trackerItem: TrackerItem = { 
          id, 
          name: itemName, 
          lat: l.lat, 
          lng: l.lng, 
          heading: l.heading || 0, 
          type: isAnml ? (animal?.type || 'Animal') : 'User', 
          isAnimal: isAnml, 
          updated_at: l.updated_at 
        };
        
        currentItemsMap.set(id, trackerItem);

        if (savedGeofence.length > 0) {
            const isInside = isPointInPolygon({ lat: l.lat, lng: l.lng }, savedGeofence);
            if (!isInside) {
                newAlerts.push(trackerItem.name);
            }
        }
      });
      setItems(Array.from(currentItemsMap.values()));
      setAlertItems(newAlerts);
    } catch (e) { console.log(e); }
  };

  const saveGeofence = async () => {
    if (geofencePoints.length < 3) {
      Alert.alert('Ошибка', 'Нужно минимум 3 точки');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('geofences').delete().eq('owner_id', user?.id);
    await supabase.from('geofences').insert({
      owner_id: user?.id,
      name: 'Основная зона',
      coordinates: geofencePoints
    });
    setDrawMode(false);
    setSavedGeofence(geofencePoints);
    setGeofencePoints([]);
    Alert.alert('Готово', 'Зона сохранена');
  };

  const deleteGeofence = async () => {
    Alert.alert(
      'Удалить зону',
      'Вы уверены?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('geofences').delete().neq('id', '');
            setSavedGeofence([]);
            setGeofencePoints([]);
            setIsFenceSelected(false);
            Alert.alert('Готово', 'Зона удалена');
          }
        }
      ]
    );
  };

  const goToMyLocation = async () => {
    const loc = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 1000);
  };

  const getEmoji = (type: string, isAnimal: boolean) => {
    if (!isAnimal) return '👤';
    const t = type?.toLowerCase();
    if (t?.includes('коров')) return '🐄';
    if (t?.includes('бык')) return '🐃';
    if (t?.includes('лошад') || t?.includes('конь')) return '🐎';
    if (t?.includes('овц') || t?.includes('баран')) return '🐑';
    if (t?.includes('коз')) return '🐐';
    if (t?.includes('куриц') || t?.includes('петух')) return '🐓';
    if (t?.includes('собак')) return '🐕';
    if (t?.includes('кошк')) return '🐈';
    return '🐾';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{drawMode ? 'Режим зон' : 'Карта'}</Text>
          <Text style={styles.subtitle}>{drawMode ? 'Ставьте точки на карте' : `${items.length} объекта(ов) в сети`}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.iconBtn, drawMode && { backgroundColor: COLORS.primary }]} 
          onPress={() => { setDrawMode(!drawMode); setGeofencePoints([]); }}
        >
          {drawMode ? <X color="#000" size={20} /> : <MapIcon color={COLORS.primary} size={20} />}
        </TouchableOpacity>
      </View>

      {alertItems.length > 0 && !drawMode && (
        <View style={styles.dangerAlert}>
          <AlertTriangle color="#FFF" size={20} />
          <Text style={styles.dangerText}>Выход из зоны: {alertItems.join(', ')}</Text>
        </View>
      )}

      <View style={styles.mapWrapper}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Запуск спутника...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            // STEP 1 & 4
            rotateEnabled={true}
            pitchEnabled={false}
            maxZoomLevel={18}
            initialRegion={userLoc ? {
              latitude: userLoc.latitude,
              longitude: userLoc.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01
            } : {
                latitude: 41.2995,
                longitude: 69.2401,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1
            }}
            onPress={(e) => {
              if (drawMode) {
                setGeofencePoints([...geofencePoints, e.nativeEvent.coordinate]);
              } else {
                setIsFenceSelected(false);
              }
            }}
          >
            {/* Esri World Imagery (High-resolution Satellite Tiles) */}
            <UrlTile
              urlTemplate="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maximumZ={18}
              flipY={false}
              zIndex={-1}
            />

            {/* STEP 6 - Manual User Location Indicator */}
            {userLoc && (
              <Marker 
                coordinate={{ latitude: userLoc.latitude, longitude: userLoc.longitude }}
                flat={true}
                rotation={userLoc.heading || 0}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.userMarkerContainer}>
                  {/* Outer ring */}
                  <View style={styles.userOuterRing} />
                  {/* Inner dot */}
                  <View style={styles.userInnerDot} />
                  {/* Direction arrow */}
                  {(userLoc.heading !== null && userLoc.heading !== undefined && userLoc.heading !== 0) && (
                    <View style={styles.directionArrow} />
                  )}
                </View>
              </Marker>
            )}

            {/* Животные и друзья (кроме меня самого) */}
            {items.filter(item => item.id !== currentUserId).map(item => (
              <Marker
                key={item.id}
                coordinate={{ latitude: item.lat, longitude: item.lng }}
                onPress={() => setSelectedItem(item)}
              >
                <View style={styles.animalMarkerIcon}>
                   <Text style={{ fontSize: 24 }}>{getEmoji(item.type, item.isAnimal)}</Text>
                </View>
              </Marker>
            ))}

            {/* STEP 5 - Geofence Polygon */}
            {savedGeofence.length > 3 && (
              <Polygon
                coordinates={savedGeofence.map(p => ({
                  latitude: p.latitude || p.lat,
                  longitude: p.longitude || p.lng
                }))}
                strokeColor={isFenceSelected ? "#FF6B00" : "#FF6B00"}
                strokeWidth={isFenceSelected ? 4 : 2}
                fillColor={isFenceSelected ? "rgba(255,107,0,0.2)" : "rgba(255,107,0,0.08)"}
                geodesic={true}
                tappable={true}
                onPress={() => setIsFenceSelected(true)}
              />
            )}

            {/* Режим рисования: Показываем Polyline (разомкнутая линия) */}
            {drawMode && geofencePoints.length >= 2 && (
              <Polyline
                coordinates={geofencePoints}
                strokeColor="#FF6B00"
                strokeWidth={2}
                lineDashPattern={[8, 4]}
              />
            )}
            
            {/* Точки рисования: Оранжевые кружки */}
            {drawMode && geofencePoints.map((p, idx) => (
              <Marker key={idx} coordinate={p} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={[styles.drawPoint, { backgroundColor: '#FF6B00' }]} />
              </Marker>
            ))}
          </MapView>
        )}
        
        {!loading && (
          <View style={styles.mapButtonsRow}>
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() => {
                if (drawMode && geofencePoints.length >= 3) {
                  saveGeofence();
                } else if (!drawMode) {
                  setDrawMode(true);
                  setGeofencePoints([]);
                  setIsFenceSelected(false);
                }
              }}
            >
              <Text style={styles.mapBtnText}>
                {drawMode ? '✅ Сохранить' : '📍 Нарисовать зону'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mapBtn}
              onPress={goToMyLocation}
            >
              <Text style={styles.mapBtnText}>🎯 Где я</Text>
            </TouchableOpacity>

            {(drawMode || isFenceSelected) && (
              <TouchableOpacity
                style={[styles.mapBtn, styles.mapBtnRed]}
                onPress={drawMode ? () => { setDrawMode(false); setGeofencePoints([]); } : deleteGeofence}
              >
                <Text style={styles.mapBtnText}>{drawMode ? '❌ Отмена' : '🗑 Удалить зону'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {selectedItem && selectedItem.id !== currentUserId && (
          <View style={styles.itemDetailCard}>
              <View style={styles.itemDetailHeader}>
                  <Text style={styles.itemDetailTitle}>{selectedItem.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedItem(null)}><X color="#000" size={20} /></TouchableOpacity>
              </View>
              <Text style={styles.itemDetailSubtitle}>{selectedItem.type}</Text>
              <TouchableOpacity style={styles.disconnectBtnSmall} onPress={async () => {
                  Alert.alert('Отключение', `Разорвать связь?`, [{ text: 'Отмена' }, { text: 'Да', style: 'destructive', onPress: async () => {
                      await supabase.from('tracking_permissions').delete().or(`owner_id.eq.${selectedItem.id},viewer_id.eq.${selectedItem.id}`);
                      setSelectedItem(null); fetchData();
                  }}]);
              }}><UserMinus color="#FFF" size={16} /><Text style={styles.disconnectTextSmall}>Удалить доступ</Text></TouchableOpacity>

              {selectedItem.isAnimal && (
                <TouchableOpacity 
                  style={[styles.disconnectBtnSmall, { backgroundColor: COLORS.red, marginTop: 8 }]} 
                  onPress={async () => {
                    Alert.alert('Удалить животное', `Удалить ${selectedItem.name}?`, [
                      { text: 'Отмена' }, 
                      { text: 'Да', style: 'destructive', onPress: async () => {
                        await supabase.from('animals').delete().eq('id', selectedItem.id);
                        setSelectedItem(null); 
                        fetchData();
                      }}
                    ]);
                  }}
                >
                  <Trash2 color="#FFF" size={16} />
                  <Text style={styles.disconnectTextSmall}>Удалить животное</Text>
                </TouchableOpacity>
              )}
          </View>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#011627' },
  loadingText: { color: COLORS.textSecondary, marginTop: 12, fontSize: 14 },
  mapWrapper: { flex: 1, marginHorizontal: 16, marginBottom: 20, borderRadius: 32, overflow: 'hidden', backgroundColor: '#011627', borderWidth: 1, borderColor: 'rgba(255,107,0,0.1)', ...SHADOWS.medium },
  map: { flex: 1 },
  dangerAlert: { position: 'absolute', top: 120, left: 24, right: 24, zIndex: 10, backgroundColor: '#FF3B30', padding: 12, borderRadius: RADIUS.card, flexDirection: 'row', alignItems: 'center', gap: 10, ...SHADOWS.medium },
  dangerText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  
  mapButtonsRow: {
    position: 'absolute',
    bottom: 15,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    zIndex: 100,
  },
  mapBtn: {
    backgroundColor: '#1a1208',
    borderWidth: 1,
    borderColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mapBtnRed: {
    borderColor: '#dc2626',
  },
  mapBtnText: {
    color: '#FF6B00',
    fontSize: 11,
    fontWeight: '500',
  },

  // STEP 6 - User Location Styles
  userMarkerContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userOuterRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 144, 226, 0.25)',
  },
  userInnerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A90E2',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  directionArrow: {
    position: 'absolute',
    top: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4A90E2',
  },

  animalMarkerIcon: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  drawPoint: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6', borderWidth: 2, borderColor: '#FFF' },
  
  itemDetailCard: { position: 'absolute', bottom: 80, left: 24, right: 24, backgroundColor: '#FFF', padding: 20, borderRadius: RADIUS.card, ...SHADOWS.medium },
  itemDetailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemDetailTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  itemDetailSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  disconnectBtnSmall: { backgroundColor: '#FF3B30', marginTop: 12, padding: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  disconnectTextSmall: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
});

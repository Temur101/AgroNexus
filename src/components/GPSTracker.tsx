import { useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../../supabase';

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000; // Радиус Земли в метрах
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function GPSTracker({ animalId }: { animalId?: string }) {
  useEffect(() => {
    let positionSub: any = null;
    let lastCoords: { lat: number, lng: number } | null = null;
    
    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user && !animalId) return;
      
      if (positionSub) positionSub.remove();

      positionSub = await Location.watchPositionAsync(
        { 
          accuracy: Location.Accuracy.BestForNavigation, 
          timeInterval: 3000, 
          distanceInterval: 1 
        },
        async (loc) => {
          const lat = loc.coords.latitude;
          const lng = loc.coords.longitude;

          // ФИЛЬТР ДРОЖАНИЯ: Если сдвинулись меньше чем на 3 метра - ничего не шлем
          if (lastCoords) {
            const dist = getDistance(lastCoords.lat, lastCoords.lng, lat, lng);
            if (dist < 3) return; // Игнорируем микро-движения
          }

          console.log('Significant movement detected, updating database...');
          lastCoords = { lat, lng };

          const payload: any = {
            lat, lng,
            speed: loc.coords.speed ?? 0,
            heading: loc.coords.heading ?? 0,
            updated_at: new Date().toISOString(),
          };

          if (animalId) {
            payload.animal_id = animalId;
          } else if (user) {
            payload.user_id = user.id;
          }

          try {
            const conflictColumn = animalId ? 'animal_id' : 'user_id';
            const { error: upsertError } = await supabase
              .from('locations')
              .upsert(payload, { onConflict: conflictColumn });
            
            if (upsertError) {
              console.error('GPS Upsert Error:', upsertError.message, upsertError.details);
            }
          } catch (e: any) {
            console.error('GPS Network/Exception:', e.message || e);
          }
        }
      );
    };

    // Следим за входом/выходом
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session || animalId) {
            start();
        } else {
            if (positionSub) positionSub.remove();
        }
    });

    start(); // Пробуем запустить сразу

    return () => {
        subscription.unsubscribe();
        if (positionSub) positionSub.remove();
    };
  }, [animalId]);
  
  return null;
}

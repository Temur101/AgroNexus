import { useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../../supabase';

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

export default function GPSTracker({ animalId }: { animalId?: string }) {
  useEffect(() => {
    let positionSub: any = null;
    let lastCoords: { lat: number, lng: number } | null = null;
    
    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      if (positionSub) positionSub.remove();

      // Resolve animal ID for background/phone tracking
      let resolvedAnimalId = animalId ?? null;
      if (!resolvedAnimalId) {
        try {
          const { data: linked } = await supabase
            .from('animals')
            .select('id')
            .eq('tracker_id', user.id)
            .maybeSingle();
          if (linked) {
            resolvedAnimalId = linked.id;
          }
        } catch (_) {}
      }

      positionSub = await Location.watchPositionAsync(
        { 
          accuracy: Location.Accuracy.Highest, 
          timeInterval: 2000, 
          distanceInterval: 0
        },
        async (loc) => {
          const lat = loc.coords.latitude;
          const lng = loc.coords.longitude;

          // lastCoords logic removed for pure continuous testing flow
          lastCoords = { lat, lng };

          // 1. Upsert into locations (Realtime persistence)
          const locationPayload: any = {
            lat, lng,
            speed: loc.coords.speed ?? 0,
            heading: loc.coords.heading ?? 0,
            updated_at: new Date().toISOString(),
          };

          const conflictCol = resolvedAnimalId ? 'animal_id' : 'user_id';
          if (resolvedAnimalId) {
            locationPayload.animal_id = resolvedAnimalId;
          } else {
            locationPayload.user_id = user.id;
          }

          try {
            await supabase.from('locations').upsert(locationPayload, { 
              onConflict: conflictCol,
              ignoreDuplicates: false 
            });

            // 2. Insert into animal_locations (History for stats/AI Analysis)
            if (resolvedAnimalId) {
               await supabase.from('animal_locations').insert({
                animal_id: resolvedAnimalId,
                lat, 
                lon: lng,
                speed: loc.coords.speed ?? 0,
                timestamp: new Date().toISOString()
              });
            }
          } catch (e: any) {
            console.error('GPSTracker Error:', e.message || e);
          }
        }
      );
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        start();
      } else {
        if (positionSub) positionSub.remove();
      }
    });

    start();

    return () => {
      subscription.unsubscribe();
      if (positionSub) positionSub.remove();
    };
  }, [animalId]);
  
  return null;
}

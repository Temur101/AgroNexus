import { useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { isPointInPolygon } from '../utils/geo';
import { sendLocalNotification } from '../utils/notifications';

export default function GeofenceMonitor() {
  const alertedDevices = useRef<Record<string, boolean>>({});
  const geofence = useRef<any[]>([]);

  useEffect(() => {
    let channel: any;

    const startMonitoring = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch current geofence
      const { data: fences } = await supabase
        .from('geofences')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fences && fences.length > 0) {
        geofence.current = fences[0].coordinates;
      }

      // 2. Fetch all animals and tracked users
      const { data: animals } = await supabase.from('animals').select('id, name').eq('owner_id', user.id);
      
      // 3. Subscribe to real-time location changes
      channel = supabase
        .channel('global-geofence')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'locations' },
          async (payload) => {
            const loc = payload.new as any;
            if (!loc || !geofence.current.length) return;

            // Check if this location belongs to one of user's animals or the user themselves
            const isMyAnimal = animals?.find(a => a.id === loc.animal_id);
            const isMe = loc.user_id === user.id;

            if (isMyAnimal || isMe) {
              const id = isMyAnimal ? isMyAnimal.id : user.id;
              const name = isMyAnimal ? isMyAnimal.name : 'Вы';
              
              const isInside = isPointInPolygon({ lat: loc.lat, lng: loc.lng }, geofence.current);
              
              if (!isInside && !alertedDevices.current[id]) {
                alertedDevices.current[id] = true;
                
                sendLocalNotification(
                  '🚨 Нарушение геозоны!',
                  `${name} покинул(а) пределы контролируемой территории.`
                );

                // Save to alert history
                await supabase.from('alerts').insert({
                  user_id: user.id,
                  item_id: id,
                  title: 'Выход из зоны',
                  message: `${name} покинул(а) безопасную зону.`,
                  type: 'geofence'
                });
              } else if (isInside && alertedDevices.current[id]) {
                alertedDevices.current[id] = false;
              }
            }
          }
        )
        .subscribe();
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        startMonitoring();
      } else {
        if (channel) supabase.removeChannel(channel);
        geofence.current = [];
        alertedDevices.current = {};
      }
    });

    startMonitoring();

    return () => {
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return null;
}

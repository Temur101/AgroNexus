import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { supabase } from '../../supabase';
import { COLORS, SHADOWS, RADIUS } from '../theme/theme';
import { User, Check, X, Smartphone } from 'lucide-react-native';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

export default function TrackingNotification() {
  const [request, setRequest] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let channel: any;

    const startListener = (userId: string) => {
        if (channel) supabase.removeChannel(channel);

        channel = supabase
          .channel(`tracking-${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'tracking_requests',
              filter: `to_user_id=eq.${userId}`
            },
            async (payload) => {
              const { data: sender } = await supabase
                .from('profiles')
                .select('first_name, email')
                .eq('id', payload.new.from_user_id)
                .single();

              setRequest({ ...payload.new, requester: sender });
              setVisible(true);
            }
          )
          .subscribe();
    };

    // Слушаем изменение статуса входа
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user?.id) {
            startListener(session.user.id);
        } else {
            if (channel) supabase.removeChannel(channel);
        }
    });

    // Проверка текущего юзера при запуске
    supabase.auth.getUser().then(({ data }) => {
        if (data.user?.id) startListener(data.user.id);
    });

    return () => {
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleAction = async (status: 'accepted' | 'rejected') => {
    setLoading(true);
    try {
      if (status === 'accepted') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Пользователь не авторизован');

        // 0. Получаем текущую локацию сразу
        let currentLoc = null;
        try {
          const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
          if (locStatus === 'granted') {
            currentLoc = await Location.getCurrentPositionAsync({});
          }
        } catch (locErr) {
          console.log('Location fetch error during accept modal:', locErr);
        }
        
        // 1. Создаем животное для отправителя
        const { error: animalError } = await supabase.from('animals').insert({
          name: request.animal_name,
          type: request.animal_type,
          tracker_id: user.id, // Текущий юзер = трекер
          owner_id: request.from_user_id // Отправитель = владелец
        });

        if (animalError) throw animalError;

        // 2. Создаем разрешение
        await supabase.from('tracking_permissions').insert({
          owner_id: user.id,
          viewer_id: request.from_user_id
        });

        // 3. Пушим начальную локацию
        if (currentLoc) {
            await supabase.from('locations').upsert({
              user_id: user.id,
              lat: currentLoc.coords.latitude,
              lng: currentLoc.coords.longitude,
              speed: currentLoc.coords.speed || 0,
              heading: currentLoc.coords.heading || 0
            });
        }
      }

      // 4. Обновляем статус запроса
      await supabase.from('tracking_requests')
        .update({ status })
        .eq('id', request.id);

      Alert.alert(
        status === 'accepted' ? 'Принято!' : 'Отклонено',
        status === 'accepted' ? 'Животное создано. Теперь вы отслеживаетесь.' : 'Запрос был удален.'
      );
      setVisible(false);
      setRequest(null);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Ошибка', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!request) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Smartphone color={COLORS.primary} size={32} />
          </View>
          
          <Text style={styles.title}>Запрос на доступ!</Text>
          <Text style={styles.message}>
            <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>
                {request.requester?.first_name || 'Кто-то'} 
            </Text> хочет отслеживать ваше устройство в демо-режиме.
          </Text>
          <Text style={styles.subMessage}>{request.requester?.email}</Text>

          <View style={styles.btnRow}>
            <TouchableOpacity 
              style={[styles.btn, styles.declineBtn]} 
              onPress={() => handleAction('rejected')}
              disabled={loading}
            >
              <X color="#FFF" size={20} />
              <Text style={styles.btnText}>Отказать</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.acceptBtn]} 
              onPress={() => handleAction('accepted')}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Check color="#000" size={20} />
                  <Text style={[styles.btnText, { color: '#000' }]}>Принять</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.2)',
    ...SHADOWS.medium,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,107,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#EEE',
    textAlign: 'center',
    lineHeight: 24,
  },
  subMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 10,
    marginBottom: 30,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 15,
  },
  btn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  declineBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  acceptBtn: {
    backgroundColor: COLORS.primary,
  },
  btnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  }
});

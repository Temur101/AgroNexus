import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, Check, X, User } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme/theme';
import { supabase } from '../../supabase';
import * as Location from 'expo-location';

const NotificationsScreen = ({ navigation }: any) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tracking_requests')
        .select('*, sender:profiles!tracking_requests_from_user_id_fkey(first_name, email)')
        .eq('to_user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      setRequests(data || []);
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAccept = async (request: any) => {
    setLoading(true);
    try {
      // 0. Получаем текущую локацию сразу
      let currentLoc = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          currentLoc = await Location.getCurrentPositionAsync({});
        }
      } catch (locErr) {
        console.log('Location fetch error during accept:', locErr);
      }

      // 1. Создаем животное для отправителя
      const { error: animalError } = await supabase.from('animals').insert({
        name: request.animal_name,
        type: request.animal_type,
        tracker_id: request.to_user_id, // ID текущего пользователя как трекера
        owner_id: request.from_user_id  // ID отправителя как владельца
      });

      if (animalError) throw animalError;

      // 2. Создаем разрешение на отслеживание (Мы -> Отправителю)
      const { error: permError } = await supabase.from('tracking_permissions').insert({
        owner_id: request.to_user_id,
        viewer_id: request.from_user_id
      });

      if (permError) throw permError;

      // 3. Создаем начальную точку на карте
      if (currentLoc) {
        await supabase.from('locations').upsert({
          user_id: request.to_user_id,
          lat: currentLoc.coords.latitude,
          lng: currentLoc.coords.longitude,
          speed: currentLoc.coords.speed || 0,
          heading: currentLoc.coords.heading || 0
        });
      }

      // 4. Обновляем статус запроса
      const { error: reqError } = await supabase.from('tracking_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);

      if (reqError) throw reqError;

      Alert.alert('Успех', 'Запрос принят. Теперь вы отслеживаетесь как это животное.');
      fetchRequests();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Ошибка', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await supabase.from('tracking_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);
      fetchRequests();
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.requestCard}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <User color={COLORS.primary} size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.senderName}>{item.sender?.first_name || 'Фермер'}</Text>
          <Text style={styles.senderEmail}>{item.sender?.email}</Text>
        </View>
      </View>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Хочет добавить вас как животное:{"\n"}
          <Text style={styles.animalHighlight}>{item.animal_name} ({item.animal_type})</Text>
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.btn, styles.rejectBtn]} 
          onPress={() => handleReject(item.id)}
        >
          <X color={COLORS.red} size={20} />
          <Text style={styles.rejectText}>Отклонить</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.btn, styles.acceptBtn]} 
          onPress={() => handleAccept(item)}
        >
          <Check color="#000" size={20} />
          <Text style={styles.acceptText}>Принять</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')} 
            style={styles.backBtn}
          >
            <ChevronLeft color={COLORS.primary} size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Уведомления</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRequests(); }} tintColor={COLORS.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Bell size={48} color={COLORS.surface} />
                <Text style={styles.emptyText}>Нет новых уведомлений</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: SPACING.lg },
  requestCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,107,0,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  senderName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  senderEmail: { color: COLORS.textSecondary, fontSize: 12 },
  infoBox: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12, marginBottom: 20 },
  infoText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  animalHighlight: { color: COLORS.primary, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, height: 48, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  rejectBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.red },
  acceptBtn: { backgroundColor: COLORS.primary },
  rejectText: { color: COLORS.red, fontWeight: 'bold' },
  acceptText: { color: '#000', fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { color: COLORS.textSecondary, fontSize: 16, marginTop: 15 },
});

export default NotificationsScreen;

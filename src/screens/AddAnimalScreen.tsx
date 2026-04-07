import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Clipboard, User, Search, Smartphone } from 'lucide-react-native';
import { CustomInput } from '../components/Input';
import { CustomButton } from '../components/Button';
import { supabase } from '../../supabase';

const AddAnimalScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [animalType, setAnimalType] = useState('Корова');
  const [trackerId, setTrackerId] = useState('');
  
  // Demo Mode State
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showUserList, setShowUserList] = useState(false);

  const types = ['Корова', 'Лошадь', 'Овца', 'Коза', 'Бык'];

  const handleSave = async () => {
    if (!name ) {
      Alert.alert('Ошибка', 'Введите имя животного');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('animals').insert({
        name,
        type: animalType,
        tracker_id: trackerId || null,
        owner_id: user?.id
      });

      if (error) throw error;

      Alert.alert('Успех', 'Животное успешно добавлено', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка сохранения', error.message);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 3) {
      setUsers([]);
      return;
    }

    setSearching(true);
    try {
      // Ищем в новой таблице профилей по Email или Имени
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name')
        .or(`email.ilike.%${query}%,first_name.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;
      
      setUsers(data || []);
    } catch (e) {
      console.log('Search error:', e);
    } finally {
      setSearching(false);
    }
  };

  const sendTrackingRequest = async (toUserId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('tracking_requests').insert({
        from_user_id: user?.id,
        to_user_id: toUserId,
        status: 'pending'
      });

      if (error) throw error;

      Alert.alert('Запрос отправлен', 'Ожидайте подтверждения от пользователя в демо-режиме.');
      setShowUserList(false);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setLoading(false);
    }
  };

  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Загружаем запросы вместе с данными профиля отправителя
    const { data } = await supabase
      .from('tracking_requests')
      .select('*, requester:profiles!tracking_requests_from_user_id_fkey(first_name, email)')
      .eq('to_user_id', user.id)
      .eq('status', 'pending');
    
    setIncomingRequests(data || []);
  };

  const acceptRequest = async (requestId: string, fromUserId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Создаем разрешение
      await supabase.from('tracking_permissions').insert({
        owner_id: user?.id,
        viewer_id: fromUserId
      });

      // 2. Обновляем статус запроса
      await supabase.from('tracking_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      Alert.alert('Готово', 'Вы теперь делитесь геопозицией с этим пользователем.');
      loadRequests();
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color={COLORS.primary} size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Добавить животное</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Основная информация</Text>
              
              <CustomInput 
                label="Кличка животного"
                placeholder="Например: Зорька"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Тип животного</Text>
              <View style={styles.typeGrid}>
                {types.map((type) => (
                  <TouchableOpacity 
                    key={type}
                    style={[
                      styles.typeItem,
                      animalType === type && styles.typeItemActive
                    ]}
                    onPress={() => setAnimalType(type)}
                  >
                    <Text style={[
                      styles.typeText,
                      animalType === type && styles.typeTextActive
                    ]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>GPS Трекер</Text>
              <Text style={styles.sectionSub}>Привяжите IMEI устройства для Traccar</Text>
              
              <CustomInput 
                label="IMEI / Device ID"
                placeholder="Например: 8663..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                leftIcon={<Clipboard color={COLORS.textSecondary} size={20} />}
                value={trackerId}
                onChangeText={setTrackerId}
              />
            </View>

            {incomingRequests.length > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: COLORS.secondary }]}>Входящие запросы (Демо-режим)</Text>
                  {incomingRequests.map(req => (
                    <View key={req.id} style={styles.userItem}>
                      <User color={COLORS.textSecondary} size={18} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.userName}>{req.requester?.first_name || 'Пользователь'}</Text>
                          <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{req.requester?.email}</Text>
                      </View>
                      <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptRequest(req.id, req.from_user_id)}>
                         <Text style={styles.acceptBtnText}>Разрешить</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={styles.divider} />

            <View style={styles.section}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>ТЕСТ (Демо режим)</Text>
                <TouchableOpacity onPress={() => setShowUserList(!showUserList)}>
                  <Text style={styles.toggleText}>{showUserList ? 'Скрыть' : 'Показать'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionSub}>Отслеживание телефона другого пользователя</Text>
              
              {showUserList && (
                <View style={styles.demoBox}>
                  <CustomInput 
                    placeholder="Поиск по ID пользователя..."
                    value={searchQuery}
                    onChangeText={searchUsers}
                    leftIcon={<Search color={COLORS.primary} size={20} />}
                  />
                  
                  {searching ? (
                    <ActivityIndicator color={COLORS.primary} style={{ margin: 10 }} />
                  ) : (
                    users.map(u => (
                      <TouchableOpacity 
                        key={u.id} 
                        style={styles.userItem}
                        onPress={() => sendTrackingRequest(u.id)}
                      >
                        <User color={COLORS.textSecondary} size={18} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.userName}>{u.first_name || 'Без имени'}</Text>
                            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{u.email}</Text>
                        </View>
                        <View style={styles.requestBtn}>
                            <Smartphone color={COLORS.primary} size={16} />
                            <Text style={styles.requestBtnText}>Запрос</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>

            <View style={styles.footer}>
              <CustomButton 
                title="Сохранить животное" 
                onPress={handleSave}
                loading={loading}
                style={styles.saveBtn}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  sectionSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 8,
    fontWeight: '500',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  typeItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  typeItemActive: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    borderColor: COLORS.primary,
  },
  typeText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  typeTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 20,
  },
  footer: {
    marginTop: 30,
  },
  saveBtn: {
    height: 60,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  demoBox: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 20,
    marginTop: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  userName: {
    color: COLORS.white,
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,107,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  requestBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  acceptBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  acceptBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  }
});

export default AddAnimalScreen;

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
import * as Location from 'expo-location';

const AddAnimalScreen = ({ navigation }: any) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [animalType, setAnimalType] = useState('Корова');
  const [trackerId, setTrackerId] = useState('');
  const [mode, setMode] = useState<'gps' | 'demo' | null>(null);
  
  // Demo Mode State
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const types = ['Корова', 'Лошадь', 'Овца', 'Коза', 'Бык'];

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        Alert.alert('Ошибка', 'Введите имя животного');
        return;
      }
      setStep(2);
    }
  };

  const selectMode = (m: 'gps' | 'demo') => {
    setMode(m);
    setStep(3);
  };

  const handleSaveGPS = async () => {
    if (!trackerId.trim()) {
      Alert.alert('Ошибка', 'Введите IMEI устройства');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Создаем животное
      const { data: animalData, error } = await supabase.from('animals').insert({
        name,
        type: animalType,
        tracker_id: trackerId,
        owner_id: user?.id
      }).select().single();

      if (error) throw error;

      // 2. Создаем начальную локацию, чтобы животное сразу появилось на карте
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          await supabase.from('locations').upsert({
            animal_id: animalData.id,
            tracker_id: trackerId,
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            speed: loc.coords.speed || 0,
            heading: loc.coords.heading || 0
          });
        }
      } catch (locErr) {
        console.log('Initial location error:', locErr);
      }

      Alert.alert('Успех', 'Животное успешно добавлено и готово к отслеживанию', [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Herd' }) }
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
        status: 'pending',
        animal_name: name,
        animal_type: animalType
      });

      if (error) throw error;

      Alert.alert('Запрос отправлен', 'Животное будет создано автоматически после того, как пользователь подтвердит запрос.', [
        { text: 'Ясно', onPress: () => navigation.navigate('MainTabs') }
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Шаг 1: О животным</Text>
      <CustomInput 
        label="Кличка животного"
        placeholder="Например: Буян"
        value={name}
        onChangeText={setName}
      />
      <Text style={styles.label}>Тип животного</Text>
      <View style={styles.typeGrid}>
        {types.map((type) => (
          <TouchableOpacity 
            key={type}
            style={[styles.typeItem, animalType === type && styles.typeItemActive]}
            onPress={() => setAnimalType(type)}
          >
            <Text style={[styles.typeText, animalType === type && styles.typeTextActive]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <CustomButton title="Далее" onPress={handleNext} style={styles.nextBtn} />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Шаг 2: Способ слежения</Text>
      <TouchableOpacity style={styles.modeCard} onPress={() => selectMode('gps')}>
        <View style={styles.modeIcon}>
          <Clipboard color={COLORS.primary} size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.modeName}>GPS Трекер</Text>
          <Text style={styles.modeDesc}>Реальное устройство (Traccar/IMEI)</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.modeCard} onPress={() => selectMode('demo')}>
        <View style={styles.modeIcon}>
          <Smartphone color={COLORS.secondary} size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.modeName}>Демо (Телефон)</Text>
          <Text style={styles.modeDesc}>Слежение за телефоном другого человека</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setStep(1)} style={styles.backLink}>
        <Text style={styles.backLinkText}>Назад</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3GPS = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Шаг 3: Настройка GPS</Text>
      <CustomInput 
        label="IMEI / Device ID"
        placeholder="Например: 8663..."
        leftIcon={<Clipboard color={COLORS.textSecondary} size={20} />}
        value={trackerId}
        onChangeText={setTrackerId}
      />
      <Text style={styles.sectionSub}>Введите уникальный номер вашего устройства Traccar</Text>
      <CustomButton title="Сохранить и завершить" onPress={handleSaveGPS} loading={loading} />
      <TouchableOpacity onPress={() => setStep(2)} style={styles.backLink}>
        <Text style={styles.backLinkText}>Назад</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3Demo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Шаг 3: Выбор пользователя</Text>
      <Text style={styles.sectionSub}>Найдите человека, за которым хотите следить под видом животного</Text>
      <CustomInput 
        placeholder="Email или Имя пользователя..."
        value={searchQuery}
        onChangeText={searchUsers}
        leftIcon={<Search color={COLORS.primary} size={20} />}
      />
      
      <ScrollView style={styles.userList}>
        {searching ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          users.map(u => (
            <TouchableOpacity key={u.id} style={styles.userItem} onPress={() => sendTrackingRequest(u.id)}>
              <User color={COLORS.textSecondary} size={18} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.userName}>{u.first_name || 'Без имени'}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{u.email}</Text>
              </View>
              <View style={styles.requestBtn}>
                <Smartphone color={COLORS.primary} size={16} />
                <Text style={styles.requestBtnText}>Выбрать</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <TouchableOpacity onPress={() => setStep(2)} style={styles.backLink}>
        <Text style={styles.backLinkText}>Назад</Text>
      </TouchableOpacity>
    </View>
  );

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

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.content}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && mode === 'gps' && renderStep3GPS()}
            {step === 3 && mode === 'demo' && renderStep3Demo()}
          </View>
        </KeyboardAvoidingView>
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
  content: { flex: 1, paddingHorizontal: SPACING.lg },
  stepContainer: { flex: 1, paddingTop: 20 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 20 },
  label: { fontSize: 14, color: '#E5E7EB', marginBottom: 8, fontWeight: '500' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 30 },
  typeItem: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  typeItemActive: { backgroundColor: 'rgba(255, 107, 0, 0.1)', borderColor: COLORS.primary },
  typeText: { color: COLORS.textSecondary, fontSize: 14 },
  typeTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  nextBtn: { height: 60, marginTop: 20 },
  modeCard: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modeIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  modeName: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  modeDesc: { color: COLORS.textSecondary, fontSize: 13 },
  backLink: { padding: 15, alignSelf: 'center', marginTop: 10 },
  backLinkText: { color: COLORS.textSecondary, fontSize: 15 },
  sectionSub: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20, lineHeight: 20 },
  userList: { flex: 1, marginTop: 10 },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  userName: { color: COLORS.white, fontWeight: '600', fontSize: 15 },
  requestBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,107,0,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  requestBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' }
});

export default AddAnimalScreen;

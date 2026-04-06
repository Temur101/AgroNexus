import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, QrCode, Clipboard } from 'lucide-react-native';
import { CustomInput } from '../components/Input';
import { CustomButton } from '../components/Button';
import { LinearGradient } from 'expo-linear-gradient';

const AddAnimalScreen = ({ navigation }: any) => {
  const [animalType, setAnimalType] = useState('Корова');

  const types = ['Корова', 'Лошадь', 'Овца', 'Коза', 'Бык'];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
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

              <CustomInput 
                label="Номер чипа / Бирка"
                placeholder="#000000"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Подключить GPS трекер</Text>
              <Text style={styles.sectionSub}>Привяжите Traccar Device ID для отслеживания</Text>
              
              <TouchableOpacity style={styles.qrButton}>
                <LinearGradient
                  colors={['rgba(255, 107, 0, 0.1)', 'rgba(255, 107, 0, 0.05)']}
                  style={styles.qrGradient}
                >
                  <QrCode color={COLORS.primary} size={32} />
                  <Text style={styles.qrText}>Сканировать QR-код</Text>
                </LinearGradient>
              </TouchableOpacity>

              <CustomInput 
                label="Traccar Device ID (вручную)"
                placeholder="1234567890"
                placeholderTextColor="rgba(255,255,255,0.2)"
                leftIcon={<Clipboard color={COLORS.textSecondary} size={20} />}
              />
            </View>

            <View style={styles.footer}>
              <CustomButton 
                title="Сохранить животное" 
                onPress={() => navigation.goBack()}
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
    marginBottom: 20,
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
    marginVertical: 25,
  },
  qrButton: {
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 0, 0.2)',
    borderStyle: 'dashed',
  },
  qrGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  qrText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
  },
  saveBtn: {
    height: 60,
  },
});

export default AddAnimalScreen;

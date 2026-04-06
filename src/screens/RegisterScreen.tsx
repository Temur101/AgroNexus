import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import { CustomInput } from '../components/Input';
import { CustomButton } from '../components/Button';
import { Mail, Lock, User, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.flex1}>
            {/* Background Glow */}
            <View style={styles.glowContainer}>
              <LinearGradient
                colors={['rgba(255, 189, 57, 0.2)', 'transparent']}
                style={styles.glow}
              />
            </View>

            <SafeAreaView style={styles.safeArea}>
              <View style={styles.navHeader}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <ChevronLeft color={COLORS.textPrimary} size={24} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.signupLink}>Войти</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                <View style={styles.logoContainer}>
                  <LinearGradient
                    colors={COLORS.gradient as any}
                    style={styles.logoGradient}
                  >
                    <Text style={styles.logoIcon}>A</Text>
                  </LinearGradient>
                </View>

                <View style={styles.headerSection}>
                  <Text style={styles.title}>Создать аккаунт</Text>
                  <Text style={styles.subtitle}>Введите ваши данные, чтобы присоединиться к AgroNexus.</Text>
                </View>

                <View style={styles.formSection}>
                  <View style={styles.nameRow}>
                    <CustomInput 
                      label="Имя" 
                      placeholder="Имя" 
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      containerStyle={styles.flex1}
                    />
                    <View style={{ width: SPACING.md }} />
                    <CustomInput 
                      label="Фамилия" 
                      placeholder="Фамилия" 
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      containerStyle={styles.flex1}
                    />
                  </View>

                  <CustomInput 
                    label="Электронная почта" 
                    placeholder="Введите ваш email" 
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    leftIcon={<Mail color={COLORS.primary} size={20} />}
                  />
                  
                  <CustomInput 
                    label="Пароль" 
                    placeholder="Введите ваш пароль" 
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry
                    leftIcon={<Lock color={COLORS.primary} size={20} />}
                  />

                  <CustomButton 
                    title="Продолжить" 
                    onPress={() => navigation.navigate('MainTabs')}
                    style={styles.loginButton}
                  />

                  <View style={styles.socialGroup}>
                    <CustomButton 
                      title="Apple" 
                      variant="social"
                      onPress={() => {}}
                      style={styles.socialBtn}
                    />
                    <CustomButton 
                      title="Google" 
                      variant="social"
                      onPress={() => {}}
                      style={styles.socialBtn}
                    />
                  </View>
                </View>
              </ScrollView>
            </SafeAreaView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex1: {
    flex: 1,
  },
  glowContainer: {
    position: 'absolute',
    top: -100,
    width: width,
    height: height * 0.5,
  },
  glow: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  signupLink: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weights.medium,
    textDecorationLine: 'underline',
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: height * 0.02,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
    flexGrow: 1,
  },
  logoContainer: {
    marginBottom: SPACING.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGradient: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  logoIcon: {
    color: '#000',
    fontSize: 26,
    fontWeight: 'bold',
    transform: [{ rotate: '-45deg' }],
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 1.5,
  },
  title: {
    fontSize: 26,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  formSection: {
    width: '100%',
    gap: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    width: '100%',
  },
  loginButton: {
    marginBottom: SPACING.lg,
  },
  socialGroup: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  socialBtn: {
    flex: 1,
  },
});

export default RegisterScreen;

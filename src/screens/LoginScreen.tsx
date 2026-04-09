import { useState } from 'react';
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
  Keyboard,
  Alert
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import { CustomInput } from '../components/Input';
import { CustomButton } from '../components/Button';
import { Mail, Lock, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Пожалуйста, введите почту и пароль');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Успешный вход — AppNavigator автоматически переключит экраны
        // так как состояние сессии обновится через onAuthStateChange
      }
    } catch (error: any) {
      Alert.alert('Ошибка входа', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* Background Glow */}
          <View style={styles.glowContainer}>
            <LinearGradient
              colors={['rgba(255, 107, 0, 0.25)', 'transparent']}
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
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signupLink}>Создать аккаунт</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
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
                <Text style={styles.title}>Вход в AgroNexus</Text>
                <Text style={styles.subtitle}>Войдите, чтобы продолжить использование приложения.</Text>
              </View>

              <View style={styles.formSection}>
                <CustomInput 
                  label="Электронная почта" 
                  placeholder="Введите ваш email" 
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  leftIcon={<Mail color={COLORS.primary} size={20} />}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                
                <CustomInput 
                  label="Пароль" 
                  placeholder="Введите ваш пароль" 
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry
                  leftIcon={<Lock color={COLORS.primary} size={20} />}
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity style={styles.forgotContainer}>
                  <Text style={styles.forgotText}>Забыли пароль?</Text>
                </TouchableOpacity>

                <CustomButton 
                  title="Войти" 
                  onPress={handleLogin}
                  loading={loading}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
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
    paddingTop: height * 0.05,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
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
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  logoIcon: {
    color: '#000',
    fontSize: 32,
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
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotText: {
    color: COLORS.textSecondary,
    fontSize: 13,
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

export default LoginScreen;

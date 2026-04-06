import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import { CustomButton } from '../components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      {/* Background Decorative Element */}
      <View style={styles.decorativeBg}>
        <LinearGradient
            colors={['rgba(255, 107, 0, 0.15)', 'transparent']}
            style={styles.full}
        />
      </View>

      <SafeAreaView style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={COLORS.gradient as any}
              style={styles.logoGradient}
            >
              <Text style={styles.logoSymbol}>A</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
          <Text style={styles.brandTitle}>AgroNexus</Text>
          <Text style={styles.tagline}>
            Умный пастух для{"\n"}безупречного управления стадом
          </Text>
        </View>

        {/* Action Section */}
        <View style={styles.actionSection}>
          <CustomButton 
            title="Зарегистрироваться" 
            onPress={() => navigation.navigate('Register')}
            style={styles.btn}
          />
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>Уже есть аккаунт? </Text>
            <Text style={styles.loginBold}>Войти</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('About')}
            style={styles.aboutLink}
          >
            <Text style={styles.aboutText}>Узнать больше о проекте</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  decorativeBg: {
    position: 'absolute',
    top: 0,
    width,
    height: height * 0.6,
  },
  full: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'space-between',
    paddingBottom: SPACING.xl,
  },
  logoSection: {
    paddingTop: height * 0.1,
    alignItems: 'center',
  },
  logoContainer: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  logoSymbol: {
    color: '#000',
    fontSize: 48,
    fontWeight: 'bold',
    transform: [{ rotate: '-45deg' }],
  },
  textSection: {
    marginTop: -SPACING.xl,
  },
  brandTitle: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: 8,
    opacity: 0.8,
  },
  tagline: {
    fontSize: 34,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    lineHeight: 44,
  },
  actionSection: {
    width: '100%',
    gap: SPACING.md,
  },
  btn: {
    height: 64,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  loginText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  loginBold: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  aboutLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  aboutText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;

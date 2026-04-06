import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'social';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
}

export const CustomButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  style,
  textStyle,
  disabled = false,
  leftIcon,
}) => {
  const isPrimary = variant === 'primary';
  
  const getBackgroundColor = () => {
    if (disabled) return COLORS.borderColor;
    if (variant === 'social') return COLORS.surface;
    if (variant === 'outline') return 'transparent';
    return isPrimary ? 'transparent' : COLORS.surface;
  };

  const getTextColor = () => {
    if (disabled) return COLORS.textSecondary;
    if (isPrimary) return '#000000'; // dark text on bright orange
    return COLORS.textPrimary;
  };

  const Content = () => (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: (variant === 'social' || variant === 'outline') ? COLORS.borderColor : 'transparent',
          borderWidth: (variant === 'social' || variant === 'outline') ? 1.2 : 0,
        },
        style,
      ]}
    >
      {isPrimary && !disabled ? (
        <LinearGradient
          colors={COLORS.gradient as any}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        >
          <Content />
        </LinearGradient>
      ) : (
        <Content />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 58,
    borderRadius: RADIUS.button,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});

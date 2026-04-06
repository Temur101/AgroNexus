import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../theme/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const CustomInput: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  containerStyle,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          error ? styles.errorBorder : null,
        ]}
      >
        {leftIcon && <View style={styles.iconWrapper}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={COLORS.textSecondary}
          style={styles.input}
          selectionColor={COLORS.primary}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    color: '#E5E7EB', // Lighter grey for dark mode
    marginBottom: SPACING.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  inputContainer: {
    height: 60,
    backgroundColor: '#121212', // Very dark grey, almost black
    borderWidth: 1.2,
    borderColor: '#262626',
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    marginRight: 10,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.white,
  },
  errorBorder: {
    borderColor: COLORS.red,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.red,
    marginTop: SPACING.xs,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightIcon?: React.ReactNode;
  variant?: 'white' | 'orange';
}

export const ScreenHeader: React.FC<HeaderProps> = ({ 
  title, 
  onBack, 
  rightIcon,
  variant = 'dark' 
}) => {
  const isDark = variant === 'dark';
  const color = isDark ? COLORS.white : COLORS.textPrimary;
  const bg = isDark ? COLORS.background : COLORS.white;

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.content}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <View style={styles.backBtnCircle}>
                <ChevronLeft color={color} size={24} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
        <Text style={[styles.title, { color }]}>{title}</Text>
        <View style={styles.rightContent}>
          {rightIcon}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 100,
    justifyContent: 'flex-end',
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  backBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  spacer: {
    width: 44,
  },
  title: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.weights.medium,
    flex: 1,
    textAlign: 'center',
  },
  rightContent: {
    width: 44,
    alignItems: 'flex-end',
  },
});

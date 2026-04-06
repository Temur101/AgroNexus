export const COLORS = {
  primary: '#FF6B00',
  secondary: '#FFC700',
  background: '#0D0D0D', // deep black
  surface: '#1A1410', // warm dark brown from ref
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  borderColor: '#262626',
  white: '#FFFFFF',
  green: '#10B981',
  red: '#EF4444',
  gradient: ['#FF6B00', '#FFBD39'] as const,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  card: 20,
  button: 24,
  input: 16,
};

export const TYPOGRAPHY = {
  fontFamily: 'System',
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    bold: '700' as const,
  },
};

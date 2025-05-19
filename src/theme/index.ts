// src/theme/index.ts
import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3B82F6',
    accent: '#10B981',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    disabled: '#E5E7EB',
    placeholder: '#9CA3AF',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#EF4444',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  roundness: 8,
};

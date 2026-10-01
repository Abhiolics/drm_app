export const Colors = {
  // Brand Accents (Replacing original yellow/gold with premium purple/indigo system)
  primary: '#7C5CFC',
  primaryGlow: 'rgba(124, 92, 252, 0.35)',
  primaryLight: 'rgba(124, 92, 252, 0.15)',
  primaryMuted: 'rgba(124, 92, 252, 0.08)',
  secondary: '#5B8CFF',
  secondaryGlow: 'rgba(91, 140, 255, 0.30)',
  
  // Base & Surfaces
  background: '#09080D',
  surface: '#111019',
  surfaceElevated: '#171521',
  surfaceGlass: 'rgba(255, 255, 255, 0.055)',
  surfaceGlassStrong: 'rgba(255, 255, 255, 0.09)',
  
  // Borders
  border: 'rgba(255, 255, 255, 0.10)',
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderAccent: 'rgba(124, 92, 252, 0.40)',

  // Typography
  textPrimary: '#F5F3FA',
  textSecondary: '#8F8B9C',
  textMuted: '#5E5A6E',
  textInverse: '#09080D',

  // Status & Feedback
  success: '#39D98A',
  successBg: 'rgba(57, 217, 138, 0.12)',
  danger: '#FF5C70',
  dangerBg: 'rgba(255, 92, 112, 0.12)',
  warning: '#FFB020',
  warningBg: 'rgba(255, 176, 32, 0.12)',
  info: '#5B8CFF',
  infoBg: 'rgba(91, 140, 255, 0.12)',

  // Gradients
  accentGradient: ['#7C5CFC', '#5B8CFF'] as const,
  cardGradient: ['rgba(23, 21, 33, 0.85)', 'rgba(17, 16, 25, 0.95)'] as const,
  heroGradient: ['#1C1635', '#121020', '#0D0C15'] as const,
  glowGradient: ['rgba(124, 92, 252, 0.22)', 'rgba(91, 140, 255, 0.04)'] as const,
  navGradient: ['rgba(17, 16, 25, 0.92)', 'rgba(9, 8, 13, 0.96)'] as const,
};

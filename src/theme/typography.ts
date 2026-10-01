import { TextStyle, Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const Typography: Record<string, TextStyle> = {
  h1: {
    fontFamily,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  balance: {
    fontFamily,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontFamily,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  body: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodyMedium: {
    fontFamily,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  bodySemiBold: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
  },
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: '500',
  },
  captionSmall: {
    fontFamily,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  button: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  tab: {
    fontFamily,
    fontSize: 13,
    fontWeight: '600',
  },
};

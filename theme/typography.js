import { StyleSheet } from 'react-native';

export const FONTS = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

// Named typography presets — use these as style spreads for consistency
export const type = {
  display: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  h2: {
    fontFamily: FONTS.semiBold,
    fontSize: 20,
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  h3: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  bodyStrong: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  caption: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 18,
    color: '#888888',
  },
  sectionLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
};

// Weight → font family map
const WEIGHT_TO_FONT = {
  '400': FONTS.regular,
  'normal': FONTS.regular,
  '500': FONTS.medium,
  '600': FONTS.semiBold,
  '700': FONTS.bold,
  '800': FONTS.bold,
  '900': FONTS.bold,
  'bold': FONTS.bold,
};

/**
 * Drop-in replacement for StyleSheet.create that auto-injects Poppins fontFamily
 * into every style rule that has fontSize or fontWeight, without touching layouts.
 */
export function injectFonts(rawStyles) {
  const processed = {};
  for (const key of Object.keys(rawStyles)) {
    const style = rawStyles[key];
    if (style && typeof style === 'object' && !Array.isArray(style)) {
      const hasFontSize = 'fontSize' in style;
      const hasFontWeight = 'fontWeight' in style;
      if ((hasFontSize || hasFontWeight) && !style.fontFamily) {
        const weight = style.fontWeight;
        processed[key] = {
          ...style,
          fontFamily: WEIGHT_TO_FONT[weight] || FONTS.regular,
        };
      } else {
        processed[key] = style;
      }
    } else {
      processed[key] = style;
    }
  }
  return StyleSheet.create(processed);
}

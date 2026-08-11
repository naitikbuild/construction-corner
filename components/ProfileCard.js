import { View } from 'react-native';
import { injectFonts } from '../theme/typography';

// Shared white rounded card wrapper used across all provider profile
// screens (Worker/Contractor/Professional/Business/Supplier) — each major
// section sits in its own card on the light grey app background, per the
// card-based redesign.
export default function ProfileCard({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

const s = injectFonts({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 14,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});

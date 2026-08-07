import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { injectFonts } from '../theme/typography';
import { getCurrentUid } from '../utils/session';
import { getClientReviews } from '../services/workRecordService';
import ClientReviewsSection from '../components/ClientReviewsSection';

const DARK   = '#262626';
const BG     = '#FAF9F5';
const FILL   = '#F2F2F2';
const BORDER = '#E5E5E5';
const LIGHT  = '#8E8E8E';

// Settings-only screen showing the reviews THIS user has received AS A
// CLIENT (from providers they've hired) — reuses ClientReviewsSection /
// workRecordService.getClientReviews, the same logic that used to render
// publicly on the user's own profile. Moved here so this reputation stays
// private, visible only to the user themself via Settings.
export default function ClientReviewsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  const load = useCallback(async () => {
    try {
      const uid = await getCurrentUid();
      if (!uid || uid.startsWith('guest_')) { setReviews([]); return; }
      setReviews(await getClientReviews(uid));
    } catch (_) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Reviews as a Client</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={DARK} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          <Text style={s.intro}>What providers you've hired have said about working with you.</Text>
          <View style={s.card}>
            <ClientReviewsSection reviews={reviews} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = injectFonts({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 52, paddingBottom: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 20, fontWeight: '700', color: DARK },
  headerTitle: { fontSize: 15, fontWeight: '600', color: DARK },

  scrollContent: { padding: 14, paddingBottom: 32 },
  intro: { fontSize: 12, color: LIGHT, fontWeight: '500', marginBottom: 14, lineHeight: 18 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: BORDER,
    padding: 14,
  },
});

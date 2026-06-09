import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '../services/userService';
import { getTotalVerifiedAmount } from '../services/workService';
import { createChat } from '../services/chatService';
import { auth } from '../config/firebase';

// ─── Gradient Button ──────────────────────────────────────────────────────────
function GradBtn({ label, subLabel, onPress }) {
  return (
    <TouchableOpacity style={ss.gradWrap} onPress={onPress} activeOpacity={0.88}>
      <View style={ss.gradBg} pointerEvents="none">
        {['#833AB4', '#C13584', '#FD1D1D', '#F77737'].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>
      <View style={ss.gradContent}>
        <Text style={ss.gradLabel}>{label}</Text>
        {subLabel ? <Text style={ss.gradSub}>{subLabel}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── CC Score Bar ─────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  return (
    <View style={ss.scorePad}>
      <View style={ss.scoreRow}>
        <Text style={ss.scoreLabel}>CC Trust Score</Text>
        <Text style={ss.scoreNum}>{score} / 100</Text>
      </View>
      <View style={ss.scoreTrack}>
        <View style={{ width: `${score}%`, height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'hidden' }}>
          {['#F44336', '#FF9800', '#FFEB3B', '#8BC34A', '#4CAF50'].map((c, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Sample data ─────────────────────────────────────────────────────────────
const PROFILE = {
  name: 'Shree Cement Agency',
  category: 'Cement & Building Materials',
  location: 'Odhav, Ahmedabad, Gujarat',
  logo: '🏗️',
  score: 91,
  orders: 280,
  deliveryRadius: '25 km',
  experience: '15 Yrs',
  verifiedAmt: '₹1,20,00,000',
  verifiedOrders: 280,
  about: 'Authorised dealer of ACC, UltraTech & Shree Cement brands. Serving construction professionals and self-builders across Ahmedabad for 15+ years. Same-day delivery available.',
};

const HIGHLIGHTS = [
  { emoji: '📋', label: 'Catalogue', color: '#833AB4' },
  { emoji: '⭐', label: 'Reviews', color: '#FD1D1D' },
  { emoji: '🚛', label: 'Delivery', color: '#F77737' },
  { emoji: '📦', label: 'Orders', color: '#4CAF50' },
  { emoji: '🏷️', label: 'Brands', color: '#0EA5E9' },
];

const MATERIALS = [
  { name: 'OPC 53 Grade Cement', brand: 'UltraTech', price: '₹340', unit: '/bag (50 kg)' },
  { name: 'PPC Cement', brand: 'ACC', price: '₹320', unit: '/bag (50 kg)' },
  { name: 'PSC Cement (Slag)', brand: 'Shree', price: '₹295', unit: '/bag (50 kg)' },
  { name: 'White Cement', brand: 'JK White', price: '₹520', unit: '/bag (50 kg)' },
  { name: 'AAC Blocks (6")', brand: 'Siporex', price: '₹45', unit: '/piece' },
  { name: 'Solid Concrete Block', brand: 'Local', price: '₹28', unit: '/piece' },
  { name: 'River Sand (M-Sand)', brand: '—', price: '₹1,800', unit: '/tonne' },
  { name: 'Coarse Aggregate (20mm)', brand: '—', price: '₹1,500', unit: '/tonne' },
  { name: 'Fine Aggregate (10mm)', brand: '—', price: '₹1,400', unit: '/tonne' },
  { name: 'Fly Ash Bricks', brand: 'Local', price: '₹6', unit: '/piece' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SupplierProfileScreen({ navigation, route }) {
  const viewUid = route?.params?.uid ?? null;
  const [activeTab, setActiveTab] = useState('Price List');
  const [loading, setLoading] = useState(true);
  const [liveProfile, setLiveProfile] = useState(null);
  const [verifiedAmt, setVerifiedAmt] = useState('');
  const [myUid, setMyUid] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const uid = viewUid || auth.currentUser?.uid;
      const me = await AsyncStorage.getItem('uid');
      setMyUid(me);
      if (!uid) { setLoading(false); return; }
      const [profile, totalAmt] = await Promise.all([getProfile(uid), getTotalVerifiedAmount(uid)]);
      if (profile) setLiveProfile(profile);
      setVerifiedAmt(totalAmt > 0 ? `₹${totalAmt.toLocaleString('en-IN')}` : '₹0');
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handleChat = async () => {
    if (!viewUid || viewUid === myUid) return;
    try {
      const myName = await AsyncStorage.getItem('userName') || 'Me';
      const chatId = await createChat(
        { uid: myUid, name: myName },
        { uid: viewUid, name: liveProfile?.companyName || liveProfile?.name || 'Supplier' }
      );
      navigation.navigate('Chat', {
        conversation: {
          id: chatId,
          uid: viewUid,
          name: liveProfile?.companyName || liveProfile?.name || 'Supplier',
          role: liveProfile?.supplierCategory || 'Supplier',
          emoji: '🏭',
          avatarBg: '#E3F2FD',
          online: false,
        }
      });
    } catch (_) { Alert.alert('Error', 'Could not open chat.'); }
  };

  const display = {
    name: liveProfile?.companyName || liveProfile?.name || 'Add business name',
    category: liveProfile?.supplierCategory || liveProfile?.designation || 'Add category',
    location: [liveProfile?.city, liveProfile?.state].filter(Boolean).join(', ') || 'Add location',
    verified: verifiedAmt || '₹0',
  };

  if (loading) {
    return (
      <View style={[ss.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#C13584" />
        <Text style={{ marginTop: 12, color: '#888', fontSize: 14 }}>Loading profile...</Text>
      </View>
    );
  }

  if (!liveProfile && !viewUid) {
    return (
      <View style={[ss.screen, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 52, marginBottom: 16 }}>🏭</Text>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#111', marginBottom: 8, textAlign: 'center' }}>Profile Incomplete</Text>
        <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
          Please complete your supplier profile to appear in search results and attract buyers.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#C13584', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 }}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Complete Profile →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={ss.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* HEADER */}
      <View style={ss.header}>
        <TouchableOpacity style={ss.backBtn} onPress={() => navigation.goBack()}>
          <Text style={ss.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={ss.headerTitle}>Supplier Profile</Text>
        <TouchableOpacity style={ss.moreBtn} onPress={() => Alert.alert('Options')}>
          <Text style={ss.moreIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HERO CARD */}
        <View style={ss.heroCard}>
          <View style={ss.companyLogoWrap}>
            <Text style={{ fontSize: 46 }}>{PROFILE.logo}</Text>
          </View>

          <Text style={ss.profileName}>{display.name}</Text>
          <Text style={ss.profileDesig}>{display.category}</Text>
          <Text style={ss.profileLoc}>📍 {display.location}</Text>

          <View style={ss.badgesRow}>
            <View style={[ss.badge, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
              <Text style={[ss.badgeText, { color: '#2E7D32' }]}>✓ GST Verified</Text>
            </View>
            <View style={[ss.badge, { backgroundColor: '#E3F2FD', borderColor: '#1E88E5' }]}>
              <Text style={[ss.badgeText, { color: '#1565C0' }]}>🏪 Authorised Dealer</Text>
            </View>
          </View>
        </View>

        {/* STATS */}
        <View style={ss.statsCard}>
          {[
            { value: `${PROFILE.orders}+`, label: 'Orders' },
            { value: PROFILE.deliveryRadius, label: 'Delivery' },
            { value: PROFILE.experience, label: 'Experience' },
            { value: `${PROFILE.score}`, label: 'CC Score' },
          ].map((st, i) => (
            <View key={i} style={[ss.statItem, i < 3 && ss.statBorder]}>
              <Text style={ss.statVal}>{st.value}</Text>
              <Text style={ss.statLbl}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* CC SCORE BAR */}
        <ScoreBar score={PROFILE.score} />

        {/* VERIFIED ORDERS DONE */}
        <View style={ss.verifiedCard}>
          <View style={ss.verifiedHeader}>
            <Text style={ss.verifiedHeaderTxt}>✅  Verified Orders Done  ·  Cannot be edited</Text>
          </View>
          <View style={ss.verifiedBody}>
            <View style={ss.verifiedStat}>
              <Text style={ss.verifiedAmt}>{display.verified}</Text>
              <Text style={ss.verifiedLbl}>Total Orders Value</Text>
            </View>
            <View style={ss.verifiedDivider} />
            <View style={ss.verifiedStat}>
              <Text style={ss.verifiedAmt}>{PROFILE.verifiedOrders}</Text>
              <Text style={ss.verifiedLbl}>Orders Completed</Text>
            </View>
          </View>
          <TouchableOpacity style={ss.viewHistoryBtn} onPress={() => navigation.navigate('WorkHistory')}>
            <Text style={ss.viewHistoryText}>View Full History →</Text>
          </TouchableOpacity>
        </View>

        {/* LINKS */}
        <View style={ss.linksSection}>
          <Text style={ss.sectionTitle}>Contact & Links</Text>
          <View style={ss.linksGrid}>
            {[
              { icon: '🌐', label: 'Website', color: '#E3F2FD', border: '#90CAF9' },
              { icon: '📍', label: 'Google Maps', color: '#FCE4EC', border: '#F48FB1' },
              { icon: '💬', label: 'WhatsApp\nBusiness', color: '#E8F5E9', border: '#A5D6A7' },
            ].map((l, i) => (
              <TouchableOpacity key={i} style={[ss.bigLinkBtn, { backgroundColor: l.color, borderColor: l.border }]} onPress={() => Alert.alert('Opening ' + l.label)}>
                <Text style={{ fontSize: 26, marginBottom: 4 }}>{l.icon}</Text>
                <Text style={ss.bigLinkLabel}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* HIGHLIGHTS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ss.highlightsContent}>
          {HIGHLIGHTS.map((h, i) => (
            <TouchableOpacity
              key={i}
              style={ss.highlight}
              onPress={() => {
                if (h.label === 'Reviews') {
                  navigation.navigate('ReviewsList', {
                    workerName: PROFILE.name,
                    workerEmoji: PROFILE.logo,
                    role: PROFILE.category,
                  });
                }
              }}
            >
              <View style={[ss.highlightRing, { borderColor: h.color }]}>
                <View style={ss.highlightCircle}>
                  <Text style={{ fontSize: 26 }}>{h.emoji}</Text>
                </View>
              </View>
              <Text style={ss.highlightLabel}>{h.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* TAB BAR */}
        <View style={ss.tabBar}>
          {['Price List', 'About', 'Reviews'].map(t => (
            <TouchableOpacity key={t} style={[ss.tab, activeTab === t && ss.tabActive]} onPress={() => setActiveTab(t)}>
              <Text style={[ss.tabText, activeTab === t && ss.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* MATERIALS PRICE LIST */}
        {activeTab === 'Price List' && (
          <View style={ss.priceListWrap}>
            {/* Header row */}
            <View style={ss.priceRowHead}>
              <Text style={[ss.priceColMat, { color: '#555', fontSize: 11 }]}>Material</Text>
              <Text style={[ss.priceColBrand, { color: '#555', fontSize: 11 }]}>Brand</Text>
              <Text style={[ss.priceColPrice, { color: '#555', fontSize: 11 }]}>Price</Text>
            </View>
            {MATERIALS.map((m, i) => (
              <View key={i} style={[ss.priceRow, i % 2 === 0 && { backgroundColor: '#FAFAFA' }]}>
                <View style={ss.priceColMat}>
                  <Text style={ss.matName}>{m.name}</Text>
                  <Text style={ss.matUnit}>{m.unit}</Text>
                </View>
                <Text style={ss.priceColBrand}>{m.brand}</Text>
                <Text style={ss.priceColPrice}>{m.price}</Text>
              </View>
            ))}
            <Text style={ss.priceNote}>* Prices subject to market rates. Call to confirm.</Text>
          </View>
        )}

        {activeTab === 'About' && (
          <View style={ss.aboutCard}>
            <Text style={ss.aboutText}>{PROFILE.about}</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ACTION BAR */}
      <View style={ss.bookBar}>
        <TouchableOpacity
          style={ss.markCompleteBtn}
          onPress={() => navigation.navigate('MarkWorkComplete', {
            workerName: display.name,
            workerRole: display.category,
            workerEmoji: '🏭',
            workerUid: viewUid,
          })}
        >
          <Text style={ss.markCompleteBtnText}>✅ Mark{'\n'}Complete</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <GradBtn
            label="Contact Now"
            subLabel="Send message"
            onPress={handleChat}
          />
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFA' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FAFAFA', borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 20, color: '#111', fontWeight: '700' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#111' },
  moreBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  moreIcon: { fontSize: 20, color: '#111', letterSpacing: 1 },

  heroCard: { backgroundColor: '#FFFFFF', margin: 14, borderRadius: 18, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E8E8E8', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  companyLogoWrap: { width: 90, height: 90, borderRadius: 18, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E8E8E8', marginBottom: 12 },
  profileName: { fontSize: 19, fontWeight: '900', color: '#111', marginBottom: 4, textAlign: 'center' },
  profileDesig: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 4 },
  profileLoc: { fontSize: 13, color: '#888', marginBottom: 12 },
  badgesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  statsCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E8E8E8', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statBorder: { borderRightWidth: 1, borderRightColor: '#E8E8E8' },
  statVal: { fontSize: 14, fontWeight: '900', color: '#111', marginBottom: 2 },
  statLbl: { fontSize: 10, color: '#888', fontWeight: '600' },

  scorePad: { marginHorizontal: 14, marginTop: 12, marginBottom: 4 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  scoreLabel: { fontSize: 12, fontWeight: '700', color: '#555' },
  scoreNum: { fontSize: 12, fontWeight: '800', color: '#4CAF50' },
  scoreTrack: { height: 10, backgroundColor: '#F0F0F0', borderRadius: 5, overflow: 'hidden' },

  verifiedCard: { marginHorizontal: 14, marginTop: 14, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#A5D6A7' },
  verifiedHeader: { backgroundColor: '#4CAF50', paddingVertical: 8, paddingHorizontal: 14 },
  verifiedHeaderTxt: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, textAlign: 'center' },
  verifiedBody: { backgroundColor: '#E8F5E9', flexDirection: 'row', paddingVertical: 14 },
  verifiedStat: { flex: 1, alignItems: 'center' },
  verifiedAmt: { fontSize: 17, fontWeight: '900', color: '#1B5E20' },
  verifiedLbl: { fontSize: 11, color: '#2E7D32', fontWeight: '600', marginTop: 2 },
  verifiedDivider: { width: 1, backgroundColor: '#A5D6A7' },

  linksSection: { marginHorizontal: 14, marginTop: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#111', borderLeftWidth: 3, borderLeftColor: '#C13584', paddingLeft: 8, marginBottom: 12 },
  linksGrid: { flexDirection: 'row', gap: 10 },
  bigLinkBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5 },
  bigLinkLabel: { fontSize: 11, fontWeight: '700', color: '#333', textAlign: 'center', lineHeight: 15 },

  highlightsContent: { paddingHorizontal: 14, paddingVertical: 16, gap: 14 },
  highlight: { alignItems: 'center', gap: 6 },
  highlightRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  highlightCircle: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  highlightLabel: { fontSize: 10, fontWeight: '700', color: '#444' },

  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E8E8E8', backgroundColor: '#FFFFFF', marginTop: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#C13584' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#C13584', fontWeight: '800' },

  priceListWrap: { backgroundColor: '#FFFFFF', marginHorizontal: 14, marginTop: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E8E8E8' },
  priceRowHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F5F5F5', borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  priceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  priceColMat: { flex: 2 },
  priceColBrand: { flex: 1, fontSize: 11, color: '#888', fontWeight: '600', textAlign: 'center' },
  priceColPrice: { flex: 1, fontSize: 14, fontWeight: '900', color: '#E8A900', textAlign: 'right' },
  matName: { fontSize: 12, fontWeight: '700', color: '#111', lineHeight: 16 },
  matUnit: { fontSize: 10, color: '#888', marginTop: 1 },
  priceNote: { fontSize: 10, color: '#AAA', padding: 12, fontStyle: 'italic' },

  aboutCard: { backgroundColor: '#FFFFFF', marginHorizontal: 14, marginTop: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E8E8E8' },
  aboutText: { fontSize: 13, color: '#555', lineHeight: 20 },

  gradWrap: { borderRadius: 14, overflow: 'hidden', height: 56 },
  gradBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  gradContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gradLabel: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
  gradSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600', marginTop: 2 },

  bookBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 28, paddingTop: 10, backgroundColor: '#FAFAFA', borderTopWidth: 1, borderTopColor: '#E8E8E8' },
  viewHistoryBtn: { backgroundColor: '#E8F5E9', paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#A5D6A7' },
  viewHistoryText: { fontSize: 12, fontWeight: '800', color: '#2E7D32' },
  markCompleteBtn: { width: 72, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F5E9', borderWidth: 2, borderColor: '#4CAF50' },
  markCompleteBtnText: { fontSize: 11, fontWeight: '900', color: '#2E7D32', textAlign: 'center', lineHeight: 16 },
});

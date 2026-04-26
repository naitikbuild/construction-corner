import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView,
} from 'react-native';
import BottomNav from '../components/BottomNav';

import { BLUE, BLUE_LIGHT } from '../constants/colors';

const TABS = ['Professionals', 'Workers', 'Companies', 'Materials'];

const DATA = {
  Professionals: [
    { emoji: '📐', bg: '#EFF6FF', name: 'Naitik Rathod', role: 'Civil Engineer', location: 'Ahmedabad', rating: '4.9', reviews: 127, tags: ['RCC Design', 'AutoCAD'] },
    { emoji: '🎨', bg: '#FDF4FF', name: 'Priya Desai', role: 'Interior Designer', location: 'Surat', rating: '4.8', reviews: 89, tags: ['Residential', '3D Renders'] },
    { emoji: '⚡', bg: '#FEFCE8', name: 'Amit Patel', role: 'Electrical Engineer', location: 'Vadodara', rating: '4.7', reviews: 63, tags: ['HT/LT', 'Solar'] },
  ],
  Workers: [
    { emoji: '🔧', bg: '#EFF6FF', name: 'Ramesh Kumar', role: 'Plumber', location: 'Bopal, Ahmedabad', rating: '4.6', reviews: 45, tags: ['Residential', 'CPVC'] },
    { emoji: '🏗️', bg: '#F0FDF4', name: 'Suresh Bhai', role: 'Mason / Mistri', location: 'Maninagar', rating: '4.8', reviews: 92, tags: ['Brickwork', 'Plaster'] },
    { emoji: '⚡', bg: '#FEFCE8', name: 'Dinesh Electrician', role: 'Electrician', location: 'Gota, Ahmedabad', rating: '4.5', reviews: 38, tags: ['Wiring', 'Switches'] },
  ],
  Companies: [
    { emoji: '🏢', bg: '#EFF6FF', name: 'Shapoorji Pallonji', role: 'EPC Contractor', location: 'Pan India', rating: '4.9', reviews: 500, tags: ['Civil', 'Turnkey'] },
    { emoji: '🏗️', bg: '#F0FDF4', name: 'L&T Construction', role: 'Infrastructure', location: 'Gujarat', rating: '5.0', reviews: 1200, tags: ['Roads', 'Bridges'] },
    { emoji: '🏛️', bg: '#FDF4FF', name: 'Studio 7 Architects', role: 'Architecture Firm', location: 'Ahmedabad', rating: '4.7', reviews: 78, tags: ['Residential', 'Commercial'] },
  ],
  Materials: [
    { emoji: '🏗️', bg: '#FFF7ED', name: 'UltraTech Cement', role: 'OPC 53 Grade', location: 'Gujarat BMC', rating: '4.8', reviews: 312, tags: ['₹345/bag', 'In Stock'], price: '₹345/bag' },
    { emoji: '⚙️', bg: '#F1F5F9', name: 'Tata Tiscon TMT', role: 'Fe-500D Steel', location: 'Gujarat BMC', rating: '4.7', reviews: 198, tags: ['₹58/kg', 'In Stock'], price: '₹58/kg' },
    { emoji: '🟫', bg: '#FFFBEB', name: 'Kajaria Vitrified', role: '800×800 GVT Tiles', location: 'Morbi Tiles Hub', rating: '4.9', reviews: 224, tags: ['₹85/sqft', 'In Stock'], price: '₹85/sqft' },
  ],
};

export default function BookmarksScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Professionals');
  const items = DATA[activeTab] || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <SafeAreaView style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{items.length}</Text>
          </View>
        </View>

        {/* Tab bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔖</Text>
            <Text style={styles.emptyTitle}>Nothing saved yet</Text>
            <Text style={styles.emptySub}>Tap the bookmark icon on any profile to save it here</Text>
          </View>
        ) : (
          items.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.card}
              onPress={() => {
                if (activeTab === 'Materials') navigation.navigate('MaterialMarketplace');
                else if (activeTab === 'Companies') navigation.navigate('BusinessProfile');
                else navigation.navigate('Profile');
              }}
            >
              <View style={[styles.cardAvatar, { backgroundColor: item.bg }]}>
                <Text style={styles.cardAvatarEmoji}>{item.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardRole}>{item.role}</Text>
                <Text style={styles.cardLocation}>📍 {item.location}</Text>
                <View style={styles.cardTags}>
                  {item.tags.map(tag => (
                    <View key={tag} style={styles.cardTag}>
                      <Text style={styles.cardTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.cardRight}>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingVal}>⭐ {item.rating}</Text>
                </View>
                <Text style={styles.reviewsText}>{item.reviews} reviews</Text>
                {activeTab === 'Materials' && (
                  <TouchableOpacity
                    style={styles.orderBtn}
                    onPress={() => navigation.navigate('Order', { material: { name: item.name, price: parseInt(item.price?.replace(/[₹,/\w]/g, '')) || 345, unit: 'bag', emoji: item.emoji, supplier: item.location, minOrder: 10, gst: 28, grade: item.role } })}
                  >
                    <Text style={styles.orderBtnText}>Order</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.bookmarkIcon}>
                  <Text style={{ fontSize: 18 }}>🔖</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNav navigation={navigation} active="MyDashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F0ED' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 18, color: '#333' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#111', flex: 1 },
  countBadge: { backgroundColor: BLUE_LIGHT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  countBadgeText: { fontSize: 13, fontWeight: '800', color: BLUE },
  tabsRow: { paddingHorizontal: 16, paddingBottom: 2, gap: 4, flexDirection: 'row' },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: BLUE },
  tabText: { fontSize: 13, fontWeight: '700', color: '#6B6560' },
  tabTextActive: { color: BLUE, fontWeight: '900' },
  scroll: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#111', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B6560', textAlign: 'center', lineHeight: 22 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 14, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: '#EAEAEA', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  cardAvatar: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardAvatarEmoji: { fontSize: 28 },
  cardName: { fontSize: 14, fontWeight: '900', color: '#111', marginBottom: 2 },
  cardRole: { fontSize: 12, fontWeight: '600', color: BLUE, marginBottom: 2 },
  cardLocation: { fontSize: 11, color: '#6B6560', marginBottom: 8 },
  cardTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  cardTag: { backgroundColor: BLUE_LIGHT, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  cardTagText: { fontSize: 10, fontWeight: '700', color: BLUE },
  cardRight: { alignItems: 'flex-end', gap: 4, justifyContent: 'flex-start' },
  ratingRow: { backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ratingVal: { fontSize: 12, fontWeight: '800', color: '#854D0E' },
  reviewsText: { fontSize: 10, color: '#aaa' },
  orderBtn: { backgroundColor: BLUE, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginTop: 4 },
  orderBtnText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  bookmarkIcon: { marginTop: 4 },
});

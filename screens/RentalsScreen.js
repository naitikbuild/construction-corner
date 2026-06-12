import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, TextInput,
} from 'react-native';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🏗️' },
  { id: 'earthmoving', label: 'Earthmoving', emoji: '🚜' },
  { id: 'lifting', label: 'Lifting', emoji: '🏗️' },
  { id: 'transport', label: 'Transport', emoji: '🚛' },
  { id: 'formwork', label: 'Formwork', emoji: '🪵' },
  { id: 'power', label: 'Power', emoji: '⚡' },
];

const RENTALS = [
  {
    id: 1, category: 'earthmoving',
    emoji: '🚜', bg: '#FFF7ED',
    name: 'JCB 3DX Backhoe Loader',
    owner: 'Patel Machinery Rentals',
    location: 'Vatva, Ahmedabad',
    rating: '4.8', reviews: 124,
    daily: '₹8,500/day', weekly: '₹52,000/wk',
    tags: ['Operator Included', 'Fuel Extra'],
    available: true,
  },
  {
    id: 2, category: 'earthmoving',
    emoji: '🚜', bg: '#FFF7ED',
    name: 'Excavator PC200',
    owner: 'Shah Equipment Co.',
    location: 'Narol, Ahmedabad',
    rating: '4.7', reviews: 89,
    daily: '₹12,000/day', weekly: '₹72,000/wk',
    tags: ['Operator Included', 'GPS Tracked'],
    available: true,
  },
  {
    id: 3, category: 'lifting',
    emoji: '🏗️', bg: '#EFF6FF',
    name: 'Tower Crane 50T',
    owner: 'Gujarat Crane Services',
    location: 'Gandhinagar',
    rating: '4.9', reviews: 56,
    daily: '₹25,000/day', weekly: '₹1,50,000/wk',
    tags: ['Operator Included', 'Erection Extra'],
    available: true,
  },
  {
    id: 4, category: 'lifting',
    emoji: '🦺', bg: '#EFF6FF',
    name: 'Boom Lift 20m',
    owner: 'Mehta Lifts Pvt Ltd',
    location: 'Sarkhej, Ahmedabad',
    rating: '4.6', reviews: 73,
    daily: '₹6,500/day', weekly: '₹38,000/wk',
    tags: ['Operator Included', 'Safety Harness'],
    available: false,
  },
  {
    id: 5, category: 'transport',
    emoji: '🚛', bg: '#F0FDF4',
    name: 'Tipper Truck 10 Tonne',
    owner: 'Rajesh Transport',
    location: 'Odhav, Ahmedabad',
    rating: '4.5', reviews: 211,
    daily: '₹4,500/day', weekly: '₹26,000/wk',
    tags: ['Driver Included', 'Fuel Extra'],
    available: true,
  },
  {
    id: 6, category: 'transport',
    emoji: '🚗', bg: '#F0FDF4',
    name: 'Transit Mixer 6 CUM',
    owner: 'Concrete Solutions',
    location: 'Naroda, Ahmedabad',
    rating: '4.7', reviews: 98,
    daily: '₹7,000/day', weekly: '₹42,000/wk',
    tags: ['Driver Included', 'Cleaning Extra'],
    available: true,
  },
  {
    id: 7, category: 'formwork',
    emoji: '🪵', bg: '#FFFBEB',
    name: 'Shuttering Plates Set',
    owner: 'Modi Formwork Rentals',
    location: 'Bavla, Ahmedabad',
    rating: '4.4', reviews: 167,
    daily: '₹12/sqft/day', weekly: '₹70/sqft/wk',
    tags: ['Delivery Available', 'Min 500 sqft'],
    available: true,
  },
  {
    id: 8, category: 'formwork',
    emoji: '🔩', bg: '#FFFBEB',
    name: 'Acrow Props (Steel)',
    owner: 'Kiran Construction Supplies',
    location: 'Bopal, Ahmedabad',
    rating: '4.6', reviews: 143,
    daily: '₹15/prop/day', weekly: '₹85/prop/wk',
    tags: ['Min 50 Props', 'Delivery Available'],
    available: true,
  },
  {
    id: 9, category: 'power',
    emoji: '⚡', bg: '#FEFCE8',
    name: 'Generator 125 KVA',
    owner: 'Power Solutions Ahmedabad',
    location: 'Sanand, Ahmedabad',
    rating: '4.8', reviews: 88,
    daily: '₹3,500/day', weekly: '₹20,000/wk',
    tags: ['Fuel Extra', '24hr Support'],
    available: true,
  },
  {
    id: 10, category: 'power',
    emoji: '💧', bg: '#FEFCE8',
    name: 'Dewatering Pump 4"',
    owner: 'Aqua Pump Rentals',
    location: 'Kathwada, Ahmedabad',
    rating: '4.5', reviews: 62,
    daily: '₹1,200/day', weekly: '₹7,000/wk',
    tags: ['Pipe Fittings Included'],
    available: true,
  },
];

export default function RentalsScreen({ navigation, route }) {
  const initialCategory = route?.params?.category || 'all';
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = RENTALS.filter(r => {
    const matchCat = activeCategory === 'all' || r.category === activeCategory;
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.owner.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Equipment Rentals</Text>
            <Text style={styles.headerSub}>{RENTALS.length} listings available</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Text style={{ fontSize: 15, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search equipment, owner..."
            placeholderTextColor="#AAA"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.catChip, activeCategory === c.id && styles.catChipActive]}
              onPress={() => setActiveCategory(c.id)}
            >
              <Text style={styles.catEmoji}>{c.emoji}</Text>
              <Text style={[styles.catLabel, activeCategory === c.id && styles.catLabelActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.listPad}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🚧</Text>
              <Text style={styles.emptyText}>No rentals found</Text>
            </View>
          ) : (
            filtered.map(item => (
              <TouchableOpacity key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.cardThumb, { backgroundColor: item.bg }]}>
                    <Text style={{ fontSize: 36 }}>{item.emoji}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                      <View style={[styles.availBadge, !item.available && styles.unavailBadge]}>
                        <Text style={[styles.availText, !item.available && styles.unavailText]}>
                          {item.available ? 'Available' : 'Booked'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardOwner}>{item.owner}</Text>
                    <Text style={styles.cardLocation}>📍 {item.location} · ⭐ {item.rating} ({item.reviews})</Text>
                  </View>
                </View>

                <View style={styles.tagsRow}>
                  {item.tags.map((t, ti) => (
                    <View key={ti} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.rateLabel}>Daily Rate</Text>
                    <Text style={styles.rateValue}>{item.daily}</Text>
                    <Text style={styles.rateWeekly}>{item.weekly}</Text>
                  </View>
                  <TouchableOpacity style={[styles.inquireBtn, !item.available && styles.inquireBtnDisabled]}>
                    <Text style={styles.inquireBtnText}>
                      {item.available ? 'Get Quote' : 'Notify Me'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F0ED' },

  header: { backgroundColor: '#fff', borderBottomWidth: 2, borderBottomColor: '#D9D4CC', paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F2F0ED', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#111' },
  headerSub: { fontSize: 11, color: '#6B6560', fontWeight: '600', marginTop: 1 },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5EFE8', borderRadius: 12, marginHorizontal: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5, borderColor: '#E8E0D8', marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 13, color: '#111', fontWeight: '600' },

  catScroll: { paddingLeft: 16 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F2F0ED', marginRight: 8, borderWidth: 1, borderColor: '#D9D4CC' },
  catChipActive: { backgroundColor: '#FF6B2B', borderColor: '#FF6B2B' },
  catEmoji: { fontSize: 13 },
  catLabel: { fontSize: 12, fontWeight: '600', color: '#6B6560' },
  catLabelActive: { color: '#fff' },

  scroll: { flex: 1 },
  listPad: { padding: 14, gap: 12 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#D9D4CC', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  cardThumb: { width: 72, height: 72, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 },
  cardName: { flex: 1, fontSize: 14, fontWeight: '800', color: '#111', lineHeight: 18 },
  availBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  unavailBadge: { backgroundColor: '#FEE2E2' },
  availText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  unavailText: { color: '#DC2626' },
  cardOwner: { fontSize: 12, fontWeight: '600', color: '#FF6B2B', marginBottom: 3 },
  cardLocation: { fontSize: 11, color: '#999' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: { backgroundColor: '#F2F0ED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#D9D4CC' },
  tagText: { fontSize: 10, fontWeight: '600', color: '#6B6560' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F2F0ED', paddingTop: 12 },
  rateLabel: { fontSize: 10, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },
  rateValue: { fontSize: 16, fontWeight: '900', color: '#111' },
  rateWeekly: { fontSize: 11, color: '#6B6560', fontWeight: '600' },
  inquireBtn: { backgroundColor: '#FF6B2B', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  inquireBtnDisabled: { backgroundColor: '#D9D4CC' },
  inquireBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, fontWeight: '700', color: '#6B6560' },
});

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, TextInput,
} from 'react-native';


import { BLUE, BLUE_LIGHT, BLUE_MID } from '../constants/colors';

const BG = '#fff';
const CARD       = '#F2F0ED';
const BORDER     = '#D9D4CC';

const CATEGORIES = [
  { id: 'all',   label: 'All',    emoji: '🏗️' },
  { id: 'cement',label: 'Cement', emoji: '🏗️' },
  { id: 'steel', label: 'Steel',  emoji: '⚙️' },
  { id: 'tiles', label: 'Tiles',  emoji: '🟫' },
  { id: 'wood',  label: 'Wood',   emoji: '🪵' },
  { id: 'paint', label: 'Paint',  emoji: '🎨' },
];

const SUPPLIERS = [
  {
    id: 1, category: 'cement',
    emoji: '🏗️', bg: '#FFF7ED',
    name: 'Shree Cement Wholesale',
    location: 'Narol, Ahmedabad',
    rating: '4.8', reviews: 312,
    price: '₹340/bag', unit: '50kg bag',
    tags: ['Shree Ultra', 'ACC Gold', 'Ambuja'],
    verified: true, inStock: true,
    minOrder: '100 bags',
  },
  {
    id: 2, category: 'cement',
    emoji: '🏗️', bg: '#FFF7ED',
    name: 'UltraTech Cement Depot',
    location: 'Vatva GIDC, Ahmedabad',
    rating: '4.9', reviews: 428,
    price: '₹355/bag', unit: '50kg bag',
    tags: ['UltraTech', 'Bulk Orders', 'Delivery'],
    verified: true, inStock: true,
    minOrder: '50 bags',
  },
  {
    id: 3, category: 'steel',
    emoji: '⚙️', bg: '#F1F5F9',
    name: 'Gujarat TMT Steel Bars',
    location: 'Vatva GIDC, Ahmedabad',
    rating: '4.7', reviews: 194,
    price: '₹58/kg', unit: 'per kg',
    tags: ['Fe-500D', 'Fe-550', 'BIS Certified'],
    verified: true, inStock: true,
    minOrder: '1 Tonne',
  },
  {
    id: 4, category: 'steel',
    emoji: '⚙️', bg: '#F1F5F9',
    name: 'Tata Tiscon Dealer',
    location: 'Odhav, Ahmedabad',
    rating: '4.9', reviews: 267,
    price: '₹61/kg', unit: 'per kg',
    tags: ['Tata Tiscon', 'Super Ductile', 'ISI Mark'],
    verified: true, inStock: true,
    minOrder: '500 kg',
  },
  {
    id: 5, category: 'tiles',
    emoji: '🟫', bg: '#FFFBEB',
    name: 'Morbi Tiles Hub',
    location: 'Morbi, Gujarat',
    rating: '4.9', reviews: 541,
    price: '₹45/sqft', unit: 'per sqft',
    tags: ['Vitrified', 'Ceramic', 'GVT'],
    verified: true, inStock: true,
    minOrder: '200 sqft',
  },
  {
    id: 6, category: 'tiles',
    emoji: '🟫', bg: '#FFFBEB',
    name: 'Kajaria Tiles Showroom',
    location: 'CG Road, Ahmedabad',
    rating: '4.8', reviews: 389,
    price: '₹55/sqft', unit: 'per sqft',
    tags: ['Kajaria', 'Polished', 'Matt Finish'],
    verified: true, inStock: true,
    minOrder: '100 sqft',
  },
  {
    id: 7, category: 'wood',
    emoji: '🪵', bg: '#FFF7ED',
    name: 'Agarwal Timber & Ply',
    location: 'Kalupur, Ahmedabad',
    rating: '4.6', reviews: 178,
    price: '₹90/sqft', unit: 'per sqft',
    tags: ['Teak', 'Plywood', 'MDF', 'Laminate'],
    verified: true, inStock: true,
    minOrder: '50 sqft',
  },
  {
    id: 8, category: 'wood',
    emoji: '🪵', bg: '#FFF7ED',
    name: 'Century Ply Dealer',
    location: 'Navrangpura, Ahmedabad',
    rating: '4.7', reviews: 223,
    price: '₹105/sqft', unit: 'per sqft',
    tags: ['BWR Grade', 'Fire Retardant', 'Borer Proof'],
    verified: true, inStock: true,
    minOrder: '20 sheets',
  },
  {
    id: 9, category: 'paint',
    emoji: '🎨', bg: '#FDF4FF',
    name: 'Asian Paints Dealer',
    location: 'Navrangpura, Ahmedabad',
    rating: '4.8', reviews: 302,
    price: '₹280/ltr', unit: 'per litre',
    tags: ['Royale', 'Apex', 'Emulsion', 'Primer'],
    verified: true, inStock: true,
    minOrder: '10 litres',
  },
  {
    id: 10, category: 'paint',
    emoji: '🎨', bg: '#FDF4FF',
    name: 'Berger Paints Outlet',
    location: 'Satellite, Ahmedabad',
    rating: '4.7', reviews: 218,
    price: '₹265/ltr', unit: 'per litre',
    tags: ['WeatherCoat', 'Luxol', 'WallFashion'],
    verified: true, inStock: true,
    minOrder: '10 litres',
  },
];

const STATS = [
  { val: '500+', label: 'Suppliers' },
  { val: '50+', label: 'Brands' },
  { val: '4.8★', label: 'Avg Rating' },
];

export default function MaterialMarketplaceScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = activeCategory === 'all'
    ? SUPPLIERS
    : SUPPLIERS.filter(s => s.category === activeCategory);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Material Marketplace</Text>
        </View>
        <TouchableOpacity style={styles.filterIconBtn}>
          <Text style={styles.filterIconText}>⊟</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search cement, steel, tiles..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* HERO */}
      <View style={styles.heroBanner}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroTag}>VERIFIED SUPPLIERS</Text>
          <Text style={styles.heroTitle}>Best Prices on{'\n'}Construction Materials</Text>
        </View>
        <Text style={styles.heroEmoji}>🏭</Text>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        {STATS.map((s, i) => (
          <React.Fragment key={i}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
            {i < STATS.length - 1 && <View style={styles.statDiv} />}
          </React.Fragment>
        ))}
      </View>

      {/* CATEGORY TABS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catScrollContent}
      >
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[styles.catChip, activeCategory === c.id && styles.catChipActive]}
            onPress={() => setActiveCategory(c.id)}
          >
            <Text style={styles.catChipEmoji}>{c.emoji}</Text>
            <Text style={[styles.catChipText, activeCategory === c.id && styles.catChipTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* SUPPLIER LIST */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <Text style={styles.resultCount}>{filtered.length} suppliers found</Text>

        {filtered.map(s => (
          <TouchableOpacity key={s.id} style={styles.card} activeOpacity={0.75} onPress={() => navigation.navigate('CategoryList', { category: CATEGORIES.find(c => c.id === s.category)?.label || 'Suppliers', profileType: 'supplier' })}>
            {/* TOP ROW */}
            <View style={styles.cardTop}>
              <View style={[styles.thumb, { backgroundColor: s.bg }]}>
                <Text style={styles.thumbEmoji}>{s.emoji}</Text>
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.supplierName}>{s.name}</Text>
                  {s.verified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.location}>📍 {s.location}</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingText}>⭐ {s.rating}</Text>
                  <Text style={styles.reviewText}>({s.reviews} reviews)</Text>
                  {s.inStock && (
                    <View style={styles.inStockBadge}>
                      <Text style={styles.inStockText}>In Stock</Text>
                    </View>
                  )}
                </View>
              </View>
              {/* Price box */}
              <View style={styles.priceBox}>
                <Text style={styles.priceVal}>{s.price}</Text>
                <Text style={styles.priceUnit}>{s.unit}</Text>
              </View>
            </View>

            {/* TAGS */}
            <View style={styles.tagsRow}>
              {s.tags.map((t, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
              <View style={styles.minOrderTag}>
                <Text style={styles.minOrderText}>Min: {s.minOrder}</Text>
              </View>
            </View>

            {/* FOOTER */}
            <View style={styles.cardFooter}>
              <TouchableOpacity style={styles.quoteBtn} onPress={() => navigation.navigate('Order', { material: { name: s.name, price: parseInt(s.price.replace(/[₹,]/g, '')), unit: s.unit.replace('per ', ''), emoji: s.emoji, supplier: s.name, minOrder: 10, gst: 18, grade: s.tags[0] } })}>
                <Text style={styles.quoteBtnText}>Get Quote →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.callBtn}>
                <Text style={styles.callBtnText}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={() => navigation.navigate('Bookmarks')}>
                <Text style={styles.saveBtnText}>🔖</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // HEADER
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12,
    backgroundColor: BG, borderBottomWidth: 1, borderBottomColor: BORDER,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: BLUE_LIGHT, alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: BLUE, fontWeight: '900' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#1A1A2E' },
  filterIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: CARD, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  filterIconText: { fontSize: 17, color: '#64748B' },

  // SEARCH
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: BG },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: CARD, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: BORDER,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A2E', fontWeight: '500' },

  // HERO
  heroBanner: {
    marginHorizontal: 16, marginBottom: 12, borderRadius: 18,
    backgroundColor: BLUE, padding: 18,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', overflow: 'hidden', minHeight: 90,
  },
  heroLeft: { flex: 1, gap: 4 },
  heroTag: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.65)', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { fontSize: 17, fontWeight: '900', color: '#fff', lineHeight: 24 },
  heroEmoji: { fontSize: 46, zIndex: 1 },
  heroCircle1: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)', top: -40, right: 50 },
  heroCircle2: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.1)', bottom: -25, right: 10 },

  // STATS
  statsRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: BLUE_LIGHT, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: BLUE_MID,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statVal: { fontSize: 15, fontWeight: '900', color: BLUE },
  statLabel: { fontSize: 9, color: '#64748B', fontWeight: '600', textTransform: 'uppercase' },
  statDiv: { width: 1, backgroundColor: BLUE_MID, marginVertical: 4 },

  // CATEGORY CHIPS
  catScroll: { maxHeight: 52 },
  catScrollContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 6 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99,
    backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER,
  },
  catChipActive: { backgroundColor: BLUE_LIGHT, borderColor: BLUE },
  catChipEmoji: { fontSize: 14 },
  catChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  catChipTextActive: { color: BLUE },

  // LIST
  list: { paddingHorizontal: 16, paddingTop: 12 },
  resultCount: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 10 },

  // CARD
  card: {
    backgroundColor: BG, borderRadius: 18,
    borderWidth: 1.5, borderColor: BORDER,
    padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  thumb: {
    width: 58, height: 58, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  thumbEmoji: { fontSize: 30 },
  cardInfo: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  supplierName: { fontSize: 14, fontWeight: '900', color: '#1A1A2E', flex: 1 },
  verifiedBadge: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center',
  },
  verifiedText: { fontSize: 9, color: '#fff', fontWeight: '900' },
  location: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#1A1A2E' },
  reviewText: { fontSize: 10, color: '#94A3B8' },
  inStockBadge: {
    backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1, borderColor: '#86EFAC',
  },
  inStockText: { fontSize: 9, color: '#16A34A', fontWeight: '800' },
  priceBox: {
    alignItems: 'flex-end', justifyContent: 'center', gap: 2,
  },
  priceVal: { fontSize: 16, fontWeight: '900', color: BLUE },
  priceUnit: { fontSize: 9, color: '#94A3B8', fontWeight: '600' },

  // TAGS
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: {
    backgroundColor: BLUE_LIGHT, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 99, borderWidth: 1, borderColor: BLUE_MID,
  },
  tagText: { fontSize: 10, color: BLUE, fontWeight: '700' },
  minOrderTag: {
    backgroundColor: '#FEF9C3', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 99, borderWidth: 1, borderColor: '#FDE047',
  },
  minOrderText: { fontSize: 10, color: '#A16207', fontWeight: '700' },

  // FOOTER
  cardFooter: {
    flexDirection: 'row', gap: 8,
    borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12,
  },
  quoteBtn: {
    flex: 1, backgroundColor: BLUE, paddingVertical: 10,
    borderRadius: 12, alignItems: 'center',
    shadowColor: BLUE, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  quoteBtnText: { fontSize: 13, fontWeight: '900', color: '#fff' },
  callBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: CARD,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  callBtnText: { fontSize: 18 },
  saveBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: CARD,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  saveBtnText: { fontSize: 18 },
});

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

import { BLUE, BLUE_LIGHT, BLUE_MID } from '../constants/colors';

const BG = '#fff';
const CARD       = '#F2F0ED';
const BORDER     = '#D9D4CC';

const CATEGORIES = [
  {
    emoji: '🏛️',
    name: 'Architect',
    count: '140+',
    desc: 'Residential & commercial design',
    color: '#6366F1',
    bg: '#EEF2FF',
  },
  {
    emoji: '📐',
    name: 'Civil Engineer',
    count: '210+',
    desc: 'Structural & site engineering',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    emoji: '🛋️',
    name: 'Interior Designer',
    count: '95+',
    desc: 'Space planning & interiors',
    color: '#DB2777',
    bg: '#FDF2F8',
  },
  {
    emoji: '🏗️',
    name: 'Structural Engineer',
    count: '120+',
    desc: 'RCC, steel & foundation design',
    color: '#059669',
    bg: '#F0FDF4',
  },
  {
    emoji: '👷',
    name: 'Site Supervisor',
    count: '180+',
    desc: 'On-site project supervision',
    color: '#D97706',
    bg: '#FFFBEB',
  },
  {
    emoji: '📋',
    name: 'Project Manager',
    count: '75+',
    desc: 'End-to-end project delivery',
    color: '#0891B2',
    bg: '#F0F9FF',
  },
  {
    emoji: '💰',
    name: 'Cost Estimator',
    count: '60+',
    desc: 'BOQ, tendering & estimation',
    color: '#16A34A',
    bg: '#F0FDF4',
  },
  {
    emoji: '🌿',
    name: 'Landscape Architect',
    count: '45+',
    desc: 'Gardens, parks & outdoor spaces',
    color: '#65A30D',
    bg: '#F7FEE7',
  },
  {
    emoji: '',
    name: 'Vastu Consultant',
    count: '55+',
    desc: 'Traditional Vastu planning',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    emoji: '🔍',
    name: 'Quantity Surveyor',
    count: '40+',
    desc: 'Material & cost measurement',
    color: '#EA580C',
    bg: '#FFF7ED',
  },
];

const STATS = [
  { val: '1000+', label: 'Professionals' },
  { val: '28+', label: 'Categories' },
  { val: '4.8★', label: 'Avg Rating' },
];

const CARD_W = (width - 48) / 2;

export default function ProfessionalCategoryScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Professionals</Text>
        </View>
        <TouchableOpacity style={styles.searchBtn}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HERO BANNER */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTag}>VERIFIED EXPERTS</Text>
            <Text style={styles.heroTitle}>Find the Right{'\n'}Professional</Text>
            <Text style={styles.heroSub}>Ahmedabad & Gujarat</Text>
          </View>
          <Text style={styles.heroEmoji}>🏗️</Text>

          {/* Decorative circles */}
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
        </View>

        {/* STATS ROW */}
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

        {/* CATEGORY GRID */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <Text style={styles.sectionCount}>{CATEGORIES.length} categories</Text>
        </View>

        <View style={styles.grid}>
          {CATEGORIES.map((cat, i) => (
            <TouchableOpacity
              key={i}
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('ProfessionalList', { category: cat.name })}
            >
              {/* Icon box */}
              <View style={[styles.iconBox, { backgroundColor: cat.bg }]}>
                <Text style={styles.iconEmoji}>{cat.emoji}</Text>
              </View>

              {/* Name + desc */}
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.catDesc} numberOfLines={2}>{cat.desc}</Text>

              {/* Count badge */}
              <View style={styles.countRow}>
                <View style={[styles.countBadge, { backgroundColor: cat.bg, borderColor: cat.color + '44' }]}>
                  <Text style={[styles.countText, { color: cat.color }]}>{cat.count} pros</Text>
                </View>
                <Text style={[styles.arrowText, { color: cat.color }]}>→</Text>
              </View>

              {/* Bottom accent bar */}
              <View style={[styles.accentBar, { backgroundColor: cat.color }]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* POST A REQUIREMENT CTA */}
        <TouchableOpacity style={styles.ctaBanner}>
          <View style={styles.ctaLeft}>
            <Text style={styles.ctaTitle}>Can't find what you need?</Text>
            <Text style={styles.ctaSub}>Post a requirement and get quotes from verified professionals</Text>
          </View>
          <View style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>Post{'\n'}Free</Text>
          </View>
        </TouchableOpacity>

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
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A2E' },
  searchBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: CARD, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  searchIcon: { fontSize: 16 },

  // HERO
  heroBanner: {
    margin: 16, borderRadius: 20, backgroundColor: BLUE,
    padding: 20, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', overflow: 'hidden', minHeight: 110,
  },
  heroLeft: { flex: 1, gap: 4 },
  heroTag: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.65)', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#fff', lineHeight: 26 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  heroEmoji: { fontSize: 52, zIndex: 1 },
  heroCircle1: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.08)', top: -40, right: 40,
  },
  heroCircle2: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)', bottom: -30, right: 10,
  },

  // STATS
  statsRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 20,
    backgroundColor: BLUE_LIGHT, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: BLUE_MID,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { fontSize: 16, fontWeight: '900', color: BLUE },
  statLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', textTransform: 'uppercase' },
  statDiv: { width: 1, backgroundColor: BLUE_MID, marginVertical: 4 },

  // SECTION HEADER
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1A1A2E' },
  sectionCount: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },

  // GRID
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 12, marginBottom: 16,
  },
  card: {
    width: CARD_W, backgroundColor: BG,
    borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: BORDER,
    gap: 6, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  iconBox: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  iconEmoji: { fontSize: 28 },
  catName: { fontSize: 14, fontWeight: '900', color: '#1A1A2E' },
  catDesc: { fontSize: 11, color: '#94A3B8', lineHeight: 16, fontWeight: '500' },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  countBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 99, borderWidth: 1,
  },
  countText: { fontSize: 10, fontWeight: '800' },
  arrowText: { fontSize: 14, fontWeight: '900' },
  accentBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },

  // CTA BANNER
  ctaBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, backgroundColor: CARD,
    borderRadius: 18, padding: 16, gap: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  ctaLeft: { flex: 1, gap: 4 },
  ctaTitle: { fontSize: 14, fontWeight: '900', color: '#1A1A2E' },
  ctaSub: { fontSize: 11, color: '#64748B', lineHeight: 16 },
  ctaBtn: {
    backgroundColor: BLUE, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center',
  },
  ctaBtnText: { fontSize: 12, fontWeight: '900', color: '#fff', textAlign: 'center' },
});

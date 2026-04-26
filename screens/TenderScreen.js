import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Modal, TextInput,
} from 'react-native';
import BottomNav from '../components/BottomNav';

import { BLUE, BLUE_LIGHT } from '../constants/colors';

const CATEGORIES = ['All', 'Civil', 'Electrical', 'Interior', 'Plumbing', 'HVAC', 'Landscape'];

const TENDERS = [
  {
    id: 1, cat: 'Civil',
    title: 'G+7 Residential Tower Construction',
    company: 'Mehta Developers Pvt. Ltd.',
    location: 'Bopal, Ahmedabad',
    budget: '₹4.5 Crore',
    deadline: '25 Apr 2026',
    posted: '2 days ago',
    scope: 'Complete civil construction for G+7 residential tower including foundation, structural work, plastering, and finishing. Area: 18,000 sq.ft. Timeline: 18 months.',
    tags: ['RCC', 'Structural', 'Finishing'],
    bids: 12,
    status: 'Open',
  },
  {
    id: 2, cat: 'Electrical',
    title: 'Industrial Electrical Wiring – Factory',
    company: 'Gujarat Precision Parts',
    location: 'Vatva GIDC, Ahmedabad',
    budget: '₹32 Lakh',
    deadline: '10 May 2026',
    posted: '5 days ago',
    scope: 'Complete electrical wiring and panel installation for 12,000 sq.ft manufacturing unit. HT/LT panels, DG backup, fire-rated cabling, earthing system.',
    tags: ['HT/LT Panel', 'Industrial', 'DG'],
    bids: 7,
    status: 'Open',
  },
  {
    id: 3, cat: 'Interior',
    title: 'Corporate Office Interior Design & Build',
    company: 'Zydus Healthcare Ltd.',
    location: 'SG Highway, Ahmedabad',
    budget: '₹1.2 Crore',
    deadline: '30 Apr 2026',
    posted: '1 day ago',
    scope: 'Turnkey interior fit-out for 8,000 sq.ft corporate office. Includes false ceiling, modular workstations, cabins, flooring, lighting design, and AV integration.',
    tags: ['Turnkey', 'Modular', 'Lighting'],
    bids: 18,
    status: 'Open',
  },
  {
    id: 4, cat: 'Civil',
    title: 'Road & Drainage Work – Township',
    company: 'Savvy Infrastructure',
    location: 'Shela, Ahmedabad',
    budget: '₹78 Lakh',
    deadline: '15 May 2026',
    posted: '3 days ago',
    scope: 'Internal road construction (CC/BM), storm water drainage, street lighting, and landscaping for 150-plot township. Length: 2.8 km.',
    tags: ['Road', 'Drainage', 'Township'],
    bids: 5,
    status: 'Open',
  },
  {
    id: 5, cat: 'Plumbing',
    title: 'PHE Works – Commercial Complex',
    company: 'Adani Realty',
    location: 'Shantigram, Ahmedabad',
    budget: '₹55 Lakh',
    deadline: '5 May 2026',
    posted: '1 week ago',
    scope: 'Complete plumbing and sanitation works for B+G+14 commercial complex. Water supply, drainage, fire hydrant, STP connection, and solar water heating system.',
    tags: ['PHE', 'Fire Hydrant', 'STP'],
    bids: 9,
    status: 'Open',
  },
  {
    id: 6, cat: 'HVAC',
    title: 'Central AC System – Hospital',
    company: 'Sterling Hospitals',
    location: 'Memnagar, Ahmedabad',
    budget: '₹2.8 Crore',
    deadline: '20 May 2026',
    posted: '4 days ago',
    scope: 'Design, supply, and installation of central HVAC system for 250-bed hospital. Includes chillers, AHUs, FCUs, BMS integration, and HEPA filtration for OTs.',
    tags: ['Chiller', 'BMS', 'HEPA'],
    bids: 4,
    status: 'Open',
  },
];

const CAT_COLORS = {
  Civil: { bg: '#BAE6FD', text: '#0369A1' },
  Electrical: { bg: '#FEF9C3', text: '#854D0E' },
  Interior: { bg: '#FDF4FF', text: '#7E22CE' },
  Plumbing: { bg: '#DCFCE7', text: '#15803D' },
  HVAC: { bg: '#FFE4E6', text: '#BE123C' },
  Landscape: { bg: '#D1FAE5', text: '#065F46' },
};

export default function TenderScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [detailTender, setDetailTender] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidSubmitted, setBidSubmitted] = useState(false);

  const filtered = activeCategory === 'All'
    ? TENDERS
    : TENDERS.filter(t => t.cat === activeCategory);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Tenders & Bids</Text>
            <Text style={styles.headerSub}>{filtered.length} open tenders</Text>
          </View>
          <TouchableOpacity style={styles.filterIconBtn}>
            <Text style={{ fontSize: 18 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catChipText, activeCategory === cat && styles.catChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {filtered.map(tender => {
          const catStyle = CAT_COLORS[tender.cat] || { bg: '#F5F5F5', text: '#555' };
          return (
            <View key={tender.id} style={styles.card}>
              {/* Card Header */}
              <View style={styles.cardHead}>
                <View style={[styles.catBadge, { backgroundColor: catStyle.bg }]}>
                  <Text style={[styles.catBadgeText, { color: catStyle.text }]}>{tender.cat}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Open</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>{tender.title}</Text>
              <Text style={styles.cardCompany}>🏢 {tender.company}</Text>

              {/* Meta Row */}
              <View style={styles.metaRow}>
                <Text style={styles.metaItem}>📍 {tender.location}</Text>
                <Text style={styles.metaItem}>📅 {tender.deadline}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.budgetText}>💰 {tender.budget}</Text>
                <Text style={styles.bidsText}>👥 {tender.bids} bids</Text>
              </View>

              {/* Tags */}
              <View style={styles.tagsRow}>
                {tender.tags.map(tag => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
                <Text style={styles.postedText}>· {tender.posted}</Text>
              </View>

              {/* Buttons */}
              <View style={styles.cardBtns}>
                <TouchableOpacity style={styles.detailBtn} onPress={() => { setDetailTender(tender); setBidSubmitted(false); setBidAmount(''); }}>
                  <Text style={styles.detailBtnText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bidBtn} onPress={() => { setDetailTender(tender); setBidSubmitted(false); setBidAmount(''); }}>
                  <Text style={styles.bidBtnText}>Submit Bid →</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNav navigation={navigation} active="Home" />

      {/* Detail Modal */}
      {detailTender && (
        <Modal animationType="slide" transparent visible onRequestClose={() => setDetailTender(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Status + Category */}
                <View style={styles.modalHeadRow}>
                  <View style={[styles.catBadge, { backgroundColor: (CAT_COLORS[detailTender.cat] || {}).bg || '#F5F5F5' }]}>
                    <Text style={[styles.catBadgeText, { color: (CAT_COLORS[detailTender.cat] || {}).text || '#555' }]}>{detailTender.cat}</Text>
                  </View>
                  <View style={styles.statusBadge}><View style={styles.statusDot} /><Text style={styles.statusText}>Open</Text></View>
                </View>

                <Text style={styles.modalTitle}>{detailTender.title}</Text>
                <Text style={styles.modalCompany}>🏢 {detailTender.company}</Text>

                <View style={styles.modalInfoGrid}>
                  {[
                    { icon: '📍', label: 'Location', val: detailTender.location },
                    { icon: '💰', label: 'Budget', val: detailTender.budget },
                    { icon: '📅', label: 'Deadline', val: detailTender.deadline },
                    { icon: '👥', label: 'Bids Received', val: `${detailTender.bids} bids` },
                  ].map(item => (
                    <View key={item.label} style={styles.infoBox}>
                      <Text style={styles.infoBoxIcon}>{item.icon}</Text>
                      <Text style={styles.infoBoxLabel}>{item.label}</Text>
                      <Text style={styles.infoBoxVal}>{item.val}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.scopeLabel}>Scope of Work</Text>
                <Text style={styles.scopeText}>{detailTender.scope}</Text>

                <Text style={styles.scopeLabel}>Requirements</Text>
                <View style={styles.tagsFull}>
                  {detailTender.tags.map(tag => (
                    <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                  ))}
                </View>

                {!bidSubmitted ? (
                  <>
                    <Text style={styles.scopeLabel}>Your Bid Amount</Text>
                    <View style={styles.bidInputRow}>
                      <Text style={styles.rupee}>₹</Text>
                      <TextInput
                        style={styles.bidInput}
                        placeholder="Enter your bid amount"
                        keyboardType="number-pad"
                        value={bidAmount}
                        onChangeText={setBidAmount}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.submitBidBtn, !bidAmount && styles.submitBidBtnDisabled]}
                      disabled={!bidAmount}
                      onPress={() => setBidSubmitted(true)}
                    >
                      <Text style={styles.submitBidBtnText}>Submit Bid →</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.bidSuccess}>
                    <Text style={styles.bidSuccessEmoji}>🎉</Text>
                    <Text style={styles.bidSuccessText}>Bid Submitted!</Text>
                    <Text style={styles.bidSuccessSub}>Your bid of ₹{bidAmount} has been submitted. The client will reach out if shortlisted.</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailTender(null)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F0ED' },
  safeHeader: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 18, color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  headerSub: { fontSize: 12, color: '#6B6560', marginTop: 1 },
  filterIconBtn: { marginLeft: 'auto', width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  catScroll: { paddingVertical: 12 },
  catChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0' },
  catChipActive: { backgroundColor: BLUE },
  catChipText: { fontSize: 13, fontWeight: '700', color: '#6B6560' },
  catChipTextActive: { color: '#fff' },
  scroll: { flex: 1, padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#EAEAEA', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  catBadgeText: { fontSize: 11, fontWeight: '800' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },
  cardTitle: { fontSize: 15, fontWeight: '900', color: '#111', marginBottom: 4, lineHeight: 21 },
  cardCompany: { fontSize: 12, color: '#6B6560', marginBottom: 10 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metaItem: { fontSize: 12, color: '#6B6560' },
  budgetText: { fontSize: 14, fontWeight: '800', color: '#111' },
  bidsText: { fontSize: 12, color: '#6B6560' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, alignItems: 'center' },
  tagsFull: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tag: { backgroundColor: '#E0F5FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '700', color: BLUE },
  postedText: { fontSize: 11, color: '#aaa' },
  cardBtns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  detailBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: BLUE, alignItems: 'center' },
  detailBtnText: { fontSize: 13, fontWeight: '800', color: BLUE },
  bidBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center' },
  bidBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeadRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#111', lineHeight: 26, marginBottom: 6 },
  modalCompany: { fontSize: 13, color: '#6B6560', marginBottom: 16 },
  modalInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  infoBox: { width: '47%', backgroundColor: '#F2F0ED', borderRadius: 12, padding: 12 },
  infoBoxIcon: { fontSize: 20, marginBottom: 4 },
  infoBoxLabel: { fontSize: 10, fontWeight: '700', color: '#6B6560', textTransform: 'uppercase', marginBottom: 2 },
  infoBoxVal: { fontSize: 13, fontWeight: '800', color: '#111' },
  scopeLabel: { fontSize: 13, fontWeight: '800', color: '#111', marginBottom: 8, marginTop: 4 },
  scopeText: { fontSize: 13, color: '#555', lineHeight: 22, marginBottom: 16 },
  bidInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F0ED', borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0', paddingHorizontal: 14, marginBottom: 14 },
  rupee: { fontSize: 18, fontWeight: '800', color: '#111', marginRight: 6 },
  bidInput: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111', paddingVertical: 14 },
  submitBidBtn: { backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  submitBidBtnDisabled: { backgroundColor: '#A8C4EE' },
  submitBidBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },
  bidSuccess: { backgroundColor: '#F0FDF4', borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 16 },
  bidSuccessEmoji: { fontSize: 40, marginBottom: 8 },
  bidSuccessText: { fontSize: 18, fontWeight: '900', color: '#16A34A', marginBottom: 6 },
  bidSuccessSub: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20 },
  closeBtn: { paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center', marginBottom: 20 },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: '#6B6560' },
});

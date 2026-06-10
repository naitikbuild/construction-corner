import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
} from 'react-native';

import { confirmWork, getPendingWork } from '../services/workService';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const ORANGE = '#FF6B2B';
const GREEN = '#2ECC71';
const GREEN_DARK = '#1A7A4A';
const RED = '#E74C3C';
const RED_LIGHT = '#FFF0F0';
const BORDER = '#EFEFEF';
const CARD = '#FFFFFF';
const TEXT = '#1A1A1A';
const MUTED = '#666666';

const WORK_RECORD = {
  customer: { name: 'Naitik Rathod', role: 'Property Owner', emoji: '🏠', location: 'Bopal, Ahmedabad' },
  amount: 20000,
  commission: 200,
  netAmount: 19800,
  description: 'RCC slab work for first floor, area 1200 sqft. Formwork, steel binding, concreting and curing completed.',
  date: '04/04/2026',
  rating: 4,
  review: 'Very professional work. Completed on time with great quality.',
  workType: 'RCC Slab Work',
};

function StarDisplay({ value }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={[styles.starIcon, s <= value && styles.starActive]}>
          {s <= value ? '★' : '☆'}
        </Text>
      ))}
      <Text style={styles.ratingLabel}>{value}.0 / 5.0</Text>
    </View>
  );
}

export default function ConfirmWorkScreen({ navigation, route }) {
  const workId = route?.params?.workId ?? null;
  const workDataParam = route?.params?.workData ?? null;
  const [loadedWorkData, setLoadedWorkData] = useState(workDataParam);
  const [loadingWork, setLoadingWork] = useState(workId && !workDataParam);

  useEffect(() => {
    if (workId && !workDataParam) {
      getDoc(doc(db, 'pending_work', workId)).then(snap => {
        if (snap.exists()) setLoadedWorkData(snap.data());
        setLoadingWork(false);
      }).catch(() => setLoadingWork(false));
    }
  }, [workId]);

  const workData = loadedWorkData || WORK_RECORD;

  const RECORD = workId ? {
    customer: { name: workData.customerName || 'Customer', role: 'Property Owner', emoji: '🏠', location: 'India' },
    amount: workData.amount || 0,
    commission: workData.commission || Math.round((workData.amount || 0) * 0.01),
    netAmount: workData.netAmount || ((workData.amount || 0) - Math.round((workData.amount || 0) * 0.01)),
    description: workData.description || '',
    date: workData.date || '',
    rating: workData.rating || 0,
    review: workData.review || '',
    workType: workData.workType || 'Construction Work',
  } : WORK_RECORD;

  const [paymentDone, setPaymentDone] = useState(false);
  const [selectedUPI, setSelectedUPI] = useState(null);
  const [confirming, setConfirming] = useState(false);

  if (loadingWork) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={{ marginTop: 12, color: '#888' }}>Loading work details...</Text>
      </View>
    );
  }

  const UPI_OPTIONS = [
    { id: 'gpay', label: 'Google Pay', icon: '🟢', color: '#1A73E8' },
    { id: 'phonepe', label: 'PhonePe', icon: '🟣', color: '#5F259F' },
    { id: 'paytm', label: 'Paytm', icon: '🔵', color: '#002970' },
  ];

  const handleConfirm = () => {
    if (!selectedUPI) {
      Alert.alert('Select UPI', 'Please select a UPI app to pay commission.');
      return;
    }
    Alert.alert(
      'Confirm & Pay Commission?',
      `You will pay ₹${RECORD.commission} via ${selectedUPI.toUpperCase()}. This work record will be permanently added to your profile.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Pay ₹' + RECORD.commission,
          style: 'default',
          onPress: doConfirm,
        },
      ]
    );
  };

  const doConfirm = async () => {
    setConfirming(true);
    try {
      if (workId) {
        await confirmWork(workId, RECORD.commission);
      }
      setPaymentDone(true);
      setTimeout(() => navigation.navigate('WorkHistory'), 1800);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to confirm work. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const handleDispute = () => {
    Alert.alert(
      'Raise a Dispute',
      'The customer will be notified to review and correct the work amount.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Dispute', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  if (paymentDone) {
    return (
      <View style={styles.successScreen}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Work Confirmed!</Text>
        <Text style={styles.successSub}>This record has been permanently added to your profile.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Work Done</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* STEP INDICATOR */}
        <View style={styles.stepRow}>
          {['Customer Submitted', 'Your Review', 'Pay & Confirm'].map((step, i) => (
            <React.Fragment key={step}>
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, i < 2 && styles.stepDotActive]}>
                  <Text style={styles.stepNum}>{i < 2 ? '✓' : '3'}</Text>
                </View>
                <Text style={[styles.stepLabel, i < 2 && styles.stepLabelActive]}>{step}</Text>
              </View>
              {i < 2 && <View style={[styles.stepLine, i === 0 && styles.stepLineDone]} />}
            </React.Fragment>
          ))}
        </View>

        {/* CUSTOMER CARD */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Customer Info</Text>
        </View>

        <View style={styles.customerCard}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerEmoji}>{RECORD.customer.emoji}</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{RECORD.customer.name}</Text>
            <Text style={styles.customerRole}>{RECORD.customer.role}</Text>
            <Text style={styles.customerLoc}>📍 {RECORD.customer.location}</Text>
          </View>
          <View style={styles.submittedBadge}>
            <Text style={styles.submittedText}>Submitted</Text>
          </View>
        </View>

        {/* WORK DETAILS */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Work Details</Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Work Type</Text>
            <Text style={styles.detailVal}>{RECORD.workType}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Work Amount</Text>
            <Text style={[styles.detailVal, { color: ORANGE, fontSize: 20, fontWeight: '800' }]}>
              ₹{RECORD.amount.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRowVertical}>
            <Text style={styles.detailKey}>Work Description</Text>
            <Text style={styles.detailDesc}>{RECORD.description}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Completion Date</Text>
            <Text style={styles.detailVal}>{RECORD.date}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRowVertical}>
            <Text style={styles.detailKey}>Customer Rating</Text>
            <StarDisplay value={RECORD.rating} />
          </View>
          {RECORD.review ? (
            <>
              <View style={styles.detailDivider} />
              <View style={styles.detailRowVertical}>
                <Text style={styles.detailKey}>Customer Review</Text>
                <Text style={styles.reviewText}>"{RECORD.review}"</Text>
              </View>
            </>
          ) : null}
        </View>

        {/* COMMISSION BREAKDOWN */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Commission Breakdown</Text>
        </View>

        <View style={styles.commissionCard}>
          <View style={styles.commRow}>
            <Text style={styles.commKey}>Work Amount</Text>
            <Text style={styles.commVal}>₹{RECORD.amount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.commRow}>
            <View>
              <Text style={styles.commKey}>Platform Commission</Text>
              <Text style={styles.commSubKey}>1% of work amount</Text>
            </View>
            <Text style={[styles.commVal, { color: RED, fontWeight: '900' }]}>
              ₹{RECORD.commission.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.commRow, styles.commNetRow]}>
            <Text style={styles.commNetKey}>You Receive (Net)</Text>
            <Text style={styles.commNetVal}>₹{RECORD.netAmount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.commPayRow}>
            <Text style={styles.commPayLabel}>Pay Commission via UPI:</Text>
            <Text style={styles.commPayUPI}>cc@upi</Text>
          </View>
        </View>

        {/* UPI OPTIONS */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Choose UPI App</Text>
        </View>
        <View style={styles.upiRow}>
          {UPI_OPTIONS.map((upi) => (
            <TouchableOpacity
              key={upi.id}
              style={[styles.upiBtn, selectedUPI === upi.id && { borderColor: upi.color, backgroundColor: '#F0F7FF' }]}
              onPress={() => setSelectedUPI(upi.id)}
            >
              <Text style={styles.upiIcon}>{upi.icon}</Text>
              <Text style={[styles.upiLabel, selectedUPI === upi.id && { color: upi.color, fontWeight: '900' }]}>
                {upi.label}
              </Text>
              {selectedUPI === upi.id && <Text style={styles.upiCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* WARNING */}
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Once you confirm and pay the commission, this work record will be <Text style={{ fontWeight: '900' }}>permanently added to your profile</Text> and cannot be deleted or modified.
          </Text>
        </View>

        {/* ACTION BUTTONS */}
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85} disabled={confirming}>
          {confirming
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.confirmBtnText}>✓  Confirm & Pay ₹{RECORD.commission}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.disputeBtn} onPress={handleDispute} activeOpacity={0.85}>
          <Text style={styles.disputeBtnText}>⚑  Amount is Incorrect — Raise Dispute</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F0' },

  // HEADER
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: ORANGE, fontWeight: '800' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: TEXT },

  // SUCCESS SCREEN
  successScreen: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', gap: 16 },
  successIcon: { fontSize: 72 },
  successTitle: { fontSize: 26, fontWeight: '800', color: GREEN_DARK },
  successSub: { fontSize: 14, color: MUTED, textAlign: 'center', paddingHorizontal: 40 },

  // STEP INDICATOR
  stepRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, paddingVertical: 20,
  },
  stepItem: { alignItems: 'center', gap: 6, flex: 1 },
  stepDot: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: GREEN },
  stepNum: { fontSize: 12, fontWeight: '800', color: '#fff' },
  stepLabel: { fontSize: 9, color: MUTED, fontWeight: '600', textAlign: 'center' },
  stepLabelActive: { color: GREEN_DARK, fontWeight: '800' },
  stepLine: { flex: 0.4, height: 2, backgroundColor: BORDER, marginBottom: 16 },
  stepLineDone: { backgroundColor: GREEN },

  // SECTION HEADER
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  sectionBar: { width: 4, height: 18, borderRadius: 2, backgroundColor: ORANGE },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: TEXT },

  // CUSTOMER CARD
  customerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, padding: 16,
    backgroundColor: CARD, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  customerAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFE0C4',
  },
  customerEmoji: { fontSize: 26 },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 2 },
  customerRole: { fontSize: 12, color: ORANGE, fontWeight: '700', marginBottom: 3 },
  customerLoc: { fontSize: 11, color: MUTED },
  submittedBadge: {
    backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: '#FFE0C4',
  },
  submittedText: { fontSize: 11, color: ORANGE, fontWeight: '800' },

  // WORK DETAILS CARD
  detailsCard: {
    marginHorizontal: 16, borderRadius: 16,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER,
    overflow: 'hidden',
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  detailRowVertical: { padding: 14, gap: 8 },
  detailDivider: { height: 1, backgroundColor: BORDER },
  detailKey: { fontSize: 12, color: MUTED, fontWeight: '600' },
  detailVal: { fontSize: 15, fontWeight: '800', color: TEXT },
  detailDesc: { fontSize: 13, color: TEXT, lineHeight: 20 },
  reviewText: { fontSize: 13, color: MUTED, fontStyle: 'italic', lineHeight: 20 },

  // STAR RATING
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  starIcon: { fontSize: 24, color: '#DDD' },
  starActive: { color: '#FFB830' },
  ratingLabel: { fontSize: 13, color: MUTED, fontWeight: '700', marginLeft: 6 },

  // COMMISSION CARD
  commissionCard: {
    marginHorizontal: 16, padding: 18,
    backgroundColor: '#F0FFF4', borderRadius: 16,
    borderWidth: 1, borderColor: '#2ECC7155',
  },
  commRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  commKey: { fontSize: 13, color: MUTED, fontWeight: '600' },
  commSubKey: { fontSize: 11, color: MUTED },
  commVal: { fontSize: 16, fontWeight: '800', color: TEXT },
  commNetRow: {
    borderTopWidth: 1, borderTopColor: '#2ECC7155',
    paddingTop: 14, marginTop: 2, marginBottom: 14,
  },
  commNetKey: { fontSize: 15, fontWeight: '800', color: GREEN_DARK },
  commNetVal: { fontSize: 22, fontWeight: '800', color: GREEN },
  commPayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: GREEN, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  commPayLabel: { fontSize: 13, color: '#fff', fontWeight: '700' },
  commPayUPI: { fontSize: 14, color: '#fff', fontWeight: '800', fontFamily: 'monospace' },

  // UPI OPTIONS
  upiRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  upiBtn: {
    flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14,
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, backgroundColor: CARD,
  },
  upiIcon: { fontSize: 28 },
  upiLabel: { fontSize: 11, fontWeight: '700', color: TEXT },
  upiCheck: { fontSize: 14, color: GREEN_DARK, fontWeight: '800' },

  // WARNING
  warningBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    marginHorizontal: 16, marginBottom: 20, padding: 14, borderRadius: 12,
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FFD700',
  },
  warningIcon: { fontSize: 18 },
  warningText: { flex: 1, fontSize: 12, color: '#7A5400', lineHeight: 18 },

  // ACTION BUTTONS
  confirmBtn: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: GREEN, paddingVertical: 17, borderRadius: 14,
    alignItems: 'center',
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  confirmBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  disputeBtn: {
    marginHorizontal: 16,
    paddingVertical: 15, borderRadius: 14,
    alignItems: 'center', borderWidth: 2, borderColor: RED,
    backgroundColor: RED_LIGHT,
  },
  disputeBtnText: { fontSize: 14, fontWeight: '800', color: RED },
});

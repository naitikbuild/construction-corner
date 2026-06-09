import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BLUE, BLUE_LIGHT, BLUE_MID, GREEN, GREEN_LIGHT } from '../constants/colors';
import { markWorkComplete } from '../services/workService';

const BORDER = '#E2E8F0';
const CARD = '#F8FAFC';
const TEXT = '#0F172A';
const MUTED = '#64748B';

const DEFAULT_PROVIDER = {
  name: 'Ramesh Vishwakarma',
  designation: 'Expert Mason & RCC Specialist',
  emoji: '👷',
  location: 'Vatva, Ahmedabad',
};

function StarRating({ value, onChange }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)} style={styles.starBtn}>
          <Text style={[styles.starIcon, star <= value && styles.starActive]}>
            {star <= value ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.starLabel}>
        {value === 0 ? 'Tap to rate' : value === 5 ? 'Excellent!' : value === 4 ? 'Very Good' : value === 3 ? 'Good' : value === 2 ? 'Fair' : 'Poor'}
      </Text>
    </View>
  );
}

export default function MarkWorkCompleteScreen({ navigation, route }) {
  const PROVIDER = {
    name:        route?.params?.workerName   ?? DEFAULT_PROVIDER.name,
    designation: route?.params?.workerRole   ?? DEFAULT_PROVIDER.designation,
    emoji:       route?.params?.workerEmoji  ?? DEFAULT_PROVIDER.emoji,
    location:    route?.params?.location     ?? DEFAULT_PROVIDER.location,
    uid:         route?.params?.workerUid    ?? null,
  };
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const commission = amount ? Math.round(parseFloat(amount.replace(/,/g, '')) * 0.01) : 0;
  const netAmount = amount ? parseFloat(amount.replace(/,/g, '')) - commission : 0;
  const rawAmount = amount ? parseFloat(amount.replace(/,/g, '')) : 0;

  const handleSubmit = () => {
    if (!amount || !description || !date || rating === 0) {
      Alert.alert('Missing Info', 'Please fill all required fields and give a rating.');
      return;
    }
    Alert.alert(
      'Submit Work Record?',
      'Once the service provider confirms, this record cannot be edited.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', style: 'default', onPress: doSubmit },
      ]
    );
  };

  const doSubmit = async () => {
    setSubmitting(true);
    try {
      const customerId = await AsyncStorage.getItem('uid');
      const customerName = await AsyncStorage.getItem('userName') || 'Customer';
      const workData = {
        customerId,
        customerName,
        providerId: PROVIDER.uid,
        providerName: PROVIDER.name,
        amount: rawAmount,
        commission,
        netAmount,
        description,
        date,
        rating,
        review,
        workType: description.split(' ').slice(0, 3).join(' '),
      };
      const workId = await markWorkComplete(workData);
      navigation.navigate('ConfirmWork', { workId, workData, provider: PROVIDER });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmount = (text) => {
    const nums = text.replace(/[^0-9]/g, '');
    if (!nums) return '';
    return parseInt(nums, 10).toLocaleString('en-IN');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mark Work Complete</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* PROVIDER INFO CARD */}
        <View style={styles.providerCard}>
          <View style={styles.providerAvatar}>
            <Text style={styles.providerEmoji}>{PROVIDER.emoji}</Text>
          </View>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{PROVIDER.name}</Text>
            <Text style={styles.providerDesig}>{PROVIDER.designation}</Text>
            <Text style={styles.providerLoc}>📍 {PROVIDER.location}</Text>
          </View>
          <View style={styles.verifiedPill}>
            <Text style={styles.verifiedPillText}>✓ Verified</Text>
          </View>
        </View>

        {/* FORM SECTION TITLE */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Work Details</Text>
        </View>

        {/* AMOUNT INPUT */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Total Work Amount (₹) <Text style={styles.required}>*</Text></Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.rupeeSign}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#CBD5E1"
              keyboardType="numeric"
              value={amount}
              onChangeText={(t) => setAmount(formatAmount(t))}
            />
          </View>
          <Text style={styles.fieldHint}>Enter the total agreed amount for this job</Text>
        </View>

        {/* DESCRIPTION INPUT */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>What work was done? <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.textArea}
            placeholder="E.g. RCC slab work for first floor, area 1200 sqft, completed in 8 days..."
            placeholderTextColor="#CBD5E1"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        {/* DATE INPUT */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Work Completion Date <Text style={styles.required}>*</Text></Text>
          <View style={styles.dateInputRow}>
            <Text style={styles.calIcon}>📅</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#CBD5E1"
              value={date}
              onChangeText={setDate}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
        </View>

        {/* DIVIDER */}
        <View style={styles.divider} />

        {/* RATING SECTION */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Your Rating & Review</Text>
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Star Rating <Text style={styles.required}>*</Text></Text>
          <StarRating value={rating} onChange={setRating} />
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Write a Review</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Share your experience working with this professional..."
            placeholderTextColor="#CBD5E1"
            multiline
            numberOfLines={3}
            value={review}
            onChangeText={setReview}
            textAlignVertical="top"
          />
        </View>

        {/* DIVIDER */}
        <View style={styles.divider} />

        {/* WORK PHOTOS */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Work Photos</Text>
        </View>
        <Text style={styles.photosHint}>Add photos as proof of completed work</Text>
        <View style={styles.photosGrid}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <TouchableOpacity key={i} style={styles.photoBox}>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoAddText}>Add Photo</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* DIVIDER */}
        <View style={styles.divider} />

        {/* SUMMARY CARD */}
        {amount ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>💰 Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Work Amount</Text>
              <Text style={styles.summaryVal}>₹{amount}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Platform Commission (1%)</Text>
              <Text style={[styles.summaryVal, { color: '#EF4444' }]}>- ₹{commission.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={styles.summaryTotalKey}>Provider Receives</Text>
              <Text style={styles.summaryTotalVal}>₹{netAmount.toLocaleString('en-IN')}</Text>
            </View>
            <Text style={styles.commissionNote}>
              * 1% commission (₹{commission.toLocaleString('en-IN')}) is paid by the service provider via UPI after confirming this record.
            </Text>
          </View>
        ) : null}

        {/* IMPORTANT NOTE */}
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>🔒</Text>
          <Text style={styles.warningText}>
            This record cannot be edited once confirmed by the service provider. Ensure all details are accurate before submitting.
          </Text>
        </View>

        {/* SUBMIT BUTTON — Instagram gradient */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85} disabled={submitting}>
          <View style={styles.submitGrad} pointerEvents="none">
            {['#833AB4', '#C13584', '#FD1D1D', '#F77737'].map((c, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: c }} />
            ))}
          </View>
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Submit Work Record →</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  // HEADER
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: BLUE_LIGHT, alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: BLUE, fontWeight: '900' },
  headerTitle: { fontSize: 17, fontWeight: '900', color: TEXT },

  // PROVIDER CARD
  providerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    margin: 16, padding: 16,
    backgroundColor: BLUE_LIGHT, borderRadius: 16,
    borderWidth: 1.5, borderColor: BLUE_MID,
  },
  providerAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: BLUE,
  },
  providerEmoji: { fontSize: 28 },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 15, fontWeight: '900', color: TEXT, marginBottom: 2 },
  providerDesig: { fontSize: 12, color: BLUE, fontWeight: '700', marginBottom: 3 },
  providerLoc: { fontSize: 11, color: MUTED },
  verifiedPill: {
    backgroundColor: GREEN_LIGHT, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 99, borderWidth: 1, borderColor: '#86EFAC',
  },
  verifiedPillText: { fontSize: 11, color: '#16A34A', fontWeight: '800' },

  // SECTION HEADER
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  sectionBar: { width: 4, height: 18, borderRadius: 2, backgroundColor: BLUE },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: TEXT },

  // FIELDS
  fieldWrap: { paddingHorizontal: 16, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 8 },
  required: { color: '#EF4444' },
  fieldHint: { fontSize: 11, color: MUTED, marginTop: 6 },

  amountInputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderColor: BORDER, borderRadius: 12,
    backgroundColor: CARD, paddingHorizontal: 14,
  },
  rupeeSign: { fontSize: 22, color: BLUE, fontWeight: '900', marginRight: 4 },
  amountInput: { flex: 1, fontSize: 26, fontWeight: '900', color: TEXT, paddingVertical: 12 },

  textArea: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    backgroundColor: CARD, padding: 14,
    fontSize: 14, color: TEXT, lineHeight: 22, minHeight: 100,
  },

  dateInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    backgroundColor: CARD, paddingHorizontal: 14, paddingVertical: 12,
  },
  calIcon: { fontSize: 18 },
  dateInput: { flex: 1, fontSize: 15, fontWeight: '700', color: TEXT },

  // STAR RATING
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  starBtn: { padding: 2 },
  starIcon: { fontSize: 36, color: '#CBD5E1' },
  starActive: { color: '#FBBF24' },
  starLabel: { fontSize: 13, color: MUTED, fontWeight: '600', marginLeft: 4 },

  // PHOTOS
  photosHint: { fontSize: 12, color: MUTED, paddingHorizontal: 16, marginBottom: 12 },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  photoBox: {
    width: 100, height: 100, borderRadius: 12,
    borderWidth: 2, borderColor: BORDER, borderStyle: 'dashed',
    backgroundColor: CARD, alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  photoIcon: { fontSize: 24 },
  photoAddText: { fontSize: 10, color: MUTED, fontWeight: '600' },

  divider: { height: 1, backgroundColor: BORDER, marginVertical: 8, marginHorizontal: 16 },

  // SUMMARY CARD
  summaryCard: {
    margin: 16, padding: 18, borderRadius: 16,
    backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#86EFAC',
  },
  summaryTitle: { fontSize: 14, fontWeight: '900', color: TEXT, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryKey: { fontSize: 13, color: MUTED, fontWeight: '500' },
  summaryVal: { fontSize: 14, fontWeight: '800', color: TEXT },
  summaryTotalRow: {
    borderTopWidth: 1.5, borderTopColor: '#86EFAC',
    paddingTop: 10, marginTop: 4, marginBottom: 0,
  },
  summaryTotalKey: { fontSize: 14, fontWeight: '900', color: TEXT },
  summaryTotalVal: { fontSize: 20, fontWeight: '900', color: GREEN },
  commissionNote: { fontSize: 11, color: '#16A34A', marginTop: 10, lineHeight: 16 },

  // WARNING
  warningBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    margin: 16, padding: 14, borderRadius: 12,
    backgroundColor: '#FFFBEB', borderWidth: 1.5, borderColor: '#FCD34D',
  },
  warningIcon: { fontSize: 18 },
  warningText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18, fontWeight: '500' },

  // SUBMIT
  submitBtn: {
    marginHorizontal: 16, marginTop: 8,
    borderRadius: 14, overflow: 'hidden',
    height: 56, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C13584', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  submitGrad: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  submitBtnText: { fontSize: 16, fontWeight: '900', color: '#fff', zIndex: 1 },
});

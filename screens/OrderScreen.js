import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, StatusBar, SafeAreaView, Alert,
} from 'react-native';

import { BLUE, BLUE_LIGHT } from '../constants/colors';

const PAYMENT_METHODS = [
  { key: 'advance', label: '100% Advance', icon: '⚡', desc: 'Instant dispatch • Best price', badge: 'Fastest', badgeColor: '#16A34A', badgeBg: '#F0FDF4' },
  { key: 'credit30', label: '30-Day Credit', icon: '📅', desc: 'For verified businesses', badge: 'Popular', badgeColor: BLUE, badgeBg: BLUE_LIGHT },
  { key: 'credit45', label: '45-Day Credit', icon: '📆', desc: 'For bulk orders ≥ ₹5 Lakh', badge: 'Bulk', badgeColor: '#EA580C', badgeBg: '#FFF7ED' },
];

export default function OrderScreen({ navigation, route }) {
  const material = route?.params?.material ?? {
    name: 'UltraTech Cement',
    grade: 'OPC 53',
    price: 345,
    unit: 'bag',
    emoji: '🏗️',
    supplier: 'Gujarat Building Materials Co.',
    minOrder: 50,
    gst: 28,
  };

  const [qty, setQty] = useState(material.minOrder || 10);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('advance');
  const [ordered, setOrdered] = useState(false);

  const itemTotal = material.price * qty;
  const deliveryCharge = itemTotal > 50000 ? 0 : 500;
  const gstAmt = Math.round(itemTotal * (material.gst / 100));
  const grandTotal = itemTotal + deliveryCharge + gstAmt;

  const fmtINR = n => '₹' + n.toLocaleString('en-IN');

  function confirmOrder() {
    if (!address.trim()) {
      Alert.alert('Address Required', 'Please enter a delivery address to continue.');
      return;
    }
    setOrdered(true);
  }

  if (ordered) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.successContent}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successSub}>
            Your order for {qty} {material.unit}s of {material.name} has been placed successfully.
            The supplier will confirm within 2 hours.
          </Text>
          <View style={styles.successCard}>
            {[
              { label: 'Order ID', value: `#CC${Date.now().toString().slice(-6)}` },
              { label: 'Material', value: `${material.name} (${material.grade})` },
              { label: 'Quantity', value: `${qty} ${material.unit}s` },
              { label: 'Grand Total', value: fmtINR(grandTotal) },
              { label: 'Payment', value: PAYMENT_METHODS.find(p => p.key === paymentMethod)?.label },
            ].map(row => (
              <View key={row.label} style={styles.successRow}>
                <Text style={styles.successRowLabel}>{row.label}</Text>
                <Text style={styles.successRowVal}>{row.value}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.doneBtnText}>Back to Home →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dashBtn} onPress={() => navigation.navigate('MyDashboard')}>
            <Text style={styles.dashBtnText}>View My Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Place Order</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Material Card */}
        <View style={styles.materialCard}>
          <View style={styles.materialEmoji}>
            <Text style={{ fontSize: 36 }}>{material.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.materialName}>{material.name}</Text>
            <Text style={styles.materialGrade}>{material.grade}</Text>
            <Text style={styles.materialSupplier}>🏭 {material.supplier}</Text>
          </View>
          <View style={styles.materialPriceBox}>
            <Text style={styles.materialPrice}>{fmtINR(material.price)}</Text>
            <Text style={styles.materialUnit}>/{material.unit}</Text>
          </View>
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quantity</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={[styles.qtyBtn, qty <= (material.minOrder || 1) && styles.qtyBtnDisabled]}
              onPress={() => setQty(q => Math.max((material.minOrder || 1), q - 1))}
              disabled={qty <= (material.minOrder || 1)}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.qtyDisplay}>
              <Text style={styles.qtyValue}>{qty}</Text>
              <Text style={styles.qtyUnit}>{material.unit}s</Text>
            </View>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => q + 1)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.minOrderNote}>Minimum order: {material.minOrder} {material.unit}s</Text>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Delivery Address</Text>
          <TextInput
            style={styles.addressInput}
            placeholder="Enter full delivery address with pincode"
            multiline
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
            placeholderTextColor="#aaa"
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Payment Method</Text>
          {PAYMENT_METHODS.map(pm => (
            <TouchableOpacity
              key={pm.key}
              style={[styles.paymentCard, paymentMethod === pm.key && styles.paymentCardSelected]}
              onPress={() => setPaymentMethod(pm.key)}
            >
              <Text style={styles.paymentIcon}>{pm.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentLabel, paymentMethod === pm.key && styles.paymentLabelSelected]}>
                  {pm.label}
                </Text>
                <Text style={styles.paymentDesc}>{pm.desc}</Text>
              </View>
              <View style={[styles.paymentBadge, { backgroundColor: pm.badgeBg }]}>
                <Text style={[styles.paymentBadgeText, { color: pm.badgeColor }]}>{pm.badge}</Text>
              </View>
              <View style={[styles.radio, paymentMethod === pm.key && styles.radioSelected]}>
                {paymentMethod === pm.key && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Order Summary</Text>
          <View style={styles.summaryCard}>
            {[
              { label: `${material.name} × ${qty} ${material.unit}s`, value: fmtINR(itemTotal) },
              { label: `GST (${material.gst}%)`, value: fmtINR(gstAmt) },
              { label: 'Delivery Charge', value: deliveryCharge === 0 ? 'FREE' : fmtINR(deliveryCharge) },
            ].map(row => (
              <View key={row.label} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{row.label}</Text>
                <Text style={[styles.summaryVal, row.value === 'FREE' && styles.summaryValFree]}>
                  {row.value}
                </Text>
              </View>
            ))}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Grand Total</Text>
              <Text style={styles.summaryTotalVal}>{fmtINR(grandTotal)}</Text>
            </View>
            {deliveryCharge === 0 && (
              <Text style={styles.freeDeliveryNote}>🎉 You've qualified for FREE delivery!</Text>
            )}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalVal}>{fmtINR(grandTotal)}</Text>
        </View>
        <TouchableOpacity style={styles.confirmBtn} onPress={confirmOrder}>
          <Text style={styles.confirmBtnText}>Confirm Order →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F0ED' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 18, color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  scroll: { flex: 1 },
  // Material card
  materialCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#E0F5FE' },
  materialEmoji: { width: 60, height: 60, borderRadius: 14, backgroundColor: BLUE_LIGHT, alignItems: 'center', justifyContent: 'center' },
  materialName: { fontSize: 15, fontWeight: '900', color: '#111', marginBottom: 2 },
  materialGrade: { fontSize: 12, color: '#6B6560', marginBottom: 3 },
  materialSupplier: { fontSize: 11, color: '#555' },
  materialPriceBox: { alignItems: 'flex-end' },
  materialPrice: { fontSize: 20, fontWeight: '900', color: '#111' },
  materialUnit: { fontSize: 12, color: '#6B6560' },
  // Section
  section: { marginHorizontal: 16, marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '900', color: '#111', marginBottom: 10 },
  // Quantity
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  qtyBtnDisabled: { backgroundColor: '#D0D0D0' },
  qtyBtnText: { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 26 },
  qtyDisplay: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0', height: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  qtyValue: { fontSize: 20, fontWeight: '900', color: '#111' },
  qtyUnit: { fontSize: 13, color: '#6B6560', fontWeight: '600' },
  minOrderNote: { fontSize: 11, color: '#aaa', marginTop: 8 },
  // Address
  addressInput: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111', textAlignVertical: 'top', lineHeight: 21 },
  // Payment
  paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0', padding: 14, marginBottom: 10, gap: 12 },
  paymentCardSelected: { borderColor: BLUE, backgroundColor: BLUE_LIGHT },
  paymentIcon: { fontSize: 24, width: 30, textAlign: 'center' },
  paymentLabel: { fontSize: 14, fontWeight: '800', color: '#111', marginBottom: 2 },
  paymentLabelSelected: { color: BLUE },
  paymentDesc: { fontSize: 11, color: '#6B6560' },
  paymentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  paymentBadgeText: { fontSize: 10, fontWeight: '800' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CCC', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: BLUE },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: BLUE },
  // Summary
  summaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EAEAEA' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 13, color: '#6B6560' },
  summaryVal: { fontSize: 13, fontWeight: '700', color: '#111' },
  summaryValFree: { color: '#16A34A' },
  summaryDivider: { height: 1, backgroundColor: '#EAEAEA', marginBottom: 12 },
  summaryTotal: { fontSize: 15, fontWeight: '900', color: '#111' },
  summaryTotalVal: { fontSize: 18, fontWeight: '900', color: BLUE },
  freeDeliveryNote: { fontSize: 11, color: '#16A34A', fontWeight: '700', marginTop: 4 },
  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EAEAEA', flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 30, gap: 16, shadowColor: '#000', shadowOpacity: 0.08, elevation: 12 },
  footerTotal: { flex: 1 },
  footerTotalLabel: { fontSize: 11, color: '#6B6560', fontWeight: '600' },
  footerTotalVal: { fontSize: 20, fontWeight: '900', color: '#111' },
  confirmBtn: { backgroundColor: BLUE, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 },
  confirmBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },
  // Success
  successContainer: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  successContent: { padding: 32, alignItems: 'center' },
  successEmoji: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 28, fontWeight: '900', color: '#111', marginBottom: 10 },
  successSub: { fontSize: 14, color: '#6B6560', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  successCard: { backgroundColor: '#F2F0ED', borderRadius: 16, padding: 16, width: '100%', marginBottom: 24 },
  successRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
  successRowLabel: { fontSize: 13, color: '#6B6560' },
  successRowVal: { fontSize: 13, fontWeight: '800', color: '#111', flex: 1, textAlign: 'right' },
  doneBtn: { backgroundColor: BLUE, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 14, marginBottom: 12, width: '100%', alignItems: 'center' },
  doneBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },
  dashBtn: { paddingVertical: 12, width: '100%', alignItems: 'center' },
  dashBtnText: { fontSize: 14, fontWeight: '700', color: BLUE },
});

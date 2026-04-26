import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';

import { BLUE, BLUE_LIGHT, BLUE_MID, GREEN, GREEN_LIGHT, GREEN_DARK } from '../constants/colors';

const BORDER = '#E2E8F0';
const CARD = '#F8FAFC';
const TEXT = '#0F172A';
const MUTED = '#64748B';

const COMMISSION_PAYMENTS = [
  { id: 1, jobType: 'RCC Slab Work', customer: 'Naitik R.', date: '04 Apr 2026', amount: 200, workAmount: 20000, upi: 'GPay', txnId: 'GCP2026040412345' },
  { id: 2, jobType: 'Brick Masonry', customer: 'Rahul M.', date: '18 Mar 2026', amount: 150, workAmount: 15000, upi: 'PhonePe', txnId: 'PPE2026031867890' },
  { id: 3, jobType: 'Plastering', customer: 'Priya S.', date: '05 Mar 2026', amount: 80, workAmount: 8000, upi: 'Paytm', txnId: 'PTM2026030511223' },
  { id: 4, jobType: 'Tile Flooring', customer: 'Suresh P.', date: '12 Feb 2026', amount: 120, workAmount: 12000, upi: 'GPay', txnId: 'GCP2026021244556' },
  { id: 5, jobType: 'Waterproofing', customer: 'Ankit V.', date: '28 Jan 2026', amount: 95, workAmount: 9500, upi: 'PhonePe', txnId: 'PPE2026012877889' },
  { id: 6, jobType: 'Foundation Work', customer: 'Kiran B.', date: '10 Dec 2025', amount: 450, workAmount: 45000, upi: 'GPay', txnId: 'GCP2025121099001' },
  { id: 7, jobType: 'Column Casting', customer: 'Mohit J.', date: '22 Nov 2025', amount: 180, workAmount: 18000, upi: 'Paytm', txnId: 'PTM2025112222334' },
  { id: 8, jobType: 'RCC Beam Work', customer: 'Dimple S.', date: '08 Nov 2025', amount: 220, workAmount: 22000, upi: 'GPay', txnId: 'GCP2025110855667' },
];

const THIS_MONTH = COMMISSION_PAYMENTS
  .filter((p) => p.date.includes('2026'))
  .slice(0, 5)
  .reduce((sum, p) => sum + p.amount, 0);

const LIFETIME = 4820;

const UPI_ICON = { GPay: '🟢', PhonePe: '🟣', Paytm: '🔵' };

const MONTHS = ['Apr 2026', 'Mar 2026', 'Feb 2026', 'Jan 2026', 'Dec 2025', 'Nov 2025'];
const MONTH_AMOUNTS = [200 + 150 + 80, 150 + 80, 120, 95, 450, 180 + 220];
const MAX_BAR = Math.max(...MONTH_AMOUNTS);

export default function CommissionWalletScreen({ navigation }) {
  const [tab, setTab] = useState('history');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Commission Wallet</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* TOTAL CARD */}
        <View style={styles.walletCard}>
          <View style={styles.walletCardBg} />
          <View style={styles.walletContent}>
            <Text style={styles.walletLabel}>Total Commission Paid (Lifetime)</Text>
            <Text style={styles.walletAmount}>₹{LIFETIME.toLocaleString('en-IN')}</Text>
            <Text style={styles.walletSub}>Across {COMMISSION_PAYMENTS.length}+ verified work records</Text>

            <View style={styles.walletStatsRow}>
              <View style={styles.walletStat}>
                <Text style={styles.walletStatVal}>₹{THIS_MONTH.toLocaleString('en-IN')}</Text>
                <Text style={styles.walletStatKey}>This Month</Text>
              </View>
              <View style={styles.walletStatDiv} />
              <View style={styles.walletStat}>
                <Text style={styles.walletStatVal}>1%</Text>
                <Text style={styles.walletStatKey}>Rate</Text>
              </View>
              <View style={styles.walletStatDiv} />
              <View style={styles.walletStat}>
                <Text style={styles.walletStatVal}>UPI</Text>
                <Text style={styles.walletStatKey}>Payment Mode</Text>
              </View>
            </View>
          </View>
        </View>

        {/* INFO PILL */}
        <View style={styles.infoPill}>
          <Text style={styles.infoPillIcon}>💡</Text>
          <Text style={styles.infoPillText}>
            Commission = 1% of verified work amount. Paid to Construction Corner app per job confirmation.
          </Text>
        </View>

        {/* TAB BAR */}
        <View style={styles.tabBar}>
          {[
            { id: 'history', label: 'Payment History' },
            { id: 'chart', label: 'Monthly Chart' },
          ].map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}
              onPress={() => setTab(t.id)}
            >
              <Text style={[styles.tabBtnText, tab === t.id && styles.tabBtnTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'history' ? (
          /* PAYMENT HISTORY */
          <View style={styles.historyList}>
            {COMMISSION_PAYMENTS.map((p) => (
              <View key={p.id} style={styles.payCard}>
                <View style={styles.payLeft}>
                  <Text style={styles.payUPIIcon}>{UPI_ICON[p.upi] || '💳'}</Text>
                  <View style={styles.payInfo}>
                    <Text style={styles.payJob}>{p.jobType}</Text>
                    <Text style={styles.payCustomer}>For: {p.customer}</Text>
                    <Text style={styles.payDate}>{p.date} · {p.upi}</Text>
                    <Text style={styles.payTxn}>TXN: {p.txnId}</Text>
                  </View>
                </View>
                <View style={styles.payRight}>
                  <Text style={styles.payAmount}>- ₹{p.amount}</Text>
                  <Text style={styles.payWork}>Work: ₹{p.workAmount.toLocaleString('en-IN')}</Text>
                  <View style={styles.paySuccessBadge}>
                    <Text style={styles.paySuccessText}>Paid</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* MONTHLY CHART */
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Commission Paid per Month</Text>
            <View style={styles.barChart}>
              {MONTHS.map((month, i) => (
                <View key={month} style={styles.barItem}>
                  <Text style={styles.barAmount}>₹{MONTH_AMOUNTS[i]}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[styles.barFill, {
                        height: Math.max(8, (MONTH_AMOUNTS[i] / MAX_BAR) * 140),
                        backgroundColor: i === 0 ? BLUE : i < 3 ? '#38BDF8' : '#38BDF8',
                      }]}
                    />
                  </View>
                  <Text style={styles.barMonth}>{month.split(' ')[0]}</Text>
                  <Text style={styles.barYear}>{month.split(' ')[1]}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartLegend}>
              <View style={[styles.legendDot, { backgroundColor: BLUE }]} />
              <Text style={styles.legendText}>Current month</Text>
              <View style={[styles.legendDot, { backgroundColor: '#38BDF8', marginLeft: 14 }]} />
              <Text style={styles.legendText}>Past months</Text>
            </View>
          </View>
        )}

        {/* UPI SUMMARY */}
        <View style={styles.upiSummaryCard}>
          <Text style={styles.upiSummaryTitle}>UPI Payment Breakdown</Text>
          <View style={styles.upiSummaryList}>
            {[
              { name: 'Google Pay', icon: '🟢', count: 4, amount: 1065 },
              { name: 'PhonePe', icon: '🟣', count: 2, amount: 245 },
              { name: 'Paytm', icon: '🔵', count: 2, amount: 230 },
            ].map((u) => (
              <View key={u.name} style={styles.upiSummaryRow}>
                <Text style={styles.upiSummaryIcon}>{u.icon}</Text>
                <Text style={styles.upiSummaryName}>{u.name}</Text>
                <Text style={styles.upiSummaryCount}>{u.count} payments</Text>
                <Text style={styles.upiSummaryAmount}>₹{u.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
        </View>

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

  // WALLET CARD
  walletCard: { margin: 16, borderRadius: 20, overflow: 'hidden' },
  walletCardBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BLUE,
  },
  walletContent: { padding: 24 },
  walletLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginBottom: 6 },
  walletAmount: { fontSize: 42, fontWeight: '900', color: '#fff', marginBottom: 4 },
  walletSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 20 },
  walletStatsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, padding: 14,
  },
  walletStat: { flex: 1, alignItems: 'center', gap: 3 },
  walletStatVal: { fontSize: 16, fontWeight: '900', color: '#fff' },
  walletStatKey: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  walletStatDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 4 },

  // INFO PILL
  infoPill: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 16, marginBottom: 16, padding: 14,
    backgroundColor: BLUE_LIGHT, borderRadius: 12,
    borderWidth: 1, borderColor: BLUE_MID,
  },
  infoPillIcon: { fontSize: 16 },
  infoPillText: { flex: 1, fontSize: 12, color: BLUE, lineHeight: 18, fontWeight: '500' },

  // TAB BAR
  tabBar: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 16,
    backgroundColor: CARD, borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: BORDER,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: BLUE },
  tabBtnText: { fontSize: 13, fontWeight: '700', color: MUTED },
  tabBtnTextActive: { color: '#fff' },

  // HISTORY LIST
  historyList: { paddingHorizontal: 16, gap: 10 },
  payCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 14, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: BORDER,
  },
  payLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  payUPIIcon: { fontSize: 28 },
  payInfo: { flex: 1, gap: 2 },
  payJob: { fontSize: 14, fontWeight: '800', color: TEXT },
  payCustomer: { fontSize: 12, color: BLUE, fontWeight: '600' },
  payDate: { fontSize: 11, color: MUTED },
  payTxn: { fontSize: 10, color: MUTED, fontFamily: 'monospace' },
  payRight: { alignItems: 'flex-end', gap: 4 },
  payAmount: { fontSize: 16, fontWeight: '900', color: '#EF4444' },
  payWork: { fontSize: 11, color: MUTED },
  paySuccessBadge: {
    backgroundColor: GREEN_LIGHT, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1, borderColor: '#86EFAC',
  },
  paySuccessText: { fontSize: 11, color: GREEN_DARK, fontWeight: '800' },

  // CHART
  chartSection: { paddingHorizontal: 16, marginBottom: 16 },
  chartTitle: { fontSize: 14, fontWeight: '800', color: TEXT, marginBottom: 20 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 190 },
  barItem: { flex: 1, alignItems: 'center', gap: 4 },
  barAmount: { fontSize: 9, fontWeight: '700', color: MUTED },
  barTrack: { width: 28, height: 140, justifyContent: 'flex-end', borderRadius: 6, backgroundColor: CARD },
  barFill: { width: '100%', borderRadius: 6 },
  barMonth: { fontSize: 10, fontWeight: '700', color: TEXT },
  barYear: { fontSize: 9, color: MUTED },
  chartLegend: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: MUTED, fontWeight: '600' },

  // UPI SUMMARY
  upiSummaryCard: {
    margin: 16, padding: 18,
    backgroundColor: CARD, borderRadius: 16,
    borderWidth: 1.5, borderColor: BORDER,
  },
  upiSummaryTitle: { fontSize: 14, fontWeight: '900', color: TEXT, marginBottom: 14 },
  upiSummaryList: { gap: 12 },
  upiSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  upiSummaryIcon: { fontSize: 22 },
  upiSummaryName: { flex: 1, fontSize: 13, fontWeight: '700', color: TEXT },
  upiSummaryCount: { fontSize: 11, color: MUTED },
  upiSummaryAmount: { fontSize: 15, fontWeight: '900', color: BLUE },
});

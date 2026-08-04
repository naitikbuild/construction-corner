import { View, Text, TouchableOpacity, Image } from 'react-native';
import { injectFonts } from '../theme/typography';
import { formatAmountIndian, isRecentJoin } from '../utils/format';
import { jobsCountNum, verifiedAmountNum, ratingNum } from '../utils/ranking';

const GREEN       = '#22A559';
const GREEN_LIGHT  = '#E8F5EC';
const DARK          = '#262626';
const FILL          = '#F2F2F2';
const LIGHT          = '#8E8E8E';
const LINK_BLUE      = '#1877F2';

// No real "next available day" scheduling data exists anywhere in this app —
// the only availability signal is the boolean `available` flag. Rather than
// fabricate a fake day, busy providers just show a plain "Busy" label.
const BUSY_LABEL = 'Busy';

// Exported so any screen that needs the same "trade · years" text for its own
// purposes (e.g. CategoryListScreen's search-box filtering) matches exactly
// what the row itself displays, instead of re-deriving a slightly different
// fallback chain.
export function tradeLine(u) {
  const trade = u.category || u.designation || u.workerSkill || u.contractorType || u.primarySkill || '';
  const years = u.workerExperience || u.contractorExperience || u.experience || '';
  return [trade, years ? `${years} yrs` : ''].filter(Boolean).join(' · ');
}

function ratingDisplay(u) {
  const r = ratingNum(u);
  return r > 0 ? r.toFixed(1) : '—';
}

// The one provider-row layout used by both Search results and every category
// listing (CategoryListScreen) — real photo thumbnail, name + verified tick,
// trade line, a single green "amount · jobs · on-time · rating" stats line,
// and availability on the right. `item` is a raw provider user record (same
// shape returned by userService's searchUsers/getAllUsers) — no pre-mapping
// needed, callers pass it straight through.
export default function ProviderRow({ item, onPress }) {
  const jobs = jobsCountNum(item);
  const hasJobs = jobs > 0;
  // Zero jobs AND joined under a month ago -> show a "New" label instead of
  // the ₹0 · 0 jobs · — · — stats row. Past the first month with still no
  // jobs, fall through to the normal (zero) stats row above.
  const isNew = !hasJobs && isRecentJoin(item.createdAt);

  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <View style={s.thumbWrap}>
        {item.photoUri ? (
          <Image source={{ uri: item.photoUri }} style={s.thumbImg} resizeMode="cover" />
        ) : (
          <View style={s.thumbPlaceholder}>
            <Text style={s.thumbPlaceholderIcon}>👤</Text>
          </View>
        )}
      </View>

      <View style={s.rowInfo}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>{item.name || item.companyName || 'Unnamed'}</Text>
          {item.verified ? (
            <View style={s.verifiedBadge}><Text style={s.verifiedBadgeText}>✓</Text></View>
          ) : null}
        </View>
        <Text style={s.tradeLine} numberOfLines={1}>{tradeLine(item) || '—'}</Text>
        {isNew ? (
          <View style={s.newBadge}>
            <Text style={s.newBadgeText}>New</Text>
          </View>
        ) : (
          <Text style={s.statsRow} numberOfLines={1}>
            <Text style={s.statsGreen}>{formatAmountIndian(verifiedAmountNum(item))}</Text>
            <Text style={s.statsDot}> · </Text>
            <Text style={s.statsGreen}>{jobs} jobs</Text>
            <Text style={s.statsDot}> · </Text>
            <Text style={s.statsGreen}>{hasJobs ? (item.onTimeRate || '—') : '—'}</Text>
            <Text style={s.statsDot}> · </Text>
            <Text style={s.statsGreen}>{hasJobs ? `★${ratingDisplay(item)}` : 'New'}</Text>
          </Text>
        )}
      </View>

      <View style={s.rightCol}>
        {item.available === true ? (
          <View style={s.availNowRow}>
            <View style={s.availDot} />
            <Text style={s.availNowText}>Now</Text>
          </View>
        ) : (
          <Text style={s.availNextText}>{BUSY_LABEL}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = injectFonts({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 9 },
  thumbWrap: { width: 46, height: 46, borderRadius: 10, overflow: 'hidden', flexShrink: 0 },
  thumbImg: { width: '100%', height: '100%' },
  thumbPlaceholder: {
    width: '100%', height: '100%', backgroundColor: FILL,
    alignItems: 'center', justifyContent: 'center',
  },
  thumbPlaceholderIcon: { fontSize: 18, opacity: 0.4 },

  rowInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontSize: 13, fontWeight: '700', color: DARK, flexShrink: 1 },
  verifiedBadge: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: LINK_BLUE,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  verifiedBadgeText: { fontSize: 8, color: '#FFFFFF', fontWeight: '900' },
  tradeLine: { fontSize: 11, color: LIGHT, fontWeight: '500', marginTop: 1 },
  statsRow: { fontSize: 11, fontWeight: '700', marginTop: 3 },
  statsGreen: { color: GREEN },
  statsDot: { color: LIGHT, fontWeight: '500' },
  newBadge: {
    alignSelf: 'flex-start', backgroundColor: GREEN_LIGHT, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2, marginTop: 3,
  },
  newBadgeText: { fontSize: 10, fontWeight: '700', color: GREEN },

  rightCol: { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  availNowRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
  availNowText: { fontSize: 11, fontWeight: '700', color: GREEN },
  availNextText: { fontSize: 11, fontWeight: '600', color: LIGHT },
});

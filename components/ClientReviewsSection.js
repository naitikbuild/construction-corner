import { View, Text } from 'react-native';
import { injectFonts } from '../theme/typography';

const DARK   = '#262626';
const GREEN  = '#22A559';
const BORDER = '#E5E5E5';
const MID    = '#737373';
const LIGHT  = '#8E8E8E';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toJsDate(v) {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(v) {
  const d = toJsDate(v);
  if (!d) return null;
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function Stars({ value }) {
  return (
    <View style={s.starsRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <Text key={n} style={[s.star, n <= value && s.starActive]}>{n <= value ? '★' : '☆'}</Text>
      ))}
    </View>
  );
}

function ReviewCard({ record, bordered }) {
  const r = record.providerReview;
  return (
    <View style={[s.card, bordered && s.cardBorder]}>
      <View style={s.cardHead}>
        <Text style={s.cardName} numberOfLines={1}>{record.lockedByName || 'A provider'}</Text>
        <Stars value={r.rating} />
      </View>
      <Text style={s.cardMeta} numberOfLines={1}>
        {record.projectName || 'Work record'}{formatDate(r.createdAt) ? ` · ${formatDate(r.createdAt)}` : ''}
      </Text>
      {r.review ? <Text style={s.cardText}>{r.review}</Text> : null}
    </View>
  );
}

// A user's reputation AS A CLIENT — providers' reviews of them, gathered
// across every work_record where they were the client (see
// workRecordService.getClientReviews). Per product decision this only ever
// renders on the client's own profile, never on either work-record detail
// screen (ClientWorkRecordReviewScreen / CreateWorkRecordScreen).
export default function ClientReviewsSection({ reviews = [] }) {
  if (reviews.length === 0) {
    return <Text style={s.placeholder}>No reviews as a client yet</Text>;
  }
  const avg = (reviews.reduce((sum, r) => sum + (r.providerReview.rating || 0), 0) / reviews.length).toFixed(1);
  return (
    <View>
      <View style={s.summaryRow}>
        <Text style={s.summaryAvg}>★ {avg}</Text>
        <Text style={s.summaryCount}>({reviews.length} review{reviews.length === 1 ? '' : 's'})</Text>
      </View>
      {reviews.map((rec, i) => <ReviewCard key={rec.id || i} record={rec} bordered={i > 0} />)}
    </View>
  );
}

const s = injectFonts({
  placeholder: { fontSize: 13, color: LIGHT, fontStyle: 'italic' },

  summaryRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 10 },
  summaryAvg: { fontSize: 16, fontWeight: '800', color: GREEN },
  summaryCount: { fontSize: 12, color: MID, fontWeight: '500' },

  card: { paddingVertical: 12 },
  cardBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardName: { fontSize: 13, fontWeight: '700', color: DARK, flexShrink: 1 },
  cardMeta: { fontSize: 11, color: LIGHT, fontWeight: '500', marginTop: 2 },
  cardText: { fontSize: 13, color: MID, fontWeight: '500', lineHeight: 19, marginTop: 6 },

  starsRow: { flexDirection: 'row', gap: 2 },
  star: { fontSize: 13, color: '#D9D9D9' },
  starActive: { color: GREEN },
});

import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, StatusBar
} from 'react-native';
import { useState } from 'react';
import BottomNav from '../components/BottomNav';

const categories = [
  { icon: '🏛️', label: 'All' },
  { icon: '📐', label: 'Design' },
  { icon: '🏗️', label: 'Structure' },
  { icon: '💻', label: 'Software' },
  { icon: '👷', label: 'Safety' },
  { icon: '💰', label: 'Management' },
];

const featured = [
  {
    emoji: '📐',
    bg: '#1a1a2e',
    title: 'AutoCAD Complete\nMasterclass',
    instructor: 'Rahul Sharma',
    students: '12,400',
    rating: '4.9',
    price: '₹999',
    original: '₹4,999',
    tag: 'Bestseller',
  },
  {
    emoji: '🏗️',
    bg: '#0A2818',
    title: 'RCC Structure\nDesign & Analysis',
    instructor: 'Dr. Amit Patel',
    students: '8,200',
    rating: '4.8',
    price: '₹1,299',
    original: '₹5,999',
    tag: 'Top Rated',
  },
  {
    emoji: '🛋️',
    bg: '#4A0080',
    title: 'Interior Design\nfrom Scratch',
    instructor: 'Priya Agarwal',
    students: '6,800',
    rating: '4.9',
    price: '₹799',
    original: '₹3,999',
    tag: 'New',
  },
];

const courses = [
  {
    emoji: '📐',
    bg: '#EEF2FF',
    accent: '#6366F1',
    title: 'AutoCAD for Civil Engineers',
    instructor: 'Rahul Sharma',
    level: 'Beginner',
    duration: '24 hrs',
    students: '12,400',
    rating: '4.9',
    reviews: 1240,
    price: '₹999',
    original: '₹4,999',
    tag: 'Bestseller',
    lessons: 48,
    skills: ['2D Drafting', 'Floor Plans', 'Sections'],
  },
  {
    emoji: '🏗️',
    bg: '#F0FDF4',
    accent: '#16A34A',
    title: 'RCC Design with STAAD Pro',
    instructor: 'Dr. Amit Patel',
    level: 'Advanced',
    duration: '32 hrs',
    students: '8,200',
    rating: '4.8',
    reviews: 890,
    price: '₹1,299',
    original: '₹5,999',
    tag: 'Top Rated',
    lessons: 64,
    skills: ['STAAD Pro', 'IS Codes', 'Beam Design'],
  },
  {
    emoji: '🛋️',
    bg: '#FDF2F8',
    accent: '#EC4899',
    title: 'Interior Design Masterclass',
    instructor: 'Priya Agarwal',
    level: 'Beginner',
    duration: '18 hrs',
    students: '6,800',
    rating: '4.9',
    reviews: 720,
    price: '₹799',
    original: '₹3,999',
    tag: 'New',
    lessons: 36,
    skills: ['Space Planning', '3D Design', 'Materials'],
  },
  {
    emoji: '💻',
    bg: '#EFF6FF',
    accent: '#3B82F6',
    title: 'Revit Architecture BIM',
    instructor: 'Suresh Kumar',
    level: 'Intermediate',
    duration: '28 hrs',
    students: '5,400',
    rating: '4.7',
    reviews: 560,
    price: '₹1,499',
    original: '₹6,999',
    tag: null,
    lessons: 56,
    skills: ['BIM', 'Revit', '3D Modeling'],
  },
  {
    emoji: '👷',
    bg: '#FFFBEB',
    accent: '#D97706',
    title: 'Construction Safety Management',
    instructor: 'Vikram Singh',
    level: 'Beginner',
    duration: '12 hrs',
    students: '4,200',
    rating: '4.6',
    reviews: 420,
    price: '₹599',
    original: '₹2,999',
    tag: null,
    lessons: 24,
    skills: ['IS Safety Codes', 'PPE', 'Risk Assessment'],
  },
  {
    emoji: '💰',
    bg: '#F0FDF4',
    accent: '#16A34A',
    title: 'Construction Cost Estimation',
    instructor: 'Rajesh Shah',
    level: 'Intermediate',
    duration: '16 hrs',
    students: '3,800',
    rating: '4.8',
    reviews: 380,
    price: '₹899',
    original: '₹4,499',
    tag: null,
    lessons: 32,
    skills: ['BOQ', 'Rate Analysis', 'Tendering'],
  },
];

export default function CoursesScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState('');

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.instructor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0EA5E9" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>📚 Courses</Text>
          <Text style={styles.headerSub}>Learn & grow your skills</Text>
        </View>
        <TouchableOpacity style={styles.myCoursesBtn}>
          <Text style={styles.myCoursesText}>My Courses</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            placeholder="Search courses, instructors..."
            placeholderTextColor="#AAAAAA"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ fontSize: 16, color: '#999' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* FEATURED */}
        {search.length === 0 && (
          <>
            <View style={styles.secHead}>
              <Text style={styles.secTitle}>🔥 Featured Courses</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 10 }}>
              {featured.map((f, i) => (
                <TouchableOpacity key={i} style={[styles.featuredCard, { backgroundColor: f.bg }]}>
                  {f.tag && (
                    <View style={styles.featuredTag}>
                      <Text style={styles.featuredTagText}>{f.tag}</Text>
                    </View>
                  )}
                  <Text style={styles.featuredEmoji}>{f.emoji}</Text>
                  <Text style={styles.featuredTitle}>{f.title}</Text>
                  <Text style={styles.featuredInstructor}>by {f.instructor}</Text>
                  <View style={styles.featuredStats}>
                    <Text style={styles.featuredRating}>⭐ {f.rating}</Text>
                    <Text style={styles.featuredStudents}>· 👥 {f.students}</Text>
                  </View>
                  <View style={styles.featuredPriceRow}>
                    <Text style={styles.featuredPrice}>{f.price}</Text>
                    <Text style={styles.featuredOriginal}>{f.original}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* STATS */}
        {search.length === 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>240+</Text>
              <Text style={styles.statLab}>Courses</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>80+</Text>
              <Text style={styles.statLab}>Instructors</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>1.2L+</Text>
              <Text style={styles.statLab}>Students</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>Certificate</Text>
              <Text style={styles.statLab}>On Completion</Text>
            </View>
          </View>
        )}

        {/* CATEGORIES */}
        {search.length === 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}>
            {categories.map((c, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.catChip, activeCategory === i && styles.catChipActive]}
                onPress={() => setActiveCategory(i)}
              >
                <Text style={styles.catIcon}>{c.icon}</Text>
                <Text style={[styles.catLabel, activeCategory === i && styles.catLabelActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* COURSE LIST */}
        <View style={styles.secHead}>
          <Text style={styles.secTitle}>
            {search.length > 0 ? `Results for "${search}"` : 'All Courses'}
          </Text>
          <Text style={styles.secCount}>{filtered.length} courses</Text>
        </View>

        <View style={styles.coursesList}>
          {filtered.map((c, i) => (
            <TouchableOpacity key={i} style={styles.courseCard}>

              {/* Thumbnail */}
              <View style={[styles.courseThumbnail, { backgroundColor: c.bg }]}>
                <Text style={styles.courseEmoji}>{c.emoji}</Text>
                {c.tag && (
                  <View style={[styles.courseTag, { backgroundColor: c.accent }]}>
                    <Text style={styles.courseTagText}>{c.tag}</Text>
                  </View>
                )}
              </View>

              {/* Content */}
              <View style={styles.courseContent}>
                <Text style={styles.courseTitle}>{c.title}</Text>
                <Text style={styles.courseInstructor}>👤 {c.instructor}</Text>

                <View style={styles.courseStats}>
                  <Text style={styles.courseStat}>⭐ {c.rating}</Text>
                  <Text style={styles.courseStatDot}>·</Text>
                  <Text style={styles.courseStat}>👥 {c.students}</Text>
                  <Text style={styles.courseStatDot}>·</Text>
                  <Text style={styles.courseStat}>🕐 {c.duration}</Text>
                </View>

                <View style={styles.skillsRow}>
                  {c.skills.map((s, si) => (
                    <View key={si} style={[styles.skillChip, { borderColor: c.accent }]}>
                      <Text style={[styles.skillText, { color: c.accent }]}>{s}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.courseMeta}>
                  <View style={[styles.levelBadge, { backgroundColor: c.bg }]}>
                    <Text style={[styles.levelText, { color: c.accent }]}>{c.level}</Text>
                  </View>
                  <Text style={styles.lessonsText}>📖 {c.lessons} lessons</Text>
                </View>

                <View style={styles.coursePriceRow}>
                  <View>
                    <Text style={[styles.coursePrice, { color: c.accent }]}>{c.price}</Text>
                    <Text style={styles.courseOriginal}>{c.original}</Text>
                  </View>
                  <TouchableOpacity style={[styles.enrollBtn, { backgroundColor: c.accent }]}>
                    <Text style={styles.enrollBtnText}>Enroll Now</Text>
                  </TouchableOpacity>
                </View>
              </View>

            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
      <BottomNav navigation={navigation} active="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F0ED' },

  // HEADER
  header: { backgroundColor: '#0EA5E9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 18, color: 'white', fontWeight: '700' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: 'white' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  myCoursesBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  myCoursesText: { fontSize: 12, fontWeight: '700', color: 'white' },

  // SEARCH
  searchWrap: { backgroundColor: '#0EA5E9', paddingHorizontal: 14, paddingBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 13, color: '#111', fontWeight: '600' },

  // FEATURED
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  secTitle: { fontSize: 15, fontWeight: '900', color: '#111' },
  secCount: { fontSize: 12, fontWeight: '600', color: '#6B6560', backgroundColor: '#D9D4CC', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  featuredCard: { width: 200, borderRadius: 16, padding: 16, justifyContent: 'flex-end', height: 180 },
  featuredTag: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FC8019', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  featuredTagText: { fontSize: 9, fontWeight: '800', color: 'white' },
  featuredEmoji: { fontSize: 36, marginBottom: 8 },
  featuredTitle: { fontSize: 13, fontWeight: '800', color: 'white', lineHeight: 18, marginBottom: 4 },
  featuredInstructor: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginBottom: 6 },
  featuredStats: { flexDirection: 'row', marginBottom: 8 },
  featuredRating: { fontSize: 11, fontWeight: '700', color: 'white' },
  featuredStudents: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  featuredPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featuredPrice: { fontSize: 16, fontWeight: '900', color: '#FC8019' },
  featuredOriginal: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textDecorationLine: 'line-through' },

  // STATS
  statsRow: { flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 14, borderRadius: 14, padding: 14, marginBottom: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 13, fontWeight: '900', color: '#0EA5E9', marginBottom: 2 },
  statLab: { fontSize: 9, fontWeight: '600', color: '#6B6560', textAlign: 'center' },
  statDiv: { width: 1, backgroundColor: '#E8E0D8' },

  // CATEGORIES
  catScroll: { paddingVertical: 12 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: 'white', borderWidth: 1.5, borderColor: '#E8E0D8' },
  catChipActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  catIcon: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: '700', color: '#555' },
  catLabelActive: { color: 'white' },

  // COURSE CARDS
  coursesList: { paddingHorizontal: 14, gap: 14 },
  courseCard: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#D9D4CC', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  courseThumbnail: { height: 100, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  courseEmoji: { fontSize: 48 },
  courseTag: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  courseTagText: { fontSize: 10, fontWeight: '800', color: 'white' },
  courseContent: { padding: 14 },
  courseTitle: { fontSize: 14, fontWeight: '800', color: '#111', marginBottom: 4 },
  courseInstructor: { fontSize: 12, color: '#6B6560', marginBottom: 8 },
  courseStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  courseStat: { fontSize: 11, fontWeight: '600', color: '#555' },
  courseStatDot: { fontSize: 11, color: '#CCC' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  skillChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1.5, backgroundColor: '#FAFAFA' },
  skillText: { fontSize: 10, fontWeight: '700' },
  courseMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  levelText: { fontSize: 11, fontWeight: '700' },
  lessonsText: { fontSize: 11, color: '#6B6560', fontWeight: '600' },
  coursePriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 12 },
  coursePrice: { fontSize: 18, fontWeight: '900' },
  courseOriginal: { fontSize: 11, color: '#CCC', textDecorationLine: 'line-through' },
  enrollBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  enrollBtnText: { fontSize: 12, fontWeight: '800', color: 'white' },
});
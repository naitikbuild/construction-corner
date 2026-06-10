import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import BottomNav from '../components/BottomNav';
import { getBookmarks, removeBookmark } from '../services/bookmarkService';
const BLUE = '#FF6B2B';
const BLUE_LIGHT = '#FFF3E0';

const TABS = ['All', 'Professionals', 'Workers', 'Companies', 'Suppliers'];

const PROFILE_SCREEN = {
  professional: 'ProfessionalProfile',
  worker: 'WorkerProfile',
  business: 'BusinessProfile',
  supplier: 'SupplierProfile',
};

const TYPE_EMOJI = {
  professional: '🏛️',
  worker: '👷',
  business: '🏢',
  supplier: '🏭',
};

const TYPE_BG = {
  professional: '#EDE7F6',
  worker: '#FFF3E0',
  business: '#E8F5E9',
  supplier: '#E3F2FD',
};

const TYPE_TAB = {
  professional: 'Professionals',
  worker: 'Workers',
  business: 'Companies',
  supplier: 'Suppliers',
};

function BookmarkCard({ item, onPress, onRemove }) {
  const pt = (item.profileType || '').toLowerCase();
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardMain} onPress={onPress} activeOpacity={0.8}>
        <View style={[styles.avatar, { backgroundColor: TYPE_BG[pt] || '#F5F5F5' }]}>
          <Text style={styles.avatarEmoji}>{TYPE_EMOJI[pt] || '👤'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name || 'Unknown'}</Text>
          <Text style={styles.cardRole} numberOfLines={1}>
            {item.category || item.designation || '—'}
          </Text>
          {(item.city || item.state) ? (
            <Text style={styles.cardLocation} numberOfLines={1}>
              📍 {[item.city, item.state].filter(Boolean).join(', ')}
            </Text>
          ) : null}
        </View>
        <Text style={styles.cardArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.removeBtn} onPress={onRemove} activeOpacity={0.7}>
        <Text style={styles.removeBtnText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function BookmarksScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('All');
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myUid, setMyUid] = useState(null);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const uid = await AsyncStorage.getItem('uid');
      if (!uid) { setLoading(false); return; }
      setMyUid(uid);
      const data = await getBookmarks(uid);
      setBookmarks(data);
    } catch (_) {
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (profileUid, profileName) => {
    Alert.alert(
      'Remove Bookmark',
      `Remove ${profileName} from your saved profiles?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeBookmark(myUid, profileUid);
              setBookmarks(prev => prev.filter(b => b.uid !== profileUid));
            } catch (_) {
              Alert.alert('Error', 'Could not remove bookmark. Please try again.');
            }
          },
        },
      ]
    );
  };

  const filtered = activeTab === 'All'
    ? bookmarks
    : bookmarks.filter(b => {
        const pt = (b.profileType || '').toLowerCase();
        return TYPE_TAB[pt] === activeTab;
      });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Saved Profiles</Text>
          {!loading && (
            <Text style={styles.headerCount}>{bookmarks.length} saved</Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsWrap}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Loading saved profiles...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🔖</Text>
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptySub}>
            {activeTab === 'All'
              ? 'Save profiles by tapping the bookmark icon on any profile'
              : `No ${activeTab.toLowerCase()} saved yet`}
          </Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.exploreBtnText}>Explore Professionals →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {filtered.map((item) => {
            const pt = (item.profileType || '').toLowerCase();
            const screen = PROFILE_SCREEN[pt] || 'ProfessionalProfile';
            return (
              <BookmarkCard
                key={item.uid}
                item={item}
                onPress={() => navigation.navigate(screen, { uid: item.uid })}
                onRemove={() => handleRemove(item.uid, item.name)}
              />
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <BottomNav navigation={navigation} active="MyDashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F0' },
  header: {
    backgroundColor: '#FFFFFF', paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#EFEFEF',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 18, color: '#FF6B2B', fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  headerCount: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 2 },

  tabsWrap: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EFEFEF', maxHeight: 50 },
  tabsContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F5F5F0',
  },
  tabActive: { backgroundColor: BLUE_LIGHT },
  tabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  tabTextActive: { color: BLUE, fontWeight: '800' },

  list: { flex: 1 },
  listContent: { padding: 16, gap: 10 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#EFEFEF',
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarEmoji: { fontSize: 26 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 3 },
  cardRole: { fontSize: 12, color: '#666666', marginBottom: 3 },
  cardLocation: { fontSize: 11, color: '#888' },
  cardArrow: { fontSize: 20, color: '#CCC', marginRight: 4 },

  removeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { fontSize: 16 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  loadingText: { marginTop: 12, color: '#888', fontSize: 13 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  exploreBtn: {
    backgroundColor: BLUE, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 14,
  },
  exploreBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Image, Alert, ActivityIndicator,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { saveProfile, getProfile } from '../services/userService';
import { auth } from '../config/firebase';

const ORANGE = '#FF6B2B';
const GREY_BG = '#F5F5F0';
const BORDER = '#EFEFEF';
const TEXT_DARK = '#1A1A1A';
const TEXT_MID = '#666666';
const TEXT_LIGHT = '#888888';

export default function PersonalProfileSetupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const uid = await AsyncStorage.getItem('uid');
        if (!uid) return;
        let p = null;
        try { p = await getProfile(uid); } catch (_) {}
        if (!p) {
          const local = await AsyncStorage.getItem('localProfile');
          if (local) p = JSON.parse(local);
        }
        if (p && p.profileType === 'personal') {
          setName(p.name || '');
          setPhotoUri(p.photoUri || '');
          setArea(p.area || '');
          setCity(p.city || '');
          setPincode(p.pincode || '');
        }
      } catch (_) {}
    })();
  }, []);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to add a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    if (pincode && !/^\d{6}$/.test(pincode)) {
      Alert.alert('Invalid Pincode', 'Pincode must be a 6-digit number.');
      return;
    }
    setSaving(true);
    try {
      const uid = await AsyncStorage.getItem('uid');
      if (!uid) throw new Error('No session found. Please restart the app.');

      const locationStr = [area.trim(), city.trim()].filter(Boolean).join(', ') + (pincode ? ` — ${pincode}` : '');
      const profileData = {
        name: name.trim(),
        photoUri: photoUri || '',
        area: area.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        location: locationStr,
        profileType: 'personal',
        role: 'personal',
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('userName', profileData.name);

      if (!auth.currentUser) {
        await AsyncStorage.setItem('localProfile', JSON.stringify({ ...profileData, uid }));
      } else {
        await saveProfile(uid, profileData);
      }

      navigation.replace('Home');
    } catch (err) {
      Alert.alert('Save Failed', err.message || 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Complete Your Profile</Text>
        <Text style={styles.headerSub}>Just a few details to get you started</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Photo */}
        <View style={styles.photoRow}>
          <TouchableOpacity style={styles.photoCircleWrap} onPress={pickPhoto} activeOpacity={0.8}>
            <View style={styles.photoCircle}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoImg} />
              ) : (
                <Text style={styles.photoEmoji}>👤</Text>
              )}
              <View style={styles.cameraIcon}>
                <Text style={styles.cameraEmoji}>📷</Text>
              </View>
            </View>
            <Text style={styles.photoCircleLabel}>Profile Photo (optional)</Text>
          </TouchableOpacity>
        </View>

        {/* Name */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Name <Text style={{ color: '#E53E3E' }}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Rahul Sharma"
            placeholderTextColor={TEXT_LIGHT}
          />
        </View>

        {/* Area */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Area / Locality</Text>
          <TextInput
            style={styles.input}
            value={area}
            onChangeText={setArea}
            placeholder="e.g. Bopal, Navrangpura"
            placeholderTextColor={TEXT_LIGHT}
          />
        </View>

        {/* City & Pincode */}
        <View style={styles.locationRow}>
          <View style={[styles.fieldWrap, { flex: 1 }]}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor={TEXT_LIGHT}
            />
          </View>
          <View style={[styles.fieldWrap, { flex: 1 }]}>
            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              value={pincode}
              onChangeText={setPincode}
              placeholder="6-digit"
              placeholderTextColor={TEXT_LIGHT}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveBtn, (!name.trim() || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!name.trim() || saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save & Continue →</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = injectFonts({
  container: { flex: 1, backgroundColor: 'white' },

  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: TEXT_DARK, marginBottom: 4 },
  headerSub: { fontSize: 13, color: TEXT_MID },

  scroll: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },

  photoRow: { alignItems: 'center', marginBottom: 24 },
  photoCircleWrap: { alignItems: 'center', gap: 8 },
  photoCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: GREY_BG,
    alignItems: 'center', justifyContent: 'center', overflow: 'visible',
    borderWidth: 2, borderColor: BORDER, borderStyle: 'dashed',
  },
  photoImg: { width: 96, height: 96, borderRadius: 48 },
  photoEmoji: { fontSize: 42 },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'white',
  },
  cameraEmoji: { fontSize: 14 },
  photoCircleLabel: { fontSize: 11, fontWeight: '700', color: TEXT_MID },

  fieldWrap: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '800', color: TEXT_MID, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: GREY_BG, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 13, fontSize: 15, color: TEXT_DARK,
    borderWidth: 1.5, borderColor: BORDER, fontWeight: '500',
  },
  locationRow: { flexDirection: 'row', gap: 12 },

  bottomBar: {
    padding: 16, paddingBottom: 32,
    backgroundColor: 'white', borderTopWidth: 1, borderTopColor: BORDER,
  },
  saveBtn: { backgroundColor: ORANGE, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: '#FFCBA8' },
  saveBtnText: { fontSize: 16, fontWeight: '900', color: 'white' },
});

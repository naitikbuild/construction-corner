import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Image, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { injectFonts } from '../theme/typography';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { saveProfile, getProfile } from '../services/userService';
import { auth } from '../config/firebase';
import { getCurrentUid } from '../utils/session';

const ORANGE = '#FF6B2B';
const GREEN = '#22A559';
const GREY_BG = '#F5F5F0';
const BORDER = '#EFEFEF';
const TEXT_DARK = '#1A1A1A';
const TEXT_MID = '#666666';
const TEXT_LIGHT = '#888888';

export default function PersonalProfileSetupScreen({ navigation, route }) {
  const redirectTo = route?.params?.redirectTo ?? null;
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initial, setInitial] = useState({ name: '', photoUri: '', city: '', state: '', pincode: '' });
  // False until the prefill effect below finds a saved personal profile —
  // distinguishes "editing my existing profile" (found one) from "finishing
  // signup" (found none), which decides how the final save navigates.
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const uid = await getCurrentUid();
        if (!uid) return;
        let p = null;
        try { p = await getProfile(uid); } catch (_) {}
        if (!p) {
          const local = await AsyncStorage.getItem('localProfile');
          if (local) p = JSON.parse(local);
        }
        if (p && p.profileType === 'personal') {
          const loaded = {
            name: p.name || '', photoUri: p.photoUri || '',
            city: p.city || '', state: p.state || '', pincode: p.pincode || '',
          };
          setName(loaded.name);
          setPhotoUri(loaded.photoUri);
          setCity(loaded.city);
          setState(loaded.state);
          setPincode(loaded.pincode);
          setLat(typeof p.lat === 'number' ? p.lat : null);
          setLng(typeof p.lng === 'number' ? p.lng : null);
          setInitial(loaded);
          setHasExistingProfile(true);
        }
      } catch (_) {}
    })();
  }, []);

  const hasUnsavedChanges = () =>
    name !== initial.name || photoUri !== initial.photoUri ||
    city !== initial.city || state !== initial.state || pincode !== initial.pincode;

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. If you go back now, they will be lost.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to add a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // GPS auto-detect, same pattern as the business/provider profiles
  // (EditProfileScreen's CurrentLocationField) — reverse-geocodes to
  // City + State (+ pincode as a bonus) but never blocks: on denied
  // permission or a failed lookup, the user just falls back to typing
  // city/state manually below.
  const detectLocation = async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission denied', 'You can still enter your city and state manually below.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const results = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const place = results?.[0];
      if (place) {
        setCity(place.city || place.subregion || place.district || city);
        setState(place.region || state);
        setPincode(place.postalCode || pincode);
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
      } else {
        Alert.alert('Could not detect location', 'Please enter your city and state manually below.');
      }
    } catch (_) {
      Alert.alert('Location detection failed', 'Please enter your city and state manually below.');
    } finally {
      setDetecting(false);
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
      const uid = await getCurrentUid();
      if (!uid) throw new Error('No session found. Please restart the app.');

      // Coordinates: GPS-detected ones already live in lat/lng. If the user set
      // location manually instead (or edited city/state after a detect, which
      // clears them), approximate coordinates by geocoding the city/state text.
      // Never blocks saving — falls back to null on any failure.
      let finalLat = lat;
      let finalLng = lng;
      if (finalLat == null && finalLng == null && (city.trim() || state.trim())) {
        try {
          const address = [city.trim(), state.trim()].filter(Boolean).join(', ');
          const geocoded = await Location.geocodeAsync(address);
          if (geocoded?.[0]) {
            finalLat = geocoded[0].latitude;
            finalLng = geocoded[0].longitude;
          }
        } catch (_) {
          // geocoding unavailable/failed — lat/lng stay null
        }
      }

      const locationStr = [city.trim(), state.trim()].filter(Boolean).join(', ') + (pincode ? ` — ${pincode}` : '');
      const profileData = {
        name: name.trim(),
        photoUri: photoUri || '',
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        lat: finalLat,
        lng: finalLng,
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

      if (hasExistingProfile) {
        // Editing an existing profile — keep the screen it was opened from
        // (e.g. Settings/PersonalProfile) reachable via back.
        if (redirectTo?.screen) navigation.replace(redirectTo.screen, redirectTo.params);
        else navigation.replace('Home');
      } else if (redirectTo?.screen) {
        // Fresh signup completing via the login gate — collapse the whole
        // onboarding/role-selection stack (AccountType/Login/this screen)
        // down to Home, then land on the originally-intended destination on
        // top of it, so back goes to Home instead of back into signup.
        navigation.reset({ index: 1, routes: [{ name: 'Home' }, { name: redirectTo.screen, params: redirectTo.params }] });
      } else {
        // Fresh signup completing with no gate destination — Home becomes
        // the root; back exits the app instead of walking into signup.
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } catch (err) {
      Alert.alert('Save Failed', err.message || 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
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

        {/* Current Location — GPS auto-detect, confirmable/editable */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Current Location</Text>
          <TouchableOpacity
            style={styles.detectBtn}
            onPress={detectLocation}
            disabled={detecting}
            activeOpacity={0.8}
          >
            {detecting ? (
              <ActivityIndicator color={GREEN} size="small" />
            ) : (
              <Text style={styles.detectBtnText}>
                {city || state ? '🔄  Re-detect my location' : '📍  Detect my location'}
              </Text>
            )}
          </TouchableOpacity>
          <View style={[styles.locationRow, { marginTop: 12 }]}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={city}
              onChangeText={(v) => { setCity(v); setLat(null); setLng(null); }}
              placeholder="City"
              placeholderTextColor={TEXT_LIGHT}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={state}
              onChangeText={(v) => { setState(v); setLat(null); setLng(null); }}
              placeholder="State"
              placeholderTextColor={TEXT_LIGHT}
            />
          </View>
          <Text style={styles.locationHint}>
            Auto-detected from your device — you can edit if it's not quite right
          </Text>
        </View>

        {/* Pincode */}
        <View style={styles.fieldWrap}>
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

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.saveBtn, (!name.trim() || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!name.trim() || saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save & Continue →</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = injectFonts({
  container: { flex: 1, backgroundColor: 'white' },

  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: GREY_BG,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  backBtnText: { fontSize: 20, fontWeight: '700', color: TEXT_DARK },
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
  detectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EAF7EF', borderRadius: 12, paddingVertical: 13,
    borderWidth: 1.5, borderColor: GREEN, borderStyle: 'dashed',
  },
  detectBtnText: { fontSize: 14, fontWeight: '800', color: GREEN },
  locationHint: { fontSize: 11, color: TEXT_LIGHT, marginTop: 8, fontStyle: 'italic', fontWeight: '500' },

  bottomBar: {
    padding: 16,
    backgroundColor: 'white', borderTopWidth: 1, borderTopColor: BORDER,
  },
  saveBtn: { backgroundColor: ORANGE, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: '#FFCBA8' },
  saveBtnText: { fontSize: 16, fontWeight: '900', color: 'white' },
});

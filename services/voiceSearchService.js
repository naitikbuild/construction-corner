// expo-speech-recognition ships a config plugin that links native code, so
// ExpoSpeechRecognitionModule only exists in a custom development build —
// requireNativeModule() throws synchronously the moment the package is
// imported inside Expo Go (where the native module was never linked). A
// static `import` at the top of a screen would hoist that throw to app
// startup and crash the whole app, so this file loads it lazily via
// `require()` inside a try/catch instead, the first time it's actually
// needed, and every caller in this file treats a load failure the same way
// as "voice search unavailable" rather than letting it propagate.
let speechModule = null;
let loadAttempted = false;

function loadModule() {
  if (loadAttempted) return speechModule;
  loadAttempted = true;
  try {
    // eslint-disable-next-line global-require
    speechModule = require('expo-speech-recognition');
  } catch (_) {
    speechModule = null;
  }
  return speechModule;
}

// True only when the native module is actually linked (dev build / EAS
// build) AND the device itself reports recognition as available. False in
// Expo Go, on unsupported devices, or if anything above throws.
export function isVoiceSearchSupported() {
  const mod = loadModule();
  if (!mod?.ExpoSpeechRecognitionModule) return false;
  try {
    return !!mod.ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch (_) {
    return false;
  }
}

// Requests mic/speech permission, starts listening, and streams the result
// back through callbacks:
//   onStart()            - recognition actually began
//   onResult(transcript) - final transcript recognized
//   onEnd()               - recognition session ended (always fires last)
//   onError(code)         - 'unsupported' | 'denied' | <native error code>
// Returns a stop() function once listening has started, or null immediately
// if it could not start (onError has already been called in that case).
export async function startVoiceSearch({ onStart, onResult, onEnd, onError }) {
  const mod = loadModule();
  const ExpoSpeechRecognitionModule = mod?.ExpoSpeechRecognitionModule;
  if (!ExpoSpeechRecognitionModule) {
    onError?.('unsupported');
    return null;
  }

  try {
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm?.granted) {
      onError?.('denied');
      return null;
    }
  } catch (_) {
    onError?.('unsupported');
    return null;
  }

  const listeners = [];
  const removeAll = () => listeners.forEach((l) => { try { l.remove(); } catch (_) {} });

  try {
    listeners.push(ExpoSpeechRecognitionModule.addListener('start', () => onStart?.()));
    listeners.push(ExpoSpeechRecognitionModule.addListener('end', () => {
      removeAll();
      onEnd?.();
    }));
    listeners.push(ExpoSpeechRecognitionModule.addListener('result', (event) => {
      const transcript = event?.results?.[0]?.transcript;
      if (event?.isFinal && transcript) onResult?.(transcript.trim());
    }));
    listeners.push(ExpoSpeechRecognitionModule.addListener('error', (event) => {
      removeAll();
      onError?.(event?.error || 'unknown');
    }));

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: false,
      continuous: false,
      maxAlternatives: 1,
    });
  } catch (_) {
    removeAll();
    onError?.('unsupported');
    return null;
  }

  return () => {
    try { ExpoSpeechRecognitionModule.stop(); } catch (_) {}
  };
}

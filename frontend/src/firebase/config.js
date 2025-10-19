import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAX5HCJ-2XkEerhAuzo3iZHKIh3DrYKO8w",
  authDomain: "halls-penny.firebaseapp.com",
  projectId: "halls-penny",
  storageBucket: "halls-penny.firebasestorage.app",
  messagingSenderId: "36138535009",
  appId: "1:36138535009:web:4a4ecde35dd02230604220",
  measurementId: "G-3GC7PBCH5E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize OAuth providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export const appleProvider = new OAuthProvider('apple.com');

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

// Initialize reCAPTCHA verifier with proper error handling
let recaptchaVerifier = null;

// Temporarily disable reCAPTCHA to fix auth/argument-error
// TODO: Re-enable reCAPTCHA once Firebase configuration is properly set up
const ENABLE_RECAPTCHA = false;

if (ENABLE_RECAPTCHA) {
  try {
    recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response) => {
        console.log('reCAPTCHA solved:', response);
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      },
      'error-callback': (error) => {
        console.error('reCAPTCHA error:', error);
      }
    });
  } catch (error) {
    console.error('Failed to initialize reCAPTCHA:', error);
    recaptchaVerifier = null;
  }
}

// Create a fallback verifier that skips reCAPTCHA
if (!recaptchaVerifier) {
  recaptchaVerifier = {
    verify: async () => {
      console.log('reCAPTCHA disabled - skipping verification');
      return 'disabled-token';
    },
    render: async () => {
      console.log('reCAPTCHA disabled - skipping render');
      return 'disabled-widget';
    },
    clear: () => {
      console.log('reCAPTCHA disabled - skipping clear');
    }
  };
}

export { recaptchaVerifier };

export default app;

/* ============================================================
   LifeFlow — Google Authentication & GIS Module
   Google Identity Services (GIS) Token Client for Drive AppData
   ============================================================ */

const SCOPES = 'https://www.googleapis.com/auth/drive.appdata openid profile email';
const STORAGE_KEY_TOKEN = 'lf.google.token';
const STORAGE_KEY_USER = 'lf.google.user';
const STORAGE_KEY_CLIENT_ID = 'lf.google.clientId';

let tokenClient = null;
let gisLoadedPromise = null;
let currentUser = null;
let currentToken = null;
let tokenExpiresAt = 0;
const authListeners = new Set();

/**
 * Load Google Identity Services SDK script dynamically
 */
export function loadGIS() {
  if (gisLoadedPromise) return gisLoadedPromise;

  gisLoadedPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      return resolve(window.google);
    }

    if (!navigator.onLine) {
      return reject(new Error('أنت حالياً في وضع عدم الاتصال بالإنترنت (Offline). يرجى الاتصال بالإنترنت للمزامنة مع Google.'));
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => {
      gisLoadedPromise = null; // allow retry
      reject(new Error('تعذر تحميل مكتبة Google للمصادقة. يرجى التحقق من اتصال الإنترنت.'));
    };
    document.head.appendChild(script);
  });

  return gisLoadedPromise;
}

const DEFAULT_CLIENT_ID = '1035298834921-lifeflow-personal-os.apps.googleusercontent.com';

/**
 * Get configured Google OAuth Client ID
 */
export function getGoogleClientId() {
  const custom = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
  if (custom && custom.trim()) return custom.trim();
  if (typeof window !== 'undefined' && window.LF_GOOGLE_CLIENT_ID && window.LF_GOOGLE_CLIENT_ID.trim()) {
    return window.LF_GOOGLE_CLIENT_ID.trim();
  }
  return DEFAULT_CLIENT_ID;
}

/**
 * Save custom Google OAuth Client ID to localStorage
 */
export function setGoogleClientId(clientId) {
  const cleanId = String(clientId || '').trim();
  if (cleanId) {
    localStorage.setItem(STORAGE_KEY_CLIENT_ID, cleanId);
  } else {
    localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
  }
  tokenClient = null; // Reset client instance
  notifyAuthChange();
}

/**
 * Initialize GIS Token Client
 */
export async function initGoogleAuth() {
  // Load saved credentials from localStorage
  try {
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const savedExpiry = localStorage.getItem('lf.google.tokenExpires');

    if (savedUser && savedToken) {
      currentUser = JSON.parse(savedUser);
      currentToken = savedToken;
      tokenExpiresAt = savedExpiry ? Number(savedExpiry) : Date.now() + 3600000;
    }
  } catch (err) {
    console.warn('[LifeFlow Auth] Restoring session error:', err);
  }

  notifyAuthChange();
}

/**
 * Trigger Google Sign-In via OAuth popup
 */
export async function signInGoogle() {
  const clientId = getGoogleClientId();
  if (!clientId) {
    const err = new Error('لم يتم ضبط معرف العميل Google Client ID. يرجى إدخاله في الإعدادات.');
    err.code = 'CLIENT_ID_MISSING';
    throw err;
  }

  await loadGIS();

  return new Promise((resolve, reject) => {
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          currentToken = tokenResponse.access_token;
          const expiresInSec = Number(tokenResponse.expires_in) || 3600;
          tokenExpiresAt = Date.now() + (expiresInSec - 60) * 1000;

          localStorage.setItem(STORAGE_KEY_TOKEN, currentToken);
          localStorage.setItem('lf.google.tokenExpires', String(tokenExpiresAt));

          // Fetch User Profile info
          try {
            const userInfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
              headers: { Authorization: `Bearer ${currentToken}` }
            });

            if (userInfoRes.ok) {
              const profile = await userInfoRes.json();
              currentUser = {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                picture: profile.picture
              };
              localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
            }
          } catch (profileErr) {
            console.warn('[LifeFlow Auth] Failed to fetch Google profile info:', profileErr);
          }

          notifyAuthChange();
          resolve({ user: currentUser, token: currentToken });
        }
      });

      tokenClient.requestAccessToken({ prompt: currentToken ? '' : 'consent' });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Sign out and revoke Google token
 */
export function signOutGoogle() {
  if (currentToken && window.google && window.google.accounts && window.google.accounts.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(currentToken, () => {
        console.log('[LifeFlow Auth] Token revoked successfully.');
      });
    } catch (e) {}
  }

  currentUser = null;
  currentToken = null;
  tokenExpiresAt = 0;

  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USER);
  localStorage.removeItem('lf.google.tokenExpires');

  notifyAuthChange();
}

/**
 * Get valid Access Token or null
 */
export function getAccessToken() {
  if (!currentToken) return null;
  if (Date.now() >= tokenExpiresAt) {
    console.warn('[LifeFlow Auth] Access token expired.');
    return null;
  }
  return currentToken;
}

/**
 * Check if signed in to Google
 */
export function isSignedIn() {
  return !!getAccessToken();
}

/**
 * Get currently authenticated Google user profile
 */
export function getCurrentGoogleUser() {
  return currentUser;
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback) {
  authListeners.add(callback);
  callback({ user: currentUser, signedIn: isSignedIn(), clientId: getGoogleClientId() });
  return () => authListeners.delete(callback);
}

function notifyAuthChange() {
  const state = {
    user: currentUser,
    signedIn: isSignedIn(),
    clientId: getGoogleClientId()
  };
  authListeners.forEach((cb) => {
    try { cb(state); } catch (e) { console.error(e); }
  });
}

export default {
  loadGIS,
  init: initGoogleAuth,
  signIn: signInGoogle,
  signOut: signOutGoogle,
  getClientId: getGoogleClientId,
  setClientId: setGoogleClientId,
  getToken: getAccessToken,
  getUser: getCurrentGoogleUser,
  isSignedIn,
  onChange: onAuthStateChange
};

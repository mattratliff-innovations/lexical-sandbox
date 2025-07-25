import axios from 'axios';
import jwtDecode from 'jwt-decode';

export const TOKEN_EXCHANGE_URL = '/api/icam/oidc_login';
export const ACCESS_TOKEN_KEY = 'access_token';
export const ID_TOKEN_KEY = 'id_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const START_LOGIN_URL = '/api/icam/start_oidc_login';
export const EXTEND_SESSION_URL = '/api/icam/extend_session';
export const DURATION_BEFORE_TOKEN_EXPIRATION_FOR_REFRESH = 2 * 60; // 2 minutes
export const CHECK_ID_TOKEN_EXPIRATION_RATE = 30 * 1000; // 30 seconds

export const ADMINISTRATOR_PERMISSION = 'scribe.administrator';
export const ISO_PERMISSION = 'scribe.immigration_services_officer';

export const USER_FRIENDLY_ADMINISTRATOR_PERMISSION_NAME = 'Administrator';
export const USER_FRIENDLY_ISO_PERMISSION_NAME = 'Immigration Services Officer';

const oidcCode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('code');
};

export const validateToken = (token) => {
  if (token === undefined) return false;
  const parsedToken = jwtDecode(token);

  if (parsedToken === undefined) return false;
  const nowNoMilli = Math.round(Date.now() / 1000);
  return parsedToken.exp > nowNoMilli;
};

export const idToken = () => localStorage.getItem(ID_TOKEN_KEY);
export const refreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const hasValidIdToken = () => {
  const token = idToken();
  if (token === null) return false;
  return !!validateToken(token);
};

export const hasValidRefreshToken = () => {
  const token = refreshToken();
  if (token === null) {
    return false;
  }
  return !!validateToken(token);
};

export const hasOidcCode = () => !!oidcCode();

const assignKeys = (data) => [ACCESS_TOKEN_KEY, ID_TOKEN_KEY, REFRESH_TOKEN_KEY].forEach((key) => localStorage.setItem(key, data[key]));

const doTokenExchange = async () => {
  const response = await axios.get(TOKEN_EXCHANGE_URL, {
    params: { code: oidcCode() },
  });
  assignKeys(response.data);
  window.location.href = '/';
};

export const startLogin = () => {
  window.location.href = START_LOGIN_URL;
};

export const extendSession = async () => {
  const response = await axios.post(EXTEND_SESSION_URL, {
    refreshToken: refreshToken(),
  });
  assignKeys(response.data);
};

export const clearSession = () => [ACCESS_TOKEN_KEY, ID_TOKEN_KEY, REFRESH_TOKEN_KEY].forEach((key) => localStorage.removeItem(key));

const refreshIdToken = () => {
  if (!hasValidIdToken()) return;

  const token = idToken();
  const parsedToken = jwtDecode(token);
  const expirationTime = Number(parsedToken.exp);
  const now = Math.round(Date.now() / 1000);
  if (expirationTime - now < DURATION_BEFORE_TOKEN_EXPIRATION_FOR_REFRESH) extendSession();
};

const idTokenRoles = () => {
  const token = idToken();
  const parsedToken = jwtDecode(token);
  const tokenAttributes = parsedToken.user_attributes;
  return ((tokenAttributes && tokenAttributes['ICAM-App-Access-Role-Scribe']) || []).concat(parsedToken.scopes || []).concat(parsedToken.scope || []);
};

export const idTokenHasAdminPrivileges = () => {
  if (!hasValidIdToken()) return false;

  const roles = idTokenRoles();
  return roles.find((role) => role === ADMINISTRATOR_PERMISSION);
};

export const idTokenHasIsoPrivileges = () => {
  if (!hasValidIdToken()) return false;
  if (idTokenHasAdminPrivileges()) return true;

  const roles = idTokenRoles();
  return roles.find((role) => role === ISO_PERMISSION);
};

export const processOidcSession = () => {
  if (hasOidcCode()) {
    doTokenExchange();
    return { showLoading: true };
  }

  if (!hasValidIdToken() && hasValidRefreshToken()) {
    extendSession();
    return { showLoading: false };
  }

  if (!hasValidIdToken()) {
    startLogin();
    return { showLoading: true };
  }
  return { showLoading: false };
};

export const getRoleNameFromToken = () => {
  if (idTokenHasAdminPrivileges()) {
    return USER_FRIENDLY_ADMINISTRATOR_PERMISSION_NAME;
  }
  return USER_FRIENDLY_ISO_PERMISSION_NAME;
};
export const getRoleNameFromPermission = (roleString) => {
  if (ADMINISTRATOR_PERMISSION === roleString) {
    return USER_FRIENDLY_ADMINISTRATOR_PERMISSION_NAME;
  }
  return USER_FRIENDLY_ISO_PERMISSION_NAME;
};

export const startIdTokenRefreshTimer = () => setInterval(refreshIdToken, CHECK_ID_TOKEN_EXPIRATION_RATE);

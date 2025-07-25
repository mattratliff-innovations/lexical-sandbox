import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import jwtDecode from 'jwt-decode';
import { DateTime } from 'luxon';
import {
  ACCESS_TOKEN_KEY,
  START_LOGIN_URL,
  ID_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  TOKEN_EXCHANGE_URL,
  EXTEND_SESSION_URL,
  CHECK_ID_TOKEN_EXPIRATION_RATE,
  DURATION_BEFORE_TOKEN_EXPIRATION_FOR_REFRESH,
  hasOidcCode,
  processOidcSession,
  idToken,
  extendSession,
  hasValidIdToken,
  hasValidRefreshToken,
  startLogin,
  validateToken,
  clearSession,
  startIdTokenRefreshTimer,
  idTokenHasAdminPrivileges,
  idTokenHasIsoPrivileges,
  getRoleNameFromToken,
  USER_FRIENDLY_ADMINISTRATOR_PERMISSION_NAME,
  USER_FRIENDLY_ISO_PERMISSION_NAME,
  ADMINISTRATOR_PERMISSION,
  ISO_PERMISSION,
} from './Authentication';

jest.mock('jwt-decode', () => jest.fn());

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  Object.defineProperty(window, 'location', {
    value: {
      search: '',
    },
    writable: true,
  });
});

test('idToken returns the access token stored in local storage', () => {
  const token = "I'm a token!";
  localStorage.setItem(ID_TOKEN_KEY, token);

  const result = idToken();

  expect(result).toBe(token);
});

test('startLogin redirects the user to the start login url', () => {
  Object.defineProperty(window, 'location', {
    value: {
      href: '',
    },
    writable: true,
  });

  startLogin();

  expect(window.location.href).toEqual(START_LOGIN_URL);
});

describe('hasOidcCoe', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
      },
      writable: true,
    });
  });

  it('returns false when there is no code', () => {
    const result = hasOidcCode();

    expect(result).toEqual(false);
  });

  it('returns true when there is a code', () => {
    window.location.search = 'code=12345';

    const result = hasOidcCode();

    expect(result).toEqual(true);
  });
});

describe('hasValidIdToken', () => {
  it('returns true when the token expires in the future', () => {
    const token = 'some token';
    const mockFuture = DateTime.now().plus({ hours: 1 }).toSeconds(); // No fate but what we make

    jwtDecode.mockImplementationOnce(() => ({ exp: mockFuture }));

    localStorage.setItem(ID_TOKEN_KEY, token);

    expect(hasValidIdToken()).toEqual(true);
  });

  it('returns false when the token does not exist', () => {
    expect(hasValidIdToken()).toEqual(false);
  });

  it('returns false when the token is null', () => {
    localStorage.setItem(ID_TOKEN_KEY, undefined);

    expect(hasValidIdToken()).toEqual(false);
  });

  it('returns false when the token is expired', () => {
    const token = 'some token';
    const mockPast = DateTime.now().minus({ hours: 1 }).toSeconds();

    jwtDecode.mockImplementationOnce(() => ({ exp: mockPast }));

    localStorage.setItem(ID_TOKEN_KEY, token);

    expect(hasValidIdToken()).toEqual(false);
  });
});

describe('hasValidRefreshToken', () => {
  it('returns true when the token expires in the future', () => {
    const token = 'some token';
    const mockFuture = DateTime.now().plus({ hours: 1 }).toSeconds(); // No fate but what we make

    jwtDecode.mockImplementationOnce(() => ({ exp: mockFuture }));

    localStorage.setItem(REFRESH_TOKEN_KEY, token);

    expect(hasValidRefreshToken()).toEqual(true);
  });

  it('returns false when the token does not exist', () => {
    expect(hasValidRefreshToken()).toEqual(false);
  });

  it('returns false when the token is null', () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, null);

    expect(hasValidIdToken()).toEqual(false);
  });

  it('returns false when the token is expired', () => {
    const token = 'some token';
    const mockPast = DateTime.now().minus({ hours: 1 }).toSeconds();

    jwtDecode.mockImplementationOnce(() => ({ exp: mockPast }));

    localStorage.setItem(REFRESH_TOKEN_KEY, token);

    expect(hasValidRefreshToken()).toEqual(false);
  });
});

describe('extendSession', () => {
  it('with a valid refresh token assigns new tokens', async () => {
    const mockRefreshCall = new MockAdapter(axios);
    const idTokenValue = 'id';
    const accessTokenValue = 'access';
    const refreshTokenValue = 'refresh';
    const newRefreshToken = 'newRefreshToken';

    localStorage.setItem(REFRESH_TOKEN_KEY, refreshTokenValue);

    mockRefreshCall.onPost(EXTEND_SESSION_URL, { refreshToken: refreshTokenValue }).reply(200, {
      [ID_TOKEN_KEY]: idTokenValue,
      [ACCESS_TOKEN_KEY]: accessTokenValue,
      [REFRESH_TOKEN_KEY]: newRefreshToken,
    });

    await extendSession();

    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toEqual(accessTokenValue);
    expect(localStorage.getItem(ID_TOKEN_KEY)).toEqual(idTokenValue);
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toEqual(newRefreshToken);
  });
});

describe('validateToken', () => {
  it('with a undefined param returns false', () => {
    expect(validateToken(undefined)).toEqual(false);
  });
});

describe('clearSession', () => {
  it('clears the tokens set in local storage', () => {
    [ACCESS_TOKEN_KEY, ID_TOKEN_KEY, REFRESH_TOKEN_KEY].forEach((key) => {
      localStorage.setItem(key, key);
    });

    clearSession();

    [ACCESS_TOKEN_KEY, ID_TOKEN_KEY, REFRESH_TOKEN_KEY].forEach((key) => {
      expect(localStorage.getItem(key)).toBe(null);
    });
  });
});

describe('idTokenHasIsoPrivileges', () => {
  it('returns true if the user is an admin', () => {
    const token = 'some token';
    const mockFuture = DateTime.now().plus({ hours: 1 }).toSeconds();

    jwtDecode.mockImplementation(() => ({
      exp: mockFuture,
      user_attributes: {
        'ICAM-App-Access-Role-Scribe': [ADMINISTRATOR_PERMISSION],
      },
    }));

    localStorage.setItem(ID_TOKEN_KEY, token);

    expect(idTokenHasIsoPrivileges()).toBeTruthy();
  });

  it('returns false if the user is not an iso', () => {
    const token = 'some token';
    const mockFuture = DateTime.now().plus({ hours: 1 }).toSeconds();

    jwtDecode.mockImplementation(() => ({
      exp: mockFuture,
      user_attributes: { 'ICAM-App-Access-Role-Scribe': ['scribe.something'] },
    }));

    localStorage.setItem(ID_TOKEN_KEY, token);

    expect(idTokenHasIsoPrivileges()).toBeFalsy();
  });

  it('returns true if the user is an iso', () => {
    const token = 'some token';
    const mockFuture = DateTime.now().plus({ hours: 1 }).toSeconds();

    jwtDecode.mockImplementation(() => ({
      exp: mockFuture,
      scopes: [ISO_PERMISSION],
    }));

    localStorage.setItem(ID_TOKEN_KEY, token);

    expect(idTokenHasIsoPrivileges()).toBeTruthy();
  });
});

describe('idTokenHasAdminPrivileges', () => {
  it('returns true if the user is an admin', () => {
    const token = 'some token';
    const mockFuture = DateTime.now().plus({ hours: 1 }).toSeconds();

    jwtDecode.mockImplementation(() => ({
      exp: mockFuture,
      user_attributes: {
        'ICAM-App-Access-Role-Scribe': [ADMINISTRATOR_PERMISSION],
      },
    }));

    localStorage.setItem(ID_TOKEN_KEY, token);

    expect(idTokenHasAdminPrivileges()).toBeTruthy();
  });

  it('returns false if the user is not an admin', () => {
    const token = 'some token';
    const mockFuture = DateTime.now().plus({ hours: 1 }).toSeconds();

    jwtDecode.mockImplementation(() => ({
      exp: mockFuture,
      user_attributes: { 'ICAM-App-Access-Role-Scribe': [ISO_PERMISSION] },
    }));

    localStorage.setItem(ID_TOKEN_KEY, token);

    expect(idTokenHasAdminPrivileges()).toBeFalsy();
  });
});

describe('getRoleNameFromToken', () => {
  it('returns a user friendly string if the user is an admin', () => {
    const token = 'some token';
    const mockFuture = DateTime.now().plus({ hours: 1 }).toSeconds();

    jwtDecode.mockImplementation(() => ({
      exp: mockFuture,
      user_attributes: {
        'ICAM-App-Access-Role-Scribe': [ADMINISTRATOR_PERMISSION],
      },
    }));

    localStorage.setItem(ID_TOKEN_KEY, token);

    expect(getRoleNameFromToken()).toBe(USER_FRIENDLY_ADMINISTRATOR_PERMISSION_NAME);
  });

  it('returns a user friendly string if the user is an iso', () => {
    const token = 'some token';
    const mockFuture = DateTime.now().plus({ hours: 1 }).toSeconds();

    jwtDecode.mockImplementation(() => ({
      exp: mockFuture,
      user_attributes: { 'ICAM-App-Access-Role-Scribe': [ISO_PERMISSION] },
    }));

    localStorage.setItem(ID_TOKEN_KEY, token);

    expect(getRoleNameFromToken()).toBe(USER_FRIENDLY_ISO_PERMISSION_NAME);
  });
});

describe('processOidcSession', () => {
  it('does the token exchange and prompts the caller to show a loading indicator', async () => {
    const oidcCode = 'code';
    const accessTokenValue = 'access';
    const idTokenValue = 'id';
    const refreshTokenValue = 'refresh';

    Object.defineProperty(window, 'location', {
      value: {
        search: `?code=${oidcCode}`,
      },
      writable: true,
    });
    const mockOidcCodeExchangeCall = new MockAdapter(axios);
    mockOidcCodeExchangeCall.onGet(TOKEN_EXCHANGE_URL, { params: { code: oidcCode } }).reply(200, {
      [ID_TOKEN_KEY]: idTokenValue,
      [ACCESS_TOKEN_KEY]: accessTokenValue,
      [REFRESH_TOKEN_KEY]: refreshTokenValue,
    });

    const result = processOidcSession();
    await new Promise(process.nextTick);

    expect(result.showLoading).toEqual(true);
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toEqual(accessTokenValue);
    expect(localStorage.getItem(ID_TOKEN_KEY)).toEqual(idTokenValue);
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toEqual(refreshTokenValue);
    expect(window.location.href).toEqual('/');
  });

  it('extends the session if the id token is invalid but has a valid refresh token', async () => {
    const refreshTokenValue = 'refresh';
    const mockFuture = DateTime.now().plus({ hours: 1 }).toSeconds(); // No fate but what we make
    jwtDecode.mockImplementationOnce(() => ({ exp: mockFuture }));
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshTokenValue);
    const mockRefreshCall = new MockAdapter(axios);
    const idTokenValue = 'id';
    const accessTokenValue = 'access';
    const newRefreshToken = 'newRefreshToken';
    mockRefreshCall.onPost(EXTEND_SESSION_URL, { refreshToken: refreshTokenValue }).reply(200, {
      [ID_TOKEN_KEY]: idTokenValue,
      [ACCESS_TOKEN_KEY]: accessTokenValue,
      [REFRESH_TOKEN_KEY]: newRefreshToken,
    });

    const result = processOidcSession();
    await new Promise(process.nextTick);

    expect(result.showLoading).toEqual(false);
    expect(jwtDecode.mock.calls[0][0]).toBe(refreshTokenValue);
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toEqual(accessTokenValue);
    expect(localStorage.getItem(ID_TOKEN_KEY)).toEqual(idTokenValue);
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toEqual(newRefreshToken);
  });

  it('starts the login if there is not a valid id token OR a valid refresh token', () => {
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
      },
      writable: true,
    });

    const result = processOidcSession();

    expect(result.showLoading).toEqual(true);
    expect(window.location.href).toEqual(START_LOGIN_URL);
  });

  it('does no processing if there is a valid id token', () => {
    const token = 'some token';
    const mockFuture = DateTime.now().plus({ hours: 1 }).toSeconds();
    jwtDecode.mockImplementation(() => ({ exp: mockFuture }));
    localStorage.setItem(ID_TOKEN_KEY, token);

    const result = processOidcSession();

    expect(jwtDecode.mock.calls[0][0]).toBe(token);
    expect(result.showLoading).toBe(false);
  });
});

describe('startIdTokenRefreshTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('does not refresh the token if there is not a valid access token', () => {
    jwtDecode.mockImplementation(() => ({ exp: 'some date' }));

    startIdTokenRefreshTimer();
    jest.advanceTimersByTime(CHECK_ID_TOKEN_EXPIRATION_RATE + 1);

    expect(jwtDecode.mock.calls.length).toBe(0);
  });

  it('does not refresh the token if the expiration winow requirement is not meant', () => {
    const token = 'some token';
    localStorage.setItem(ID_TOKEN_KEY, token);
    const expirationTime = Math.round(Date.now() / 1000 + (CHECK_ID_TOKEN_EXPIRATION_RATE / 1000 + DURATION_BEFORE_TOKEN_EXPIRATION_FOR_REFRESH + 1));
    jwtDecode.mockImplementation(() => ({ exp: expirationTime }));

    startIdTokenRefreshTimer();
    jest.advanceTimersByTime(CHECK_ID_TOKEN_EXPIRATION_RATE + 1);

    expect(jwtDecode.mock.calls[0][0]).toBe(token);
  });

  it('refreshes the token if the expiration winow requirement is meant', async () => {
    const oldIdToken = 'some token';
    localStorage.setItem(ID_TOKEN_KEY, oldIdToken);
    const oldRefreshToken = 'oldRefreshToken';
    localStorage.setItem(REFRESH_TOKEN_KEY, oldRefreshToken);
    const expirationTime = Math.round(Date.now() / 1000 + (CHECK_ID_TOKEN_EXPIRATION_RATE / 1000 + 1));
    jwtDecode.mockImplementation(() => ({ exp: expirationTime }));
    const mockRefreshCall = new MockAdapter(axios);
    const idTokenValue = 'id';
    const accessTokenValue = 'access';
    const newRefreshToken = 'newRefreshToken';
    mockRefreshCall.onPost(EXTEND_SESSION_URL, { refreshToken: oldRefreshToken }).reply(200, {
      [ID_TOKEN_KEY]: idTokenValue,
      [ACCESS_TOKEN_KEY]: accessTokenValue,
      [REFRESH_TOKEN_KEY]: newRefreshToken,
    });

    startIdTokenRefreshTimer();
    jest.advanceTimersByTime(CHECK_ID_TOKEN_EXPIRATION_RATE + 1);

    expect(jwtDecode.mock.calls[0][0]).toBe(oldIdToken);
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    await new Promise(process.nextTick);
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toEqual(accessTokenValue);
    expect(localStorage.getItem(ID_TOKEN_KEY)).toEqual(idTokenValue);
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toEqual(newRefreshToken);
  });
});

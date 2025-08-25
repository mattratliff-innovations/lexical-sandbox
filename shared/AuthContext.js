// AuthContext.js - Authentication context and hook
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

// Auth context
const AuthContext = createContext(null);

// Auth actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  SET_LOADING: 'SET_LOADING',
};

// Initial auth state
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.TOKEN_REFRESH:
      return {
        ...state,
        token: action.payload.token,
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.isLoading,
      };
    
    default:
      return state;
  }
};

// Token storage utilities
const tokenStorage = {
  get: () => {
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting token from storage:', error);
      return null;
    }
  },
  
  set: (token) => {
    try {
      localStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error setting token in storage:', error);
    }
  },
  
  remove: () => {
    try {
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing token from storage:', error);
    }
  },
  
  getRefresh: () => {
    try {
      return localStorage.getItem('refreshToken');
    } catch (error) {
      console.error('Error getting refresh token from storage:', error);
      return null;
    }
  },
  
  setRefresh: (token) => {
    try {
      localStorage.setItem('refreshToken', token);
    } catch (error) {
      console.error('Error setting refresh token in storage:', error);
    }
  },
  
  removeRefresh: () => {
    try {
      localStorage.removeItem('refreshToken');
    } catch (error) {
      console.error('Error removing refresh token from storage:', error);
    }
  }
};

// Token validation utility
const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp > (currentTime + 30); // 30 second buffer
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

// Auth Provider Component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: { isLoading: true } });
      
      const token = tokenStorage.get();
      const refreshToken = tokenStorage.getRefresh();
      
      if (token && isTokenValid(token)) {
        // Token is valid, extract user info
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: {
                userId: payload.userId,
                username: payload.username,
                email: payload.email,
                permissions: payload.permissions || [],
              },
              token,
              refreshToken,
            },
          });
        } catch (error) {
          console.error('Error parsing token:', error);
          // Clear invalid tokens
          tokenStorage.remove();
          tokenStorage.removeRefresh();
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: { isLoading: false } });
        }
      } else if (refreshToken) {
        // Try to refresh the token
        try {
          await refreshAuthToken(refreshToken);
        } catch (error) {
          console.error('Token refresh failed during initialization:', error);
          // Clear invalid refresh token
          tokenStorage.removeRefresh();
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: { isLoading: false } });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: { isLoading: false } });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      
      // Store tokens
      tokenStorage.set(data.token);
      if (data.refreshToken) {
        tokenStorage.setRefresh(data.refreshToken);
      }
      
      // Update state
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: data.user,
          token: data.token,
          refreshToken: data.refreshToken,
        },
      });
      
      return data;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: error.message },
      });
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Optional: Call logout endpoint to invalidate token on server
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`,
        },
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local state and storage
      tokenStorage.remove();
      tokenStorage.removeRefresh();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, [state.token]);

  // Refresh token function
  const refreshAuthToken = useCallback(async (refreshToken) => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      
      // Update stored token
      tokenStorage.set(data.token);
      
      // Update state
      dispatch({
        type: AUTH_ACTIONS.TOKEN_REFRESH,
        payload: { token: data.token },
      });
      
      return data.token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear tokens and logout user
      tokenStorage.remove();
      tokenStorage.removeRefresh();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      throw error;
    }
  }, []);

  // Get valid token (with automatic refresh)
  const getValidToken = useCallback(async () => {
    if (isTokenValid(state.token)) {
      return state.token;
    }
    
    // Token is invalid or expired, try to refresh
    const refreshToken = tokenStorage.getRefresh();
    if (refreshToken) {
      try {
        return await refreshAuthToken(refreshToken);
      } catch (error) {
        console.error('Failed to refresh token:', error);
        return null;
      }
    }
    
    return null;
  }, [state.token, refreshAuthToken]);

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    login,
    logout,
    refreshAuthToken,
    getValidToken,
    
    // Utilities
    isTokenValid: () => isTokenValid(state.token),
    hasPermission: (permission) => {
      return state.user?.permissions?.includes(permission) || state.user?.isAdmin || false;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// HOC for protected components
export function withAuth(Component) {
  const AuthenticatedComponent = (props) => {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return <div>Loading...</div>; // Replace with your loading component
    }
    
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return <div>Please log in to access this feature.</div>;
    }
    
    return <Component {...props} />;
  };
  
  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
}

// Hook for protected API calls
export function useAuthenticatedFetch() {
  const { getValidToken } = useAuth();
  
  return useCallback(async (url, options = {}) => {
    const token = await getValidToken();
    
    if (!token) {
      throw new Error('No valid authentication token available');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
    
    return fetch(url, {
      ...options,
      headers,
    });
  }, [getValidToken]);
}
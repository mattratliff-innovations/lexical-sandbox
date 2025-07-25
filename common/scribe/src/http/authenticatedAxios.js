import axios from 'axios';
import applyCaseMiddleware from 'axios-case-converter';

import { idToken } from '../oidc/Authentication';

const APP_API_ENDPOINT = '/api/scribe/v1';
const FLIPPER_API_ENDPOINT = '/api/flags/feature_flags';
const PDF_ENDPOINT = '/api/pdf';
const GRAMMAR_CHECK_ENDPOINT = '/api/grammar';
const PRESERVED_KEYS = ['_destroy'];

const createAuthenticatedAxios = () => {
  const instance = applyCaseMiddleware(
    axios.create({
      headers: {
        Authorization: `Bearer ${idToken()}`,
      },
    }),
    { preservedKeys: PRESERVED_KEYS }
  );
  return instance;
};

export { createAuthenticatedAxios, APP_API_ENDPOINT, FLIPPER_API_ENDPOINT, PDF_ENDPOINT, GRAMMAR_CHECK_ENDPOINT };

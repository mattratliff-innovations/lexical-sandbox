import { toast } from 'react-toastify';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import upsertUser from './SaveUserToken';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../http/authenticatedAxios';

jest.mock('../http/authenticatedAxios');
jest.mock('react-toastify');

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });
const axiosCall = () => mockAxios.onPost(`${APP_API_ENDPOINT}/users/upsert`);

describe('upsertUser', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    createAuthenticatedAxios.mockImplementation(() => axios);
  });
  it('calls the upsert user endpoint', async () => {
    axiosCall().reply(200, {});

    await upsertUser();

    expect(mockAxios.history.post.length).toEqual(1);
    expect(createAuthenticatedAxios.mock.calls).toHaveLength(1);
  });

  it('shows an error message if the call has an error', async () => {
    axiosCall().timeout();
    toast.error.mockImplementation(() => 42);

    await upsertUser();

    expect(mockAxios.history.post.length).toEqual(1);
    expect(toast.error.mock.calls).toHaveLength(1);
    expect(createAuthenticatedAxios.mock.calls).toHaveLength(1);
  });
});

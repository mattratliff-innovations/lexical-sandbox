import MockAdapter from 'axios-mock-adapter';
import { createAuthenticatedAxios } from './authenticatedAxios';
import { idToken } from '../oidc/Authentication';

jest.mock('../oidc/Authentication');

test('createAuthenticatedAxios sets the access token in the request', async () => {
  const token = "I'm a JWT!";
  idToken.mockImplementation(() => token);
  const authenticatedAxios = createAuthenticatedAxios();
  const mockedAxios = new MockAdapter(authenticatedAxios);
  mockedAxios.onGet('something.example', undefined, expect.objectContaining({ Authorization: `Bearer ${token}` })).reply(200, { some: 'result' });

  const response = await authenticatedAxios.get('something.example');

  expect(response.data.some).toEqual('result');
});

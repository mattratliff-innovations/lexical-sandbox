import { toast, Flip } from 'react-toastify';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../http/authenticatedAxios';

const upsertUser = async () => {
  const axios = createAuthenticatedAxios();
  await axios.post(`${APP_API_ENDPOINT}/users/upsert`).catch(() => {
    toast.error('There was an error updating User data', {
      position: 'top-center',
      transition: Flip,
      theme: 'dark',
    });
  });
};

export default upsertUser;

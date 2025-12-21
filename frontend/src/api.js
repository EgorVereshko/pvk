import axios from 'axios';

axios.defaults.withCredentials = true;

export const getCsrfToken = async () => {
  try {
    const response = await axios.get('/api/csrf/');
    return response.data;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    throw error;
  }
};

export const setupAxiosInterceptors = () => {
  axios.interceptors.request.use(async (config) => {
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];

    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 403) {
        console.error('CSRF or permissions error:', error);
      }
      return Promise.reject(error);
    }
  );
};
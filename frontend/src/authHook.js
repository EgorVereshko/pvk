import {useState, useEffect} from 'react';
import {Navigate, useNavigate} from 'react-router-dom';
import axios from 'axios';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authResponse = await axios.get('/api/check_auth/');
      if (authResponse.data.is_authenticated) {
        setIsAuthenticated(true);

        const profileResponse = await axios.get('/api/user/');
        setUser(profileResponse.data)
      }
    } catch (err) {
      console.log('Error', err.message);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout/');
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  return {isAuthenticated, user, authLoading, handleLogout, checkAuthStatus};
};
import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useAppDispatch } from '../redux/hooks';
import { setAuth, logout, setLoading } from '../redux/slices/authSlice';
import { authApi } from '../lib/api';

export function AuthWatcher() {
  const { isLoaded, userId, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    async function sync() {
      if (isLoaded && userId && clerkUser) {
        dispatch(setLoading(true));
        try {
          const token = await getToken();
          if (token) {
            const response = await authApi.sync({
              token,
              clerkId: userId,
              email: clerkUser.primaryEmailAddress?.emailAddress || '',
            });
            
            dispatch(setAuth({
              user: response.data.user,
              token: response.data.accessToken,
              role: response.data.user.role,
            }));
          }
        } catch (err) {
          console.error('Auth sync failed', err);
          dispatch(logout());
        } finally {
          dispatch(setLoading(false));
        }
      } else if (isLoaded && !userId) {
        dispatch(logout());
      }
    }

    sync();
  }, [isLoaded, userId, clerkUser, dispatch, getToken]);

  return null;
}

import { useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useAppDispatch } from '../redux/hooks';
import { setAuth, logout, setLoading } from '../redux/slices/authSlice';
import { authApi } from '../lib/api';

export function AuthWatcher() {
  const { isLoaded, userId, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const dispatch = useAppDispatch();
  // Track whether enough time has passed since mount to safely dispatch logout.
  // This prevents a false logout during the brief window when Clerk is re-hydrating
  // on page reload, which was causing wagmi to lose its wallet connection.
  const canLogout = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      canLogout.current = true;
    }, 600);
    return () => clearTimeout(timer);
  }, []);

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
      } else if (isLoaded && !userId && canLogout.current) {
        // Only dispatch logout after Clerk has had time to fully restore the session.
        dispatch(logout());
      }
    }

    sync();
  }, [isLoaded, userId, clerkUser, dispatch, getToken]);

  return null;
}

import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Endpoint from '@/API/apiConfig';
import { useRouter } from 'next/router';
import { useAppDispatch } from '@/store';
import { setAuth, clearAuth } from '@/store/slices/authSlice';
import { authService } from '@/services/auth.service';
import { Box, TextField, Button, Typography, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  data?: { token: string; id: string; firstName: string; lastName: string; email: string; role: string };
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loader, setLoader] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false); 
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!router.isReady) return;

    // Deep-audit / live-bug fix: this page previously decided "already
    // logged in" purely from localStorage (authService.getToken()), while
    // src/middleware.ts -- which actually gates /admin/** -- trusts only
    // the separate `auth_token` cookie. The two stores can fall out of
    // sync (e.g. the cookie's 1-day expiry lapses, or gets cleared by
    // browser privacy settings, while localStorage's token has no expiry
    // at all) without ever going through logout. When that happened, this
    // effect would push to the redirect target, middleware would see no
    // cookie and bounce straight back to /login?redirect=..., and this
    // effect would fire again on remount -- an infinite router.push loop
    // that manifested live as every screen "buffering" (Chrome's own
    // navigation-throttling warning was the only visible symptom).
    // Checking both stores, and clearing the stale one instead of
    // pushing when they disagree, breaks the loop and is the honest
    // "you're not really logged in" case rather than a cosmetic guard.
    const localToken = authService.getToken();
    const cookieToken = Cookies.get('auth_token');

    if (localToken && cookieToken) {
      const redirectPath = (router.query.redirect as string) || '/';
      router.push(redirectPath);
    } else if (localToken && !cookieToken) {
      authService.clearAuth();
      dispatch(clearAuth());
      setLoader(false);
    } else {
      setLoader(false);
    }
  }, [router.isReady, router, dispatch]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(Endpoint.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      // Log response status and headers for debugging

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON Response:', text);
        throw new Error('Server returned a non-JSON response. Check the endpoint or server configuration.');
      }

      const data: LoginResponse = await response.json();

      if (data.success && data.data) {
        const { token, id, firstName, lastName, email, role } = data.data;
        const user: UserData = { id, firstName, lastName, email, role };

        const isProduction = process.env.NODE_ENV === 'production';

        // Store in cookies. sameSite is always 'Lax' (not 'None'): this
        // cookie is read only by this app's own middleware.ts on the same
        // origin -- it's never sent cross-site (the backend, a separate
        // deployment, authenticates via the Authorization header only,
        // never cookies -- confirmed via `grep req.cookies` across its
        // middleware returning no matches). 'None' is for cookies that
        // must ride along on cross-site requests; using it here bought
        // nothing and made the cookie a target for the stricter rejection/
        // partitioning rules browsers apply to SameSite=None cookies
        // (Safari ITP, Brave, some privacy extensions) -- while
        // localStorage (used elsewhere as the token source of truth) is
        // immune to all of that. That divergence is what caused the live
        // infinite-redirect-loop bug: the cookie could silently vanish
        // while localStorage's copy of the token persisted, so this
        // page's "already logged in" check and middleware.ts's cookie
        // check permanently disagreed. See the loader effect below for
        // the other half of this fix.
        //
        // Live-bug fix #2: this cookie used to hold the actual JWT, not a
        // marker. The JWT embeds the caller's full roleData (including the
        // entire permissions object) -- after the Admin role's permissions
        // grew from 26 to 55 keys (the live DB fix), that pushed the JWT
        // well past ~8000 characters. A single cookie's browser-enforced
        // limit is ~4096 bytes, so the browser was silently refusing to
        // store it at all -- js-cookie doesn't throw on this, so nothing
        // in the UI signalled it. The next navigation's middleware check
        // then always failed (`Cookies.get('auth_token')` came back
        // empty), bouncing straight back to /login and reproducing the
        // exact same symptom as the loop above, just triggered by login
        // itself rather than a stale session. middleware.ts only ever
        // needs to know a token *exists* -- it can't validate the JWT's
        // signature anyway (no JWT_SECRET on this deployment) -- so the
        // cookie now holds a fixed, tiny presence marker instead of the
        // real token; the real JWT continues to live in localStorage,
        // which has no comparable size limit, and is what every API call
        // actually sends as the Authorization header.
        Cookies.set('auth_token', '1', {
          expires: 1,
          secure: isProduction,
          sameSite: 'Lax',
        });
        Cookies.set('user', JSON.stringify(user), {
          expires: 1,
          secure: isProduction,
          sameSite: 'Lax',
        });

        // Store in authService and Redux
        authService.setToken(token);
        authService.setUser(user as any);
        dispatch(setAuth({ token, user: user as any }));

        // Debug: Log stored values

        // Redirect to intended page or default
        const redirectPath = (router.query.redirect as string) || '/';
        setTimeout(() => {
          router.push(redirectPath);
        }, 100);
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again later.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  if (loader) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(140deg, #a1c4fd 10%, #c2e9fb 50%, #d4a0fc 100%)',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(140deg, #a1c4fd 10%, #c2e9fb 50%, #d4a0fc 100%)',
      }}
    >
      <Box
        sx={{
          background: 'rgba(255,255,255,0.85)',
          borderRadius: 5,
          boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
          p: { xs: 3, sm: 5 },
          minWidth: { xs: 300, sm: 600 },
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            color: 'rgba(140, 82, 255, 0.8)',
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          Login
        </Typography>
        {error && (
          <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}
        <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
          <TextField
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            sx={{ mb: 3 }}
          />
          <TextField
            type={showPassword ? 'text' : 'password'}
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            sx={{ mb: 4 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            disabled={loading}
            fullWidth
            variant="contained"
            sx={{
              py: 1.5,
              background: loading
                ? 'gray'
                : 'linear-gradient(90deg, #a259f7 0%, #7f56d9 100%)',
              fontWeight: 600,
              fontSize: 18,
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
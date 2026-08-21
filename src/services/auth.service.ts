import axios, { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import { Role } from './role.service';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

// src/pages/login/index.tsx already sets an `auth_token` cookie
// (js-cookie) alongside localStorage, specifically so that Next.js
// middleware (src/middleware.ts) — which runs server-side and can't see
// localStorage — has something to check. That middleware used to read
// the cookie and then ignore it ("client-side components will handle
// it"); it's now wired up to do a real presence check.
//
// The bug this fixes: nothing ever cleared that cookie on logout.
// clearToken/clearAuth wiped localStorage but left the cookie in place
// (valid for the js-cookie call's 1-day expiry), so the middleware's new
// presence check could pass for a user who had just logged out. Clearing
// it here closes that gap.
//
// Note this is a presence check, not a signature/expiry check — the
// middleware doesn't have the JWT secret (backend-only, deliberately not
// shared with the frontend deployment). A stale or tampered cookie can
// still pass the middleware; it just means the first API call fails with
// a real 401 from the backend, same as today. The middleware closes the
// "anyone can load the page" gap; the backend's authenticateToken
// remains the actual security boundary.
function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
}

export const authService = {
  getToken: () => {
    return localStorage.getItem('auth_token');
  },
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },
  clearToken: () => {
    localStorage.removeItem('auth_token');
    clearAuthCookie();
  },
  getUser: (): User | null => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },
  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    clearAuthCookie();
  },
  fetchUser: async (token: string, userId: string): Promise<User> => {
    try {
      const response: AxiosResponse<{ success: boolean; data: any }> = await axios.get(
        `${Endpoint.GET_USER_PROFILE}/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        const { data } = response.data;
        return {
          id: data._id, // Map _id to id
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
        };
      }
      throw new Error('Failed to fetch user data');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user data');
    }
  },
};
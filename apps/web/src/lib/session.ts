import { ref } from 'vue';
import { ApiError, api } from './api.ts';
import type { Me } from './types.ts';

export const me = ref<Me | null>(null);
let loaded = false;

/** Loads the logged-in person once; null when nobody is signed in. */
export async function loadMe(force = false): Promise<Me | null> {
  if (loaded && !force) return me.value;
  try {
    me.value = await api.get<Me>('/api/me');
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    me.value = null;
  }
  loaded = true;
  return me.value;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
  me.value = null;
}

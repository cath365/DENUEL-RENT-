export async function register(payload: { name?: string; email: string; password: string; phone?: string; role?: string; serviceType?: string }) {
  try {
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const text = await res.text();
    if (!text) return { error: 'Empty response from server' };
    try {
      return JSON.parse(text);
    } catch {
      return { error: 'Invalid response from server' };
    }
  } catch (err: any) {
    return { error: err?.message || 'Network error' };
  }
}

export async function login(payload: { email: string; password: string }) {
  try {
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const text = await res.text();
    if (!text) return { error: 'Empty response from server' };
    try {
      return JSON.parse(text);
    } catch {
      return { error: 'Invalid response from server' };
    }
  } catch (err: any) {
    return { error: err?.message || 'Network error' };
  }
}

export async function me() {
  try {
    const res = await fetch('/api/auth/me');
    const text = await res.text();
    if (!text) return { user: null };
    try {
      return JSON.parse(text);
    } catch {
      return { user: null };
    }
  } catch {
    return { user: null };
  }
}

export async function logout() {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    const text = await res.text();
    if (!text) return { ok: true };
    try {
      return JSON.parse(text);
    } catch {
      return { ok: true };
    }
  } catch {
    return { error: 'Logout failed' };
  }
}
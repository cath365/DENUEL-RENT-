"use client";

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const parts = document.cookie.split(';').map((p) => p.trim());
  for (const part of parts) {
    if (!part.startsWith(`${name}=`)) continue;
    return decodeURIComponent(part.slice(name.length + 1));
  }
  return null;
}

export function getCsrfToken(): string | null {
  return getCookie('denuel_csrf');
}

export async function csrfFetch(input: any, init: any = {}) {
  const token = getCsrfToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('x-csrf-token', token);
  return fetch(input, { ...init, headers });
}


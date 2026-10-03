import { requireCsrf } from '../lib/auth';

describe('CSRF helper', () => {
  it('throws when header missing or mismatched', () => {
    const req = new Request('http://localhost/api/test', { method: 'POST', headers: { cookie: 'denuel_csrf=abcd' } });
    let thrown = null;
    try {
      requireCsrf(req);
    } catch (e: any) {
      thrown = e;
    }
    expect(thrown).toBeTruthy();
    expect(thrown?.status).toBe(403);
  });

  it('allows when header matches cookie', () => {
    const req = new Request('http://localhost/api/test', { method: 'POST', headers: { cookie: 'denuel_csrf=token123', 'x-csrf-token': 'token123' } });
    expect(requireCsrf(req)).toBe(true);
  });
});
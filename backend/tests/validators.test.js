const { registerBody, loginBody, paginationQuery, matchBody, createJobBody } = require('../src/validators');

describe('registerBody', () => {
    test('defaults role to CANDIDATE', () => {
        const parsed = registerBody.parse({ email: 'a@b.com', password: 'password1', name: 'A' });
        expect(parsed.role).toBe('CANDIDATE');
    });

    test('rejects privilege escalation to ADMIN', () => {
        expect(() => registerBody.parse({ email: 'a@b.com', password: 'password1', name: 'A', role: 'ADMIN' })).toThrow();
    });

    test('allows RECRUITER', () => {
        const parsed = registerBody.parse({ email: 'a@b.com', password: 'password1', name: 'A', role: 'RECRUITER' });
        expect(parsed.role).toBe('RECRUITER');
    });

    test('normalizes email (trim + lowercase)', () => {
        const parsed = registerBody.parse({ email: '  A@B.COM ', password: 'password1', name: 'A' });
        expect(parsed.email).toBe('a@b.com');
    });

    test('rejects short passwords', () => {
        expect(() => registerBody.parse({ email: 'a@b.com', password: 'short', name: 'A' })).toThrow();
    });
});

describe('loginBody', () => {
    test('requires email and password', () => {
        expect(() => loginBody.parse({ email: 'a@b.com' })).toThrow();
    });
});

describe('paginationQuery', () => {
    test('coerces strings to numbers with defaults', () => {
        expect(paginationQuery.parse({})).toEqual({ page: 1, limit: 20 });
        expect(paginationQuery.parse({ page: '3', limit: '50' })).toEqual({ page: 3, limit: 50 });
    });

    test('caps limit at 100', () => {
        expect(() => paginationQuery.parse({ limit: '101' })).toThrow();
    });
});

describe('matchBody', () => {
    test('requires valid uuids', () => {
        expect(() => matchBody.parse({ resumeId: 'nope', jobId: 'nope' })).toThrow();
    });
});

describe('createJobBody', () => {
    test('defaults skills_required to empty array', () => {
        const parsed = createJobBody.parse({ title: 'Dev', description: 'Build things' });
        expect(parsed.skills_required).toEqual([]);
    });
});

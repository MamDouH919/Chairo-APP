import { qk } from '@/hooks/queries';
import type { Tokens, User } from '@/lib/api';
import { bindSession } from '@/lib/api/http';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/stores/auth';

jest.mock('@/lib/api/http', () => ({ ...jest.requireActual('@/lib/api/http'), bindSession: jest.fn() }));
jest.mock('@react-native-community/netinfo', () => ({ addEventListener: () => () => undefined }));
jest.mock('@/lib/storage', () => ({
  StorageKeys: { refreshToken: 'r', user: 'u', policyAccepted: 'p', deviceId: 'd' },
  storage: { get: async () => null, set: async () => undefined, remove: async () => undefined },
}));
jest.mock('@/components/ui/feedback', () => ({ toast: jest.fn() }));

const user = (id: string) => ({ id, name: id }) as User;

describe('account isolation', () => {
  it('keeps private query keys apart per user', () => {
    useAuth.setState({ user: user('a') });
    const a = qk.bookings('upcoming');
    useAuth.setState({ user: user('b') });
    expect(qk.bookings('upcoming')).not.toEqual(a);
    expect(a).toContain('a');
  });

  it('drops all cached data on sign-out, and in-flight responses stay out', async () => {
    useAuth.setState({ user: user('a'), status: 'signedIn' });
    const key = qk.bookings('upcoming');
    queryClient.setQueryData(key, ['bookings of a']);

    let finish = (_: string[]) => {};
    const inFlight = queryClient.fetchQuery({
      queryKey: qk.record(),
      queryFn: () => new Promise<string[]>((r) => (finish = r)),
    });

    await useAuth.getState().signOut({ remote: false });
    finish(['record of a']);
    await inFlight.catch(() => undefined);

    expect(useAuth.getState().status).toBe('signedOut');
    expect(useAuth.getState().user).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('does not let a late token refresh bring back a signed-out session', async () => {
    const session = (jest.mocked(bindSession).mock.calls[0] as unknown as [{ onTokens: (t: Tokens) => Promise<void> }])[0];
    const tokens = { accessToken: 'late', refreshToken: 'late' } as Tokens;

    useAuth.setState({ status: 'signedOut', accessToken: null });
    await session.onTokens(tokens);
    expect(useAuth.getState().accessToken).toBeNull();

    useAuth.setState({ status: 'signedIn' });
    await session.onTokens(tokens);
    expect(useAuth.getState().accessToken).toBe('late');
  });
});

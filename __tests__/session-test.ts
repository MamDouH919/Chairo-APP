import { bindSession, request } from '@/lib/api/http';

const reply = (status: number, body: unknown) => ({ status, json: async () => body }) as Response;
const unauthorized = reply(401, { success: false, error: { code: 'TOKEN_EXPIRED', message: 'expired' } });

describe('session refresh', () => {
  const onSessionLost = jest.fn();
  const onTokens = jest.fn(async () => undefined);
  const fetchMock = jest.fn();

  beforeEach(async () => {
    // The single-flight refresh promise is cleared on the next tick.
    await new Promise((resolve) => setTimeout(resolve, 0));
    jest.clearAllMocks();
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
    bindSession({
      getAccessToken: () => 'old',
      getRefreshToken: async () => 'refresh',
      onTokens,
      onSessionLost,
    });
  });

  it('retries the request after a successful refresh', async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(reply(200, { success: true, data: { accessToken: 'new' } }))
      .mockResolvedValueOnce(reply(200, { success: true, data: 'ok' }));
    await expect(request('/x')).resolves.toBe('ok');
    expect(onTokens).toHaveBeenCalledTimes(1);
    expect(onSessionLost).not.toHaveBeenCalled();
  });

  it('keeps the session when the refresh fails on the network', async () => {
    fetchMock.mockResolvedValueOnce(unauthorized).mockRejectedValueOnce(new Error('offline'));
    await expect(request('/x')).rejects.toMatchObject({ code: 'NETWORK' });
    expect(onSessionLost).not.toHaveBeenCalled();
  });

  it('keeps the session when the server fails during the refresh', async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(reply(500, { success: false, error: { code: 'INTERNAL', message: 'boom' } }));
    await expect(request('/x')).rejects.toMatchObject({ code: 'NETWORK' });
    expect(onSessionLost).not.toHaveBeenCalled();
  });

  it('ends the session when the refresh token is rejected', async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(reply(401, { success: false, error: { code: 'REFRESH_REUSED', message: 'reused' } }));
    await expect(request('/x')).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' });
    expect(onSessionLost).toHaveBeenCalledTimes(1);
  });
});

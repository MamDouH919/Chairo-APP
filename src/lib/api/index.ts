import { env } from '@/config/env';

import { liveApi, type ChairoApi } from './live';
import { mockApi } from './mock';

export const api: ChairoApi = env.useMocks ? mockApi : liveApi;

export { ApiError } from './http';
export type * from './types';

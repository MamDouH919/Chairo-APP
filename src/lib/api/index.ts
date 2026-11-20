import { liveApi, type ChairoApi } from './live';

export const api: ChairoApi = liveApi;

export { ApiError } from './http';
export type * from './types';

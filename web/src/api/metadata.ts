import { apiClient } from '../lib/api-client';
import { AppMetadata } from '../types/api';

export async function fetchMetadata(): Promise<AppMetadata> {
  return apiClient<AppMetadata>('/metadata/');
}

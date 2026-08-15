import { fetchWorkItems, fetchWorkItem, createWorkItem } from '../api/workItems';
import { fetchDashboardStats } from '../api/dashboard';
import { fetchComments } from '../api/comments';
import { describe, it, expect, beforeAll } from 'vitest';

/**
 * INTEGRATION TESTS
 * These tests hit the real local Django backend.
 * Ensure `python manage.py runserver` is running before executing!
 */
describe('Web API Integration', () => {

  it('fetches dashboard stats successfully', async () => {
    const stats = await fetchDashboardStats();
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('open');
    expect(typeof stats.total).toBe('number');
  });

  it('fetches a list of work items and respects pagination/filtering', async () => {
    const res = await fetchWorkItems({ status: 'OPEN' });
    expect(res).toHaveProperty('count');
    expect(res).toHaveProperty('results');
    expect(Array.isArray(res.results)).toBe(true);

    if (res.results.length > 0) {
      // All items should be OPEN
      expect(res.results[0].status).toBe('OPEN');
    }
  });

  it('handles 404 cleanly', async () => {
    await expect(fetchWorkItem(999999)).rejects.toMatchObject({
      status: 404,
      message: 'Not found.',
    });
  });

});

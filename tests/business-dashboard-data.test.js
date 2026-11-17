import { describe, expect, it, vi } from 'vitest';
import { BUSINESS_DASHBOARD_LIMIT, fetchBusinessDashboardCount, fetchBusinessDashboardItems } from '@/lib/business-dashboard';

function query(result) {
  const builder = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), abortSignal: vi.fn().mockResolvedValue(result) };
  builder.select.mockReturnValue(builder); builder.eq.mockReturnValue(builder); builder.order.mockReturnValue(builder); builder.limit.mockReturnValue(builder);
  return builder;
}

describe('business dashboard data helper', () => {
  it('uses the jobs owner and open-status filters for a genuine exact count', async () => {
    const jobs = query({ count: 7, error: null }); const client = { from: vi.fn(() => jobs) };
    await expect(fetchBusinessDashboardCount(client, 'business-a', 'jobs')).resolves.toBe(7);
    expect(client.from).toHaveBeenCalledWith('jobs'); expect(jobs.select).toHaveBeenCalledWith('id', { count: 'exact', head: true }); expect(jobs.eq).toHaveBeenNthCalledWith(1, 'posted_by', 'business-a'); expect(jobs.eq).toHaveBeenNthCalledWith(2, 'status', 'open');
  });
  it('filters each recent record query by its owning business and bounds it to five', async () => {
    for (const [section, ownerColumn] of [['jobs', 'posted_by'], ['proposals', 'job_owner_id'], ['contracts', 'business_id'], ['payments', 'business_id']]) {
      const table = query({ data: Array.from({ length: 7 }, (_, index) => ({ id: `${section}-${index}` })), error: null });
      await expect(fetchBusinessDashboardItems({ from: vi.fn(() => table) }, 'business-a', section)).resolves.toHaveLength(BUSINESS_DASHBOARD_LIMIT);
      expect(table.eq).toHaveBeenCalledWith(ownerColumn, 'business-a'); if (section === 'jobs') expect(table.eq).toHaveBeenCalledWith('status', 'open'); if (section === 'contracts') expect(table.eq).toHaveBeenCalledWith('status', 'active'); expect(table.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: false }); expect(table.order).toHaveBeenNthCalledWith(2, 'id', { ascending: false }); expect(table.limit).toHaveBeenCalledWith(BUSINESS_DASHBOARD_LIMIT);
    }
  });
  it('surfaces query failures instead of treating them as zero records', async () => {
    const payments = query({ count: null, error: { message: 'not authorized' } });
    await expect(fetchBusinessDashboardCount({ from: vi.fn(() => payments) }, 'business-a', 'payments')).rejects.toThrow('not authorized');
  });
});

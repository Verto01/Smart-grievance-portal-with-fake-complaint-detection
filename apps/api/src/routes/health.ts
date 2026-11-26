import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { Complaint, Department } from '@nagrik-setu/domain';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

healthRouter.get('/ready', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  // 1 = connected
  if (dbState === 1) {
    res.json({ status: 'ready', db: 'connected' });
  } else {
    res.status(503).json({ status: 'not ready', db: 'disconnected' });
  }
});

/**
 * GET /public/stats
 * Public (no-auth) analytics endpoint for the citizen-facing stats page.
 */
healthRouter.get('/public/stats', async (_req: Request, res: Response) => {
  try {
    const [total, statusAgg, categoryAgg, overdueCount] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Complaint.aggregate([
        { $group: { _id: { $ifNull: ['$category', '$citizenCategory'] }, count: { $sum: 1 } } },
      ]),
      Complaint.countDocuments({
        status: { $nin: ['RESOLVED', 'CLOSED'] },
        slaDueAt: { $lt: new Date() },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const s of statusAgg) {
      if (s._id) statusCounts[s._id] = s.count;
    }

    const categoryCounts: Record<string, number> = {};
    for (const c of categoryAgg) {
      if (c._id) categoryCounts[c._id] = c.count;
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.json({
      summary: {
        totalComplaints: total,
        statusCounts,
        categoryCounts,
        overdueComplaints: overdueCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch statistics' } });
  }
});

/**
 * GET /public/departments
 * Public (no-auth) list of municipal departments for the citizen-facing page.
 */
healthRouter.get('/public/departments', async (_req: Request, res: Response) => {
  try {
    const departments = await Department.find().sort({ code: 1 });
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.json({ departments });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch departments' } });
  }
});

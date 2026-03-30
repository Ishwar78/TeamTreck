import { Router, Request, Response, NextFunction } from 'express';
import { DailyReport } from '../models/DailyReport';
import { authenticate } from '../middleware/auth';
import { AppError } from '../utils/errors';

export const dailyReportRoutes = Router();

// GET all reports for a company (Admin sees all, User sees own)
dailyReportRoutes.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, company_id, user_id } = req.auth!;
    
    // Filter by company
    const query: any = { company_id };

    // If user/employee/intern, only fetch their own reports
    if (role === 'user' || role === 'employee' || role === 'intern') {
      query.user_id = user_id;
    }

    const reports = await DailyReport.find(query)
      .populate('user_id', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, reports });
  } catch (err) {
    next(err);
  }
});

// POST to submit a new daily report
dailyReportRoutes.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, subject, body } = req.body;

    if (!title || !subject || !body) {
      throw new AppError('Title, Subject, and Body are required', 400);
    }

    const { company_id, user_id } = req.auth!;

    const newReport = await DailyReport.create({
      title,
      subject,
      body,
      company_id,
      user_id,
    });

    const populatedReport = await DailyReport.findById(newReport._id)
      .populate('user_id', 'name email role')
      .lean();

    res.status(201).json({ success: true, report: populatedReport });
  } catch (err) {
    next(err);
  }
});

// DELETE a daily report
dailyReportRoutes.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role, company_id, user_id } = req.auth!;

    const report = await DailyReport.findOne({ _id: id, company_id });

    if (!report) {
       throw new AppError('Report not found', 404);
    }

    // Only allow admin or the creator to delete
    if ((role === 'user' || role === 'employee' || role === 'intern') && report.user_id.toString() !== user_id) {
       throw new AppError('Not authorized to delete this report', 403);
    }

    await DailyReport.deleteOne({ _id: id });

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (err) {
    next(err);
  }
});

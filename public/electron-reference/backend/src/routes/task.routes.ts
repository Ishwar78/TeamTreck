import { Router } from 'express';
import { Task } from '../models/Task';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { AppError } from '../utils/errors';

const router = Router();

// GET tasks 
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { role, company_id, user_id } = req.auth!;
    let query: any = { company_id };

    // Users, employees and interns only see their own tasks
    if (role === 'user' || role === 'employee' || role === 'intern') {
      query.assignedTo = user_id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
});

// POST to create a new task
router.post('/', authenticate, requireRole('company_admin', 'sub_admin'), async (req, res, next) => {
  try {
    const { title, description, assignedTo } = req.body;
    if (!title || !assignedTo) {
      throw new AppError('Title and Assignee are required', 400);
    }

    const task = await Task.create({
      title,
      description,
      company_id: req.auth!.company_id,
      assignedBy: req.auth!.user_id,
      assignedTo,
      status: 'pending'
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .lean();

    res.status(201).json({ success: true, task: populatedTask });
  } catch (err) {
    next(err);
  }
});

// PATCH to update task status
router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = await Task.findOne({ _id: req.params.id, company_id: req.auth!.company_id });
    
    if (!task) throw new AppError('Task not found', 404);
    
    if ((req.auth!.role === 'user' || req.auth!.role === 'employee' || req.auth!.role === 'intern') && task.assignedTo.toString() !== req.auth!.user_id) {
      throw new AppError('Not authorized', 403);
    }

    task.status = status;
    await task.save();

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
});

export const taskRoutes = router;

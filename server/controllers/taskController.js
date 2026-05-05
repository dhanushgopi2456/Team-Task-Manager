const Task = require('../models/Task');
const Project = require('../models/Project');

// GET /api/tasks - List tasks with filters
exports.getTasks = async (req, res, next) => {
  try {
    const { project, status, priority, assignedTo, search, sort = '-createdAt' } = req.query;
    
    let query = {};

    // Filter by project
    if (project) query.project = project;

    // Filter by status
    if (status) query.status = status;

    // Filter by priority
    if (priority) query.priority = priority;

    // Filter by assignee
    if (assignedTo) query.assignedTo = assignedTo;

    // Search by title
    if (search) query.title = { $regex: search, $options: 'i' };

    // Role-based filtering
    if (req.user.role === 'member') {
      // Members only see tasks from their projects or assigned to them
      const userProjects = await Project.find({ members: req.userId }).select('_id');
      const projectIds = userProjects.map(p => p._id);
      query.$or = [
        { project: { $in: projectIds } },
        { assignedTo: req.userId }
      ];
    }

    const tasks = await Task.find(query)
      .populate('project', 'name')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort(sort);

    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks - Create task
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, project, assignedTo, status, priority, dueDate } = req.body;

    // Verify project exists
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // If assigning, verify assignee is a project member
    if (assignedTo) {
      const isMember = projectDoc.members.includes(assignedTo);
      if (!isMember) {
        return res.status(400).json({ message: 'Assignee must be a project member.' });
      }
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignedTo: assignedTo || null,
      createdBy: req.userId,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null
    });

    await task.populate('project', 'name');
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id - Get task details
exports.getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name owner members')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tasks/:id - Update task
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Admin can update any task, members can only update status of assigned tasks
    if (req.user.role !== 'admin') {
      const isAssigned = task.assignedTo && task.assignedTo.toString() === req.userId.toString();
      if (!isAssigned) {
        return res.status(403).json({ message: 'You can only update tasks assigned to you.' });
      }
      // Members can only update status
      const allowedFields = ['status'];
      const updateFields = Object.keys(req.body);
      const isValidUpdate = updateFields.every(field => allowedFields.includes(field));
      if (!isValidUpdate) {
        return res.status(403).json({ message: 'Members can only update task status.' });
      }
    }

    const { title, description, assignedTo, status, priority, dueDate, project } = req.body;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();
    await task.populate('project', 'name');
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:id - Delete task (admin only)
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id/status - Update task status
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Admin or assigned member can update status
    if (req.user.role !== 'admin') {
      const isAssigned = task.assignedTo && task.assignedTo.toString() === req.userId.toString();
      if (!isAssigned) {
        return res.status(403).json({ message: 'Only the assigned member or admin can update status.' });
      }
    }

    task.status = status;
    await task.save();
    await task.populate('project', 'name');
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    res.json({ message: 'Status updated successfully', task });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/dashboard/stats - Dashboard statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    let projectFilter = {};
    
    if (req.user.role === 'member') {
      const userProjects = await Project.find({ members: req.userId }).select('_id');
      const projectIds = userProjects.map(p => p._id);
      projectFilter = { project: { $in: projectIds } };
    }

    // Total counts by status
    const statusCounts = await Task.aggregate([
      { $match: projectFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Priority counts
    const priorityCounts = await Task.aggregate([
      { $match: projectFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Overdue tasks count
    const overdueCount = await Task.countDocuments({
      ...projectFilter,
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' }
    });

    // Total projects
    let projectCount;
    if (req.user.role === 'admin') {
      projectCount = await Project.countDocuments({
        $or: [{ owner: req.userId }, { members: req.userId }]
      });
    } else {
      projectCount = await Project.countDocuments({ members: req.userId });
    }

    // Total team members (unique across all user's projects)
    let memberQuery;
    if (req.user.role === 'admin') {
      memberQuery = { $or: [{ owner: req.userId }, { members: req.userId }] };
    } else {
      memberQuery = { members: req.userId };
    }
    const projects = await Project.find(memberQuery).select('members');
    const uniqueMembers = new Set();
    projects.forEach(p => p.members.forEach(m => uniqueMembers.add(m.toString())));

    // Recent tasks (last 10)
    const recentTasks = await Task.find(projectFilter)
      .populate('project', 'name')
      .populate('assignedTo', 'name avatar')
      .populate('createdBy', 'name avatar')
      .sort({ updatedAt: -1 })
      .limit(10);

    const stats = {
      todo: 0, 'in-progress': 0, review: 0, completed: 0, total: 0
    };
    statusCounts.forEach(sc => {
      stats[sc._id] = sc.count;
      stats.total += sc.count;
    });

    const priorities = { low: 0, medium: 0, high: 0, critical: 0 };
    priorityCounts.forEach(pc => { priorities[pc._id] = pc.count; });

    res.json({
      stats,
      priorities,
      overdueCount,
      projectCount,
      memberCount: uniqueMembers.size,
      recentTasks
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/dashboard/overdue - Get overdue tasks
exports.getOverdueTasks = async (req, res, next) => {
  try {
    let projectFilter = {};
    
    if (req.user.role === 'member') {
      const userProjects = await Project.find({ members: req.userId }).select('_id');
      const projectIds = userProjects.map(p => p._id);
      projectFilter = { project: { $in: projectIds } };
    }

    const overdueTasks = await Task.find({
      ...projectFilter,
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' }
    })
      .populate('project', 'name')
      .populate('assignedTo', 'name email avatar')
      .sort({ dueDate: 1 })
      .limit(20);

    res.json({ tasks: overdueTasks });
  } catch (error) {
    next(error);
  }
};

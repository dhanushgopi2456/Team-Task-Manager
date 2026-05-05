const Project = require('../models/Project');
const Task = require('../models/Task');

// GET /api/projects - List user's projects
exports.getProjects = async (req, res, next) => {
  try {
    let query;
    if (req.user.role === 'admin') {
      // Admin sees all projects they own or are a member of
      query = { $or: [{ owner: req.userId }, { members: req.userId }] };
    } else {
      // Members see projects they're part of
      query = { members: req.userId };
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ updatedAt: -1 });

    // Add task counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        const counts = { total: 0, todo: 0, 'in-progress': 0, review: 0, completed: 0 };
        taskCounts.forEach(tc => {
          counts[tc._id] = tc.count;
          counts.total += tc.count;
        });

        return { ...project.toObject(), taskCounts: counts };
      })
    );

    res.json({ projects: projectsWithCounts });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects - Create project (admin only)
exports.createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      owner: req.userId,
      members: [req.userId] // Owner is automatically a member
    });

    await project.populate('owner', 'name email avatar');
    await project.populate('members', 'name email avatar');

    res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/:id - Get project details
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar role')
      .populate('members', 'name email avatar role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Check if user is a member or owner
    const isMember = project.members.some(m => m._id.toString() === req.userId.toString());
    const isOwner = project.owner._id.toString() === req.userId.toString();

    if (!isMember && !isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Get tasks for this project
    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ project, tasks });
  } catch (error) {
    next(error);
  }
};

// PUT /api/projects/:id - Update project (admin/owner only)
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Only owner or admin can update
    if (project.owner.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the project owner can update this project.' });
    }

    const { name, description, status } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;

    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members', 'name email avatar');

    res.json({ message: 'Project updated successfully', project });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:id - Delete project (admin/owner only)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.owner.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the project owner can delete this project.' });
    }

    // Delete all tasks in the project
    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project and all its tasks deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:id/members - Add member to project
exports.addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.owner.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the project owner can manage members.' });
    }

    // Check if already a member
    if (project.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member of this project.' });
    }

    project.members.push(userId);
    await project.save();
    await project.populate('members', 'name email avatar role');
    await project.populate('owner', 'name email avatar role');

    res.json({ message: 'Member added successfully', project });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:id/members/:userId - Remove member
exports.removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.owner.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the project owner can manage members.' });
    }

    // Cannot remove the owner
    if (req.params.userId === project.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove the project owner.' });
    }

    project.members = project.members.filter(m => m.toString() !== req.params.userId);
    await project.save();
    await project.populate('members', 'name email avatar role');
    await project.populate('owner', 'name email avatar role');

    // Unassign tasks from removed member
    await Task.updateMany(
      { project: project._id, assignedTo: req.params.userId },
      { assignedTo: null }
    );

    res.json({ message: 'Member removed successfully', project });
  } catch (error) {
    next(error);
  }
};

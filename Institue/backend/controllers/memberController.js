// backend/controllers/memberController.js
const Member = require('../models/Member');

// @desc    Get all members
// @route   GET /api/members
// @access  Private/Admin
const getAllMembers = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const members = await Member.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: members.length,
      members
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single member by ID
// @route   GET /api/members/:id
// @access  Private/Admin
const getMemberById = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.status(200).json({
      success: true,
      member
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new member
// @route   POST /api/members
// @access  Private/Admin
const createMember = async (req, res, next) => {
  try {
    const { name, designation, salary, subject, timing } = req.body;

    if (!name || !designation || !salary || !subject || !timing) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, designation, salary, subject, timing'
      });
    }

    const member = await Member.create({
      name,
      designation,
      salary,
      subject,
      timing,
      createdBy: req.user ? req.user.id : undefined
    });

    res.status(201).json({
      success: true,
      message: 'Member created successfully',
      member
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update member
// @route   PUT /api/members/:id
// @access  Private/Admin
const updateMember = async (req, res, next) => {
  try {
    let member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const { name, designation, salary, subject, timing } = req.body;

    member = await Member.findByIdAndUpdate(
      req.params.id,
      {
        name: name !== undefined ? name : member.name,
        designation: designation !== undefined ? designation : member.designation,
        salary: salary !== undefined ? salary : member.salary,
        subject: subject !== undefined ? subject : member.subject,
        timing: timing !== undefined ? timing : member.timing
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      member
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete member
// @route   DELETE /api/members/:id
// @access  Private/Admin
const deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    await member.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
};

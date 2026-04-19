'use strict';

const express = require('express');
const router = express.Router();
const { Student, University, Verifier } = require('../models/User');

// ─── POST /api/auth/login ─────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Thiếu thông tin đăng nhập' });
  }

  try {
    let user = null;
    if (role === 'university') {
      user = await University.findOne({ email });
    } else if (role === 'student') {
      user = await Student.findOne({ email });
    } else if (role === 'verifier') {
      user = await Verifier.findOne({ email });
    } else {
      return res.status(400).json({ error: 'Role không hợp lệ' });
    }

    if (!user) return res.status(401).json({ error: 'Email không tồn tại' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Mật khẩu không đúng' });

    req.session.user = {
      id: user._id.toString(),
      email: user.email,
      hoTen: user.hoTen,
      role: user.role,
    };

    res.json({ success: true, user: req.session.user });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: 'Chưa đăng nhập' });
  res.json({ user: req.session.user });
});

// ─── POST /api/auth/register/student ─────────────────────────────────────
router.post('/register/student', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.password && !data.matKhauGoc) {
      data.matKhauGoc = data.password;
    }
    const student = new Student(data);
    await student.save();
    res.status(201).json({ success: true, id: student._id, student: { ...student.toObject(), password: undefined } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email hoặc mã SV đã tồn tại' });
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/auth/students/:id ──────────────────────────────────────────
router.put('/students/:id', async (req, res) => {
  try {
    const update = { ...req.body };
    // Nếu có password mới thì lưu matKhauGoc, còn lại bỏ qua password rỗng
    if (!update.password) {
      delete update.password;
    } else {
      update.matKhauGoc = update.password;
    }
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true, select: '-password' }
    );
    if (!student) return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    res.json({ success: true, student });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email hoặc mã SV đã tồn tại' });
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/auth/students/:id ───────────────────────────────────────
router.delete('/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/register/verifier ────────────────────────────────────
router.post('/register/verifier', async (req, res) => {
  try {
    const verifier = new Verifier(req.body);
    await verifier.save();
    res.status(201).json({ success: true, id: verifier._id });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email đã tồn tại' });
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/auth/students ───────────────────────────────────────────────
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find({}, '-password');
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/auth/students/:id ───────────────────────────────────────────
router.get('/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id, '-password');
    if (!student) return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

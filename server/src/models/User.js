'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  hoTen: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  matKhauGoc: { type: String, default: '' }, // lưu mật khẩu gốc để admin xem
  maSV: { type: String, required: true, unique: true },
  ngaySinh: String,
  gioiTinh: String,
  khoa: String,
  nganh: String,
  khoaHoc: String,
  soDienThoai: String,
  diaChi: String,
  role: { type: String, default: 'student' },
}, { timestamps: true });

studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (!this.matKhauGoc) this.matKhauGoc = this.password; // lưu trước khi hash
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

studentSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

const universitySchema = new mongoose.Schema({
  hoTen: { type: String, default: 'Admin - ĐH Văn Lang' },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: 'university' },
}, { timestamps: true });

universitySchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

universitySchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

const verifierSchema = new mongoose.Schema({
  hoTen: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  toChuc: String,
  role: { type: String, default: 'verifier' },
}, { timestamps: true });

verifierSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

verifierSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = {
  Student: mongoose.model('Student', studentSchema),
  University: mongoose.model('University', universitySchema),
  Verifier: mongoose.model('Verifier', verifierSchema),
};

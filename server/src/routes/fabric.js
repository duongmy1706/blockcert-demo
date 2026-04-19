'use strict';

const express = require('express');
const router = express.Router();
const cc = require('../fabric/chaincode');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getNetwork, isFabricConnected } = require('../fabric/gateway');

// ─── GET /api/fabric/status ───────────────────────────────────────────────
// Thông tin network (public)
router.get('/status', (req, res) => {
  if (isFabricConnected()) {
    res.json({
      connected: true,
      channel: process.env.FABRIC_CHANNEL_NAME || 'mychannel',
      chaincode: process.env.FABRIC_CHAINCODE_NAME || 'educert',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.json({
      connected: false,
      error: 'Fabric network chưa kết nối. Kiểm tra Docker containers đang chạy.',
    });
  }
});

// ─── POST /api/fabric/certificates ───────────────────────────────────────
// issueCredential — chỉ university
router.post('/certificates', requireRole('university'), async (req, res) => {
  try {
    const result = await cc.issueCredential(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error('[Fabric] issueCredential error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// ─── GET /api/fabric/certificates/:maChungChi ─────────────────────────────
// queryCredential — public
router.get('/certificates/:maChungChi', async (req, res) => {
  try {
    const result = await cc.queryCredential(req.params.maChungChi);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ─── PUT /api/fabric/certificates/:maChungChi/sign ────────────────────────
// signCredential — chỉ university
router.put('/certificates/:maChungChi/sign', requireRole('university'), async (req, res) => {
  try {
    const { nguoiKy } = req.body;
    if (!nguoiKy) return res.status(400).json({ error: 'Thiếu tên người ký' });
    const result = await cc.signCredential(req.params.maChungChi, nguoiKy);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Fabric] signCredential error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// ─── GET /api/fabric/certificates/:maChungChi/verify ─────────────────────
// verifyCredential — public (nhà tuyển dụng dùng)
router.get('/certificates/:maChungChi/verify', async (req, res) => {
  try {
    const result = await cc.verifyCredential(req.params.maChungChi);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ─── DELETE /api/fabric/certificates/:maChungChi ──────────────────────────
// deleteCredential — chỉ university
router.delete('/certificates/:maChungChi', requireRole('university'), async (req, res) => {
  try {
    const result = await cc.deleteCredential(req.params.maChungChi);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── GET /api/fabric/students/:studentId/certificates ────────────────────
// queryByStudent — student xem chứng chỉ của mình / university xem tất cả
router.get('/students/:studentId/certificates', requireAuth, async (req, res) => {
  try {
    const result = await cc.queryByStudent(req.params.studentId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── GET /api/fabric/certificates ─────────────────────────────────────────
// queryAll — university dashboard
router.get('/certificates', requireRole('university'), async (req, res) => {
  try {
    const { pageSize = 20, bookmark = '' } = req.query;
    const result = await cc.queryAll(Number(pageSize), bookmark);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── GET /api/fabric/certificates/:maChungChi/history ────────────────────
// getHistory — audit trail
router.get('/certificates/:maChungChi/history', requireRole('university'), async (req, res) => {
  try {
    const result = await cc.getHistory(req.params.maChungChi);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

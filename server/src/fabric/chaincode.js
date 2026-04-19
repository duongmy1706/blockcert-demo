'use strict';

const { getContract } = require('./gateway');

// ─── Helper: parse transaction result ─────────────────────────────────────
function parseResult(result) {
  try {
    return JSON.parse(result.toString());
  } catch {
    return result.toString();
  }
}

// ─── issueCredential ──────────────────────────────────────────────────────
async function issueCredential(data) {
  const contract = getContract();
  const {
    maChungChi, tenChungChi, studentId, maSV, hoTen,
    khoa, nganh, loaiChungChi, xepLoai, nguoiKy, ngayCap, moTa
  } = data;

  const result = await contract.submitTransaction(
    'issueCredential',
    maChungChi, tenChungChi, studentId, maSV, hoTen,
    khoa, nganh, loaiChungChi, xepLoai, nguoiKy, ngayCap, moTa || ''
  );
  return parseResult(result);
}

// ─── signCredential ────────────────────────────────────────────────────────
async function signCredential(maChungChi, nguoiKy) {
  const contract = getContract();
  const result = await contract.submitTransaction('signCredential', maChungChi, nguoiKy);
  return parseResult(result);
}

// ─── verifyCredential ─────────────────────────────────────────────────────
async function verifyCredential(maChungChi) {
  const contract = getContract();
  // evaluateTransaction = query, không tốn phí, không ghi ledger
  const result = await contract.evaluateTransaction('verifyCredential', maChungChi);
  return parseResult(result);
}

// ─── queryCredential ──────────────────────────────────────────────────────
async function queryCredential(maChungChi) {
  const contract = getContract();
  const result = await contract.evaluateTransaction('queryCredential', maChungChi);
  return parseResult(result);
}

// ─── deleteCredential ─────────────────────────────────────────────────────
async function deleteCredential(maChungChi) {
  const contract = getContract();
  const result = await contract.submitTransaction('deleteCredential', maChungChi);
  return parseResult(result);
}

// ─── queryByStudent ───────────────────────────────────────────────────────
async function queryByStudent(studentId) {
  const contract = getContract();
  const result = await contract.evaluateTransaction('queryByStudent', studentId);
  return parseResult(result);
}

// ─── queryAll ─────────────────────────────────────────────────────────────
async function queryAll(pageSize = 20, bookmark = '') {
  const contract = getContract();
  const result = await contract.evaluateTransaction('queryAll', String(pageSize), bookmark);
  return parseResult(result);
}

// ─── getHistory ───────────────────────────────────────────────────────────
async function getHistory(maChungChi) {
  const contract = getContract();
  const result = await contract.evaluateTransaction('getHistory', maChungChi);
  return parseResult(result);
}

module.exports = {
  issueCredential,
  signCredential,
  verifyCredential,
  queryCredential,
  deleteCredential,
  queryByStudent,
  queryAll,
  getHistory,
};

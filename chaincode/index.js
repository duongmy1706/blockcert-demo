'use strict';

const { Contract } = require('fabric-contract-api');

class EduCertContract extends Contract {

  async initLedger(ctx) {
    console.log('EduCert chaincode initialized on channel');
    return { success: true };
  }

  // ─── issueCredential ───────────────────────────────────────────────────────
  // Phát hành chứng chỉ mới lên ledger
  async issueCredential(ctx, maChungChi, tenChungChi, studentId, maSV,
    hoTen, khoa, nganh, loaiChungChi, xepLoai, nguoiKy, ngayCap, moTa) {

    const exists = await this._certExists(ctx, maChungChi);
    if (exists) {
      throw new Error(`Chứng chỉ ${maChungChi} đã tồn tại trên ledger`);
    }

    const cert = {
      docType: 'certificate',
      maChungChi,
      tenChungChi,
      studentId,
      maSV,
      hoTen,
      khoa,
      nganh,
      loaiChungChi,
      xepLoai,
      nguoiKy,
      ngayCap,
      moTa,
      trangThai: 'cho_ky',
      ngayKy: '',
      issuedAt: new Date().toISOString(),
      txId: ctx.stub.getTxID(),
    };

    await ctx.stub.putState(maChungChi, Buffer.from(JSON.stringify(cert)));
    ctx.stub.setEvent('CertificateIssued', Buffer.from(JSON.stringify({ maChungChi, studentId, tenChungChi })));
    console.log(`issueCredential: ${maChungChi} issued`);
    return JSON.stringify(cert);
  }

  // ─── signCredential ────────────────────────────────────────────────────────
  // Ký điện tử chứng chỉ — chỉ admin/university được gọi
  async signCredential(ctx, maChungChi, nguoiKy) {
    const certJSON = await this._getCert(ctx, maChungChi);

    if (certJSON.trangThai === 'da_ky') {
      throw new Error(`Chứng chỉ ${maChungChi} đã được ký rồi`);
    }

    certJSON.trangThai = 'da_ky';
    certJSON.nguoiKy = nguoiKy;
    certJSON.ngayKy = new Date().toISOString().split('T')[0];
    certJSON.signTxId = ctx.stub.getTxID();

    await ctx.stub.putState(maChungChi, Buffer.from(JSON.stringify(certJSON)));
    ctx.stub.setEvent('CertificateSigned', Buffer.from(JSON.stringify({ maChungChi, nguoiKy })));
    console.log(`signCredential: ${maChungChi} signed by ${nguoiKy}`);
    return JSON.stringify(certJSON);
  }

  // ─── verifyCredential ──────────────────────────────────────────────────────
  // Xác minh tính hợp lệ của chứng chỉ (query — không tốn phí)
  async verifyCredential(ctx, maChungChi) {
    const certJSON = await this._getCert(ctx, maChungChi);
    const result = {
      valid: certJSON.trangThai === 'da_ky',
      certificate: certJSON,
      verifiedAt: new Date().toISOString(),
      txId: ctx.stub.getTxID(),
    };
    console.log(`verifyCredential: ${maChungChi} → valid=${result.valid}`);
    return JSON.stringify(result);
  }

  // ─── queryCredential ───────────────────────────────────────────────────────
  // Truy vấn thông tin chứng chỉ theo mã
  async queryCredential(ctx, maChungChi) {
    const certJSON = await this._getCert(ctx, maChungChi);
    return JSON.stringify(certJSON);
  }

  // ─── deleteCredential ──────────────────────────────────────────────────────
  // Xóa chứng chỉ khỏi ledger (chỉ admin)
  async deleteCredential(ctx, maChungChi) {
    const exists = await this._certExists(ctx, maChungChi);
    if (!exists) {
      throw new Error(`Chứng chỉ ${maChungChi} không tồn tại`);
    }
    await ctx.stub.deleteState(maChungChi);
    ctx.stub.setEvent('CertificateDeleted', Buffer.from(JSON.stringify({ maChungChi })));
    console.log(`deleteCredential: ${maChungChi} deleted`);
    return JSON.stringify({ success: true, maChungChi });
  }

  // ─── queryByStudent ────────────────────────────────────────────────────────
  // CouchDB rich query: lấy tất cả chứng chỉ của 1 sinh viên
  async queryByStudent(ctx, studentId) {
    const queryString = JSON.stringify({
      selector: { docType: 'certificate', studentId },
      sort: [{ ngayCap: 'desc' }],
    });
    const results = await this._getQueryResult(ctx, queryString);
    return JSON.stringify(results);
  }

  // ─── queryAll ─────────────────────────────────────────────────────────────
  // CouchDB: lấy tất cả chứng chỉ (phân trang)
  async queryAll(ctx, pageSize, bookmark) {
    const queryString = JSON.stringify({
      selector: { docType: 'certificate' },
    });
    const { iterator, metadata } = await ctx.stub.getQueryResultWithPagination(
      queryString, parseInt(pageSize) || 20, bookmark || ''
    );
    const results = await this._iteratorToList(iterator);
    return JSON.stringify({ results, fetchedRecordsCount: metadata.fetchedRecordsCount, bookmark: metadata.bookmark });
  }

  // ─── getHistory ────────────────────────────────────────────────────────────
  // Lấy lịch sử thay đổi của 1 chứng chỉ
  async getHistory(ctx, maChungChi) {
    const iterator = await ctx.stub.getHistoryForKey(maChungChi);
    const history = [];
    let result = await iterator.next();
    while (!result.done) {
      const record = {
        txId: result.value.txId,
        timestamp: result.value.timestamp,
        isDelete: result.value.isDelete,
        value: result.value.value.toString('utf8'),
      };
      history.push(record);
      result = await iterator.next();
    }
    await iterator.close();
    return JSON.stringify(history);
  }

  // ─── helpers ───────────────────────────────────────────────────────────────
  async _certExists(ctx, maChungChi) {
    const data = await ctx.stub.getState(maChungChi);
    return data && data.length > 0;
  }

  async _getCert(ctx, maChungChi) {
    const data = await ctx.stub.getState(maChungChi);
    if (!data || data.length === 0) {
      throw new Error(`Chứng chỉ ${maChungChi} không tồn tại trên ledger`);
    }
    return JSON.parse(data.toString());
  }

  async _getQueryResult(ctx, queryString) {
    const iterator = await ctx.stub.getQueryResult(queryString);
    return this._iteratorToList(iterator);
  }

  async _iteratorToList(iterator) {
    const results = [];
    let result = await iterator.next();
    while (!result.done) {
      if (result.value && result.value.value) {
        try {
          results.push(JSON.parse(result.value.value.toString('utf8')));
        } catch (e) {
          results.push(result.value.value.toString('utf8'));
        }
      }
      result = await iterator.next();
    }
    await iterator.close();
    return results;
  }
}

module.exports = EduCertContract;

// models/receiptModel.js
const moment = require('moment');

class ReceiptModel {
  constructor() {
    this.receipts = new Map();
  }

  async save(receipt) {
    const key = `${receipt.userId}_${receipt.id}`;
    this.receipts.set(key, receipt);
    return receipt;
  }

  async findByUser(userId) {
    const userReceipts = [];
    for (const [key, receipt] of this.receipts.entries()) {
      if (receipt.userId === userId) {
        userReceipts.push(receipt);
      }
    }
    return userReceipts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async findByUserAndDate(userId, date) {
    const userReceipts = await this.findByUser(userId);
    return userReceipts.filter(receipt => 
      moment(receipt.date).format('YYYY-MM-DD') === date
    );
  }

  async findByUserAndDateRange(userId, startDate, endDate) {
    const userReceipts = await this.findByUser(userId);
    return userReceipts.filter(receipt => {
      const receiptDate = moment(receipt.date).format('YYYY-MM-DD');
      return receiptDate >= startDate && receiptDate <= endDate;
    });
  }

  async findById(userId, receiptId) {
    const key = `${userId}_${receiptId}`;
    return this.receipts.get(key);
  }

  async deleteById(userId, receiptId) {
    const key = `${userId}_${receiptId}`;
    return this.receipts.delete(key);
  }
}

module.exports = new ReceiptModel();
// services/receiptAnalyzer.js
const geminiService = require('./geminiService');
const ReceiptModel = require('../models/receiptModel');
const moment = require('moment');

class ReceiptAnalyzer {
  async analyzeImage(imagePath, userId) {
    try {
      const analysisResult = await geminiService.analyzeImage(imagePath);
      
      if (analysisResult.is_receipt) {
        const receiptData = analysisResult;
        
        const categories = await geminiService.categorizeExpense(receiptData.items);
        
        const receipt = {
          id: Date.now().toString(),
          userId: userId,
          ...receiptData,
          categories: categories.categories,
          createdAt: new Date(),
          processedAt: new Date()
        };
        
        await ReceiptModel.save(receipt);
        
        return {
          success: true,
          type: 'receipt',
          data: receipt
        };
      } else {
        return {
          success: true,
          type: 'general',
          data: analysisResult.description
        };
      }
    } catch (error) {
      console.error('Error in ReceiptAnalyzer analyzeImage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ... (Sisa fungsi lainnya seperti getDailySummary, getWeeklySummary, dll. tidak perlu diubah)
  async getDailySummary(userId) {
    const today = moment().format('YYYY-MM-DD');
    const receipts = await ReceiptModel.findByUserAndDate(userId, today);
    
    const totalSpent = receipts.reduce((sum, receipt) => sum + receipt.total, 0);
    const totalTransactions = receipts.length;
    
    const categoryTotals = {};
    receipts.forEach(receipt => {
      if (receipt.categories) {
        receipt.categories.forEach(cat => {
          categoryTotals[cat.category] = (categoryTotals[cat.category] || 0) + cat.total;
        });
      }
    });
    
    return {
      date: today,
      totalSpent,
      totalTransactions,
      categoryTotals,
      receipts: receipts.map(r => ({
        store: r.store_name,
        time: r.time,
        total: r.total
      }))
    };
  }

  async getWeeklySummary(userId) {
    const startOfWeek = moment().startOf('week').format('YYYY-MM-DD');
    const endOfWeek = moment().endOf('week').format('YYYY-MM-DD');
    
    const receipts = await ReceiptModel.findByUserAndDateRange(userId, startOfWeek, endOfWeek);
    
    const dailyTotals = {};
    receipts.forEach(receipt => {
      const date = moment(receipt.date).format('YYYY-MM-DD');
      dailyTotals[date] = (dailyTotals[date] || 0) + receipt.total;
    });
    
    return {
      weekStart: startOfWeek,
      weekEnd: endOfWeek,
      totalSpent: receipts.reduce((sum, receipt) => sum + receipt.total, 0),
      dailyTotals,
      averagePerDay: Object.values(dailyTotals).reduce((a, b) => a + b, 0) / Object.keys(dailyTotals).length || 0
    };
  }

  async getMonthlySummary(userId) {
    const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
    const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');
    
    const receipts = await ReceiptModel.findByUserAndDateRange(userId, startOfMonth, endOfMonth);
    
    const categoryTotals = {};
    const weeklyTotals = {};
    
    receipts.forEach(receipt => {
      // Category totals
      if (receipt.categories) {
        receipt.categories.forEach(cat => {
          categoryTotals[cat.category] = (categoryTotals[cat.category] || 0) + cat.total;
        });
      }
      
      // Weekly totals
      const week = moment(receipt.date).format('YYYY-[W]WW');
      weeklyTotals[week] = (weeklyTotals[week] || 0) + receipt.total;
    });
    
    return {
      month: moment().format('YYYY-MM'),
      totalSpent: receipts.reduce((sum, receipt) => sum + receipt.total, 0),
      categoryTotals,
      weeklyTotals,
      averagePerDay: receipts.reduce((sum, receipt) => sum + receipt.total, 0) / moment().daysInMonth()
    };
  }
}

module.exports = new ReceiptAnalyzer();
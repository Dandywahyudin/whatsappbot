// controllers/receiptController.js
const receiptAnalyzer = require('../Services/receiptAnalyzer');
const ReceiptModel = require('../models/receiptModel');
const fs = require('fs-extra');
const path = require('path');

class ReceiptController {
  // Upload dan analisis struk via HTTP endpoint
  async uploadReceipt(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada file yang diupload'
        });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID diperlukan'
        });
      }

      const imagePath = req.file.path;
      
      // Analisis struk menggunakan service
      const result = await receiptAnalyzer.analyzeReceipt(imagePath, userId);
      
      // Hapus file setelah diproses
      await fs.remove(imagePath);

      if (result.success) {
        res.json({
          success: true,
          message: 'Struk berhasil dianalisis',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Gagal menganalisis struk',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in uploadReceipt:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: error.message
      });
    }
  }

  // Mendapatkan semua struk user
  async getUserReceipts(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, startDate, endDate } = req.query;

      let receipts;
      
      if (startDate && endDate) {
        receipts = await ReceiptModel.findByUserAndDateRange(userId, startDate, endDate);
      } else {
        receipts = await ReceiptModel.findByUser(userId);
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedReceipts = receipts.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          receipts: paginatedReceipts,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(receipts.length / limit),
            total: receipts.length
          }
        }
      });
    } catch (error) {
      console.error('Error in getUserReceipts:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data struk',
        error: error.message
      });
    }
  }

  // Mendapatkan ringkasan harian
  async getDailySummary(req, res) {
    try {
      const { userId } = req.params;
      const { date } = req.query;

      const summary = await receiptAnalyzer.getDailySummary(userId, date);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error in getDailySummary:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil ringkasan harian',
        error: error.message
      });
    }
  }

  // Mendapatkan ringkasan mingguan
  async getWeeklySummary(req, res) {
    try {
      const { userId } = req.params;
      const { weekStart } = req.query;

      const summary = await receiptAnalyzer.getWeeklySummary(userId, weekStart);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error in getWeeklySummary:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil ringkasan mingguan',
        error: error.message
      });
    }
  }

  // Mendapatkan ringkasan bulanan
  async getMonthlySummary(req, res) {
    try {
      const { userId } = req.params;
      const { month } = req.query;

      const summary = await receiptAnalyzer.getMonthlySummary(userId, month);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error in getMonthlySummary:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil ringkasan bulanan',
        error: error.message
      });
    }
  }

  // Mendapatkan detail struk berdasarkan ID
  async getReceiptById(req, res) {
    try {
      const { userId, receiptId } = req.params;

      const receipt = await ReceiptModel.findById(userId, receiptId);

      if (!receipt) {
        return res.status(404).json({
          success: false,
          message: 'Struk tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: receipt
      });
    } catch (error) {
      console.error('Error in getReceiptById:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil detail struk',
        error: error.message
      });
    }
  }

  // Menghapus struk
  async deleteReceipt(req, res) {
    try {
      const { userId, receiptId } = req.params;

      const deleted = await ReceiptModel.deleteById(userId, receiptId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Struk tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Struk berhasil dihapus'
      });
    } catch (error) {
      console.error('Error in deleteReceipt:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus struk',
        error: error.message
      });
    }
  }

  // Mendapatkan statistik pengeluaran
  async getExpenseStats(req, res) {
    try {
      const { userId } = req.params;
      const { period = 'monthly' } = req.query;

      let stats;
      
      switch (period) {
        case 'daily':
          stats = await receiptAnalyzer.getDailySummary(userId);
          break;
        case 'weekly':
          stats = await receiptAnalyzer.getWeeklySummary(userId);
          break;
        case 'monthly':
          stats = await receiptAnalyzer.getMonthlySummary(userId);
          break;
        default:
          stats = await receiptAnalyzer.getMonthlySummary(userId);
      }

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getExpenseStats:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil statistik pengeluaran',
        error: error.message
      });
    }
  }

  // Mendapatkan kategori pengeluaran
  async getExpenseCategories(req, res) {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      let receipts;
      
      if (startDate && endDate) {
        receipts = await ReceiptModel.findByUserAndDateRange(userId, startDate, endDate);
      } else {
        receipts = await ReceiptModel.findByUser(userId);
      }

      const categoryTotals = {};
      const categoryItems = {};

      receipts.forEach(receipt => {
        if (receipt.categories) {
          receipt.categories.forEach(cat => {
            categoryTotals[cat.category] = (categoryTotals[cat.category] || 0) + cat.total;
            
            if (!categoryItems[cat.category]) {
              categoryItems[cat.category] = [];
            }
            categoryItems[cat.category].push(...cat.items);
          });
        }
      });

      // Hitung persentase
      const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
      const categoryPercentages = {};
      
      Object.entries(categoryTotals).forEach(([category, amount]) => {
        categoryPercentages[category] = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
      });

      res.json({
        success: true,
        data: {
          categoryTotals,
          categoryPercentages,
          categoryItems,
          totalSpent
        }
      });
    } catch (error) {
      console.error('Error in getExpenseCategories:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil kategori pengeluaran',
        error: error.message
      });
    }
  }
}

module.exports = new ReceiptController();
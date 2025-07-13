// services/whatsappService.js
const moment = require('moment');

class WhatsappService {
  formatReceiptResponse(receipt) {
    let response = `📋 *STRUK BELANJA BERHASIL DIANALISIS*\n\n`;
    response += `🏪 *Toko:* ${receipt.store_name || 'Tidak diketahui'}\n`;
    response += `📅 *Tanggal:* ${moment(receipt.date).format('DD/MM/YYYY')}\n`;
    response += `⏰ *Waktu:* ${receipt.time || 'Tidak diketahui'}\n\n`;
    
    response += `🛒 *DETAIL BELANJA:*\n`;
    response += `────────────────────\n`;
    
    if (receipt.items && receipt.items.length > 0) {
      receipt.items.forEach((item, index) => {
        response += `${index + 1}. ${item.name}\n`;
        response += `   ${item.quantity}x @ Rp ${this.formatCurrency(item.price)}\n`;
        response += `   Subtotal: Rp ${this.formatCurrency(item.total)}\n\n`;
      });
    }
    
    response += `────────────────────\n`;
    response += `💰 *Subtotal:* Rp ${this.formatCurrency(receipt.subtotal)}\n`;
    
    if (receipt.tax && receipt.tax > 0) {
      response += `🧾 *Pajak:* Rp ${this.formatCurrency(receipt.tax)}\n`;
    }
    
    response += `💵 *TOTAL:* Rp ${this.formatCurrency(receipt.total)}\n\n`;
    
    if (receipt.categories && receipt.categories.length > 0) {
      response += `📊 *KATEGORI BELANJA:*\n`;
      receipt.categories.forEach(cat => {
        response += `• ${cat.category}: Rp ${this.formatCurrency(cat.total)}\n`;
      });
    }
    
    response += `\n📱 Ketik /summary untuk ringkasan hari ini`;
    
    return response;
  }

  formatSummaryResponse(summary) {
    let response = `📊 *RINGKASAN BELANJA HARI INI*\n`;
    response += `📅 ${moment(summary.date).format('DD MMMM YYYY')}\n\n`;
    
    response += `💰 *Total Pengeluaran:* Rp ${this.formatCurrency(summary.totalSpent)}\n`;
    response += `📋 *Total Transaksi:* ${summary.totalTransactions}\n\n`;
    
    if (Object.keys(summary.categoryTotals).length > 0) {
      response += `📊 *PENGELUARAN PER KATEGORI:*\n`;
      response += `────────────────────\n`;
      
      Object.entries(summary.categoryTotals).forEach(([category, total]) => {
        response += `• ${category}: Rp ${this.formatCurrency(total)}\n`;
      });
      response += `\n`;
    }
    
    if (summary.receipts.length > 0) {
      response += `🛒 *DETAIL TRANSAKSI:*\n`;
      response += `────────────────────\n`;
      
      summary.receipts.forEach((receipt, index) => {
        response += `${index + 1}. ${receipt.store} (${receipt.time})\n`;
        response += `   Rp ${this.formatCurrency(receipt.total)}\n\n`;
      });
    }
    
    response += `📱 Ketik /weekly untuk ringkasan mingguan`;
    
    return response;
  }

  formatWeeklySummaryResponse(summary) {
    let response = `📊 *RINGKASAN BELANJA MINGGU INI*\n`;
    response += `📅 ${moment(summary.weekStart).format('DD MMM')} - ${moment(summary.weekEnd).format('DD MMM YYYY')}\n\n`;
    
    response += `💰 *Total Pengeluaran:* Rp ${this.formatCurrency(summary.totalSpent)}\n`;
    response += `📈 *Rata-rata per Hari:* Rp ${this.formatCurrency(summary.averagePerDay)}\n\n`;
    
    response += `📊 *PENGELUARAN HARIAN:*\n`;
    response += `────────────────────\n`;
    
    Object.entries(summary.dailyTotals).forEach(([date, total]) => {
      response += `• ${moment(date).format('ddd, DD MMM')}: Rp ${this.formatCurrency(total)}\n`;
    });
    
    response += `\n📱 Ketik /monthly untuk ringkasan bulanan`;
    
    return response;
  }

  formatMonthlySummaryResponse(summary) {
    let response = `📊 *RINGKASAN BELANJA BULAN INI*\n`;
    response += `📅 ${moment(summary.month).format('MMMM YYYY')}\n\n`;
    
    response += `💰 *Total Pengeluaran:* Rp ${this.formatCurrency(summary.totalSpent)}\n`;
    response += `📈 *Rata-rata per Hari:* Rp ${this.formatCurrency(summary.averagePerDay)}\n\n`;
    
    if (Object.keys(summary.categoryTotals).length > 0) {
      response += `📊 *PENGELUARAN PER KATEGORI:*\n`;
      response += `────────────────────\n`;
      
      Object.entries(summary.categoryTotals).forEach(([category, total]) => {
        response += `• ${category}: Rp ${this.formatCurrency(total)}\n`;
      });
      response += `\n`;
    }
    
    if (Object.keys(summary.weeklyTotals).length > 0) {
      response += `📈 *PENGELUARAN MINGGUAN:*\n`;
      response += `────────────────────\n`;
      
      Object.entries(summary.weeklyTotals).forEach(([week, total]) => {
        response += `• ${week}: Rp ${this.formatCurrency(total)}\n`;
      });
    }
    
    return response;
  }

  getHelpMessage() {
    return `🤖 *BANTUAN WHATSAPP RECEIPT BOT*\n\n` +
           `📱 *PERINTAH:*\n` +
           `• /help - Menampilkan bantuan\n` +
           `• /summary - Ringkasan belanja hari ini\n` +
           `• /weekly - Ringkasan belanja minggu ini\n` +
           `• /monthly - Ringkasan belanja bulan ini\n\n` +
           `💡 *TIPS:*\n` +
           `• Pastikan gambar struk jelas dan tidak blur\n` +
           `• Foto struk dengan pencahayaan yang baik\n` +
           `• Bot akan otomatis menganalisis dan menyimpan data\n\n` +
           `📞 Butuh bantuan? Hubungi 08996901370`;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
  }
}

module.exports = new WhatsappService();
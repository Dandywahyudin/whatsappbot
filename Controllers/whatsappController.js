// controllers/whatsappController.js
const receiptAnalyzer = require('../Services/receiptAnalyzer');
const whatsappService = require('../Services/whatsappServices');
const fs = require('fs-extra');
const path = require('path');

class WhatsappController {
  async handleMessage(client, message) {
    try {
      const contact = await message.getContact();
      const userId = contact.id.user;
      
      // Handle pesan dengan gambar
      if (message.hasMedia) {
        const media = await message.downloadMedia();
        
        if (media.mimetype.startsWith('image/')) {
          await this.processReceiptImage(client, message, media, userId);
        } else {
          await message.reply('Mohon kirim gambar struk belanja yang valid.');
        }
      } else {
        // Handle pesan teks
        await this.handleTextMessage(client, message, userId);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      await message.reply('Maaf, terjadi kesalahan. Silakan coba lagi.');
    }
  }

  async processReceiptImage(client, message, media, userId) {
    try {
      // Simpan gambar sementara
      const tempPath = path.join(__dirname, '..', 'uploads', `temp_${Date.now()}.${media.mimetype.split('/')[1]}`);
      await fs.writeFile(tempPath, media.data, 'base64');

      // Analisis struk menggunakan Gemini
      const analysisResult = await receiptAnalyzer.analyzeReceipt(tempPath, userId);
      
      // Hapus file sementara
      await fs.remove(tempPath);

      if (analysisResult.success) {
        const response = whatsappService.formatReceiptResponse(analysisResult.data);
        await message.reply(response);
      } else {
        await message.reply('Maaf, tidak dapat membaca struk belanja. Pastikan gambar jelas dan berisi struk belanja.');
      }
    } catch (error) {
      console.error('Error processing receipt image:', error);
      await message.reply('Terjadi kesalahan saat memproses gambar struk.');
    }
  }

  async handleTextMessage(client, message, userId) {
    const text = message.body.toLowerCase().trim();
    
    switch (text) {
      case '/help':
        await message.reply(whatsappService.getHelpMessage());
        break;
      
      case '/summary':
        const summary = await receiptAnalyzer.getDailySummary(userId);
        await message.reply(whatsappService.formatSummaryResponse(summary));
        break;
      
      case '/weekly':
        const weeklySummary = await receiptAnalyzer.getWeeklySummary(userId);
        await message.reply(whatsappService.formatWeeklySummaryResponse(weeklySummary));
        break;
      
      case '/monthly':
        const monthlySummary = await receiptAnalyzer.getMonthlySummary(userId);
        await message.reply(whatsappService.formatMonthlySummaryResponse(monthlySummary));
        break;
      
      default:
        await message.reply('Kirim gambar struk belanja atau ketik /help untuk bantuan.');
    }
  }
}

module.exports = new WhatsappController();
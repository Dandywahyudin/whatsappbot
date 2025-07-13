const receiptAnalyzer = require('../Services/receiptAnalyzer');
const whatsappService = require('../Services/whatsappServices');
const fs = require('fs-extra');
const path = require('path');

class WhatsappController {
  constructor() {
    this.botTrigger = "wawan"; 
  }

  async handleMessage(client, message) {
    try {
      // Mengambil isi pesan atau caption media
      const messageBody = (message.body || '').trim();
      
      // Mengubah pesan menjadi huruf kecil untuk pengecekan pemicu yang tidak case-sensitive
      const lowerCaseMessage = messageBody.toLowerCase();
      const trigger = this.botTrigger.toLowerCase();

      // Bot hanya akan merespons jika pesan dimulai dengan kata pemicu
      if (!lowerCaseMessage.startsWith(trigger)) {
        return; // Hentikan proses jika pesan tidak diawali dengan nama bot
      }

      // Menghapus kata pemicu dari pesan untuk diproses lebih lanjut
      const content = messageBody.substring(this.botTrigger.length).trim();
      
      const contact = await message.getContact();
      const userId = contact.id.user;
      
      // Handle pesan dengan gambar (jika bot dipanggil)
      if (message.hasMedia) {
        const media = await message.downloadMedia();
        
        if (media && media.mimetype.startsWith('image/')) {
          await this.processReceiptImage(client, message, media, userId);
        } else {
          // Pesan balasan ini hanya dikirim jika bot dipanggil dengan media selain gambar
          await message.reply('Mohon kirim gambar struk belanja yang valid.');
        }
      } else {
        // Handle pesan teks (dengan konten yang sudah dibersihkan dari pemicu)
        await this.handleTextMessage(client, message, userId, content);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      await message.reply('Maaf, terjadi kesalahan. Silakan coba lagi.');
    }
  }

   async processReceiptImage(client, message, media, userId) {
    try {
      const tempPath = path.join(__dirname, '..', 'uploads', `temp_${Date.now()}.${media.mimetype.split('/')[1]}`);
      await fs.writeFile(tempPath, media.data, 'base64');

      // Memanggil fungsi analisis gambar yang baru
      const analysisResult = await receiptAnalyzer.analyzeImage(tempPath, userId);
      
      await fs.remove(tempPath);

      if (analysisResult.success) {
        // Memeriksa tipe hasil analisis
        if (analysisResult.type === 'receipt') {
          // Jika struk, format seperti biasa
          const response = whatsappService.formatReceiptResponse(analysisResult.data);
          await message.reply(response);
        } else if (analysisResult.type === 'general') {
          // Jika gambar lain, langsung kirim deskripsinya
          await message.reply(analysisResult.data);
        }
      } else {
        await message.reply('Maaf, tidak dapat menganalisis gambar ini. Pastikan gambar jelas.');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      await message.reply('Terjadi kesalahan saat memproses gambar.');
    }
  }


  async handleTextMessage(client, message, userId, content) {
    const text = content.trim();
    const lowerCaseText = text.toLowerCase();
    
    // Jika tidak ada teks setelah pemicu, berikan pesan bantuan
    if (!text) {
        await message.reply(`Halo! Ada yang bisa saya bantu? Ketik "${this.botTrigger} /help" untuk melihat daftar perintah.`);
        return;
    }

    if (lowerCaseText.startsWith('/')) {
      const command = lowerCaseText;
      switch (command) {
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
          await message.reply(`Perintah tidak dikenali. Ketik "${this.botTrigger} /help" untuk bantuan.`);
      }
    } else {
        // Jika bukan perintah, anggap sebagai chat biasa
        try {
            const geminiService = require('../Services/geminiService');
            const chatResponse = await geminiService.generateChatResponse(text);
            await message.reply(chatResponse);
        } catch (error) {
            console.error('Error handling free-form chat:', error);
            await message.reply('Maaf, terjadi kesalahan saat mencoba merespons. Silakan coba lagi.');
        }
    }
  }
}

module.exports = new WhatsappController();
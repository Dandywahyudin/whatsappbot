// services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs-extra');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeReceiptImage(imagePath) {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const prompt = `
        Analisis gambar struk belanja ini dan berikan informasi dalam format JSON dengan struktur berikut:
        {
          "store_name": "nama toko",
          "date": "tanggal transaksi (format YYYY-MM-DD)",
          "time": "waktu transaksi (format HH:MM)",
          "items": [
            {
              "name": "nama barang",
              "quantity": jumlah,
              "price": harga_per_item,
              "total": total_harga_item
            }
          ],
          "subtotal": total_sebelum_pajak,
          "tax": pajak,
          "total": total_keseluruhan,
          "payment_method": "metode_pembayaran",
          "change": uang_kembalian
        }
        
        Pastikan semua angka dalam format number, bukan string.
        Jika ada informasi yang tidak tersedia, berikan nilai null.
        Hanya berikan response dalam format JSON yang valid.
      `;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const jsonString = text.substring(jsonStart, jsonEnd);
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error analyzing receipt with Gemini:', error);
      throw new Error('Failed to analyze receipt');
    }
  }

  async categorizeExpense(items) {
    try {
      const itemNames = items.map(item => item.name).join(', ');
      
      const prompt = `
        Kategorikan item belanja berikut ke dalam kategori yang sesuai:
        Items: ${itemNames}
        
        Berikan response dalam format JSON:
        {
          "categories": [
            {
              "category": "nama_kategori",
              "items": ["item1", "item2"],
              "total": total_harga_kategori
            }
          ]
        }
        
        Kategori yang tersedia: makanan, minuman, kebersihan, kesehatan, elektronik, pakaian, lainnya
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const jsonString = text.substring(jsonStart, jsonEnd);
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error categorizing expense:', error);
      return { categories: [] };
    }
  }
}

module.exports = new GeminiService();
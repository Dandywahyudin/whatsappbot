// services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs-extra');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeImage(imagePath) {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const prompt = `
        Analisis gambar ini. Pertama, tentukan apakah gambar ini adalah struk belanja.

        1.  **Jika ini adalah struk belanja**, analisis dan berikan informasi HANYA dalam format JSON yang ketat dengan struktur berikut. Pastikan semua angka adalah tipe data number.
            {
              "is_receipt": true,
              "store_name": "nama toko",
              "date": "tanggal transaksi (format YYYY-MM-DD)",
              "time": "waktu transaksi (format HH:MM)",
              "items": [
                { "name": "nama barang", "quantity": jumlah, "price": harga_per_item, "total": total_harga_item }
              ],
              "subtotal": total_sebelum_pajak,
              "tax": pajak,
              "total": total_keseluruhan
            }

        2.  **Jika ini BUKAN struk belanja** (misalnya foto pemandangan, soal matematika, diagram, dll.), analisis konten gambar tersebut secara cerdas dan jawab menggunakan bahasa indonesia jika percakapan menggunakan bahasa indonesia. Berikan respons dalam format JSON berikut:
            {
              "is_receipt": false,
              "description": "Deskripsi, jawaban, atau analisis relevan dari gambar."
            }
        
        PENTING: Jangan berikan teks atau penjelasan lain di luar format JSON yang diminta.
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
      
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const jsonString = text.substring(jsonStart, jsonEnd);
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error analyzing image with Gemini:', error);
      throw new Error('Failed to analyze image');
    }
  }

  async categorizeExpense(items) {
    try {
      const itemNames = items.map(item => item.name).join(', ');
      
      const prompt = `
        Kategorikan item belanja berikut ke dalam kategori yang sesuai: Makanan, Minuman, Kebersihan, Kesehatan, Elektronik, Pakaian, Lainnya.
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

  async generateChatResponse(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating chat response with Gemini:', error);
      throw new Error('Failed to generate chat response');
    }
  }
}

module.exports = new GeminiService();
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const whatsappController = require('./controllers/whatsappController');
const receiptController = require('./controllers/receiptController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer untuk upload gambar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan!'));
    }
  }
});

// Initialize WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }
});

// WhatsApp Events
client.on('qr', (qr) => {
  console.log('QR Code received, scan please!');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('WhatsApp Bot is ready!');
});

client.on('message', async (message) => {
  await whatsappController.handleMessage(client, message);
});

client.initialize();

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'WhatsApp Receipt Bot is running!' });
});

// Receipt routes
app.post('/upload', upload.single('receipt'), receiptController.uploadReceipt);
app.get('/receipts/:userId', receiptController.getUserReceipts);
app.get('/receipts/:userId/:receiptId', receiptController.getReceiptById);
app.delete('/receipts/:userId/:receiptId', receiptController.deleteReceipt);
app.get('/summary/:userId', receiptController.getDailySummary);
app.get('/weekly/:userId', receiptController.getWeeklySummary);
app.get('/monthly/:userId', receiptController.getMonthlySummary);
app.get('/stats/:userId', receiptController.getExpenseStats);
app.get('/categories/:userId', receiptController.getExpenseCategories);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
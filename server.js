const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const axios = require('axios');
require('dotenv').config();
const { isNonEmptyString, sanitize, isPositiveNumberString } = require('./src/validators');

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "data:"],
    }
  }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html' }));

// Rate limiter (IP-based, to mitigate spam)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,             // 20 requests/min/IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Multer for handling file uploads
const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || '5', 10);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('ไฟล์รูปต้องเป็น JPG/PNG/WebP เท่านั้น'));
    }
    cb(null, true);
  }
});

// Honeypot middleware (basic bot trap)
function honeypot(req, res, next) {
  if (req.body && req.body.hp_field) {
    return res.status(400).json({ ok: false, error: 'Bot detected' });
  }
  next();
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.warn('⚠️  โปรดตั้งค่า TELEGRAM_BOT_TOKEN และ TELEGRAM_CHAT_ID ในไฟล์ .env');
}

async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = { chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true };
  const res = await axios.post(url, payload);
  return res.data;
}

async function sendTelegramPhoto(buffer, filename, caption) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const formData = new FormData();
  formData.append('chat_id', TELEGRAM_CHAT_ID);
  formData.append('caption', caption || '');
  formData.append('photo', new Blob([buffer]), filename);

  const res = await axios.post(url, formData, {
    headers: formData.getHeaders ? formData.getHeaders() : { 'Content-Type': 'multipart/form-data' },
    maxBodyLength: Infinity,
  });
  return res.data;
}

// Because we're using Blob/FormData in Node, ensure globals (Node 18+ has them; fallback for older)

app.post('/api/register', upload.single('photo'), honeypot, async (req, res) => {
  try {
    const fullName = sanitize(req.body.fullName || '');
    const lineName = sanitize(req.body.lineName || '');
    const capital = sanitize(req.body.capital || '');
    const sectors = Array.isArray(req.body.sectors) ? req.body.sectors : (req.body.sectors ? [req.body.sectors] : []);
    const tradingStyle = sanitize(req.body.tradingStyle || '');

    // Basic validations
    if (!isNonEmptyString(fullName)) {
      return res.status(400).json({ ok: false, error: 'กรุณากรอกชื่อ-นามสกุล' });
    }
    if (!isNonEmptyString(lineName)) {
      return res.status(400).json({ ok: false, error: 'กรุณากรอก Line name' });
    }
    if (!isPositiveNumberString(capital)) {
      return res.status(400).json({ ok: false, error: 'จำนวนเงินทุนต้องเป็นตัวเลข' });
    }
    if (!isNonEmptyString(tradingStyle)) {
      return res.status(400).json({ ok: false, error: 'กรุณาเลือกสไตล์การเทรด' });
    }

    const sectorList = sectors.map(sanitize).filter(Boolean);
    const timeStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

    // Construct message
    const message = [
      '📥 <b>WE WIN - ลูกค้าใหม่ลงทะเบียน</b>',
      `👤 ชื่อ-นามสกุล: <b>${fullName}</b>`,
      `💬 Line name: <b>${lineName}</b>`,
      `💰 เงินทุน: <b>${capital}</b>`,
      `📊 กลุ่มหุ้นที่สนใจ: <b>${sectorList.join(', ') || '-'}</b>`,
      `🧭 สไตล์การเทรด: <b>${tradingStyle}</b>`,
      `⏱ เวลา: ${timeStr}`
    ].join('\n');

    // Send text first
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return res.status(500).json({ ok: false, error: 'ไม่ได้ตั้งค่า Telegram' });
    }
    await sendTelegramMessage(message);

    // If photo attached, forward it
    if (req.file && req.file.buffer) {
      const filename = req.file.originalname || 'photo.jpg';
      await sendTelegramPhoto(req.file.buffer, filename, `📎 รูปลูกค้า: ${fullName}`);
    }

    return res.json({ ok: true, message: 'ส่งข้อมูลไปยัง Telegram แล้ว ขอบคุณค่ะ/ครับ' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
  }
});

// Health check
app.get('/healthz', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`WE WIN server running on http://localhost:${port}`);
});

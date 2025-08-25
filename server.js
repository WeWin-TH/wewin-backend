import express from "express";
import multer from "multer";
import cors from "cors";

const app = express();
const upload = multer();

// ✅ เปิด CORS ให้ทุก origin (ถ้าต้องการจำกัดเฉพาะ domain แก้ตรงนี้ได้)
app.use(cors());

// 🔑 ใช้ Environment Variables
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.post("/api/register", upload.none(), async (req, res) => {
  try {
    const { fullName, lineName, capital, tradingStyle } = req.body;

    const message = `
📝 WE WIN Registration
👤 ชื่อ: ${fullName}
💬 Line: ${lineName}
💰 ทุน: ${capital}
📈 สไตล์: ${tradingStyle}
    `;

    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
      }),
    });

    res.json({ ok: true, message: "ส่งข้อมูลสำเร็จ!" });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: "ส่งไม่สำเร็จ" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

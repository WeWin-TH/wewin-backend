import express from "express";
import multer from "multer";
import cors from "cors";

const app = express();
const upload = multer();

app.use(cors());

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

    // ✅ ลอง log request/response เพื่อ debug
    const tgResp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
      }),
    });

    const tgData = await tgResp.json();
    console.log("Telegram API response:", tgData); // 👈 log ไว้ดูใน Render

    if (!tgData.ok) {
      return res.status(500).json({ ok: false, error: tgData.description });
    }

    res.json({ ok: true, message: "ส่งข้อมูลสำเร็จ!" });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ ok: false, error: "ส่งไม่สำเร็จ" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

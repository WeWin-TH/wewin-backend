import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" }); // เก็บไฟล์ชั่วคราว

app.use(cors());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.post("/api/register", upload.single("photo"), async (req, res) => {
  try {
    console.log("📥 Incoming body:", req.body);
    console.log("📷 File uploaded:", req.file);

    const { fullName, lineName, capital, tradingStyle } = req.body;

    const message = `
📝 WE WIN Registration
👤 ชื่อ: ${fullName || "ไม่ระบุ"}
💬 Line: ${lineName || "ไม่ระบุ"}
💰 ทุน: ${capital || "ไม่ระบุ"}
📈 สไตล์: ${tradingStyle || "ไม่ระบุ"}
    `;

    // 1) ส่งข้อความไป Telegram
    const urlMsg = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    await fetch(urlMsg, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
      }),
    });

    // 2) ถ้ามีไฟล์ → ส่งรูปไป Telegram
    if (req.file) {
      const urlPhoto = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`;

      const formData = new FormData();
      formData.append("chat_id", CHAT_ID);
      formData.append("photo", fs.createReadStream(req.file.path));

      await fetch(urlPhoto, { method: "POST", body: formData });
    }

    // 3) ลบไฟล์ชั่วคราวหลังส่งสำเร็จ
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("ลบไฟล์ไม่สำเร็จ:", err);
      });
    }

    res.json({ ok: true, message: "ส่งข้อมูลสำเร็จ!" });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ ok: false, error: "ส่งไม่สำเร็จ" });
  }
});

// root route (optional)
app.get("/", (req, res) => {
  res.send("✅ WE WIN backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

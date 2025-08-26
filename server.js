import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import FormData from "form-data";

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.post("/api/register", upload.single("photo"), async (req, res) => {
  try {
    console.log("📥 Incoming body:", req.body);
    console.log("📷 File uploaded:", req.file);

    const { fullName, lineName, capital, sectors, tradingStyle } = req.body;

    const message = `
📝 WE WIN Registration
👤 ชื่อ: ${fullName || "ไม่ระบุ"}
💬 Line: ${lineName || "ไม่ระบุ"}
💰 ทุน: ${capital || "ไม่ระบุ"}
📊 กลุ่มหุ้น: ${Array.isArray(sectors) ? sectors.join(", ") : (sectors || "ไม่ระบุ")}
📈 สไตล์: ${tradingStyle || "ไม่ระบุ"}
    `;

    if (req.file) {
      // ส่งรูป + ข้อความพร้อมกัน
      const formData = new FormData();
      formData.append("chat_id", CHAT_ID);
      formData.append("caption", message);
      formData.append("photo", fs.createReadStream(req.file.path));

      const tgResp = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
        method: "POST",
        body: formData,
      });

      const tgData = await tgResp.json();
      console.log("✅ Telegram API response:", tgData);

      fs.unlink(req.file.path, () => {}); // ลบไฟล์ชั่วคราว

      if (!tgData.ok) {
        return res.status(500).json({ ok: false, error: tgData.description });
      }
    } else {
      // ถ้าไม่มีรูป → ส่งข้อความธรรมดา
      const tgResp = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
      });

      const tgData = await tgResp.json();
      if (!tgData.ok) {
        return res.status(500).json({ ok: false, error: tgData.description });
      }
    }

    res.json({ ok: true, message: "ส่งข้อมูลสำเร็จ!" });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ ok: false, error: "ส่งไม่สำเร็จ" });
  }
});

app.get("/", (req, res) => {
  res.send("✅ WE WIN backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

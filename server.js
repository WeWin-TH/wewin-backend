import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import FormData from "form-data";

const app = express();
const upload = multer({ dest: "uploads/" });

// เปิดให้ CORS ใช้งานได้จาก GitHub Pages
app.use(cors());

// อ่านค่า Environment Variables
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Debug log ตอนสตาร์ท server
console.log("🔑 TELEGRAM_TOKEN:", TELEGRAM_TOKEN ? TELEGRAM_TOKEN : "❌ Missing");
console.log("💬 CHAT_ID:", CHAT_ID ? CHAT_ID : "❌ Missing");

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

    let tgUrl = "";
    let tgResp, tgData;

    if (req.file) {
      const formData = new FormData();
      formData.append("chat_id", CHAT_ID);
      formData.append("caption", message);
      formData.append("photo", fs.createReadStream(req.file.path));

      tgUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`;
      console.log("🚀 Sending to Telegram (photo):", { url: tgUrl, chat_id: CHAT_ID });

      tgResp = await fetch(tgUrl, { method: "POST", body: formData });
      tgData = await tgResp.json();

      fs.unlink(req.file.path, () => {}); // ลบไฟล์หลังส่ง
    } else {
      tgUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
      console.log("🚀 Sending to Telegram (message):", { url: tgUrl, chat_id: CHAT_ID });

      tgResp = await fetch(tgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
      });

      tgData = await tgResp.json();
    }

    console.log("✅ Telegram API response:", tgData);

    if (!tgData.ok) {
      return res.status(500).json({ ok: false, error: tgData.description });
    }

    res.json({ ok: true, message: "ส่งข้อมูลสำเร็จ!" });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ ok: false, error: "ส่งไม่สำเร็จ" });
  }
});

// root route
app.get("/", (req, res) => {
  res.send("✅ WE WIN backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

console.log("🔑 TELEGRAM_TOKEN:", TELEGRAM_TOKEN ? TELEGRAM_TOKEN : "❌ Missing");
console.log("💬 CHAT_ID:", CHAT_ID ? CHAT_ID : "❌ Missing");

app.post("/api/register", upload.single("photo"), async (req, res) => {
  try {
    const { fullName, lineName, capital, sectors, tradingStyle } = req.body;

    const message = `
📝 WE WIN Registration
👤 ชื่อ: ${fullName || "ไม่ระบุ"}
💬 Line: ${lineName || "ไม่ระบุ"}
💰 ทุน: ${capital || "ไม่ระบุ"}
📊 กลุ่มหุ้น: ${sectors || "ไม่ระบุ"}
📈 สไตล์: ${tradingStyle || "ไม่ระบุ"}
    `;

    let tgData;

    if (req.file) {
      const formData = new FormData();
      formData.append("chat_id", CHAT_ID);
      formData.append("caption", message);
      formData.append("photo", fs.createReadStream(req.file.path));

      const tgUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`;

      tgData = await axios.post(tgUrl, formData, {
        headers: formData.getHeaders(),
      });

      fs.unlink(req.file.path, () => {});
    } else {
      const tgUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

      tgData = await axios.post(tgUrl, {
        chat_id: CHAT_ID,
        text: message,
      });
    }

    if (!tgData.data.ok) {
      return res.status(500).json({ ok: false, error: tgData.data.description });
    }

    res.json({ ok: true, message: "ส่งข้อมูลสำเร็จ!" });
  } catch (err) {
    console.error("❌ Server error:", err.response?.data || err.message);
    res.status(500).json({ ok: false, error: "ส่งไม่สำเร็จ" });
  }
});

app.get("/", (req, res) => {
  res.send("✅ WE WIN backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

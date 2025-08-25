app.post("/api/register", upload.none(), async (req, res) => {
  try {
    console.log("📥 Incoming body:", req.body); // 👈 ดูว่า frontend ส่งอะไรมาบ้าง

    const { fullName, lineName, capital, tradingStyle } = req.body;

    const message = `
📝 WE WIN Registration
👤 ชื่อ: ${fullName || "ไม่ระบุ"}
💬 Line: ${lineName || "ไม่ระบุ"}
💰 ทุน: ${capital || "ไม่ระบุ"}
📈 สไตล์: ${tradingStyle || "ไม่ระบุ"}
    `;

    console.log("📤 Sending message:", message); // 👈 ดู payload ที่จะส่งไป Telegram

    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const tgResp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
      }),
    });

    const tgData = await tgResp.json();
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

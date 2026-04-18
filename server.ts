import express from "express";
import { createServer as createViteServer } from "vite";
import { Telegraf, Markup } from "telegraf";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEB_APP_URL = process.env.TELEGRAM_MINI_APP_URL || "https://ais-dev-6b4qiuppxj2zxsupd36mmg-329310627949.asia-southeast1.run.app";

async function startServer() {
  // Telegram Bot Setup
  if (BOT_TOKEN) {
    const bot = new Telegraf(BOT_TOKEN);

    bot.start((ctx) => {
      ctx.reply(
        `Әссәләму әләйкум, ${ctx.from.first_name}! \n\n"Намаз Index" бағдарламасына қош келдіңіз. Бұл жерде сіз намаздарыңызды қадағалап, рухани дамуыңызды бақылай аласыз.`,
        Markup.keyboard([
          [Markup.button.webApp("Намаз Index ашу", WEB_APP_URL)]
        ]).resize()
      );
    });

    bot.on("message", (ctx) => {
      ctx.reply(
        "Намаз Index бағдарламасын ашу үшін төмендегі батырманы басыңыз 👇",
        Markup.keyboard([
          [Markup.button.webApp("Намаз Index ашу", WEB_APP_URL)]
        ]).resize()
      );
    });

    bot.launch()
      .then(() => console.log("Telegram Bot is running..."))
      .catch((err) => console.error("Error starting Telegram Bot:", err));

    // Enable graceful stop
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
  } else {
    console.warn("TELEGRAM_BOT_TOKEN find not found in environment variables. Bot functionality will be disabled.");
  }

  // API Routes (Optional)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

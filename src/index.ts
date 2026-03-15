import { Hono } from "hono";
import { initDb } from "./db";
import { handleWebhook } from "./webhook";
import { runDailyCron } from "./cron";

// If running as a Railway cron job, execute and exit
if (process.env.RAILWAY_CRON_JOB_NAME) {
	console.log("[Cron] Running daily cron job...");
	await initDb();
	await runDailyCron();
	console.log("[Cron] Done.");
	process.exit(0);
}

const app = new Hono();

await initDb();
console.log("[DB] Initialized.");

app.post("/webhook", handleWebhook);

app.get("/health", (c) => {
	return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/cron", async (c) => {
	const key = c.req.query("key");
	if (key !== process.env.CRON_SECRET) {
		return c.json({ error: "unauthorized" }, 401);
	}
	console.log("[Cron] Triggered via /cron endpoint");
	await runDailyCron();
	return c.json({ status: "ok" });
});

const port = parseInt(process.env.PORT || "3000");

console.log(`[Server] Listening on port ${port}`);

export default {
	port,
	fetch: app.fetch,
};

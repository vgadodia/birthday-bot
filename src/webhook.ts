import type { Context } from "hono";
import { ensureUser, upsertBirthday, deleteBirthday, listBirthdays, getDaysUntilNext } from "./db";
import { parseIntent } from "./parser";
import { sendSms } from "./sms";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatMonthDay(month: number, day: number): string {
	return `${MONTH_NAMES[month - 1]} ${day}`;
}

export async function handleWebhook(c: Context) {
	const body = await c.req.parseBody();
	const from = body["From"] as string;
	const text = body["Body"] as string;

	console.log(`[SMS] From: ${from} | Body: ${text}`);

	await ensureUser(from);

	const intent = await parseIntent(text);
	console.log(`[Intent] ${JSON.stringify(intent)}`);

	let reply: string;

	switch (intent.action) {
		case "add":
		case "update": {
			await upsertBirthday(from, intent.name, intent.month, intent.day, intent.year);
			reply = `Got it! I'll remind you about ${intent.name}'s birthday on ${formatMonthDay(intent.month, intent.day)}. 🎂`;
			break;
		}

		case "delete": {
			const found = await deleteBirthday(from, intent.name);
			reply = found
				? `Removed ${intent.name} from your birthdays.`
				: `I don't have a birthday saved for ${intent.name}.`;
			break;
		}

		case "list": {
			const birthdays = await listBirthdays(from);
			if (birthdays.length === 0) {
				reply = `You haven't added any birthdays yet. Try: "Jake's birthday is June 22"`;
			} else {
				const today = new Date();
				const lines = birthdays.slice(0, 10).map((b) => {
					const daysUntil = getDaysUntilNext(today, b.month, b.day);
					const label = daysUntil === 0 ? "(today! 🎂)" : `(in ${daysUntil} day${daysUntil === 1 ? "" : "s"})`;
					return `• ${b.name} — ${formatMonthDay(b.month, b.day)} ${label}`;
				});

				reply = `Your birthdays:\n${lines.join("\n")}`;
				if (birthdays.length > 10) {
					reply += `\n+ ${birthdays.length - 10} more`;
				}
			}
			break;
		}

		case "help": {
			reply = `Birthday Bot 🎂

Add: "Jake's birthday is June 22"
Update: "Actually Jake is June 23"
Remove: "Remove Jake"
List: "Show my birthdays"

You'll get a text every morning when it's someone's birthday.`;
			break;
		}

		default: {
			reply = `Hmm, I didn't understand that. Text "help" to see what I can do.`;
			break;
		}
	}

	await sendSms(from, reply);

	return c.body(null, 200);
}

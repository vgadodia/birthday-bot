import { getTodaysBirthdays, getUpcomingBirthdays } from "./db";
import { sendSms } from "./sms";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatMonthDay(month: number, day: number): string {
	return `${MONTH_NAMES[month - 1]} ${day}`;
}

export async function runDailyCron() {
	const now = new Date();
	const month = now.getMonth() + 1;
	const day = now.getDate();

	// Handle Feb 29 → remind on Feb 28 in non-leap years
	const isLeapYear = (now.getFullYear() % 4 === 0 && now.getFullYear() % 100 !== 0) || now.getFullYear() % 400 === 0;

	const todayRows = await getTodaysBirthdays(month, day);
	const todaysBirthdays = [...todayRows];

	if (month === 2 && day === 28 && !isLeapYear) {
		const leapBirthdays = await getTodaysBirthdays(2, 29);
		todaysBirthdays.push(...leapBirthdays);
	}

	if (todaysBirthdays.length === 0) {
		console.log("[Cron] No birthdays today.");
		return;
	}

	// Group by user
	const byUser = new Map<string, string[]>();
	for (const row of todaysBirthdays) {
		const names = byUser.get(row.user_phone) ?? [];
		names.push(row.name);
		byUser.set(row.user_phone, names);
	}

	for (const [userPhone, names] of byUser) {
		const todayLines = names.map((n) => `It's ${n}'s birthday!`).join("\n");
		let message = `🎂 Today:\n${todayLines}`;

		const upcoming = await getUpcomingBirthdays(userPhone, 7);
		if (upcoming.length > 0) {
			const upcomingLines = upcoming
				.map(
					(b) => `• ${b.name} — ${formatMonthDay(b.month, b.day)} (${b.daysUntil} day${b.daysUntil === 1 ? "" : "s"})`,
				)
				.join("\n");
			message += `\n\n📅 Coming up this week:\n${upcomingLines}`;
		}

		console.log(`[Cron] Sending to ${userPhone}: ${message}`);
		await sendSms(userPhone, message);
	}
}

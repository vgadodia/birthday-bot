// import twilio from "twilio";
//
// const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
//
// export async function sendSms(to: string, body: string): Promise<void> {
// 	await client.messages.create({
// 		to,
// 		from: process.env.TWILIO_PHONE_NUMBER!,
// 		body,
// 	});
// }

import SendblueAPI from "sendblue";

const client = new SendblueAPI({
	apiKey: process.env.SENDBLUE_API_KEY!,
	apiSecret: process.env.SENDBLUE_API_SECRET!,
});

export async function sendSms(to: string, body: string): Promise<void> {
	await client.messages.send({
		content: body,
		from_number: process.env.SENDBLUE_PHONE_NUMBER!,
		number: to,
	});
}

# Birthday Bot 🎂

A self-hostable SMS birthday reminder bot. Users interact entirely via text message — no app, no dashboard. Text a Twilio number to add, update, or delete birthdays. Every morning, the bot texts you a reminder if someone's birthday is today, plus a heads-up for upcoming birthdays in the next 7 days.

## Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/your-username/birthday-bot.git
   cd birthday-bot
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in the values:

   - **Supabase**: Create a project at [supabase.com](https://supabase.com). Grab the connection string from **Settings → Database → Connection string** (use the "URI" format, direct connection not pooler).
   - **Twilio**: Get a phone number from [twilio.com/console](https://twilio.com/console). Set the SMS webhook URL to `https://your-domain/webhook`.
   - **OpenAI**: Get an API key from [platform.openai.com](https://platform.openai.com).

4. **Run locally**

   ```bash
   bun dev
   ```

5. **Deploy to Railway**

   - Push to GitHub and connect your repo at [railway.app](https://railway.app)
   - Set all environment variables from `.env.example`
   - Add a **cron service** from the same repo with schedule `0 8 * * *` and set `RAILWAY_CRON_JOB_NAME=daily` in its env vars

## Usage

Text your Twilio number:

| Message                              | What it does            |
| ------------------------------------ | ----------------------- |
| `Jake's birthday is June 22`        | Add a birthday          |
| `Actually Jake is June 23`          | Update a birthday       |
| `Sarah turns 30 on July 4th 1995`   | Add with birth year     |
| `Remove Jake`                        | Delete a birthday       |
| `Show my birthdays`                  | List all birthdays      |
| `help`                               | Show available commands |

You'll get a text every morning at 8am when it's someone's birthday.

## Self-Hosting Notes

Railway is recommended but any Bun-compatible host works. The app runs as two services from the same image:

- **Web service**: handles inbound SMS webhooks
- **Cron service**: runs daily to send birthday reminders (set `RAILWAY_CRON_JOB_NAME=daily` in the cron service's env vars)

For non-Railway hosts, trigger the cron by running `bun run src/index.ts` with `RAILWAY_CRON_JOB_NAME=daily` set, e.g. via system cron.

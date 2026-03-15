import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

export default sql;

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      phone TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS birthdays (
      id SERIAL PRIMARY KEY,
      user_phone TEXT NOT NULL REFERENCES users(phone),
      name TEXT NOT NULL,
      month INTEGER NOT NULL,
      day INTEGER NOT NULL,
      year INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_phone, name)
    )
  `;
}

export async function ensureUser(phone: string) {
  await sql`INSERT INTO users (phone) VALUES (${phone}) ON CONFLICT DO NOTHING`;
}

export async function upsertBirthday(
  userPhone: string,
  name: string,
  month: number,
  day: number,
  year?: number
) {
  await sql`
    INSERT INTO birthdays (user_phone, name, month, day, year)
    VALUES (${userPhone}, ${name}, ${month}, ${day}, ${year ?? null})
    ON CONFLICT (user_phone, name)
    DO UPDATE SET month = ${month}, day = ${day}, year = ${year ?? null}, updated_at = NOW()
  `;
}

export async function deleteBirthday(
  userPhone: string,
  name: string
): Promise<boolean> {
  const result = await sql`
    DELETE FROM birthdays
    WHERE user_phone = ${userPhone} AND LOWER(name) = LOWER(${name})
    RETURNING id
  `;
  return result.length > 0;
}

export async function listBirthdays(userPhone: string) {
  const rows = await sql`
    SELECT name, month, day, year FROM birthdays
    WHERE user_phone = ${userPhone}
    ORDER BY month, day
  `;
  return rows;
}

export async function getTodaysBirthdays(month: number, day: number) {
  const rows = await sql`
    SELECT user_phone, name, year FROM birthdays
    WHERE month = ${month} AND day = ${day}
  `;
  return rows;
}

export async function getUpcomingBirthdays(
  userPhone: string,
  withinDays: number
) {
  const today = new Date();
  const upcoming: { name: string; month: number; day: number; year: number | null; daysUntil: number }[] = [];

  const rows = await sql`
    SELECT name, month, day, year FROM birthdays
    WHERE user_phone = ${userPhone}
    ORDER BY month, day
  `;

  for (const row of rows) {
    const daysUntil = getDaysUntilNext(today, row.month, row.day);
    if (daysUntil > 0 && daysUntil <= withinDays) {
      upcoming.push({
        name: row.name,
        month: row.month,
        day: row.day,
        year: row.year,
        daysUntil,
      });
    }
  }

  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function getDaysUntilNext(
  from: Date,
  month: number,
  day: number
): number {
  const year = from.getFullYear();
  let next = new Date(year, month - 1, day);

  // Handle Feb 29 in non-leap years
  if (month === 2 && day === 29 && next.getMonth() !== 1) {
    next = new Date(year, 1, 28);
  }

  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  if (next < today) {
    next = new Date(year + 1, month - 1, day);
    if (month === 2 && day === 29 && next.getMonth() !== 1) {
      next = new Date(year + 1, 1, 28);
    }
  }

  const diff = next.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

import type { NextApiRequest, NextApiResponse } from 'next';

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body ?? {};
  if (!password || password !== process.env.AUTH_PSK) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  res.setHeader(
    'Set-Cookie',
    `auth=${process.env.AUTH_COOKIE_SECRET}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${THIRTY_DAYS}`,
  );
  res.status(200).json({ ok: true });
}

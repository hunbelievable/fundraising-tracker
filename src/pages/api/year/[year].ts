import type { NextApiRequest, NextApiResponse } from 'next';
import { loadOmahaData } from 'mustache-historian/server';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { year } = req.query;

  if (!year || typeof year !== 'string') {
    res.status(400).json({ error: 'Year parameter is required' });
    return;
  }

  try {
    const yearNum = parseInt(year);
    const data = loadOmahaData().filter(r => r.year === yearNum);
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error loading data' });
  }
}

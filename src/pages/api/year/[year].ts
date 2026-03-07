import { loadCSV } from '@/utils/loadCSV';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { year } = req.query;

  if (!year || typeof year !== 'string') {
    res.status(400).json({ error: 'Year parameter is required' });
    return;
  }

  try {
    // Filter out John Doe placeholder rows — they carry unattributed event
    // dollars and should never appear as leaderboard entries.
    const data = loadCSV(year).filter(
      r => !(r.firstName === 'John' && r.lastName === 'Doe'),
    );
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error loading data' });
  }
  {console.log('Full req.query:', req.query);
 }
}

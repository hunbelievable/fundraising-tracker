import type { NextApiRequest, NextApiResponse } from 'next';
import { loadAwardsCSV, StacheyAwardRecord } from '../../utils/loadAwardsCSV';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const awards = loadAwardsCSV();
    res.status(200).json(awards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error loading Stachey Awards data' });
  }
}

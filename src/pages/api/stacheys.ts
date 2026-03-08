import type { NextApiRequest, NextApiResponse } from 'next';
import { loadOmahaAwards } from 'mustache-historian/server';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    res.status(200).json(loadOmahaAwards());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error loading Stachey Awards data' });
  }
}

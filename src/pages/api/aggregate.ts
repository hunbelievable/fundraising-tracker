import type { NextApiRequest, NextApiResponse } from 'next';
import { loadOmahaData } from 'mustache-historian/server';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const allData = loadOmahaData();
  res.status(200).json(allData);
}

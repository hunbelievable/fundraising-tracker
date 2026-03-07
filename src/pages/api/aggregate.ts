import type { NextApiRequest, NextApiResponse } from 'next';
import { loadCSV, FundraisingRecord } from '@/utils/loadCSV';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const files = fs.readdirSync(path.join(process.cwd(), 'data'));
  const years = files
    .map(file => {
      const match = file.match(/fundraising-(\d{4})\.csv/);
      return match ? parseInt(match[1]) : null;
    })
    .filter(year => year !== null) as number[];

  let allData: FundraisingRecord[] = [];

  years.forEach(year => {
    const yearData = loadCSV(year.toString());
    allData = allData.concat(yearData);
  });

  res.status(200).json(allData);
}

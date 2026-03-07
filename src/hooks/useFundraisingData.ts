import { useEffect, useState } from 'react';
import { FundraisingRecord } from '@/utils/loadCSV';

export function useFundraisingData(year?: number) {
  const url = year ? `/api/year/${year}` : `/api/aggregate`;
  const [data, setData] = useState<FundraisingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}

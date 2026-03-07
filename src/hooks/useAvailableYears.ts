import { useEffect, useState } from 'react';

export function useAvailableYears() {
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/years')
      .then(res => res.json())
      .then(setYears)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { years, loading, error };
}

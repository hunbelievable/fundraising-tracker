interface YearSelectorProps {
  years: number[];
  selectedYear: number | 'ALL';
  onChange: (year: number | 'ALL') => void;
}

export default function YearSelector({ years, selectedYear, onChange }: YearSelectorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
      <span className="eyebrow">Year</span>
      <select
        value={selectedYear}
        onChange={e => {
          const val = e.target.value;
          onChange(val === 'ALL' ? 'ALL' : parseInt(val));
        }}
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '0.78rem',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          color: 'var(--white)',
          padding: '0.4rem 0.85rem',
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        <option value="ALL">All Years</option>
        {years.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
  );
}

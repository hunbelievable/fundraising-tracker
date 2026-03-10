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
          padding: '0.55rem 2.25rem 0.55rem 0.85rem',
          outline: 'none',
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' viewBox='0 0 11 7'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%236b5a3a' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.7rem center',
          minHeight: '2.5rem',
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

export default function BaseTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="tbl-wrap">
      <table>{children}</table>
    </div>
  );
}

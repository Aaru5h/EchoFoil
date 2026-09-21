export default function Loading() {
  return (
    <main id="main" className="container section" aria-busy="true">
      <div className="skeleton" style={{ height: 60, maxWidth: 500, marginBottom: 40 }} />
      <div className="grid3">
        {[1, 2, 3].map((n) => (
          <div className="skeleton" key={n} style={{ height: 320 }} />
        ))}
      </div>
    </main>
  );
}

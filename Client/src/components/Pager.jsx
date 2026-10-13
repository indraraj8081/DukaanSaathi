const Pager = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="px-3 py-1 border rounded bg-white disabled:opacity-40">
        ← Prev
      </button>
      <span className="text-sm text-gray-600">Page {page} of {pages}</span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="px-3 py-1 border rounded bg-white disabled:opacity-40">
        Next →
      </button>
    </div>
  );
};

export default Pager;
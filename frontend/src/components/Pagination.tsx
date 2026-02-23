type PaginationProps = {
  page: number;
  pageSize: number;
  itemCount: number;
  hasNext?: boolean;
  totalCount?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const DEFAULT_PAGE_SIZES = [100, 250, 500, 1000];

export function Pagination({
  page,
  pageSize,
  itemCount,
  hasNext,
  totalCount,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  onPageChange,
  onPageSizeChange
}: PaginationProps) {
  const totalPages = totalCount ? Math.max(1, Math.ceil(totalCount / pageSize)) : null;
  const canPrev = page > 1;
  const canNext = totalPages !== null ? page < totalPages : (hasNext ?? itemCount === pageSize);

  const start = itemCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = itemCount === 0 ? 0 : (page - 1) * pageSize + itemCount;

  return (
    <div className="pagination">
      <div className="pagination-info">
        <span>Showing {start}-{end}</span>
        {totalCount !== undefined && <span>of {totalCount}</span>}
      </div>
      <div className="pagination-controls">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
        >
          Prev
        </button>
        <span className="pagination-page">Page {page}{totalPages ? ` of ${totalPages}` : ''}</span>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
        >
          Next
        </button>
        <label className="pagination-size">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

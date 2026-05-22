interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  itemLabel?: string;
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  loading = false,
  itemLabel = "mục",
}: AdminPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        borderTop: "1px solid var(--adm-border)",
        marginTop: "auto",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <span style={{ color: "#64748b", fontSize: "13px" }}>
        Trang {currentPage} / {safeTotalPages} — Tổng {totalCount.toLocaleString("vi-VN")} {itemLabel}
      </span>
      <div className="admin-pagination-btns" style={{ display: "flex", gap: "6px" }}>
        <button
          type="button"
          className="admin-pagination-btn"
          style={{
            minWidth: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "6px",
            border: "1px solid var(--adm-border)",
            background: "rgba(255,255,255,0.02)",
            color: currentPage <= 1 ? "#64748b" : "#94a3b8",
            cursor: currentPage <= 1 || loading ? "not-allowed" : "pointer",
          }}
          disabled={currentPage <= 1 || loading}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          &lt;
        </button>
        <button
          type="button"
          className="admin-pagination-btn active"
          style={{
            minWidth: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "6px",
            border: "none",
            background: "#6366f1",
            color: "#fff",
            fontWeight: 600,
            cursor: "default",
          }}
        >
          {currentPage}
        </button>
        <button
          type="button"
          className="admin-pagination-btn"
          style={{
            minWidth: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "6px",
            border: "1px solid var(--adm-border)",
            background: "rgba(255,255,255,0.02)",
            color: currentPage >= safeTotalPages ? "#64748b" : "#94a3b8",
            cursor: currentPage >= safeTotalPages || loading ? "not-allowed" : "pointer",
          }}
          disabled={currentPage >= safeTotalPages || loading}
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

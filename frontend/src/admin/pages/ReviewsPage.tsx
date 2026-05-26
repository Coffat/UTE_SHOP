import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useConfirm } from "../components/AdminUI";
import { AdminPagination } from "../components/AdminPagination";
import {
  fetchAdminReviews,
  approveAdminReview,
  deleteAdminReview,
  type Review,
} from "../services/adminReviews.api";
import {
  fetchStaffReviews,
  moderateStaffReview,
} from "../services/staffReviews.api";

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill={i < rating ? "#f59e0b" : "none"}
          stroke={i < rating ? "#f59e0b" : "#64748b"}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function ReviewsPage() {
  const { user } = useAdminAuth();
  const isAdmin = user?.role === "ADMIN";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const { confirm, ModalEl } = useConfirm();

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: currentPage, limit: 10 };
      const result = isAdmin
        ? await fetchAdminReviews(params)
        : await fetchStaffReviews(params);

      setReviews(result.items);
      setTotalItems(result.total);
      setTotalPages(Math.ceil(result.total / 10) || 1);
    } catch (err) {
      console.error("Failed to load reviews:", err);
      setError("Không thể tải danh sách đánh giá.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, isAdmin]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  async function handleApprove(review: Review) {
    const ok = await confirm({
      title: "Duyệt đánh giá",
      message: `Bạn muốn phê duyệt đánh giá của khách hàng "${review.customer?.fullName || "Khách hàng"}"?`,
      variant: "info",
      confirmLabel: "Duyệt",
    });
    if (!ok) return;

    try {
      if (isAdmin) {
        await approveAdminReview(review._id);
      } else {
        await moderateStaffReview(review._id, "APPROVED");
      }
      await loadReviews();
    } catch (err) {
      console.error("Failed to approve review:", err);
      setError("Không thể duyệt đánh giá.");
    }
  }

  async function handleReject(review: Review) {
    if (!isAdmin) return;
    const ok = await confirm({
      title: "Từ chối / Xóa đánh giá",
      message: `Bạn muốn xóa/từ chối đánh giá của khách hàng "${review.customer?.fullName || "Khách hàng"}"? Hành động này sẽ gỡ hoàn toàn đánh giá khỏi sản phẩm.`,
      variant: "danger",
      confirmLabel: "Xóa",
    });
    if (!ok) return;

    try {
      if (isAdmin) {
        await deleteAdminReview(review._id);
      } else {
        await moderateStaffReview(review._id, "REJECTED");
      }
      await loadReviews();
    } catch (err) {
      console.error("Failed to reject review:", err);
      setError("Không thể từ chối/xóa đánh giá.");
    }
  }

  return (
    <div className="admin-page">
      {ModalEl}

      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Đánh giá khách hàng</h2>
          <p className="admin-page-subtitle">Duyệt hoặc ẩn đánh giá sản phẩm từ người dùng</p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: "16px", color: "#f87171", fontSize: "13px" }}>{error}</div>
      )}

      <div className="admin-card" style={{ padding: "20px" }}>
        {loading ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "32px 0" }}>Đang tải...</p>
        ) : reviews.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: "32px 0" }}>Không có đánh giá nào.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Khách hàng</th>
                  <th>Điểm số</th>
                  <th>Nội dung bình luận</th>
                  <th>Trạng thái</th>
                  <th>Ngày đánh giá</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review._id}>
                    <td style={{ fontWeight: 600, color: "#fff" }}>
                      {review.product?.name || "Sản phẩm đã bị xóa"}
                    </td>
                    <td>
                      <div>{review.customer?.fullName || "Khách lẻ"}</div>
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                        {review.customer?.email || ""}
                      </div>
                    </td>
                    <td>
                      <StarRating rating={review.rating} />
                    </td>
                    <td style={{ maxWidth: "300px", wordBreak: "break-word" }}>
                      {review.comment || <span style={{ color: "#64748b", fontStyle: "italic" }}>Không ghi chú</span>}
                    </td>
                    <td>
                      <span
                        className="admin-category-tag"
                        style={{
                          background: review.isVerified
                            ? "rgba(16, 185, 129, 0.12)"
                            : "rgba(245, 158, 11, 0.12)",
                          color: review.isVerified ? "#10b981" : "#f59e0b",
                        }}
                      >
                        {review.isVerified ? "Đã duyệt" : "Chờ duyệt"}
                      </span>
                    </td>
                    <td>{new Date(review.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        {!review.isVerified && (
                          <button
                            className="admin-btn admin-btn-ghost"
                            onClick={() => handleApprove(review)}
                            style={{ color: "#10b981" }}
                          >
                            Duyệt
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            className="admin-btn admin-btn-ghost"
                            onClick={() => handleReject(review)}
                            style={{ color: "#f87171" }}
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalItems}
          onPageChange={setCurrentPage}
          loading={loading}
          itemLabel="đánh giá"
        />
      </div>
    </div>
  );
}

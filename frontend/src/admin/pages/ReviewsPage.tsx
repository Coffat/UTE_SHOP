import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useConfirm, CrudModal, Modal, FormField, FormTextarea } from "../components/AdminUI";
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
  replyStaffReview,
  hideStaffReview
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

  // Modals States
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [selectedReviewForReply, setSelectedReviewForReply] = useState<Review | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReviewForDetail, setSelectedReviewForDetail] = useState<Review | null>(null);

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
      if (selectedReviewForDetail && selectedReviewForDetail._id === review._id) {
        setSelectedReviewForDetail(prev => prev ? { ...prev, isVerified: true } : null);
      }
      await loadReviews();
    } catch (err) {
      console.error("Failed to approve review:", err);
      setError("Không thể duyệt đánh giá.");
    }
  }

  async function handleReject(review: Review) {
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
      if (selectedReviewForDetail && selectedReviewForDetail._id === review._id) {
        setIsDetailOpen(false);
      }
      await loadReviews();
    } catch (err) {
      console.error("Failed to reject review:", err);
      setError("Không thể từ chối/xóa đánh giá.");
    }
  }

  function handleOpenReply(review: Review) {
    setSelectedReviewForReply(review);
    setReplyText(review.replyComment || "");
    setIsReplyOpen(true);
  }

  async function handleSaveReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReviewForReply) return;

    try {
      await replyStaffReview(selectedReviewForReply._id, replyText);
      setIsReplyOpen(false);
      if (selectedReviewForDetail && selectedReviewForDetail._id === selectedReviewForReply._id) {
        setSelectedReviewForDetail(prev => prev ? { ...prev, replyComment: replyText } : null);
      }
      await loadReviews();
    } catch (err) {
      console.error("Failed to reply review:", err);
      setError("Không thể phản hồi đánh giá.");
    }
  }

  async function handleDeleteReply() {
    if (!selectedReviewForReply) return;
    const ok = await confirm({
      title: "Xóa phản hồi",
      message: "Bạn có chắc chắn muốn xóa phản hồi này?",
      variant: "danger",
      confirmLabel: "Xóa",
    });
    if (!ok) return;

    try {
      await replyStaffReview(selectedReviewForReply._id, "");
      setIsReplyOpen(false);
      if (selectedReviewForDetail && selectedReviewForDetail._id === selectedReviewForReply._id) {
        setSelectedReviewForDetail(prev => prev ? { ...prev, replyComment: "" } : null);
      }
      await loadReviews();
    } catch (err) {
      console.error("Failed to delete reply:", err);
      setError("Không thể xóa phản hồi.");
    }
  }

  async function handleToggleHide(review: Review) {
    try {
      await hideStaffReview(review._id, !review.isHidden);
      if (selectedReviewForDetail && selectedReviewForDetail._id === review._id) {
        setSelectedReviewForDetail(prev => prev ? { ...prev, isHidden: !prev.isHidden } : null);
      }
      await loadReviews();
    } catch (err) {
      console.error("Failed to hide/show review:", err);
      setError("Không thể thay đổi trạng thái hiển thị của đánh giá.");
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

      <div className="admin-card" style={{ padding: "20px", flex: 1 }}>
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
                      <div>{review.comment || <span style={{ color: "#64748b", fontStyle: "italic" }}>Không ghi chú</span>}</div>
                      {review.replyComment && (
                        <div style={{ marginTop: "8px", padding: "8px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "4px", fontSize: "13px", color: "#a7f3d0", borderLeft: "2px solid #10b981" }}>
                          <strong>Phản hồi:</strong> {review.replyComment}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span
                          className="admin-category-tag"
                          style={{
                            background: review.isVerified
                              ? "rgba(16, 185, 129, 0.12)"
                              : "rgba(245, 158, 11, 0.12)",
                            color: review.isVerified ? "#10b981" : "#f59e0b",
                            width: "fit-content"
                          }}
                        >
                          {review.isVerified ? "Đã duyệt" : "Chờ duyệt"}
                        </span>
                        {review.isHidden && (
                          <span
                            className="admin-category-tag"
                            style={{
                              background: "rgba(100, 116, 139, 0.2)",
                              color: "#94a3b8",
                              width: "fit-content"
                            }}
                          >
                            Đã ẩn
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{new Date(review.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", flexWrap: "wrap" }}>
                        <button style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "#6366f1",
                          padding: "6px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }} title="Xem chi tiết" className="admin-action-glass-btn" onClick={() => { setSelectedReviewForDetail(review); setIsDetailOpen(true); }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                        </button>
                        {!review.isVerified && (
                          <button style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            color: "#10b981",
                            padding: "6px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s"
                          }} title="Duyệt đánh giá" className="admin-action-glass-btn" onClick={() => handleApprove(review)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                        )}
                        <button style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "#3b82f6",
                          padding: "6px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }} title="Phản hồi đánh giá" className="admin-action-glass-btn" onClick={() => handleOpenReply(review)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>
                        <button style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "#f59e0b",
                          padding: "6px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }} title={review.isHidden ? "Hiện đánh giá" : "Ẩn đánh giá"} className="admin-action-glass-btn" onClick={() => handleToggleHide(review)}>
                          {review.isHidden ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                        <button style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "#ef4444",
                          padding: "6px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }} title="Xóa đánh giá" className="admin-action-glass-btn" onClick={() => handleReject(review)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
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

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        title="Chi tiết Đánh giá"
        onClose={() => setIsDetailOpen(false)}
        size="lg"
      >
        {selectedReviewForDetail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#94a3b8' }}>Sản phẩm</p>
                <p style={{ margin: 0, fontWeight: 600, color: '#fff', fontSize: '15px' }}>
                  {selectedReviewForDetail.product?.name || "Sản phẩm đã bị xóa"}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#94a3b8' }}>Khách hàng</p>
                <p style={{ margin: 0, fontWeight: 600, color: '#fff', fontSize: '15px' }}>
                  {selectedReviewForDetail.customer?.fullName || "Khách lẻ"}
                </p>
                {selectedReviewForDetail.customer?.email && (
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    {selectedReviewForDetail.customer.email}
                  </p>
                )}
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#94a3b8' }}>Điểm số</p>
                <div style={{ marginTop: '2px' }}>
                  <StarRating rating={selectedReviewForDetail.rating} />
                </div>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#94a3b8' }}>Ngày đánh giá</p>
                <p style={{ margin: 0, color: '#e2e8f0' }}>
                  {new Date(selectedReviewForDetail.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            <div>
              <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#94a3b8' }}>Nội dung đánh giá</p>
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', color: '#fff', lineHeight: 1.6 }}>
                {selectedReviewForDetail.comment || <span style={{ color: '#64748b', fontStyle: 'italic' }}>Không có nội dung bình luận</span>}
              </div>
            </div>

            {selectedReviewForDetail.replyComment && (
              <div>
                <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#94a3b8' }}>Phản hồi của cửa hàng</p>
                <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', fontSize: '14px', color: '#a7f3d0', borderLeft: '3px solid #10b981', lineHeight: 1.6 }}>
                  {selectedReviewForDetail.replyComment}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--adm-border)', paddingTop: '20px', marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  background: selectedReviewForDetail.isVerified ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                  color: selectedReviewForDetail.isVerified ? "#10b981" : "#f59e0b",
                  border: selectedReviewForDetail.isVerified ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(245, 158, 11, 0.25)"
                }}>
                  {selectedReviewForDetail.isVerified ? "Đã duyệt" : "Chờ duyệt"}
                </span>
                {selectedReviewForDetail.isHidden && (
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    background: "rgba(100, 116, 139, 0.2)",
                    color: "#94a3b8",
                  }}>
                    Đã ẩn
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {!selectedReviewForDetail.isVerified && (
                  <button
                    onClick={() => handleApprove(selectedReviewForDetail)}
                    className="admin-btn"
                    style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Duyệt
                  </button>
                )}
                <button
                  onClick={() => { setIsDetailOpen(false); handleOpenReply(selectedReviewForDetail); }}
                  className="admin-btn"
                  style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}
                >
                  {selectedReviewForDetail.replyComment ? "Sửa phản hồi" : "Phản hồi"}
                </button>
                <button
                  onClick={() => handleToggleHide(selectedReviewForDetail)}
                  className="admin-btn"
                  style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}
                >
                  {selectedReviewForDetail.isHidden ? "Hiện" : "Ẩn"}
                </button>
                <button
                  onClick={() => handleReject(selectedReviewForDetail)}
                  className="admin-btn"
                  style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reply Modal */}
      <CrudModal
        isOpen={isReplyOpen}
        mode="edit"
        title={selectedReviewForReply?.replyComment ? "Chỉnh sửa Phản hồi" : "Gửi Phản hồi mới"}
        onClose={() => setIsReplyOpen(false)}
        onSubmit={handleSaveReply}
        submitLabel="Lưu phản hồi"
      >
        {selectedReviewForReply && (
          <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#94a3b8' }}>Đánh giá từ {selectedReviewForReply.customer?.fullName || "Khách lẻ"} ({selectedReviewForReply.rating} sao)</p>
            <p style={{ margin: 0, fontStyle: 'italic', fontSize: '13px', color: '#cbd5e1' }}>"{selectedReviewForReply.comment || 'Không có nội dung'}"</p>
          </div>
        )}

        <FormField label="Nội dung phản hồi" required>
          <FormTextarea
            required
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Nhập nội dung phản hồi của cửa hàng..."
            rows={5}
          />
        </FormField>

        {selectedReviewForReply?.replyComment && (
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-start' }}>
            <button
              type="button"
              onClick={handleDeleteReply}
              className="admin-btn"
              style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
              Xóa phản hồi hiện tại
            </button>
          </div>
        )}
      </CrudModal>
    </div>
  );
}

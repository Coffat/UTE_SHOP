import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { AppDispatch, RootState } from "@/store";
import { fetchUserOrders } from "@/features/profile/profileSlice";
import { formatVND, getProductImage } from "./ProductList";
import { useToast } from "@/components/ui/ToastContext";
import { api } from "@/lib/api";
import { ReviewModal } from "@/components/ReviewModal";
import { RewardModal } from "@/components/RewardModal";
import { addToCart } from "@/features/cart/cartSlice";
import { parseDecimalPrice } from "@/lib/price";

export function UserOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const orders = useSelector((state: RootState) => state.profile.orders);
  const ordersStatus = useSelector((state: RootState) => state.profile.ordersStatus);
  const profile = useSelector((state: RootState) => state.profile.profile);

  // States
  const [activeStatusTab, setActiveStatusTab] = useState<string>("TẤT CẢ");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ orderId: string; productId: string; productName: string } | null>(null);
  const [rewardData, setRewardData] = useState<{ points: number; voucherCode: string } | null>(null);
  const [viewingReview, setViewingReview] = useState<{ productName: string; rating: number; comment: string } | null>(null);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: "CANCEL" | "RETURN";
    orderId: string | null;
  }>({ isOpen: false, type: "CANCEL", orderId: null });
  const [actionReason, setActionReason] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  useEffect(() => {
    if (profile) {
      dispatch(fetchUserOrders());
    }
  }, [dispatch, profile]);

  // Status mapping for filter
  const filterOrders = () => {
    if (activeStatusTab === "TẤT CẢ") return orders;
    return orders.filter((o: any) => {
      let dbStatus = o.status || "PENDING";
      if (dbStatus === "CONFIRMED" || dbStatus === "READY") {
        dbStatus = "PENDING";
      }
      return dbStatus === activeStatusTab;
    });
  };

  const handleOpenReview = (orderId: string, productId: string, productName: string) => {
    setReviewTarget({ orderId, productId, productName });
  };

  const handleReviewSuccess = (
    reward: { points: number; voucherCode: string },
    reviewData?: { rating: number; comment: string }
  ) => {
    const targetProductId = reviewTarget?.productId;
    setReviewTarget(null);
    setRewardData(reward);
    // Refresh orders list to update isReviewed flags
    dispatch(fetchUserOrders());

    // Update the local selectedOrder items list state directly so that the item is marked as reviewed immediately
    if (selectedOrder && targetProductId) {
      setSelectedOrder((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items?.map((item: any) => {
            const product = item.productVariant?.product;
            const itemId = product?._id || product;
            if (itemId === targetProductId) {
              return {
                ...item,
                isReviewed: true,
                review: reviewData
                  ? {
                      rating: reviewData.rating,
                      comment: reviewData.comment,
                      createdAt: new Date().toISOString(),
                    }
                  : null,
              };
            }
            return item;
          }),
        };
      });
    }
  };

  const handleViewDetails = async (orderId: string) => {
    try {
      const response = await api.get(`/api/v1/orders/${orderId}`);
      if (response.data.success && response.data.data) {
        setSelectedOrder(response.data.data);
      } else {
        showToast("Không thể tải thông tin chi tiết đơn hàng", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi tải chi tiết đơn hàng", "error");
    }
  };

  useEffect(() => {
    const openOrderId = (location.state as { openOrderId?: string } | null)?.openOrderId;
    if (!openOrderId || ordersStatus === "loading") {
      return;
    }
    void handleViewDetails(openOrderId);
    navigate(location.pathname, { replace: true, state: {} });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- open once when navigated from overview
  }, [location.state, ordersStatus]);

  //Thêm hàm xử lý Hủy và Trả hàng
  // Hàm chỉ dùng để mở UI Modal
  const handleCancelOrder = (orderId: string) => {
    setActionReason("");
    setActionModal({ isOpen: true, type: "CANCEL", orderId });
  };

  const handleReturnOrder = (orderId: string) => {
    setActionReason("");
    setActionModal({ isOpen: true, type: "RETURN", orderId });
  };

  // Hàm thực thi gọi API khi người dùng bấm "Xác nhận" trên Modal
  const submitOrderAction = async () => {
    if (!actionReason.trim()) {
      showToast("Vui lòng nhập lý do của bạn", "warning");
      return;
    }
    if (!actionModal.orderId) return;

    setIsSubmittingAction(true);
    try {
      const endpoint = actionModal.type === "CANCEL" ? "cancel" : "return";
      const response = await api.post(`/api/v1/orders/${actionModal.orderId}/${endpoint}`, { reason: actionReason });
      
      if (response.data.success) {
        showToast(
          actionModal.type === "CANCEL" ? "Hủy đơn hàng thành công" : "Đã gửi yêu cầu trả hàng thành công", 
          "success"
        );
        dispatch(fetchUserOrders()); 
        setActionModal({ isOpen: false, type: "CANCEL", orderId: null });
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại", "error");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleBuyAgain = (item: any) => {
    const pVar = item.productVariant;
    const product = pVar?.product;
    const productId = product?._id || product;
    const variantId = pVar?._id || pVar;
    if (!productId || !variantId) {
      showToast("Không thể mua lại sản phẩm này do thiếu thông tin biến thể.", "warning");
      return;
    }

    const price = parseDecimalPrice(item.unitPrice);

    dispatch(
      addToCart({
        productId,
        variantId,
        name: product?.name || item.snapshotName,
        variantName: pVar?.sizeName || "Tiêu chuẩn",
        price,
        imageUrl: product?.mainImageUrl || getProductImage(product?.slug || productId),
        quantity: 1,
        stock: pVar?.stock || 99,
      })
    );
    showToast(`Đã thêm "${product?.name || item.snapshotName}" vào giỏ hàng!`, "success");
  };

  const handleViewWrittenReview = (item: any, productName: string) => {
    if (item.review) {
      setViewingReview({
        productName,
        rating: item.review.rating,
        comment: item.review.comment,
      });
    } else {
      setViewingReview({
        productName,
        rating: 5,
        comment: "Sản phẩm đã được đánh giá thành công.",
      });
    }
  };

  const activeOrders = filterOrders();

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED": return "Đã giao";
      case "DELIVERING": return "Đang giao";
      case "CANCELLED": return "Đã hủy";
      case "DELIVERY_FAILED": return "Giao thất bại";
      case "RETURNED": return "Đã hoàn hàng";
      default: return "Chờ xử lý";
    }
  };

 const getStatusClass = (status: string) => {
    switch (status) {
      case "COMPLETED": return "text-[#2a9d66] bg-[#2a9d66]/10";
      case "DELIVERING": return "text-[#8b6bff] bg-[#8b6bff]/10";
      case "CANCELLED": return "text-[#ef4444] bg-[#ef4444]/10";
      case "DELIVERY_FAILED": return "text-[#f59e0b] bg-[#f59e0b]/10"; // Màu cam (Amber)
      case "RETURNED": return "text-[#6366f1] bg-[#6366f1]/10";       // Màu xanh tím (Indigo)
      default: return "text-[#d97706] bg-[#d97706]/10";
    }
  };

  return (
      <div className="space-y-6">
        {/* Title Panel */}
        <div className="glass-panel rounded-[24px] p-6 shadow-[0_10px_40px_rgba(168,85,247,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/60">
          <div>
            <h2 className="font-section-title text-[32px] text-deep-plum flex items-center gap-2">
              <MaterialIcon name="shopping_bag" className="text-primary text-[28px]" />
              Đơn hàng của tôi
            </h2>
            <p className="text-sm text-dusk-gray mt-1 font-medium">Theo dõi hành trình của những đóa hoa thơm ngát</p>
          </div>
          <div className="bg-pure-ivory/80 px-4 py-2 rounded-full border border-crystal-border/80 shadow-sm self-start sm:self-auto">
            <span className="text-sm font-bold text-deep-plum">Tổng số: {orders.length} đơn</span>
          </div>
        </div>

        {/* Tabs Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {["TẤT CẢ", "PENDING", "DELIVERING", "COMPLETED", "DELIVERY_FAILED", "RETURNED", "CANCELLED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveStatusTab(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-full border transition active-press whitespace-nowrap ${
                activeStatusTab === tab
                  ? "bg-primary border-primary text-pure-ivory shadow-sm"
                  : "bg-pure-ivory/80 border-crystal-border text-midnight-purple hover:bg-white"
              }`}
            >
              {tab === "TẤT CẢ" ? "Tất cả" : getStatusText(tab)}
            </button>
          ))}
        </div>

        {/* Order List */}
        {ordersStatus === "loading" && orders.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-crystal-border border-t-primary"></div>
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="glass-panel rounded-[24px] p-12 shadow-[0_10px_40px_rgba(168,85,247,0.05)] text-center border border-white/60 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-petal-pink/10 via-transparent to-soft-amethyst/10 opacity-30 -z-10"></div>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-soft-amethyst/20 text-primary border border-white/80 shadow-inner">
              <MaterialIcon name="local_mall" className="text-[36px] text-deep-plum" />
            </div>
            <h3 className="font-hero-display text-xl font-bold text-deep-plum mb-1 tracking-tight">Không có đơn hàng nào</h3>
            <p className="text-dusk-gray text-sm mb-6 max-w-xs mx-auto">
              Không tìm thấy đơn hàng nào ở trạng thái này. Hãy bắt đầu chọn lựa những bó hoa tươi thắm nhất ngay nhé!
            </p>
            <button
              onClick={() => navigate("/products")}
              className="inline-flex items-center gap-2 btn-hero-cta-gradient px-6 py-2.5 rounded-full text-sm font-bold tracking-wide active-press"
            >
              <MaterialIcon name="explore" className="text-[16px]" />
              Mua sắm ngay
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order: any) => {
              const orderDate = new Date(order.createdAt).toLocaleDateString("vi-VN");
              const itemsSummary = order.items && order.items.length > 0
                ? order.items.map((item: any) => item.snapshotName).join(", ")
                : "Đơn hàng hoa tươi";
              let dbStatus = order.status || "PENDING";
              if (dbStatus === "CONFIRMED" || dbStatus === "READY") {
                dbStatus = "PENDING";
              }

              return (
                <div
                  key={order.id || order._id}
                  className="glass-panel p-5 rounded-3xl border border-white/60 bg-white/40 shadow-sm hover:border-dreamy-purple/30 transition-all space-y-4"
                >
                  <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-crystal-border/60">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-deep-plum text-sm tracking-wider">{order.orderCode}</span>
                      <span className="text-xs text-dusk-gray">• {orderDate}</span>
                    </div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${getStatusClass(dbStatus)}`}>
                      {getStatusText(dbStatus)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-midnight-purple line-clamp-1">{itemsSummary}</p>
                      <p className="text-xs text-dusk-gray mt-1">Số lượng sản phẩm: {order.items?.length || 0}</p>
                    </div>
                    
                    {/* BẮT ĐẦU ĐOẠN ĐÃ CHÈN THÊM NÚT */}
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end mt-2 sm:mt-0">
                      <p className="text-base font-bold text-primary sm:mr-2">{formatVND(order.totalAmount || 0)}</p>
                      
                      {dbStatus === "PENDING" && (
                        <button
                          onClick={() => handleCancelOrder(order.id || order._id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold active-press transition cursor-pointer"
                        >
                          Hủy đơn
                        </button>
                      )}

                      {dbStatus === "COMPLETED" && (
                        <button
                          onClick={() => handleReturnOrder(order.id || order._id)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold active-press transition cursor-pointer"
                        >
                          Trả hàng
                        </button>
                      )}

                      <button
                        onClick={() => handleViewDetails(order.id || order._id)}
                        className="bg-pure-ivory hover:bg-white text-deep-plum border border-crystal-border/80 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 active-press cursor-pointer"
                      >
                        Chi tiết
                        <MaterialIcon name="expand_more" className="text-xs" />
                      </button>
                    </div>
                    {/* KẾT THÚC ĐOẠN ĐÃ CHÈN THÊM NÚT */}

                  </div>

                  {/* Expanded Details / Items Section */}
                  {selectedOrder && selectedOrder._id === (order.id || order._id) && (
                    <div className="mt-4 pt-4 border-t border-crystal-border/40 space-y-3 animate-fade-in">
                      <h4 className="text-xs font-bold text-deep-plum uppercase tracking-wider">Danh sách sản phẩm:</h4>
                      <div className="space-y-3">
                        {selectedOrder.items?.map((item: any) => {
                          const product = item.productVariant?.product;
                          const productId = product?._id;
                          const productName = product?.name || item.snapshotName;
                          const imageUrl = product?.mainImageUrl || getProductImage(product?.slug || productId);
                          const isCompleted = selectedOrder.status === "COMPLETED";

                          return (
                            <div key={item._id} className="flex items-center gap-3.5 bg-pure-ivory/30 p-2.5 rounded-2xl border border-crystal-border/40">
                              <div className="w-12 h-14 rounded-xl overflow-hidden border border-crystal-border flex-shrink-0 bg-soft-amethyst/10">
                                <img src={imageUrl} alt={productName} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-xs font-bold text-deep-plum truncate">{productName}</h5>
                                <p className="text-[10px] text-dusk-gray mt-0.5">SL: {item.quantity} × {formatVND(item.unitPrice)}</p>
                              </div>
                              
                              {/* Action review button */}
                              {isCompleted && (
                                <div className="flex-shrink-0">
                                  {item.isReviewed ? (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => handleViewWrittenReview(item, productName)}
                                        className="bg-pure-ivory hover:bg-white text-primary border border-primary/20 hover:border-primary/50 text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 active-press transition cursor-pointer"
                                      >
                                        <MaterialIcon name="rate_review" className="text-xs" />
                                        Xem đánh giá
                                      </button>
                                      <button
                                        onClick={() => handleBuyAgain(item)}
                                        className="bg-primary hover:bg-deep-plum text-pure-ivory text-[11px] font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1 active-press transition cursor-pointer"
                                      >
                                        <MaterialIcon name="shopping_bag" className="text-xs" />
                                        Mua lại
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenReview(order.id || order._id, productId, productName)}
                                      className="bg-primary hover:bg-deep-plum text-pure-ivory text-[11px] font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1 active-press transition"
                                    >
                                      <MaterialIcon name="star" className="text-xs" />
                                      Đánh giá
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          orderId={reviewTarget.orderId}
          productId={reviewTarget.productId}
          productName={reviewTarget.productName}
          onClose={() => setReviewTarget(null)}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* Reward Success Popup */}
      {rewardData && (
        <RewardModal
          points={rewardData.points}
          voucherCode={rewardData.voucherCode}
          onClose={() => setRewardData(null)}
        />
      )}

      {/* Viewing written review modal */}
      {viewingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4a3b52]/40 backdrop-blur-md animate-fade-in">
          {/* Float Level (L2) Modal */}
          <div className="w-full max-w-md rounded-[24px] border border-white/60 bg-white/70 backdrop-blur-[40px] p-6 sm:p-8 shadow-[0_10px_40px_rgba(168,85,247,0.05)] relative overflow-hidden group motion-safe:animate-scale-in">
            
            {/* Ambient background decorative colors */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#c084fc]/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#fbcfe8]/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex justify-between items-start pb-5 border-b border-[#f3e8ff]/50 relative z-10">
              <div>
                <h3 className="font-hero-display text-[28px] font-medium text-[#311b92] leading-[1.2]">Đánh giá của bạn</h3>
                <p className="text-[14px] text-[#7e6e8c] mt-1 truncate max-w-[280px] sm:max-w-[360px] font-medium font-ui" title={viewingReview.productName}>
                  {viewingReview.productName}
                </p>
              </div>
              <button
                onClick={() => setViewingReview(null)}
                className="text-[#7e6e8c] hover:text-[#311b92] p-2 rounded-full hover:bg-white/40 transition active-press cursor-pointer"
              >
                <MaterialIcon name="close" className="text-[20px]" />
              </button>
            </div>
            
            <div className="mt-6 space-y-5 relative z-10">
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                {Array.from({ length: 5 }, (_, i) => (
                  <MaterialIcon
                    key={i}
                    name="star"
                    filled={i < viewingReview.rating}
                    className={`text-[32px] ${i < viewingReview.rating ? "text-[#c084fc] drop-shadow-sm" : "text-[#7e6e8c]/20"}`}
                  />
                ))}
              </div>
              
              <div className="rounded-[16px] border border-white/60 bg-white/80 p-5 text-[17px] text-[#4a3b52] font-ui min-h-[100px] leading-[1.6] whitespace-pre-wrap shadow-inner">
                {viewingReview.comment}
              </div>
            </div>
            
            <div className="flex justify-end pt-5 mt-6 border-t border-[#f3e8ff]/50 relative z-10">
              {/* Primary CTA Button */}
              <button
                type="button"
                onClick={() => setViewingReview(null)}
                className="bg-[#c084fc] hover:bg-[#a855f7] text-[#311b92] px-8 py-2.5 rounded-full text-[14px] font-bold shadow-[0_0_15px_rgba(192,132,252,0.3)] hover:shadow-[0_0_25px_rgba(192,132,252,0.5)] transition hover-lift active-press cursor-pointer font-ui"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4a3b52]/40 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-[24px] border border-white/60 bg-white/90 backdrop-blur-[40px] p-6 sm:p-8 shadow-[0_10px_40px_rgba(168,85,247,0.05)] relative overflow-hidden motion-safe:animate-scale-in">
            {/* Hiệu ứng trang trí góc */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#c084fc]/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#fbcfe8]/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex justify-between items-start pb-4 border-b border-crystal-border/40 relative z-10">
              <div>
                <h3 className={`font-hero-display text-[26px] font-medium leading-[1.2] ${actionModal.type === 'CANCEL' ? 'text-rose-600' : 'text-deep-plum'}`}>
                  {actionModal.type === "CANCEL" ? "Hủy Đơn Hàng" : "Yêu Cầu Trả Hàng"}
                </h3>
                <p className="text-[13px] text-dusk-gray mt-1 pr-4">
                  {actionModal.type === "CANCEL" 
                    ? "Bạn có chắc chắn muốn hủy đơn hàng này? Vui lòng cho chúng tôi biết lý do." 
                    : "Hoa của chúng tôi có vấn đề gì sao? Vui lòng cung cấp chi tiết lý do bạn muốn trả hàng (VD: Hoa dập nát, sai mẫu...)."}
                </p>
              </div>
              <button
                onClick={() => setActionModal({ isOpen: false, type: "CANCEL", orderId: null })}
                className="text-dusk-gray hover:text-deep-plum p-2 rounded-full hover:bg-black/5 transition active-press cursor-pointer"
              >
                <MaterialIcon name="close" className="text-[20px]" />
              </button>
            </div>

            <div className="mt-5 relative z-10">
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Nhập lý do của bạn vào đây..."
                className="w-full rounded-[16px] border border-crystal-border/80 bg-pure-ivory/50 p-4 text-[15px] text-deep-plum font-ui min-h-[120px] focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition resize-none shadow-inner"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-crystal-border/40 relative z-10">
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, type: "CANCEL", orderId: null })}
                disabled={isSubmittingAction}
                className="px-6 py-2.5 rounded-full text-[14px] font-bold text-dusk-gray hover:text-deep-plum hover:bg-black/5 transition cursor-pointer font-ui"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={submitOrderAction}
                disabled={isSubmittingAction}
                className={`px-8 py-2.5 rounded-full text-[14px] font-bold text-pure-ivory shadow-[0_0_15px_rgba(192,132,252,0.3)] transition hover-lift active-press cursor-pointer font-ui flex items-center gap-2 ${
                  actionModal.type === "CANCEL" 
                    ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/30" 
                    : "bg-[#c084fc] hover:bg-[#a855f7]"
                } ${isSubmittingAction ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isSubmittingAction && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                )}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

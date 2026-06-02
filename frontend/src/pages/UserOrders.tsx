import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { AppDispatch, RootState } from "@/store";
import { fetchUserOrders } from "@/features/profile/profileSlice";
import { formatVND, getProductImage } from "./ProductList";
import { useToast } from "@/components/ui/ToastContext";
import { api } from "@/lib/api";
import { ReviewModal } from "@/components/ReviewModal";
import { RewardModal } from "@/components/RewardModal";

export function UserOrders() {
  const navigate = useNavigate();
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

  const handleReviewSuccess = (reward: { points: number; voucherCode: string }) => {
    setReviewTarget(null);
    setRewardData(reward);
    // Refresh orders list to update isReviewed flags
    dispatch(fetchUserOrders());
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

  const activeOrders = filterOrders();

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED": return "Đã hoàn thành";
      case "DELIVERING": return "Đang giao hàng";
      case "CANCELLED": return "Đã hủy";
      default: return "Chờ xử lý";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "COMPLETED": return "text-[#2a9d66] bg-[#2a9d66]/10";
      case "DELIVERING": return "text-[#8b6bff] bg-[#8b6bff]/10";
      case "CANCELLED": return "text-[#ef4444] bg-[#ef4444]/10";
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
        {["TẤT CẢ", "PENDING", "DELIVERING", "COMPLETED", "CANCELLED"].map((tab) => (
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
                  <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
                    <p className="text-base font-bold text-primary">{formatVND(order.totalAmount || 0)}</p>
                    <button
                      onClick={() => handleViewDetails(order.id || order._id)}
                      className="bg-pure-ivory hover:bg-white text-deep-plum border border-crystal-border/80 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 active-press"
                    >
                      Chi tiết
                      <MaterialIcon name="expand_more" className="text-xs" />
                    </button>
                  </div>
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
                                  <span className="text-[11px] font-semibold text-dusk-gray/60 bg-gray-100 border border-gray-200/60 px-3 py-1.5 rounded-xl flex items-center gap-1 select-none">
                                    <MaterialIcon name="check" className="text-xs text-dusk-gray/60" />
                                    Đã đánh giá
                                  </span>
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
    </div>
  );
}

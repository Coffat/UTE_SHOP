import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useToast } from "@/components/ui/ToastContext";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchNotifications, markAsRead, markAllAsRead } from "@/features/notification/notificationSlice";

export function Notifications() {
  const { showToast } = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const { items: notificationItems, status, nextCursor } = useSelector((state: RootState) => state.notification);
  const notifications = Array.isArray(notificationItems) ? notificationItems : [];
  
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchNotifications());
    }
  }, [status, dispatch]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await dispatch(markAsRead(id)).unwrap();
      showToast("Đã đánh dấu là đã đọc", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Lỗi kết nối khi cập nhật thông báo.", "error");
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) {
      showToast("Tất cả thông báo đã được đọc", "info");
      return;
    }
    
    try {
      await dispatch(markAllAsRead()).unwrap();
      showToast("Đã đánh dấu tất cả thông báo là đã đọc", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Lỗi khi cập nhật danh sách thông báo.", "error");
    }
  };

  const loadMore = () => {
    if (nextCursor && status !== 'loading') {
      dispatch(fetchNotifications(nextCursor));
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  const getIconInfo = (type: string) => {
    switch (type) {
      case "ORDER":
        return { name: "shopping_bag", color: "text-amber-500 bg-amber-50" };
      case "PROMOTION":
        return { name: "local_offer", color: "text-rose-500 bg-rose-50" };
      case "SYSTEM":
        return { name: "settings", color: "text-blue-500 bg-blue-50" };
      default:
        return { name: "info", color: "text-primary bg-soft-amethyst/30" };
    }
  };

  const formatDate = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-section-title text-[28px] text-deep-plum">Thông báo của tôi</h1>
          <p className="text-sm text-dusk-gray">Xem và cập nhật các thông báo, ưu đãi và đơn hàng của bạn</p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={status === 'loading'}
            className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-soft-amethyst/30 px-4 py-2 text-xs font-bold text-primary transition-[background-color,color,box-shadow] duration-300 hover:bg-primary hover:text-pure-ivory hover:shadow-md disabled:opacity-50"
          >
            <MaterialIcon name="done_all" className="text-sm" />
            <span>Đọc tất cả</span>
          </button>
        )}
      </div>

      {/* Filters tabs */}
      <div className="flex gap-2 border-b border-crystal-border/80 pb-3">
        {(["all", "unread", "read"] as const).map((t) => {
          const count =
            t === "all"
              ? notifications.length
              : t === "unread"
              ? notifications.filter((n) => !n.isRead).length
              : notifications.filter((n) => n.isRead).length;

          const label = t === "all" ? "Tất cả" : t === "unread" ? "Chưa đọc" : "Đã đọc";
          const active = filter === t;

          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`relative rounded-xl px-4 py-2 text-xs font-bold font-home-heading transition-[background-color,color,box-shadow] duration-200 ${
                active 
                  ? "bg-primary text-pure-ivory shadow-sm" 
                  : "text-midnight-purple hover:bg-soft-amethyst/20"
              }`}
            >
              <span>{label}</span>
              {count > 0 && (
                <span className={`ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? "bg-pure-ivory/20 text-pure-ivory" : "bg-soft-amethyst/40 text-primary"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications grid list */}
      <AnimatePresence mode="wait">
        {status === 'loading' && notifications.length === 0 ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center items-center py-20"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-crystal-border border-t-primary" />
              <p className="text-xs font-semibold text-dusk-gray font-home-heading">Đang kiểm tra thông tin...</p>
            </div>
          </motion.div>
        ) : filteredNotifications.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel rounded-[24px] text-center py-16 px-6 border border-crystal-border"
          >
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-soft-amethyst/30 text-primary mb-4">
              <MaterialIcon name="notifications_off" className="text-[24px]" />
            </div>
            <h3 className="font-home-heading text-base font-bold text-deep-plum mb-1">Hộp thư trống</h3>
            <p className="text-xs text-dusk-gray max-w-sm mx-auto">
              {filter === "unread"
                ? "Không tìm thấy thông báo chưa đọc nào."
                : filter === "read"
                ? "Không tìm thấy thông báo đã đọc nào."
                : "Hộp thư thông báo của bạn trống trơn."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filteredNotifications.map((notif) => {
              const icon = getIconInfo(notif.notification.type);
              return (
                <motion.div
                  key={notif._id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`glass-panel group relative rounded-[20px] p-4 transition-[border-color,background-color,box-shadow] duration-300 border ${
                    notif.isRead 
                      ? "border-crystal-border/40 bg-pure-ivory/30 shadow-none hover:bg-pure-ivory/50" 
                      : "border-primary/20 bg-pure-ivory/80 shadow-[0_4px_20px_rgba(168,85,247,0.03)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)]"
                  }`}
                >
                  <div className="flex gap-4 items-start">
                    {/* Status indicator Icon */}
                    <div className={`size-10 rounded-xl shrink-0 flex items-center justify-center border border-crystal-border/80 ${icon.color}`}>
                      <MaterialIcon name={icon.name} className="text-[20px]" />
                    </div>

                    {/* Notification body */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h4 className={`font-home-heading text-sm font-bold truncate leading-snug ${
                          notif.isRead ? "text-midnight-purple/80" : "text-midnight-purple"
                        }`}>
                          {notif.notification.title}
                        </h4>
                        
                        {!notif.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary inline-block animate-pulse" />
                        )}
                      </div>
                      
                      <p className={`text-xs leading-relaxed mb-2.5 ${
                        notif.isRead ? "text-dusk-gray" : "text-midnight-purple/90 font-medium"
                      }`}>
                        {notif.notification.body}
                      </p>

                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-dusk-gray font-home-heading">
                        <MaterialIcon name="schedule" className="text-[12px]" />
                        <span>{formatDate(notif.notification.createdAt)}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif._id)}
                        className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 flex size-7 items-center justify-center rounded-full border border-crystal-border bg-pure-ivory text-primary shadow-sm transition-[opacity,background-color,color,transform] duration-300 hover:bg-primary hover:text-pure-ivory hover:scale-105"
                        title="Đánh dấu đã đọc"
                      >
                        <MaterialIcon name="done" className="text-[16px]" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
            
            {nextCursor && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={status === 'loading'}
                  className="rounded-full bg-primary px-6 py-2 text-xs font-bold text-pure-ivory shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {status === 'loading' ? 'Đang tải...' : 'Tải thêm'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

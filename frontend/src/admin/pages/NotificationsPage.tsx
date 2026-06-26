import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "@/store";
import { useAdminAuth } from "../context/AdminAuthContext";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllAsRead,
  markAsRead,
  type UserNotification,
} from "@/features/notification/notificationSlice";
import { resolveDashboardNotificationLink } from "@/features/notification/notificationRouting";
import { subscribeNotificationRealtime } from "@/features/notification/notificationRealtime";

type NotificationFilter = "all" | "unread" | "read";

const getTimeLabel = (isoDate: string) => {
  const createdAt = new Date(isoDate).getTime();
  const diffMs = Date.now() - createdAt;
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
};

export function NotificationsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { role } = useAdminAuth();
  const { items: notificationItems, unreadCount, nextCursor, status, error } = useSelector(
    (state: RootState) => state.notification
  );
  const notifications = Array.isArray(notificationItems) ? notificationItems : [];
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchNotifications(undefined));
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  useEffect(() => {
    const unsubscribe = subscribeNotificationRealtime(dispatch);
    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  const filteredItems = (() => {
    if (filter === "unread") return notifications.filter((item) => !item.isRead);
    if (filter === "read") return notifications.filter((item) => item.isRead);
    return notifications;
  })();

  const handleMarkAsRead = async (item: UserNotification) => {
    if (item.isRead) {
      navigate(resolveDashboardNotificationLink(item, role));
      return;
    }

    try {
      await dispatch(markAsRead(item._id)).unwrap();
      window.dispatchEvent(new CustomEvent("notification-updated"));
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc", error);
    } finally {
      navigate(resolveDashboardNotificationLink(item, role));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount <= 0) return;
    try {
      await dispatch(markAllAsRead()).unwrap();
      window.dispatchEvent(new CustomEvent("notification-updated"));
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc", error);
    }
  };

  const handleLoadMore = () => {
    if (!nextCursor || loadingMore) return;
    setLoadMoreError(null);
    setLoadingMore(true);
    dispatch(fetchNotifications(nextCursor))
      .unwrap()
      .catch((err) => {
        console.error("Lỗi tải thêm thông báo", err);
        setLoadMoreError("Không thể tải thêm thông báo. Vui lòng thử lại.");
      })
      .finally(() => {
        setLoadingMore(false);
      });
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[var(--adm-border)] bg-[var(--adm-surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[var(--adm-text)]">Thông báo hệ thống</h1>
            <p className="text-sm text-[var(--adm-text-muted)]">Theo dõi các cập nhật đơn hàng, thanh toán và hội thoại.</p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-[var(--adm-border)] px-3 py-2 text-sm text-[var(--adm-text)] disabled:opacity-50"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount <= 0}
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(["all", "unread", "read"] as NotificationFilter[]).map((type) => {
          const isActive = filter === type;
          const count =
            type === "all"
              ? notifications.length
              : type === "unread"
              ? unreadCount
              : notifications.filter((item) => item.isRead).length;

          return (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                isActive ? "bg-[#6366f1] text-white" : "bg-[var(--adm-surface)] text-[var(--adm-text-muted)]"
              }`}
            >
              {type === "all" ? "Tất cả" : type === "unread" ? "Chưa đọc" : "Đã đọc"} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {status === "failed" && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error || "Không thể tải thông báo. Vui lòng thử lại."}
          </div>
        )}
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--adm-border)] bg-[var(--adm-surface)] p-8 text-center text-[var(--adm-text-muted)]">
            Không có thông báo phù hợp.
          </div>
        ) : (
          filteredItems.map((item) => {
            const title = item.notification?.title || "Thông báo hệ thống";
            const body = item.notification?.body || "Không có nội dung chi tiết.";
            const safeCreatedAt = item.createdAt || new Date().toISOString();

            return (
              <button
                type="button"
                key={item._id || `${safeCreatedAt}-${title}`}
                onClick={() => handleMarkAsRead(item)}
                className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                  item.isRead
                    ? "border-[var(--adm-border)] bg-[var(--adm-surface)]"
                    : "border-[#6366f1]/40 bg-[#6366f1]/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--adm-text)]">{title}</p>
                    <p className="mt-1 text-sm text-[var(--adm-text-muted)]">{body}</p>
                  </div>
                  {!item.isRead && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#6366f1]" />}
                </div>
                <p className="mt-2 text-xs text-[var(--adm-text-muted)]">{getTimeLabel(safeCreatedAt)}</p>
              </button>
            );
          })
        )}
      </div>

      {nextCursor && (
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-2">
            {loadMoreError && (
              <p className="text-xs text-rose-300">{loadMoreError}</p>
            )}
            <button
              type="button"
              onClick={handleLoadMore}
              className="rounded-lg border border-[var(--adm-border)] px-4 py-2 text-sm text-[var(--adm-text)] disabled:opacity-50"
              disabled={loadingMore}
            >
              {loadingMore ? "Đang tải..." : "Tải thêm"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}


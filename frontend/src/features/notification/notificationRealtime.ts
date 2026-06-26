import type { AppDispatch } from "@/store";
import { addRealtimeNotification, fetchUnreadCount, type UserNotification } from "./notificationSlice";
import { chatSocket } from "@/features/chat/shared/chat.socket";

let activeSubscribers = 0;
const dispatchSubscriberCount = new Map<AppDispatch, number>();

const handleRealtimeNotification = (payload: UserNotification) => {
  if (!payload?._id || dispatchSubscriberCount.size === 0) return;
  dispatchSubscriberCount.forEach((_count, dispatch) => {
    dispatch(addRealtimeNotification(payload));
    dispatch(fetchUnreadCount());
  });
};

export const subscribeNotificationRealtime = (dispatch: AppDispatch) => {
  activeSubscribers += 1;
  dispatchSubscriberCount.set(dispatch, (dispatchSubscriberCount.get(dispatch) || 0) + 1);
  if (activeSubscribers === 1) {
    chatSocket.connect();
    chatSocket.on("notification:new", handleRealtimeNotification);
  }

  return () => {
    activeSubscribers = Math.max(0, activeSubscribers - 1);
    const current = dispatchSubscriberCount.get(dispatch) || 0;
    if (current <= 1) {
      dispatchSubscriberCount.delete(dispatch);
    } else {
      dispatchSubscriberCount.set(dispatch, current - 1);
    }
    if (activeSubscribers === 0) {
      chatSocket.off("notification:new", handleRealtimeNotification);
      dispatchSubscriberCount.clear();
    }
  };
};


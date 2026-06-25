import { api } from "../../lib/api";
import { Review, ReviewListResult } from "./adminReviews.api";

export async function fetchStaffReviews(params: { page?: number; limit?: number } = {}): Promise<ReviewListResult> {
  const response = await api.get("/api/v1/staff/reviews", { params });
  return response.data.data as ReviewListResult;
}

export async function fetchStaffReviewById(id: string): Promise<Review> {
  const response = await api.get(`/api/v1/staff/reviews/${id}`);
  return response.data.data as Review;
}

export async function moderateStaffReview(
  id: string,
  status: "APPROVED" | "REJECTED",
  note?: string
): Promise<Review> {
  const response = await api.patch(`/api/v1/staff/reviews/${id}/moderation`, {
    status,
    note: note ?? "",
  });
  return response.data.data as Review;
}

export async function replyStaffReview(id: string, replyComment: string): Promise<Review> {
  const response = await api.patch(`/api/v1/staff/reviews/${id}/reply`, { replyComment });
  return response.data.data as Review;
}

export async function hideStaffReview(id: string, isHidden: boolean): Promise<Review> {
  const response = await api.patch(`/api/v1/staff/reviews/${id}/hide`, { isHidden });
  return response.data.data as Review;
}

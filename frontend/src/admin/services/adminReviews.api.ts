import { api } from "../../lib/api";

export interface Review {
  _id: string;
  product: {
    _id: string;
    name: string;
    slug: string;
  };
  customer: {
    _id: string;
    fullName: string;
    email: string;
  };
  rating: number;
  comment: string;
  imageUrls: string[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewListResult {
  items: Review[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchAdminReviews(params: { page?: number; limit?: number } = {}): Promise<ReviewListResult> {
  const response = await api.get("/api/v1/admin/reviews", { params });
  return response.data.data as ReviewListResult;
}

export async function fetchAdminReviewById(id: string): Promise<Review> {
  const response = await api.get(`/api/v1/admin/reviews/${id}`);
  return response.data.data as Review;
}

export async function approveAdminReview(id: string): Promise<Review> {
  const response = await api.patch(`/api/v1/admin/reviews/${id}/approve`);
  return response.data.data as Review;
}

export async function deleteAdminReview(id: string): Promise<void> {
  await api.delete(`/api/v1/admin/reviews/${id}`);
}

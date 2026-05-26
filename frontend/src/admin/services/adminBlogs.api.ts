import { api } from "../../lib/api";

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  views: number;
  author?: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogListParams {
  category?: string;
  tag?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BlogListResult {
  items: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchAdminBlogs(params: BlogListParams = {}): Promise<BlogListResult> {
  const response = await api.get("/api/v1/admin/blogs", { params });
  return response.data.data as BlogListResult;
}

export async function fetchAdminBlogById(id: string): Promise<BlogPost> {
  const response = await api.get(`/api/v1/admin/blogs/${id}`);
  return response.data.data as BlogPost;
}

export async function createAdminBlog(payload: Partial<BlogPost>): Promise<BlogPost> {
  const response = await api.post("/api/v1/admin/blogs", payload);
  return response.data.data as BlogPost;
}

export async function updateAdminBlog(id: string, payload: Partial<BlogPost>): Promise<BlogPost> {
  const response = await api.put(`/api/v1/admin/blogs/${id}`, payload);
  return response.data.data as BlogPost;
}

export async function deleteAdminBlog(id: string): Promise<void> {
  await api.delete(`/api/v1/admin/blogs/${id}`);
}

import { api } from "../../lib/api";
import { BlogPost, BlogListParams, BlogListResult } from "./adminBlogs.api";

export async function fetchStaffBlogs(params: BlogListParams = {}): Promise<BlogListResult> {
  const response = await api.get("/api/v1/staff/blogs", { params });
  return response.data.data as BlogListResult;
}

export async function fetchStaffBlogById(id: string): Promise<BlogPost> {
  const response = await api.get(`/api/v1/staff/blogs/${id}`);
  return response.data.data as BlogPost;
}

export async function createStaffBlog(payload: Partial<BlogPost>): Promise<BlogPost> {
  const response = await api.post("/api/v1/staff/blogs", payload);
  return response.data.data as BlogPost;
}

export async function updateStaffBlog(id: string, payload: Partial<BlogPost>): Promise<BlogPost> {
  const response = await api.patch(`/api/v1/staff/blogs/${id}`, payload);
  return response.data.data as BlogPost;
}

export async function fetchStaffBlogFilters(): Promise<{ categories: string[]; tags: string[] }> {
  const response = await api.get("/api/v1/staff/blogs/filters");
  return response.data.data;
}

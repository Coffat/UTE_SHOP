import { Request, Response } from 'express';
import * as blogService from '../services/blog.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import { isBlogStaffRole } from '../constants/blogRoles.js';

export const getBlogPosts = async (req: Request, res: Response) => {
  const { category, tag, search, page, limit } = req.query;
  const isAdmin = req.user ? isBlogStaffRole(req.user.role) : false;

  const result = await blogService.getBlogPosts({
    category: category ? String(category) : undefined,
    tag: tag ? String(tag) : undefined,
    search: search ? String(search) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    isAdmin,
  });

  return sendSuccess(res, 200, 'Tải danh sách bài viết thành công.', result);
};

export const getBlogPostBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const isAdmin = req.user ? isBlogStaffRole(req.user.role) : false;

  const post = await blogService.getBlogPostBySlug(slug as string, isAdmin);
  if (!post) {
    return sendError(res, 404, 'Không tìm thấy bài viết.');
  }

  return sendSuccess(res, 200, 'Tải chi tiết bài viết thành công.', post);
};

export const createBlogPost = async (req: Request, res: Response) => {
  const authorId = req.user!.id;
  const post = await blogService.createBlogPost(req.body, authorId);
  return sendSuccess(res, 201, 'Tạo bài viết thành công.', post);
};

export const updateBlogPost = async (req: Request, res: Response) => {
  const { id } = req.params;
  const post = await blogService.updateBlogPost(id as string, req.body);
  if (!post) {
    return sendError(res, 404, 'Không tìm thấy bài viết để cập nhật.');
  }
  return sendSuccess(res, 200, 'Cập nhật bài viết thành công.', post);
};

export const deleteBlogPost = async (req: Request, res: Response) => {
  const { id } = req.params;
  const success = await blogService.deleteBlogPost(id as string);
  if (!success) {
    return sendError(res, 404, 'Không tìm thấy bài viết để xóa.');
  }
  return sendSuccess(res, 200, 'Xóa bài viết thành công.');
};

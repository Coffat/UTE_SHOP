import { Request, Response } from 'express';
import * as blogService from '../../system/services/blog.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { writeAuditLog } from '../../../shared/utils/auditLogger.js';

/** GET /staff/blogs */
export const listBlogs = asyncHandler(async (req: Request, res: Response) => {
  const { category, tag, search, page, limit } = req.query;

  const result = await blogService.getBlogPosts({
    category: category ? String(category) : undefined,
    tag: tag ? String(tag) : undefined,
    search: search ? String(search) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    isAdmin: true,
  });

  return sendSuccess(res, 200, 'Tải danh sách bài viết thành công.', result);
});

/** GET /staff/blogs/filters */
export const getBlogFilters = asyncHandler(async (req: Request, res: Response) => {
  const filters = await blogService.getBlogFilters();
  return sendSuccess(res, 200, 'Tải danh sách lọc thành công.', filters);
});

/** GET /staff/blogs/:id */
export const getBlog = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const post = await blogService.getBlogPostById(id);
  if (!post) {
    return sendError(res, 404, 'Không tìm thấy bài viết.');
  }
  return sendSuccess(res, 200, 'Tải chi tiết bài viết thành công.', post);
});

/** POST /staff/blogs */
export const createBlog = asyncHandler(async (req: Request, res: Response) => {
  const authorId = req.user!.id;
  const post = await blogService.createBlogPost(req.body, authorId);

  // Write audit log
  await writeAuditLog(req, 'CREATE', 'BlogPost', post.id, undefined, post.toObject());

  return sendSuccess(res, 201, 'Tạo bài viết thành công.', post);
});

/** PATCH /staff/blogs/:id */
export const updateBlog = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const beforePost = await blogService.getBlogPostById(id);
  if (!beforePost) {
    return sendError(res, 404, 'Không tìm thấy bài viết để cập nhật.');
  }

  const post = await blogService.updateBlogPost(id, req.body);
  if (!post) {
    return sendError(res, 404, 'Không tìm thấy bài viết để cập nhật.');
  }

  // Write audit log
  await writeAuditLog(
    req,
    'UPDATE',
    'BlogPost',
    id,
    beforePost.toObject(),
    post.toObject()
  );

  return sendSuccess(res, 200, 'Cập nhật bài viết thành công.', post);
});

import BlogPost, { IBlogPost } from '../models/BlogPost.js';

interface BlogQueryOptions {
  category?: string;
  tag?: string;
  search?: string;
  page?: number;
  limit?: number;
  isAdmin?: boolean;
}

interface BlogPostData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  category: string;
  tags?: string[];
  isPublished?: boolean;
}

/**
 * Service: Blog Service
 * 
 * Tuân thủ Single Responsibility Principle (SRP):
 * Chỉ chịu trách nhiệm xử lý logic nghiệp vụ và truy vấn dữ liệu của Blog.
 */
export const getBlogPosts = async (options: BlogQueryOptions) => {
  const { category, tag, search, page = 1, limit = 10, isAdmin = false } = options;

  const filter: any = {};
  
  // Trừ khi là Admin/Staff, chỉ lấy các bài viết đã xuất bản
  if (!isAdmin) {
    filter.isPublished = true;
  }

  if (category) {
    filter.category = category;
  }

  if (tag) {
    filter.tags = tag;
  }

  if (search) {
    // Nếu có search, dùng text search của MongoDB hoặc regex fallback
    filter.$or = [
      { $text: { $search: search } },
      { title: { $regex: search, $options: 'i' } },
      { excerpt: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    BlogPost.find(filter)
      .populate('author', 'fullName email role')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    BlogPost.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getBlogPostBySlug = async (slug: string, isAdmin = false): Promise<IBlogPost | null> => {
  const filter: any = { slug };
  if (!isAdmin) {
    filter.isPublished = true;
  }

  const post = await BlogPost.findOne(filter).populate('author', 'fullName email role');
  
  if (post && !isAdmin) {
    // Tăng lượt xem bất đồng bộ khi đọc bài viết công khai
    post.views += 1;
    await post.save();
  }

  return post;
};

export const createBlogPost = async (data: BlogPostData, authorId: string): Promise<IBlogPost> => {
  const blogPost = await BlogPost.create({
    ...data,
    author: authorId as any,
    publishedAt: data.isPublished !== false ? new Date() : undefined,
  });
  return blogPost;
};

export const updateBlogPost = async (id: string, data: Partial<BlogPostData>): Promise<IBlogPost | null> => {
  const updatePayload: any = { ...data };
  if (data.isPublished === true) {
    updatePayload.publishedAt = new Date();
  }
  
  return BlogPost.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true });
};

export const deleteBlogPost = async (id: string): Promise<boolean> => {
  const result = await BlogPost.findByIdAndDelete(id);
  return result !== null;
};

export const getBlogPostById = async (id: string): Promise<IBlogPost | null> => {
  return BlogPost.findById(id).populate('author', 'fullName email role');
};

export const getBlogFilters = async () => {
  const categories = await BlogPost.distinct('category');
  const tags = await BlogPost.distinct('tags');
  return {
    categories: categories.filter(Boolean),
    tags: tags.filter(Boolean),
  };
};

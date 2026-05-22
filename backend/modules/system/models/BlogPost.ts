import mongoose, { Document, Schema } from 'mongoose';

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: mongoose.Types.ObjectId;
  coverImage: string;
  category: string;
  tags: string[];
  views: number;
  isPublished: boolean;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: [true, 'Tiêu đề là bắt buộc'], trim: true },
    slug: { type: String, required: [true, 'Slug là bắt buộc'], unique: true, lowercase: true, trim: true },
    content: { type: String, required: [true, 'Nội dung bài viết là bắt buộc'] },
    excerpt: { type: String, required: [true, 'Tóm tắt bài viết là bắt buộc'], trim: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Tác giả là bắt buộc'] },
    coverImage: { type: String, required: [true, 'Ảnh bìa là bắt buộc'] },
    category: { type: String, required: [true, 'Danh mục là bắt buộc'], trim: true },
    tags: [{ type: String, trim: true }],
    views: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Tự động tạo index cho tìm kiếm toàn văn bản
blogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

const BlogPost = mongoose.model<IBlogPost>('BlogPost', blogPostSchema);
export default BlogPost;

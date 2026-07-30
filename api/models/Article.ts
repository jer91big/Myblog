import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  content: string;
  excerpt: string;
  authorId: Types.ObjectId;
  categoryId: Types.ObjectId;
  tagIds: Types.ObjectId[];
  status: 'published' | 'draft';
  featuredImage: string;
  views: number;
  likes: number;
  likedBy: Types.ObjectId[];
  metaTitle: string;
  metaDescription: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema: Schema<IArticle> = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      default: '',
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    tagIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
      default: [],
    },
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'draft',
    },
    featuredImage: {
      type: String,
      default: '',
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    metaTitle: {
      type: String,
      default: '',
    },
    metaDescription: {
      type: String,
      default: '',
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ArticleSchema.pre<IArticle>('save', function (next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

export const Article = mongoose.model<IArticle>('Article', ArticleSchema);

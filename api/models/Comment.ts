import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComment extends Document {
  articleId: Types.ObjectId;
  authorId: Types.ObjectId;
  parentId: Types.ObjectId | null;
  content: string;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema<IComment> = new Schema(
  {
    articleId: {
      type: Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);

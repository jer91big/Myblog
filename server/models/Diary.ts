import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDiary extends Document {
  title: string;
  content: string;
  excerpt: string;
  authorId: Types.ObjectId;
  date: Date;
  status: 'draft' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const DiarySchema: Schema<IDiary> = new Schema(
  {
    title: {
      type: String,
      default: '',
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
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'completed'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

// 列表按人按日期倒序查询
DiarySchema.index({ authorId: 1, date: -1 });

export const Diary = mongoose.model<IDiary>('Diary', DiarySchema);

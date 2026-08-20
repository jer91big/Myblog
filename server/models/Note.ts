import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INote extends Document {
  title: string;
  content: string;
  excerpt: string;
  authorId: Types.ObjectId;
  tags: string[];
  status: 'published' | 'draft';
  views: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema<INote> = new Schema(
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
    tags: {
      type: [{ type: String }],
      default: [],
    },
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'draft',
    },
    views: {
      type: Number,
      default: 0,
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

NoteSchema.pre<INote>('save', function (next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

export const Note = mongoose.model<INote>('Note', NoteSchema);

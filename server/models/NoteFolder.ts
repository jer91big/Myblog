import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INoteFolder extends Document {
  name: string;
  parentId: Types.ObjectId | null;
  authorId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoteFolderSchema: Schema<INoteFolder> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'NoteFolder',
      default: null,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const NoteFolder = mongoose.model<INoteFolder>('NoteFolder', NoteFolderSchema);

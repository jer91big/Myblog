import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INoteFolder extends Document {
  name: string;
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

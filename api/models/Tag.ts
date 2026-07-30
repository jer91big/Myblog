import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

export interface ITag extends Document {
  name: string;
  slug: string;
  createdAt: Date;
}

const TagSchema: Schema<ITag> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

TagSchema.pre<ITag>('save', async function (next) {
  if (this.isModified('name') || !this.slug) {
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    if (!baseSlug) {
      baseSlug = this.name.toLowerCase().replace(/\s+/g, '-');
    }
    this.slug = baseSlug;
    
    let counter = 1;
    while (await Tag.findOne({ slug: this.slug, _id: { $ne: this._id } })) {
      this.slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  next();
});

export const Tag = mongoose.model<ITag>('Tag', TagSchema);

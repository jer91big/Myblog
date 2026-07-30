import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

export interface ICategory extends Document {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema<ICategory> = new Schema(
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

CategorySchema.pre<ICategory>('save', async function (next) {
  if (this.isModified('name') || !this.slug) {
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    if (!baseSlug) {
      baseSlug = this.name.toLowerCase().replace(/\s+/g, '-');
    }
    this.slug = baseSlug;
    
    let counter = 1;
    while (await Category.findOne({ slug: this.slug, _id: { $ne: this._id } })) {
      this.slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  next();
});

export const Category = mongoose.model<ICategory>('Category', CategorySchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IVisit extends Document {
  ip: string;
  date: string; // YYYY-MM-DD（Asia/Shanghai）
  firstSeenAt: Date;
  location: string; // IP 属地（缓存，查询时按需解析）
}

const VisitSchema: Schema<IVisit> = new Schema(
  {
    ip: { type: String, required: true },
    date: { type: String, required: true },
    firstSeenAt: { type: Date, default: Date.now },
    location: { type: String, default: '' },
  },
  { timestamps: true }
);

// 同一天同一 IP 只计一次
VisitSchema.index({ ip: 1, date: 1 }, { unique: true });

export const Visit = mongoose.model<IVisit>('Visit', VisitSchema);

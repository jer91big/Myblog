import { Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { Diary } from '../models/Diary.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// 正文含 base64 图片，单篇上限兜底防止超出 Mongo 16MB 文档限制
const MAX_CONTENT_LENGTH = 14_000_000;

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD');

const createDiarySchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(MAX_CONTENT_LENGTH),
  date: dateSchema,
});

const updateDiarySchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(MAX_CONTENT_LENGTH).optional(),
  date: dateSchema.optional(),
});

// 统一存成当日 UTC 正午，避免各时区渲染时日期前移/后移一天
const toNoonUtc = (date: string): Date => new Date(`${date}T12:00:00.000Z`);

// 摘要需要剔除图片/链接/代码块语法，否则 base64 数据会整段写进摘要
const stripExcerpt = (content: string): string => {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);
};

const serializeDiary = (diary: any) => ({
  id: diary._id.toString(),
  title: diary.title,
  excerpt: diary.excerpt,
  date: diary.date,
  createdAt: diary.createdAt,
  updatedAt: diary.updatedAt,
});

export const getDiaries = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    // 只查本人的日记，管理员不例外
    const query = { authorId: new Types.ObjectId(req.user.id) };

    const diaries = await Diary.find(query)
      .select('-content')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1, createdAt: -1 });

    const total = await Diary.countDocuments(query);

    res.json({
      success: true,
      data: {
        diaries: diaries.map(serializeDiary),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get diaries error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getDiaryById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, message: '日记不存在' });
      return;
    }

    // 非本人一律 404，不泄露日记是否存在
    const diary = await Diary.findOne({
      _id: id,
      authorId: req.user.id,
    });

    if (!diary) {
      res.status(404).json({ success: false, message: '日记不存在' });
      return;
    }

    res.json({
      success: true,
      data: {
        ...serializeDiary(diary),
        content: diary.content,
      },
    });
  } catch (error) {
    console.error('Get diary error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createDiary = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const validated = createDiarySchema.safeParse(req.body);

    if (!validated.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validated.error.errors,
      });
      return;
    }

    const { title = '', content, date } = validated.data;

    const diary = new Diary({
      title,
      content,
      excerpt: stripExcerpt(content),
      authorId: req.user.id,
      date: toNoonUtc(date),
    });

    await diary.save();

    res.status(201).json({
      success: true,
      message: 'Diary created successfully',
      data: serializeDiary(diary),
    });
  } catch (error) {
    console.error('Create diary error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateDiary = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, message: '日记不存在' });
      return;
    }

    const validated = updateDiarySchema.safeParse(req.body);

    if (!validated.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validated.error.errors,
      });
      return;
    }

    const diary = await Diary.findOne({ _id: id, authorId: req.user.id });

    if (!diary) {
      res.status(404).json({ success: false, message: '日记不存在' });
      return;
    }

    const { title, content, date } = validated.data;

    if (title !== undefined) diary.title = title;
    if (content !== undefined) {
      diary.content = content;
      diary.excerpt = stripExcerpt(content);
    }
    if (date !== undefined) diary.date = toNoonUtc(date);

    await diary.save();

    res.json({
      success: true,
      message: 'Diary updated successfully',
      data: serializeDiary(diary),
    });
  } catch (error) {
    console.error('Update diary error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteDiary = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ success: false, message: '日记不存在' });
      return;
    }

    const diary = await Diary.findOneAndDelete({
      _id: id,
      authorId: req.user.id,
    });

    if (!diary) {
      res.status(404).json({ success: false, message: '日记不存在' });
      return;
    }

    res.json({
      success: true,
      message: 'Diary deleted successfully',
    });
  } catch (error) {
    console.error('Delete diary error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

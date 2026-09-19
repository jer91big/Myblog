export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string;
  bio: string;
  role: 'user' | 'admin';
  createdAt: string;
  articleCount?: number;
  commentCount?: number;
  noteCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  articleCount: number;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  articleCount: number;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: User;
  category: Category;
  tags: Tag[];
  featuredImage: string;
  views: number;
  likes: number;
  status: 'published' | 'draft';
  metaTitle: string;
  metaDescription: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  parentId: string | null;
  approved: boolean;
  createdAt: string;
  children?: Comment[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: { message: string }[];
}

export interface ArticleListResponse {
  articles: Article[];
  pagination: Pagination;
}

export interface CommentListResponse {
  comments: Comment[];
  pagination: Pagination;
}

export interface NoteFolder {
  id: string;
  name: string;
  parentId: string | null;
  /** 递归计数：自身 + 全部子孙文件夹的笔记数 */
  noteCount: number;
  /** 仅该文件夹直属的笔记数（不含子文件夹） */
  directNoteCount: number;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  author: User;
  folderId?: string | null;
  status: 'published' | 'draft';
  views: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResponse {
  articles: Article[];
  count: number;
}

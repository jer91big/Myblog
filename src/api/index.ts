import {
  User,
  Article,
  Category,
  Tag,
  Comment,
  AuthResponse,
  ApiResponse,
  ArticleListResponse,
  CommentListResponse,
  SearchResponse,
} from '../types';

const API_BASE_URL = '/api';

const buildUrl = (path: string, params?: Record<string, string | number | boolean | undefined>): string => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value));
    });
  }
  const queryString = searchParams.toString();
  return queryString ? `${API_BASE_URL}${path}?${queryString}` : `${API_BASE_URL}${path}`;
};

let accessToken = localStorage.getItem('accessToken');

export const setToken = (token: string) => {
  accessToken = token;
  localStorage.setItem('accessToken', token);
};

export const clearToken = () => {
  accessToken = '';
  localStorage.removeItem('accessToken');
};

const headers = () => ({
  'Content-Type': 'application/json',
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
});

export const authApi = {
  register: async (email: string, password: string, username: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, password, username }),
    });
    return response.json();
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },
};

export const articleApi = {
  getArticles: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
    status?: string;
  }): Promise<ApiResponse<ArticleListResponse>> => {
    const response = await fetch(buildUrl('/articles', params), {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  getArticleById: async (id: string): Promise<ApiResponse<Article>> => {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  createArticle: async (data: {
    title: string;
    content: string;
    excerpt?: string;
    categoryId: string;
    tagIds?: string[];
    status: 'published' | 'draft';
    featuredImage?: string;
    metaTitle?: string;
    metaDescription?: string;
  }): Promise<ApiResponse<Article>> => {
    const response = await fetch(`${API_BASE_URL}/articles`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  updateArticle: async (
    id: string,
    data: Partial<{
      title: string;
      content: string;
      excerpt?: string;
      categoryId: string;
      tagIds?: string[];
      status: 'published' | 'draft';
      featuredImage?: string;
      metaTitle?: string;
      metaDescription?: string;
    }>
  ): Promise<ApiResponse<Article>> => {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteArticle: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    return response.json();
  },

  incrementViews: async (id: string): Promise<ApiResponse<{ views: number }>> => {
    const response = await fetch(`${API_BASE_URL}/articles/${id}/views`, {
      method: 'POST',
      headers: headers(),
    });
    return response.json();
  },

  toggleLike: async (id: string): Promise<ApiResponse<{ likes: number; liked: boolean }>> => {
    const response = await fetch(`${API_BASE_URL}/articles/${id}/likes`, {
      method: 'POST',
      headers: headers(),
    });
    return response.json();
  },

  getPopularArticles: async (limit?: number): Promise<ApiResponse<Article[]>> => {
    const response = await fetch(buildUrl('/articles/popular', { limit }), {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  getRelatedArticles: async (id: string, limit?: number): Promise<ApiResponse<Article[]>> => {
    const response = await fetch(buildUrl(`/articles/${id}/related`, { limit }), {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },
};

export const categoryApi = {
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  createCategory: async (name: string): Promise<ApiResponse<Category>> => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ name }),
    });
    return response.json();
  },

  updateCategory: async (id: string, name: string): Promise<ApiResponse<Category>> => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ name }),
    });
    return response.json();
  },

  deleteCategory: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    return response.json();
  },
};

export const tagApi = {
  getTags: async (): Promise<ApiResponse<Tag[]>> => {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  createTag: async (name: string): Promise<ApiResponse<Tag>> => {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ name }),
    });
    return response.json();
  },

  deleteTag: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/tags/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    return response.json();
  },
};

export const commentApi = {
  getComments: async (articleId: string, approved?: boolean): Promise<ApiResponse<CommentListResponse>> => {
    const response = await fetch(buildUrl('/comments', { articleId, approved }), {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  createComment: async (articleId: string, content: string, parentId?: string): Promise<ApiResponse<Comment>> => {
    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ articleId, content, parentId }),
    });
    return response.json();
  },

  updateComment: async (id: string, content: string): Promise<ApiResponse<Comment>> => {
    const response = await fetch(`${API_BASE_URL}/comments/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ content }),
    });
    return response.json();
  },

  deleteComment: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/comments/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    return response.json();
  },

  approveComment: async (id: string): Promise<ApiResponse<Comment>> => {
    const response = await fetch(`${API_BASE_URL}/comments/${id}/approve`, {
      method: 'POST',
      headers: headers(),
    });
    return response.json();
  },

  getPendingComments: async (): Promise<ApiResponse<CommentListResponse>> => {
    const response = await fetch(`${API_BASE_URL}/comments/pending`, {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },
};

export const searchApi = {
  searchArticles: async (q: string, type?: 'title' | 'content' | 'tag'): Promise<ApiResponse<SearchResponse>> => {
    const response = await fetch(buildUrl('/search', { q, type }), {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },
};

export const userApi = {
  getUsers: async (page?: number, limit?: number): Promise<ApiResponse<{ users: User[]; pagination: any }>> => {
    const response = await fetch(buildUrl('/users', { page, limit }), {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  updateUser: async (
    id: string,
    data: Partial<{ username: string; bio: string; avatarUrl: string }>
  ): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    return response.json();
  },

  getUserArticles: async (id: string, page?: number, limit?: number): Promise<ApiResponse<{ articles: Article[]; pagination: any }>> => {
    const response = await fetch(buildUrl(`/users/${id}/articles`, { page, limit }), {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },
};

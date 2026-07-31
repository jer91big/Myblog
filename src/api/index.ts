import {
  User,
  Article,
  Category,
  Tag,
  Comment,
  Note,
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
let refreshTokenValue = localStorage.getItem('refreshToken');
let refreshPromise: Promise<boolean> | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshTokenValue = refresh;
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
};

export const setToken = (token: string) => {
  accessToken = token;
  localStorage.setItem('accessToken', token);
};

export const clearToken = () => {
  accessToken = '';
  refreshTokenValue = '';
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

const headers = () => ({
  'Content-Type': 'application/json',
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
});

// 自动刷新 Token
async function refreshAccessToken(): Promise<boolean> {
  const storedRefresh = localStorage.getItem('refreshToken');
  if (!storedRefresh) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefresh }),
    });
    const data = await res.json();
    if (data.success && data.data) {
      setTokens(data.data.accessToken, data.data.refreshToken || storedRefresh);
      return true;
    }
    clearToken();
    return false;
  } catch {
    return false;
  }
}

// 带自动续期的 fetch 包装
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const reqOptions: RequestInit = {
    ...options,
    headers: {
      ...headers(),
      ...(options.headers as Record<string, string> || {}),
    },
  };

  let res = await fetch(url, reqOptions);

  // 401 且存在 refreshToken → 尝试自动续期
  if (res.status === 401 && localStorage.getItem('refreshToken')) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      reqOptions.headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers as Record<string, string> || {}),
      };
      res = await fetch(url, reqOptions);
    }
  }

  return res;
}

export const authApi = {
  register: async (email: string, password: string, username: string): Promise<AuthResponse> => {
    const response = await authFetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, password, username }),
    });
    return response.json();
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await authFetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await authFetch(`${API_BASE_URL}/auth/me`, {
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
    const response = await authFetch(buildUrl('/articles', params), {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  getArticleById: async (id: string): Promise<ApiResponse<Article>> => {
    const response = await authFetch(`${API_BASE_URL}/articles/${id}`, {
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
    const response = await authFetch(`${API_BASE_URL}/articles`, {
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
    const response = await authFetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteArticle: async (id: string): Promise<ApiResponse<void>> => {
    const response = await authFetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    return response.json();
  },

  incrementViews: async (id: string): Promise<ApiResponse<{ views: number }>> => {
    const response = await authFetch(`${API_BASE_URL}/articles/${id}/views`, {
      method: 'POST',
      headers: headers(),
    });
    return response.json();
  },

  toggleLike: async (id: string): Promise<ApiResponse<{ likes: number; liked: boolean }>> => {
    const response = await authFetch(`${API_BASE_URL}/articles/${id}/likes`, {
      method: 'POST',
      headers: headers(),
    });
    return response.json();
  },

  getPopularArticles: async (limit?: number): Promise<ApiResponse<Article[]>> => {
    const response = await authFetch(buildUrl('/articles/popular', { limit }), {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  getRelatedArticles: async (id: string, limit?: number): Promise<ApiResponse<Article[]>> => {
    const response = await authFetch(buildUrl(`/articles/${id}/related`, { limit }), {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },
};

export const categoryApi = {
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    const response = await authFetch(`${API_BASE_URL}/categories`, {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  createCategory: async (name: string): Promise<ApiResponse<Category>> => {
    const response = await authFetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ name }),
    });
    return response.json();
  },

  updateCategory: async (id: string, name: string): Promise<ApiResponse<Category>> => {
    const response = await authFetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ name }),
    });
    return response.json();
  },

  deleteCategory: async (id: string): Promise<ApiResponse<void>> => {
    const response = await authFetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    return response.json();
  },
};

export const tagApi = {
  getTags: async (): Promise<ApiResponse<Tag[]>> => {
    const response = await authFetch(`${API_BASE_URL}/tags`, {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  createTag: async (name: string): Promise<ApiResponse<Tag>> => {
    const response = await authFetch(`${API_BASE_URL}/tags`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ name }),
    });
    return response.json();
  },

  deleteTag: async (id: string): Promise<ApiResponse<void>> => {
    const response = await authFetch(`${API_BASE_URL}/tags/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    return response.json();
  },
};

export const commentApi = {
  getComments: async (articleId: string, approved?: boolean): Promise<ApiResponse<CommentListResponse>> => {
    const response = await authFetch(buildUrl('/comments', { articleId, approved }), {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  createComment: async (articleId: string, content: string, parentId?: string): Promise<ApiResponse<Comment>> => {
    const response = await authFetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ articleId, content, parentId }),
    });
    return response.json();
  },

  updateComment: async (id: string, content: string): Promise<ApiResponse<Comment>> => {
    const response = await authFetch(`${API_BASE_URL}/comments/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ content }),
    });
    return response.json();
  },

  deleteComment: async (id: string): Promise<ApiResponse<void>> => {
    const response = await authFetch(`${API_BASE_URL}/comments/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    return response.json();
  },

  approveComment: async (id: string): Promise<ApiResponse<Comment>> => {
    const response = await authFetch(`${API_BASE_URL}/comments/${id}/approve`, {
      method: 'POST',
      headers: headers(),
    });
    return response.json();
  },

  getPendingComments: async (): Promise<ApiResponse<CommentListResponse>> => {
    const response = await authFetch(`${API_BASE_URL}/comments/pending`, {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },
};

export const searchApi = {
  searchArticles: async (q: string, type?: 'title' | 'content' | 'tag'): Promise<ApiResponse<SearchResponse>> => {
    const response = await authFetch(buildUrl('/search', { q, type }), {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },
};

export const userApi = {
  getUsers: async (page?: number, limit?: number): Promise<ApiResponse<{ users: User[]; pagination: any }>> => {
    const response = await authFetch(buildUrl('/users', { page, limit }), {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await authFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  updateUser: async (
    id: string,
    data: Partial<{ username: string; bio: string; avatarUrl: string }>
  ): Promise<ApiResponse<User>> => {
    const response = await authFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    const response = await authFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    return response.json();
  },

  getUserArticles: async (id: string, page?: number, limit?: number): Promise<ApiResponse<{ articles: Article[]; pagination: any }>> => {
    const response = await authFetch(buildUrl(`/users/${id}/articles`, { page, limit }), {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  getUserNotes: async (id: string, page?: number, limit?: number): Promise<ApiResponse<{ notes: Note[]; pagination: any }>> => {
    const response = await authFetch(buildUrl(`/users/${id}/notes`, { page, limit }), {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },
};

export const noteApi = {
  getNotes: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<{ notes: Note[]; pagination: any }>> => {
    const response = await authFetch(buildUrl('/notes', params), {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  getNoteById: async (id: string): Promise<ApiResponse<Note>> => {
    const response = await authFetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'GET',
      headers: headers(),
    });
    return response.json();
  },

  createNote: async (data: {
    title: string;
    content: string;
    tags?: string[];
    status: 'published' | 'draft';
  }): Promise<ApiResponse<Note>> => {
    const response = await authFetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  updateNote: async (
    id: string,
    data: Partial<{ title: string; content: string; tags?: string[]; status: 'published' | 'draft' }>
  ): Promise<ApiResponse<Note>> => {
    const response = await authFetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteNote: async (id: string): Promise<ApiResponse<void>> => {
    const response = await authFetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    return response.json();
  },
};

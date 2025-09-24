export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bookmark {
  id: string;
  userId: string;
  url: string;
  title: string;
  description?: string | null;
  isPublic: boolean;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

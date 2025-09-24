export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Bookmark = {
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
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginationResult = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

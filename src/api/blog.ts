// src/api/blog.ts
import {apiClient, ApiResponse} from './config';
import {getAuthHeader} from './auth';

export interface BlogPost {
  id: string;
  title: string;
  summary?: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  publishedAt?: string;
  author?: string;
}

export interface BlogPostDetail extends BlogPost {
  kindergarten?: {
    id: string;
    name: string;
  };
}

export interface BlogPostsResponse {
  posts: BlogPost[];
  page: number;
  pageSize: number;
  total: number;
}

export async function getBlogPosts(
  token: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<ApiResponse<BlogPostsResponse>> {
  try {
    const headers = getAuthHeader(token);
    const response = await apiClient.get(
      `/blog?page=${page}&pageSize=${pageSize}`,
      {headers},
    );
    return {data: response.data};
  } catch (error: any) {
    if (error.response) {
      return {
        error: error.response.data.error || 'Failed to fetch blog posts',
      };
    }
    return {
      error: error.message || 'Network error. Please check your connection.',
    };
  }
}

export async function getBlogPostDetails(
  token: string,
  id: string,
): Promise<ApiResponse<BlogPostDetail>> {
  try {
    const headers = getAuthHeader(token);
    const response = await apiClient.get(`/blog/${id}`, {headers});
    return {data: response.data};
  } catch (error: any) {
    if (error.response) {
      return {
        error: error.response.data.error || 'Failed to fetch blog post',
      };
    }
    return {
      error: error.message || 'Network error. Please check your connection.',
    };
  }
}

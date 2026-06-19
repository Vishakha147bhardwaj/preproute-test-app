import axiosInstance from './axios';
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  Subject,
  Topic,
  SubTopic,
  Test,
  CreateTestRequest,
  UpdateTestRequest,
  Question,
  BulkCreateQuestionsRequest,
} from '../types';

// ─── Auth ───────────────────────────────────────────
export const loginApi = (data: LoginRequest) =>
  axiosInstance.post<AuthResponse>('/auth/login', data);

// ─── Subjects ───────────────────────────────────────
export const getSubjectsApi = () =>
  axiosInstance.get<ApiResponse<Subject[]>>('/subjects');

// ─── Topics ─────────────────────────────────────────
export const getTopicsBySubjectApi = (subjectId: string) =>
  axiosInstance.get<ApiResponse<Topic[]>>(`/topics/subject/${subjectId}`);

// ─── Sub-topics ──────────────────────────────────────
export const getSubTopicsByTopicApi = (topicId: string) =>
  axiosInstance.get<ApiResponse<SubTopic[]>>(`/sub-topics/topic/${topicId}`);

export const getSubTopicsByMultipleTopicsApi = (topicIds: string[]) =>
  axiosInstance.post<ApiResponse<SubTopic[]>>('/sub-topics/multi-topics', { topicIds });

// ─── Tests ───────────────────────────────────────────
export const getAllTestsApi = () =>
  axiosInstance.get<ApiResponse<Test[]>>('/tests');

export const getTestByIdApi = (id: string) =>
  axiosInstance.get<ApiResponse<Test>>(`/tests/${id}`);

export const createTestApi = (data: CreateTestRequest) =>
  axiosInstance.post<ApiResponse<Test>>('/tests', data);

export const updateTestApi = (id: string, data: UpdateTestRequest) =>
  axiosInstance.put<ApiResponse<Test>>(`/tests/${id}`, data);

export const publishTestApi = (id: string) =>
  axiosInstance.put<ApiResponse<Test>>(`/tests/${id}`, { status: 'live' });

// ─── Questions ───────────────────────────────────────
export const bulkCreateQuestionsApi = (data: BulkCreateQuestionsRequest) =>
  axiosInstance.post<ApiResponse<Question[]>>('/questions/bulk', data);

export const fetchBulkQuestionsApi = (questionIds: string[]) =>
  axiosInstance.post<ApiResponse<Question[]>>('/questions/fetchBulk', {
    question_ids: questionIds,
  });

  export const deleteTestApi = (id: string) =>
  axiosInstance.delete(`/tests/${id}`);
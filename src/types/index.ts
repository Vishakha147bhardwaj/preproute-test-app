export interface LoginRequest{
    userId: string;
    password: string;
}
export interface User{
    id: string;
    userId: string;
    name:string;
}
export interface AuthResponse{
success:boolean;
data:{
    token:string;
    user:User;
};
}
// Subjects, Topics, Sub-topics
export interface Subject {
  id: string;
  name: string;
}

export interface Topic {
  id: string;
  name: string;
  subject_id: string;
}
export interface SubTopic {
  id: string;
  name: string;
  topic_id: string;
}
// Test related types
export type TestStatus = 'draft' | 'live' | null;
export type TestType = 'practice' | 'chapter_wise' | 'pyq' | 'mock_test';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export interface Test {
  id: string;
  name: string;
  type: TestType;
  subject: string;
  topics: string[];
  sub_topics?: string[];
  correct_marks: number;
  wrong_marks: number;
  unattempt_marks: number;
  difficulty: DifficultyLevel;
  total_time: number;
  total_marks: number;
  total_questions: number;
  status: TestStatus;
  created_at?: string;
  questions?: string[];
}
export interface CreateTestRequest {
  name: string;
  type: TestType;
  subject: string;
  topics: string[];
  sub_topics: string[];
  correct_marks: number;
  wrong_marks: number;
  unattempt_marks: number;
  difficulty: DifficultyLevel;
  total_time: number;
  total_marks: number;
  total_questions: number;
  status: TestStatus;
}
export interface UpdateTestRequest {
  name?: string;
  questions?: string[];
  total_questions?: number;
  total_marks?: number;
  status?: TestStatus;
}
// Questions
export type CorrectOption = 'option1' | 'option2' | 'option3' | 'option4';
export interface Question {
  id: string;
  type: 'mcq';
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: CorrectOption;
  explanation?: string;
  difficulty?: DifficultyLevel;
  topic?: string;
  sub_topic?: string;
  media_url?: string;
  test_id: string;
}
export interface CreateQuestionRequest {
  type: 'mcq';
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: CorrectOption;
  explanation?: string;
  difficulty?: DifficultyLevel;
  topic?: string;
  sub_topic?: string;
  media_url?: string;
  test_id: string;
}
export interface BulkCreateQuestionsRequest {
  questions: CreateQuestionRequest[];
}
// API Generic Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

import { createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';
import type { Test, Question } from '../../types';

interface TestState {
  currentTest: Test | null;
  questions: Question[];
  allTests: Test[];
  loading: boolean;
  error: string | null;
}

const initialState: TestState = {
  currentTest: null,
  questions: [],
  allTests: [],
  loading: false,
  error: null,
};

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    setCurrentTest: (state, action: PayloadAction<Test>) => {
      state.currentTest = action.payload;
    },
    setAllTests: (state, action: PayloadAction<Test[]>) => {
      state.allTests = action.payload;
    },
    setQuestions: (state, action: PayloadAction<Question[]>) => {
      state.questions = action.payload;
    },
    addQuestion: (state, action: PayloadAction<Question>) => {
      state.questions.push(action.payload);
    },
    updateQuestion: (state, action: PayloadAction<Question>) => {
      const index = state.questions.findIndex((q) => q.id === action.payload.id);
      if (index !== -1) state.questions[index] = action.payload;
    },
    removeQuestion: (state, action: PayloadAction<string>) => {
      state.questions = state.questions.filter((q) => q.id !== action.payload);
    },
    clearTest: (state) => {
      state.currentTest = null;
      state.questions = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setCurrentTest,
  setAllTests,
  setQuestions,
  addQuestion,
  updateQuestion,
  removeQuestion,
  clearTest,
  setLoading,
  setError,
} = testSlice.actions;

export default testSlice.reducer;
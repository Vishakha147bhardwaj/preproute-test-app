import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setCurrentTest } from '../app/slices/testSlice';
import {
  getSubjectsApi,
  getTopicsBySubjectApi,
  getSubTopicsByMultipleTopicsApi,
  createTestApi,
  updateTestApi,
} from '../api';
import type { Subject, Topic, SubTopic, TestType, DifficultyLevel } from '../types';
import Layout from '../components/Layout';
import { ChevronDown, X } from 'lucide-react';

const testSchema = z.object({
  name: z.string().min(1, 'Test name is required'),
  type: z.enum(['chapter_wise', 'pyq', 'mock_test']),
  subject: z.string().min(1, 'Subject is required'),
  topics: z.array(z.string()).min(1, 'At least one topic is required'),
  sub_topics: z.array(z.string()),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  total_time: z.number().min(1, 'Duration is required'),
  correct_marks: z.number(),
  wrong_marks: z.number(),
  unattempt_marks: z.number(),
  total_questions: z.number().min(1, 'Number of questions is required'),
  total_marks: z.number().min(1, 'Total marks is required'),
});

type TestFormData = z.infer<typeof testSchema>;

const TAB_TYPES: { label: string; value: TestType }[] = [
  { label: 'Chapter Wise', value: 'chapter_wise' },
  { label: 'PYQ', value: 'pyq' },
  { label: 'Mock Test', value: 'mock_test' },
];

const CreateTest = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { currentTest } = useAppSelector((state) => state.test);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dropdown open states
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [topicOpen, setTopicOpen] = useState(false);
  const [subTopicOpen, setSubTopicOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      type: 'chapter_wise',
      difficulty: 'easy',
      correct_marks: 5,
      wrong_marks: -1,
      unattempt_marks: 0,
      topics: [],
      sub_topics: [],
    },
  });

  const selectedSubject = watch('subject');
  const selectedTopics = watch('topics');
  const selectedType = watch('type');

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await getSubjectsApi();
        if (res.data.success) setSubjects(res.data.data);
      } catch {
        setError('Failed to load subjects.');
      }
    };
    fetchSubjects();
  }, []);

  // Fetch topics when subject changes
  useEffect(() => {
    if (!selectedSubject) return;
    const fetchTopics = async () => {
      try {
        const res = await getTopicsBySubjectApi(selectedSubject);
        if (res.data.success) {
          setTopics(res.data.data);
          setValue('topics', []);
          setValue('sub_topics', []);
          setSubTopics([]);
        }
      } catch {
        setError('Failed to load topics.');
      }
    };
    fetchTopics();
  }, [selectedSubject, setValue]);

  // Fetch sub-topics when topics change
  useEffect(() => {
    if (!selectedTopics || selectedTopics.length === 0) {
      setSubTopics([]);
      setValue('sub_topics', []);
      return;
    }
    const fetchSubTopics = async () => {
      try {
        const res = await getSubTopicsByMultipleTopicsApi(selectedTopics);
        if (res.data.success) {
          setSubTopics(res.data.data);
          setValue('sub_topics', []);
        }
      } catch {
        setError('Failed to load sub-topics.');
      }
    };
    fetchSubTopics();
  }, [selectedTopics, setValue]);

  // Prefill form if editing
  useEffect(() => {
    if (editId && currentTest) {
      reset({
        name: currentTest.name,
        type: currentTest.type,
        subject: currentTest.subject,
        topics: currentTest.topics || [],
        sub_topics: currentTest.sub_topics || [],
        difficulty: currentTest.difficulty,
        total_time: currentTest.total_time,
        correct_marks: currentTest.correct_marks,
        wrong_marks: currentTest.wrong_marks,
        unattempt_marks: currentTest.unattempt_marks,
        total_questions: currentTest.total_questions,
        total_marks: currentTest.total_marks,
      });
    }
  }, [editId, currentTest, reset]);

  const onSubmit = async (data: TestFormData) => {
    setLoading(true);
    setError(null);
    try {
      let testId = editId;
      if (editId) {
        const res = await updateTestApi(editId, {
          name: data.name,
          total_questions: data.total_questions,
          total_marks: data.total_marks,
        });
        if (res.data.success) {
          dispatch(setCurrentTest(res.data.data));
        }
      } else {
        const res = await createTestApi({
          ...data,
          status: null,
        });
        if (res.data.success) {
          testId = res.data.data.id;
          dispatch(setCurrentTest(res.data.data));
        }
      }
      navigate(`/create-test/${testId}/questions`);
    } catch {
      setError('Failed to save test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Multi-select toggle helper
  const toggleItem = (
    current: string[],
    id: string,
    field: 'topics' | 'sub_topics'
  ) => {
    const updated = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];
    setValue(field, updated);
  };

  const getSubjectName = (id: string) =>
    subjects.find((s) => s.id === id)?.name || 'Choose from Drop-down';

  const getTopicNames = (ids: string[]) =>
    ids.map((id) => topics.find((t) => t.id === id)?.name || id);

  const getSubTopicNames = (ids: string[]) =>
    ids.map((id) => subTopics.find((s) => s.id === id)?.name || id);

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-1">
        <span>Test Creation</span>
        <span>/</span>
        <span>Create Test</span>
        <span>/</span>
        <span className="text-gray-800 font-medium">
          {TAB_TYPES.find((t) => t.value === selectedType)?.label}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {/* Tab switcher */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-8">
          {TAB_TYPES.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setValue('type', tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                selectedType === tab.value
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject
              </label>
              <Controller
                name="subject"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setSubjectOpen(!subjectOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg text-sm text-left transition hover:border-blue-400"
                    >
                      <span className={field.value ? 'text-gray-800' : 'text-gray-400'}>
                        {field.value ? getSubjectName(field.value) : 'Choose from Drop-down'}
                      </span>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>
                    {subjectOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                        {subjects.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-gray-400">No subjects available</p>
                        ) : (
                          subjects.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                field.onChange(s.id);
                                setSubjectOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition ${
                                field.value === s.id ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                              }`}
                            >
                              {s.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              />
              {errors.subject && (
                <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>
              )}
            </div>

            {/* Name of Test */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Name of Test
              </label>
              <input
                {...register('name')}
                placeholder="Enter name of Test"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition placeholder:text-gray-400"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Topic multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Topic
              </label>
              <Controller
                name="topics"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTopicOpen(!topicOpen)}
                      disabled={!selectedSubject}
                      className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg text-sm text-left transition hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className={field.value.length > 0 ? 'text-gray-800' : 'text-gray-400'}>
                        {field.value.length > 0
                          ? `${field.value.length} topic(s) selected`
                          : 'Choose from Drop-down'}
                      </span>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>
                    {/* Selected topics tags */}
                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {getTopicNames(field.value).map((name, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full"
                          >
                            {name}
                            <button
                              type="button"
                              onClick={() => toggleItem(field.value, field.value[i], 'topics')}
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {topicOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                        {topics.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-gray-400">No topics available</p>
                        ) : (
                          topics.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => toggleItem(field.value, t.id, 'topics')}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition flex items-center gap-2 ${
                                field.value.includes(t.id) ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                                field.value.includes(t.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                              }`}>
                                {field.value.includes(t.id) && (
                                  <span className="text-white text-xs">✓</span>
                                )}
                              </span>
                              {t.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              />
              {errors.topics && (
                <p className="text-red-500 text-xs mt-1">{errors.topics.message}</p>
              )}
            </div>

            {/* Sub Topic multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sub Topic
              </label>
              <Controller
                name="sub_topics"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setSubTopicOpen(!subTopicOpen)}
                      disabled={selectedTopics.length === 0}
                      className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg text-sm text-left transition hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className={field.value.length > 0 ? 'text-gray-800' : 'text-gray-400'}>
                        {field.value.length > 0
                          ? `${field.value.length} sub-topic(s) selected`
                          : 'Choose from Drop-down'}
                      </span>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>
                    {/* Selected sub-topics tags */}
                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {getSubTopicNames(field.value).map((name, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full"
                          >
                            {name}
                            <button
                              type="button"
                              onClick={() => toggleItem(field.value, field.value[i], 'sub_topics')}
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {subTopicOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                        {subTopics.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-gray-400">No sub-topics available</p>
                        ) : (
                          subTopics.map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => toggleItem(field.value, st.id, 'sub_topics')}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition flex items-center gap-2 ${
                                field.value.includes(st.id) ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                                field.value.includes(st.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                              }`}>
                                {field.value.includes(st.id) && (
                                  <span className="text-white text-xs">✓</span>
                                )}
                              </span>
                              {st.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Duration (Minutes)
              </label>
              <input
                {...register('total_time')}
                type="number"
                placeholder="Enter the time"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition placeholder:text-gray-400"
              />
              {errors.total_time && (
                <p className="text-red-500 text-xs mt-1">{errors.total_time.message}</p>
              )}
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Test Difficulty Level
              </label>
              <Controller
                name="difficulty"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-6 py-3">
                    {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((d) => (
                      <label key={d} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={field.value === d}
                          onChange={() => field.onChange(d)}
                          className="w-4 h-4 accent-blue-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {d === 'hard' ? 'Difficult' : d.charAt(0).toUpperCase() + d.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Marking Scheme */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Marking Scheme:</h3>
            <div className="flex flex-wrap gap-6 items-end">

              {/* Wrong Answer */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Wrong Answer</label>
                <input
                  {...register('wrong_marks')}
                  type="number"
                  className="w-28 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 text-center"
                />
              </div>

              {/* Unattempted */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Unattempted</label>
                <input
                  {...register('unattempt_marks')}
                  type="number"
                  className="w-28 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 text-center"
                />
              </div>

              {/* Correct Answer */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Correct Answer</label>
                <input
                  {...register('correct_marks')}
                  type="number"
                  className="w-28 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 text-center"
                />
              </div>

              {/* No of Questions */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">No of Questions</label>
                <input
                  {...register('total_questions')}
                  type="number"
                  placeholder="Ex:250"
                  className="w-36 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 placeholder:text-gray-400"
                />
                {errors.total_questions && (
                  <p className="text-red-500 text-xs mt-1">{errors.total_questions.message}</p>
                )}
              </div>

              {/* Total Marks */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Total Marks</label>
                <input
                  {...register('total_marks')}
                  type="number"
                  placeholder="Ex:250"
                  className="w-36 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 placeholder:text-gray-400"
                />
                {errors.total_marks && (
                  <p className="text-red-500 text-xs mt-1">{errors.total_marks.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 text-sm text-blue-500 hover:underline font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-lg transition"
            >
              {loading ? 'Saving...' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateTest;
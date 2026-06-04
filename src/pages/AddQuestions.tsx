import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setCurrentTest, setQuestions } from '../app/slices/testSlice';
import {
  getTestByIdApi,
  bulkCreateQuestionsApi,
  fetchBulkQuestionsApi,
  getTopicsBySubjectApi,
  getSubTopicsByMultipleTopicsApi,
} from '../api';
import type { Question, CorrectOption, DifficultyLevel, Topic, SubTopic } from '../types';
import Layout from '../components/Layout';
import { ChevronDown, Trash2, Plus } from 'lucide-react';

interface QuestionForm {
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: CorrectOption;
  explanation: string;
  difficulty: DifficultyLevel | '';
  topic: string;
  sub_topic: string;
}

const emptyQuestion = (): QuestionForm => ({
  question: '',
  option1: '',
  option2: '',
  option3: '',
  option4: '',
  correct_option: 'option1',
  explanation: '',
  difficulty: '',
  topic: '',
  sub_topic: '',
});

const OPTIONS: { key: CorrectOption; label: string }[] = [
  { key: 'option1', label: 'Option 1' },
  { key: 'option2', label: 'Option 2' },
  { key: 'option3', label: 'Option 3' },
  { key: 'option4', label: 'Option 4' },
];

const AddQuestions = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentTest } = useAppSelector((state) => state.test);

  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);
  const [currentForm, setCurrentForm] = useState<QuestionForm>(emptyQuestion());
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [diffOpen, setDiffOpen] = useState(false);
  const [topicOpen, setTopicOpen] = useState(false);
  const [subTopicOpen, setSubTopicOpen] = useState(false);

  // ── Fetch functions declared BEFORE useEffects ──

  const fetchSubTopics = async (topicId: string) => {
    try {
      const res = await getSubTopicsByMultipleTopicsApi([topicId]);
      if (res.data.success) setSubTopics(res.data.data);
    } catch { /* empty */ }
  };

  const fetchTopics = async () => {
    try {
      const res = await getTopicsBySubjectApi(currentTest!.subject);
      if (res.data.success) setTopics(res.data.data);
    } catch { /* empty */ }
  };

  const fetchTest = async () => {
    setLoading(true);
    try {
      const res = await getTestByIdApi(testId!);
      if (res.data.success) {
        dispatch(setCurrentTest(res.data.data));
        if (res.data.data.questions && res.data.data.questions.length > 0) {
          const qRes = await fetchBulkQuestionsApi(res.data.data.questions);
          if (qRes.data.success) {
            setSavedQuestions(qRes.data.data);
            dispatch(setQuestions(qRes.data.data));
          }
        }
      }
    } catch { /* empty */ } finally {
      setError('Failed to load test.');
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (testId) fetchTest();
  }, [testId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (currentTest?.subject) fetchTopics();
  }, [currentTest]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (currentForm.topic) fetchSubTopics(currentForm.topic);
  }, [currentForm.topic]);

  const updateForm = (key: keyof QuestionForm, value: string) => {
    setCurrentForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = (): boolean => {
    if (!currentForm.question.trim()) {
      setError('Question text is required.');
      return false;
    }
    if (
      !currentForm.option1.trim() ||
      !currentForm.option2.trim() ||
      !currentForm.option3.trim() ||
      !currentForm.option4.trim()
    ) {
      setError('All 4 options are required.');
      return false;
    }
    return true;
  };

  const handleSaveQuestion = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        questions: [
          {
            type: 'mcq' as const,
            question: currentForm.question,
            option1: currentForm.option1,
            option2: currentForm.option2,
            option3: currentForm.option3,
            option4: currentForm.option4,
            correct_option: currentForm.correct_option,
            explanation: currentForm.explanation || undefined,
            difficulty: (currentForm.difficulty as DifficultyLevel) || undefined,
            topic: currentForm.topic || undefined,
            sub_topic: currentForm.sub_topic || undefined,
            test_id: testId!,
          },
        ],
      };
      const res = await bulkCreateQuestionsApi(payload);
      if (res.data.success) {
        const newQ = res.data.data[0];
        const updated = [...savedQuestions, newQ];
        setSavedQuestions(updated);
        dispatch(setQuestions(updated));
        setCurrentForm(emptyQuestion());
        setError(null);
      }
    } catch {
      setError('Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (savedQuestions.length === 0) {
      setError('Please add at least 1 question before continuing.');
      return;
    }
    navigate(`/create-test/${testId}/publish`);
  };

  const totalRequired = currentTest?.total_questions || 0;
  const progress = savedQuestions.length;

  return (
    <Layout>
      {/* Breadcrumb + Publish button */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <span>Test Creation</span>
          <span>/</span>
          <span>Create Test</span>
          <span>/</span>
          <span className="text-gray-800 font-medium capitalize">
            {currentTest?.type?.replace(/_/g, ' ') || 'Chapter Wise'}
          </span>
        </div>
        <button
          onClick={() => navigate(`/create-test/${testId}/publish`)}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition"
        >
          Publish
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
          Loading test...
        </div>
      ) : (
        <div className="flex gap-4">

          {/* ── Left panel — question list ── */}
          <div className="w-52 flex-shrink-0 bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                Question creation
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Total Questions . {totalRequired}
            </p>

            <div className="space-y-2">
              {/* Saved questions */}
              {savedQuestions.map((q, i) => (
                <div
                  key={q.id}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-green-50 border border-green-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    <span className="text-gray-700 text-xs truncate max-w-[80px]">
                      Question {i + 1}
                    </span>
                  </div>
                  <ChevronDown
                    size={12}
                    className="text-gray-400 -rotate-90 flex-shrink-0"
                  />
                </div>
              ))}

              {/* Current question slot */}
              <div className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-blue-400 flex-shrink-0" />
                  <span className="text-gray-600 text-xs">
                    Question {progress + 1}
                  </span>
                </div>
                <ChevronDown
                  size={12}
                  className="text-gray-400 -rotate-90 flex-shrink-0"
                />
              </div>

              {/* Remaining placeholder slots */}
              {Array.from({
                length: Math.max(0, Math.min(3, totalRequired - progress - 1)),
              }).map((_, i) => (
                <div
                  key={i}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" />
                    <span className="text-gray-400 text-xs">
                      Question {progress + i + 2}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Main content ── */}
          <div className="flex-1 bg-white rounded-xl border border-gray-100 p-6 overflow-y-auto">

            {/* Test info card */}
            {currentTest && (
              <div className="border border-gray-100 rounded-xl p-4 mb-6 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 bg-gray-800 text-white text-xs rounded-full mb-3 capitalize">
                      {currentTest.type?.replace(/_/g, ' ') || 'Chapter Wise'}
                    </span>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base font-semibold text-gray-800">
                        {currentTest.name}
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full capitalize">
                        {currentTest.difficulty}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 w-16 text-xs">Subject</span>
                        <span className="text-xs">: {currentTest.subject}</span>
                      </div>
                      {Array.isArray(currentTest.topics) &&
                        currentTest.topics.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 w-16 text-xs">Topic</span>
                            <div className="flex gap-1 flex-wrap">
                              <span className="text-xs">:</span>
                              {currentTest.topics.map((t, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full border border-orange-100"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                    <span>⏱ {currentTest.total_time} Min</span>
                    <span>📋 {currentTest.total_questions} Q's</span>
                    <span>📊 {currentTest.total_marks} Marks</span>
                  </div>
                </div>
              </div>
            )}

            {/* Question header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">
                Question {progress + 1}
                <span className="text-gray-400">/{totalRequired || '?'}</span>
              </h3>
              <button
                onClick={handleSaveQuestion}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-blue-300 text-blue-500 rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
              >
                <Plus size={12} />
                {saving ? 'Saving...' : 'MCQ'}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Question text */}
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <textarea
                value={currentForm.question}
                onChange={(e) => updateForm('question', e.target.value)}
                placeholder="Type here"
                rows={4}
                className="w-full text-sm text-gray-700 outline-none resize-none placeholder:text-gray-400"
              />
            </div>

            {/* Options */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Type the options below
              </p>
              <div className="space-y-3">
                {OPTIONS.map((opt) => (
                  <div key={opt.key} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correct_option"
                      checked={currentForm.correct_option === opt.key}
                      onChange={() => updateForm('correct_option', opt.key)}
                      className="w-4 h-4 accent-blue-500 flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={currentForm[opt.key] as string}
                      onChange={(e) => updateForm(opt.key, e.target.value)}
                      placeholder="Type Option here"
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => updateForm(opt.key, '')}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Solution */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Add Solution
              </p>
              <div className="border border-gray-200 rounded-lg p-4">
                <textarea
                  value={currentForm.explanation}
                  onChange={(e) => updateForm('explanation', e.target.value)}
                  placeholder="Type here"
                  rows={3}
                  className="w-full text-sm text-gray-700 outline-none resize-none placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Question settings */}
            <div className="mb-8">
              <p className="text-sm font-medium text-gray-700 mb-4">
                Question settings
              </p>
              <div className="space-y-3">

                {/* Difficulty */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Level of Difficulty
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setDiffOpen(!diffOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-left hover:border-blue-400 transition"
                    >
                      <span
                        className={
                          currentForm.difficulty
                            ? 'text-gray-800 capitalize'
                            : 'text-gray-400'
                        }
                      >
                        {currentForm.difficulty || 'Select from Drop-down'}
                      </span>
                      <ChevronDown size={15} className="text-gray-400" />
                    </button>
                    {diffOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map(
                          (d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                updateForm('difficulty', d);
                                setDiffOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm capitalize hover:bg-blue-50 text-gray-700 transition"
                            >
                              {d}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Topic */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Topic
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTopicOpen(!topicOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-left hover:border-blue-400 transition"
                    >
                      <span
                        className={
                          currentForm.topic ? 'text-gray-800' : 'text-gray-400'
                        }
                      >
                        {topics.find((t) => t.id === currentForm.topic)?.name ||
                          'Select from Drop-down'}
                      </span>
                      <ChevronDown size={15} className="text-gray-400" />
                    </button>
                    {topicOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                        {topics.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-gray-400">
                            No topics available
                          </p>
                        ) : (
                          topics.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                updateForm('topic', t.id);
                                setTopicOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 text-gray-700 transition"
                            >
                              {t.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-topic */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Sub-topic
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setSubTopicOpen(!subTopicOpen)}
                      disabled={!currentForm.topic}
                      className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-left hover:border-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span
                        className={
                          currentForm.sub_topic
                            ? 'text-gray-800'
                            : 'text-gray-400'
                        }
                      >
                        {subTopics.find((s) => s.id === currentForm.sub_topic)
                          ?.name || 'Select from Drop-down'}
                      </span>
                      <ChevronDown size={15} className="text-gray-400" />
                    </button>
                    {subTopicOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                        {subTopics.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-gray-400">
                            No sub-topics available
                          </p>
                        ) : (
                          subTopics.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                updateForm('sub_topic', s.id);
                                setSubTopicOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 text-gray-700 transition"
                            >
                              {s.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2.5 text-sm bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition"
              >
                Exit Test Creation
              </button>
              <button
                onClick={handleNext}
                className="px-8 py-2.5 text-sm bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AddQuestions;
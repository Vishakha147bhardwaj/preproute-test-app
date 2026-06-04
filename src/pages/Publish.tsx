import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setCurrentTest, clearTest } from '../app/slices/testSlice';
import {
  getTestByIdApi,
  fetchBulkQuestionsApi,
  publishTestApi,
} from '../api';
import type { Question } from '../types';
import Layout from '../components/Layout';
import { ChevronDown, Pencil } from 'lucide-react';

type PublishTab = 'now' | 'schedule';
type LiveUntil =
  | 'always'
  | '1week'
  | '2weeks'
  | '3weeks'
  | '1month'
  | 'custom';

const LIVE_UNTIL_OPTIONS: { value: LiveUntil; label: string }[] = [
  { value: 'always', label: 'Always Available' },
  { value: '1week', label: '1 Week' },
  { value: '2weeks', label: '2 Weeks' },
  { value: '3weeks', label: '3 Weeks' },
  { value: '1month', label: '1 Month' },
  { value: 'custom', label: 'Custom Duration' },
];

const Publish = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentTest } = useAppSelector((state) => state.test);

  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [publishTab, setPublishTab] = useState<PublishTab>('now');
  const [liveUntil, setLiveUntil] = useState<LiveUntil>('custom');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

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
          }
        }
      }
    } catch {
      setError('Failed to load test.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (testId) fetchTest();
  }, [testId]);

  const handleConfirm = async () => {
    if (!testId) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await publishTestApi(testId);
      if (res.data.success) {
        setSuccess(true);
        dispatch(clearTest());
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch {
      setError('Failed to publish test. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const totalRequired = currentTest?.total_questions || 0;
  const progress = savedQuestions.length;

  if (success) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <span className="text-green-500 text-3xl">✓</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Test Published Successfully!
          </h2>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard...
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4 flex items-center gap-1">
        <span>Test Creation</span>
        <span>/</span>
        <span>Create Test</span>
        <span>/</span>
        <span className="text-gray-800 font-medium capitalize">
          {currentTest?.type?.replace(/_/g, ' ') || 'Chapter Wise'}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
          Loading...
        </div>
      ) : (
        <div className="flex gap-4">

          {/* ── Left panel ── */}
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
              {savedQuestions.map((_, i) => (
                <div
                  key={i}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-green-50 border border-green-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    <span className="text-gray-700 text-xs">
                      Question {i + 1}
                    </span>
                  </div>
                  <ChevronDown
                    size={12}
                    className="text-gray-400 -rotate-90 flex-shrink-0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Main content ── */}
          <div className="flex-1 bg-white rounded-xl border border-gray-100 p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  Test creation
                </h2>
              </div>
            </div>

            {/* Test created badge */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-medium text-gray-700">
                Test created
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                <span>✓</span>
                All {progress} Questions done
              </span>
            </div>

            {/* Test info card */}
            {currentTest && (
              <div className="border border-gray-100 rounded-xl p-5 mb-6 bg-gray-50 relative">
                <button
                  onClick={() => navigate(`/create-test?edit=${testId}`)}
                  className="absolute top-4 right-4 p-1.5 text-blue-400 hover:text-blue-600 transition"
                >
                  <Pencil size={15} />
                </button>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 bg-gray-800 text-white text-xs rounded-full mb-3 capitalize">
                      {currentTest.type?.replace(/_/g, ' ') || 'Chapter Wise'}
                    </span>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base font-semibold text-gray-800">
                        {currentTest.name}
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full capitalize">
                        {currentTest.difficulty}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 w-16 text-xs">Subject</span>
                        <span className="text-xs text-gray-700">
                          : {currentTest.subject}
                        </span>
                      </div>
                      {Array.isArray(currentTest.topics) &&
                        currentTest.topics.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 w-16 text-xs">Topic</span>
                            <div className="flex gap-1 flex-wrap items-center">
                              <span className="text-xs text-gray-700">:</span>
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
                      {Array.isArray(currentTest.sub_topics) &&
                        currentTest.sub_topics.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 w-16 text-xs">Sub Topic</span>
                            <div className="flex gap-1 flex-wrap items-center">
                              <span className="text-xs text-gray-700">:</span>
                              {currentTest.sub_topics.map((st, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-yellow-50 text-yellow-600 text-xs rounded-full border border-yellow-100"
                                >
                                  {st}
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Publish tabs */}
            <div className="flex gap-1 border-b border-gray-100 mb-6">
              <button
                onClick={() => setPublishTab('now')}
                className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                  publishTab === 'now'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Publish Now
              </button>
              <button
                onClick={() => setPublishTab('schedule')}
                className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                  publishTab === 'schedule'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Schedule Publish
              </button>
            </div>

            {/* Schedule date/time — only for schedule tab */}
            {publishTab === 'schedule' && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Select Date and Time
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition text-gray-600"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition text-gray-600 appearance-none"
                    >
                      <option value="">Select Time</option>
                      {Array.from({ length: 24 }).map((_, h) =>
                        ['00', '30'].map((m) => (
                          <option key={`${h}:${m}`} value={`${h}:${m}`}>
                            {String(h).padStart(2, '0')}:{m}
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Live Until */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Live Until
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Choose how long this test should remain available on the platform.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {LIVE_UNTIL_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="live_until"
                      checked={liveUntil === opt.value}
                      onChange={() => setLiveUntil(opt.value)}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>

              {/* Custom duration date/time pickers */}
              {liveUntil === 'custom' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="relative">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="Select End Date"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition text-gray-600"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition text-gray-600 appearance-none"
                    >
                      <option value="">Select End Time</option>
                      {Array.from({ length: 24 }).map((_, h) =>
                        ['00', '30'].map((m) => (
                          <option key={`${h}:${m}`} value={`${h}:${m}`}>
                            {String(h).padStart(2, '0')}:{m}
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2.5 text-sm text-blue-500 hover:underline font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={publishing}
                className="px-8 py-2.5 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-lg transition"
              >
                {publishing ? 'Publishing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Publish;
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setAllTests, setCurrentTest } from '../app/slices/testSlice';
import { getAllTestsApi, updateTestApi } from '../api';
import type { Test } from '../types';
import Layout from '../components/Layout';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

// ── Outside component to avoid re-render issues ──
const SortIcon = ({
  field,
  sortField,
  sortOrder,
}: {
  field: 'name' | 'created_at';
  sortField: 'name' | 'created_at';
  sortOrder: 'asc' | 'desc';
}) => (
  <span className="inline-flex flex-col ml-1">
    <ChevronUp
      size={10}
      className={
        sortField === field && sortOrder === 'asc'
          ? 'text-blue-500'
          : 'text-gray-300'
      }
    />
    <ChevronDown
      size={10}
      className={
        sortField === field && sortOrder === 'desc'
          ? 'text-blue-500'
          : 'text-gray-300'
      }
    />
  </span>
);

const statusStyles: Record<string, string> = {
  live: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  default: 'bg-gray-100 text-gray-600',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { allTests } = useAppSelector((state) => state.test);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'live'>('all');
  const [sortField, setSortField] = useState<'name' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);



  const fetchTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllTestsApi();
      if (res.data.success) {
        dispatch(setAllTests(res.data.data));
      }
    } catch {
      setError('Failed to load tests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTests();
  }, [fetchTests]);
  const handleEdit = (test: Test) => {
    dispatch(setCurrentTest(test));
    navigate(`/create-test?edit=${test.id}`);
  };

  const handleView = (test: Test) => {
    dispatch(setCurrentTest(test));
    navigate(`/create-test/${test.id}/publish`);
  };

  const handleDelete = async (id: string) => {
    try {
      await updateTestApi(id, { status: null });
      fetchTests();
    } catch {
      setError('Failed to delete test.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleSort = (field: 'name' | 'created_at') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filtered = allTests
    .filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.subject?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        const dateA = new Date(a.created_at || '').getTime();
        const dateB = new Date(b.created_at || '').getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">All Tests</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage and track all your tests
            </p>
          </div>
          <button
            onClick={() => navigate('/create-test')}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
          >
            <Plus size={16} />
            Create New Test
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by name or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-2">
            {(['all', 'draft', 'live'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-sm rounded-lg font-medium capitalize transition ${
                  statusFilter === s
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
              Loading tests...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-sm">No tests found</p>
              <button
                onClick={() => navigate('/create-test')}
                className="mt-3 text-blue-500 text-sm hover:underline"
              >
                Create your first test
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center hover:text-gray-700"
                    >
                      Test Name
                      <SortIcon
                        field="name"
                        sortField={sortField}
                        sortOrder={sortOrder}
                      />
                    </button>
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Subject
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Topics
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <button
                      onClick={() => handleSort('created_at')}
                      className="flex items-center hover:text-gray-700"
                    >
                      Created
                      <SortIcon
                        field="created_at"
                        sortField={sortField}
                        sortOrder={sortOrder}
                      />
                    </button>
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {test.name}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {test.subject || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(test.topics) && test.topics.length > 0 ? (
                          test.topics.slice(0, 2).map((topic, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full border border-orange-100"
                            >
                              {topic}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                        {Array.isArray(test.topics) &&
                          test.topics.length > 2 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                              +{test.topics.length - 2}
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          statusStyles[test.status || 'default'] ||
                          statusStyles.default
                        }`}
                      >
                        {test.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {test.created_at
                        ? new Date(test.created_at).toLocaleDateString(
                            'en-IN',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }
                          )
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(test)}
                          title="View"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleEdit(test)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 transition"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(test.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Total count */}
        {!loading && filtered.length > 0 && (
          <p className="text-xs text-gray-400 mt-3">
            Showing {filtered.length} of {allTests.length} tests
          </p>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Delete Test?
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              This action cannot be undone. Are you sure you want to delete
              this test?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
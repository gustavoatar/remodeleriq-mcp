import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { BarChart3, Users, Upload, LogIn, TrendingUp, Clock, Crown, AlertCircle, Download, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface AdminStats {
  summary: {
    totalUsers: number;
    premiumUsers: number;
    totalUploads: number;
    totalLogins: number;
  };
  uploadsByDay: { date: string; count: number }[];
  loginsByDay: { date: string; count: number }[];
  recentActivity: {
    id: number;
    user_id: number | null;
    action_type: string;
    metadata: string | null;
    created_at: string;
    email: string | null;
    name: string | null;
  }[];
  topUsers: {
    email: string;
    name: string | null;
    is_premium: number;
    subscription_tier: string | null;
    upload_count: number;
  }[];
  newUsers: {
    id: number;
    email: string;
    name: string | null;
    is_premium: number;
    subscription_tier: string | null;
    created_at: string;
  }[];
}

interface ErrorStats {
  recentErrors: {
    id: number;
    error_type: string;
    error_message: string;
    error_stack: string | null;
    url: string | null;
    user_agent: string | null;
    user_id: string | null;
    metadata: string | null;
    created_at: string;
  }[];
  errorCounts: { error_type: string; count: number }[];
  errorsByDay: { date: string; count: number }[];
}

export default function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const handleExportUsers = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/admin/export/users');
      if (!response.ok) {
        throw new Error('Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `remodeleriq-users-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export users');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.status === 401 || response.status === 403) {
          setError('Access denied. Admin privileges required.');
          setLoading(false);
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch error logs when errors section is expanded
  useEffect(() => {
    if (!showErrors || errorStats) return;
    
    const fetchErrors = async () => {
      try {
        const response = await fetch('/api/admin/errors');
        if (response.ok) {
          const data = await response.json();
          setErrorStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch error logs:', err);
      }
    };
    
    fetchErrors();
  }, [showErrors, errorStats]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const parseMetadata = (metadata: string | null) => {
    if (!metadata) return null;
    try {
      return JSON.parse(metadata);
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportUsers}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export Users'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to App
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-500 text-sm">Total Users</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.summary.totalUsers}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-gray-500 text-sm">Premium Users</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.summary.premiumUsers}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Upload className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-gray-500 text-sm">Total Uploads</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.summary.totalUploads}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-xl">
                <LogIn className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-gray-500 text-sm">Total Logins</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.summary.totalLogins}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Uploads by Day */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Uploads (Last 30 Days)</h2>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.uploadsByDay.length === 0 ? (
                <p className="text-gray-500 text-sm">No uploads in the last 30 days</p>
              ) : (
                stats.uploadsByDay.map((day) => (
                  <div key={day.date} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-600">{formatDate(day.date)}</span>
                    <span className="font-semibold text-emerald-600">{day.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Logins by Day */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <LogIn className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Logins (Last 30 Days)</h2>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.loginsByDay.length === 0 ? (
                <p className="text-gray-500 text-sm">No logins in the last 30 days</p>
              ) : (
                stats.loginsByDay.map((day) => (
                  <div key={day.date} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-600">{formatDate(day.date)}</span>
                    <span className="font-semibold text-purple-600">{day.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Top Users */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Top Users by Uploads</h2>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {stats.topUsers.map((user, idx) => (
                <div key={user.email} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm w-6">#{idx + 1}</span>
                    <div>
                      <p className="text-gray-900 text-sm truncate max-w-[180px]">{user.email}</p>
                      {(user.is_premium || user.subscription_tier) && (
                        <span className="text-xs text-amber-600 font-medium">
                          {user.subscription_tier || 'Premium'}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold text-emerald-600">{user.upload_count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* New Users */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">New Users (Last 30 Days)</h2>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {stats.newUsers.length === 0 ? (
                <p className="text-gray-500 text-sm">No new users in the last 30 days</p>
              ) : (
                stats.newUsers.map((user) => (
                  <div key={user.id} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <div>
                      <p className="text-gray-900 text-sm truncate max-w-[200px]">{user.email}</p>
                      {(user.is_premium || user.subscription_tier) && (
                        <span className="text-xs text-amber-600 font-medium">
                          {user.subscription_tier || 'Premium'}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-500 text-xs">{formatDate(user.created_at)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Time</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Action</th>
                  <th className="text-left py-2 text-gray-500 font-medium">User</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivity.map((activity) => {
                  const metadata = parseMetadata(activity.metadata);
                  return (
                    <tr key={activity.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 text-gray-600">{formatDateTime(activity.created_at)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          activity.action_type === 'upload' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : activity.action_type === 'login'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {activity.action_type}
                        </span>
                      </td>
                      <td className="py-3 text-gray-900">
                        {activity.email || metadata?.email || 'Anonymous'}
                      </td>
                      <td className="py-3 text-gray-500 text-xs max-w-[200px] truncate">
                        {metadata?.fileName || metadata?.method || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Error Logs Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-2xl"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">Error Logs (Last 7 Days)</h2>
              {errorStats && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  {errorStats.recentErrors.length} errors
                </span>
              )}
            </div>
            {showErrors ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {showErrors && (
            <div className="px-6 pb-6 border-t border-gray-100">
              {!errorStats ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
                </div>
              ) : errorStats.recentErrors.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No errors in the last 7 days 🎉
                </div>
              ) : (
                <>
                  {/* Error Summary */}
                  <div className="grid md:grid-cols-2 gap-4 py-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Errors by Type</h3>
                      <div className="space-y-1">
                        {errorStats.errorCounts.map((ec) => (
                          <div key={ec.error_type} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{ec.error_type}</span>
                            <span className="font-medium text-red-600">{ec.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Errors by Day</h3>
                      <div className="space-y-1">
                        {errorStats.errorsByDay.map((ed) => (
                          <div key={ed.date} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{formatDate(ed.date)}</span>
                            <span className="font-medium text-red-600">{ed.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Errors Table */}
                  <h3 className="text-sm font-medium text-gray-700 mb-2 mt-4">Recent Errors</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 text-gray-500 font-medium">Time</th>
                          <th className="text-left py-2 text-gray-500 font-medium">Type</th>
                          <th className="text-left py-2 text-gray-500 font-medium">Message</th>
                          <th className="text-left py-2 text-gray-500 font-medium">URL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {errorStats.recentErrors.slice(0, 50).map((err) => (
                          <tr key={err.id} className="border-b border-gray-50 hover:bg-red-50">
                            <td className="py-3 text-gray-600 whitespace-nowrap">{formatDateTime(err.created_at)}</td>
                            <td className="py-3">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                {err.error_type}
                              </span>
                            </td>
                            <td className="py-3 text-gray-900 max-w-[300px] truncate" title={err.error_message}>
                              {err.error_message}
                            </td>
                            <td className="py-3 text-gray-500 text-xs max-w-[150px] truncate" title={err.url || ''}>
                              {err.url || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, MessageCircle, Send, Calendar, User, Tag, AlertCircle, Clock } from 'lucide-react';
import { supabase, Request, RequestComment, PRIORITIES, STATUSES, CATEGORIES } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface RequestDetailsProps {
  request: Request;
  onClose: () => void;
  onUpdate: () => void;
  isHandler: boolean;
}

export default function RequestDetails({ request, onClose, onUpdate, isHandler }: RequestDetailsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<RequestComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedRequest, setEditedRequest] = useState(request);

  useEffect(() => {
    loadComments();

    const channel = supabase
      .channel(`comments_${request.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'request_comments',
          filter: `request_id=eq.${request.id}`
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [request.id]);

  async function loadComments() {
    const { data, error } = await supabase
      .from('request_comments')
      .select('*')
      .eq('request_id', request.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('request_comments').insert({
        request_id: request.id,
        user_id: user!.id,
        user_name: user!.user_metadata.name || user!.email,
        comment: newComment
      });

      if (error) throw error;

      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRequest() {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('requests')
        .update({
          status: editedRequest.status,
          priority: editedRequest.priority,
          category: editedRequest.category,
          assigned_unit: editedRequest.assigned_unit,
          assigned_handler: editedRequest.assigned_handler,
          deadline: editedRequest.deadline
        })
        .eq('id', request.id);

      if (error) throw error;

      setEditMode(false);
      onUpdate();
    } catch (err) {
      console.error('Error updating request:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getPriorityStyle(priority: string) {
    return PRIORITIES.find((p) => p.value === priority)?.color || '';
  }

  function getStatusStyle(status: string) {
    return STATUSES.find((s) => s.value === status)?.color || '';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{request.title}</h3>
            <div className="flex flex-wrap gap-2 items-center">
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getPriorityStyle(request.priority)}`}
              >
                {request.priority}
              </span>
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusStyle(request.status)}`}
              >
                {request.status}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                <Tag className="w-4 h-4" />
                {request.category}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span className="font-medium">Submitted by:</span>
              <span>{request.submitter_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Date:</span>
              <span>{formatDate(request.created_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Assigned Unit:</span>
              <span>{request.assigned_unit || 'Not assigned'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span className="font-medium">Handler:</span>
              <span>{request.assigned_handler || 'Not assigned'}</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
            <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
              {request.description}
            </p>
          </div>

          {request.ai_response && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                AI-Generated Response
              </h4>
              <p className="text-blue-800 text-sm">{request.ai_response}</p>
            </div>
          )}

          {isHandler && (
            <div className="border-t border-gray-200 pt-6">
              {editMode ? (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Update Request</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={editedRequest.status}
                        onChange={(e) =>
                          setEditedRequest({ ...editedRequest, status: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.value}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={editedRequest.priority}
                        onChange={(e) =>
                          setEditedRequest({ ...editedRequest, priority: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.value}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={editedRequest.category}
                        onChange={(e) =>
                          setEditedRequest({ ...editedRequest, category: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assigned Unit
                      </label>
                      <input
                        type="text"
                        value={editedRequest.assigned_unit}
                        onChange={(e) =>
                          setEditedRequest({ ...editedRequest, assigned_unit: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assigned Handler
                      </label>
                      <input
                        type="text"
                        value={editedRequest.assigned_handler}
                        onChange={(e) =>
                          setEditedRequest({ ...editedRequest, assigned_handler: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deadline (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={editedRequest.deadline?.slice(0, 16) || ''}
                        onChange={(e) =>
                          setEditedRequest({
                            ...editedRequest,
                            deadline: e.target.value ? new Date(e.target.value).toISOString() : null
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditMode(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateRequest}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 font-medium"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Edit Request
                </button>
              )}
            </div>
          )}

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Comments ({comments.length})
            </h4>

            <div className="space-y-4 mb-4">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{comment.user_name}</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          </div>

          {request.updated_at !== request.created_at && (
            <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-gray-200 pt-4">
              <Clock className="w-3 h-3" />
              Last updated: {formatDate(request.updated_at)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

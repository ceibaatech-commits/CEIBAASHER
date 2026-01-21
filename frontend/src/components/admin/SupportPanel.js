import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, Mail, Phone, User, Clock, CheckCircle, 
  AlertCircle, Loader2, Trash2, Eye, X, Send, RefreshCw,
  Inbox, MessageCircle, CheckCheck, XCircle
} from 'lucide-react';

const BACKEND_URL = window.location.origin;

const SupportPanel = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const url = filterStatus === 'all' 
        ? `${BACKEND_URL}/api/admin/support-tickets`
        : `${BACKEND_URL}/api/admin/support-tickets?status=${filterStatus}`;
      
      const response = await axios.get(url);
      if (response.data.success) {
        setTickets(response.data.tickets);
        setStatusCounts(response.data.status_counts);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filterStatus]);

  const updateTicketStatus = async (ticketId, newStatus) => {
    setUpdating(true);
    try {
      await axios.put(`${BACKEND_URL}/api/admin/support-tickets/${ticketId}`, {
        status: newStatus
      });
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    } finally {
      setUpdating(false);
    }
  };

  const saveAdminNotes = async (ticketId) => {
    setUpdating(true);
    try {
      await axios.put(`${BACKEND_URL}/api/admin/support-tickets/${ticketId}`, {
        admin_notes: adminNotes
      });
      fetchTickets();
      setSelectedTicket(prev => ({ ...prev, admin_notes: adminNotes }));
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setUpdating(false);
    }
  };

  const deleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/support-tickets/${ticketId}`);
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return <Inbox className="w-4 h-4" />;
      case 'in_progress': return <MessageCircle className="w-4 h-4" />;
      case 'resolved': return <CheckCheck className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 text-sm mt-1">Manage contact form submissions</p>
        </div>
        <button
          onClick={fetchTickets}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div 
          onClick={() => setFilterStatus('new')}
          className={`p-4 rounded-xl border-2 cursor-pointer transition ${
            filterStatus === 'new' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Inbox className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-gray-600 text-sm">New</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{statusCounts.new || 0}</p>
        </div>
        <div 
          onClick={() => setFilterStatus('in_progress')}
          className={`p-4 rounded-xl border-2 cursor-pointer transition ${
            filterStatus === 'in_progress' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-yellow-600" />
            </div>
            <span className="text-gray-600 text-sm">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{statusCounts.in_progress || 0}</p>
        </div>
        <div 
          onClick={() => setFilterStatus('resolved')}
          className={`p-4 rounded-xl border-2 cursor-pointer transition ${
            filterStatus === 'resolved' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCheck className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-gray-600 text-sm">Resolved</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{statusCounts.resolved || 0}</p>
        </div>
        <div 
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-xl border-2 cursor-pointer transition ${
            filterStatus === 'all' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-gray-600 text-sm">All Tickets</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(statusCounts.new || 0) + (statusCounts.in_progress || 0) + (statusCounts.resolved || 0) + (statusCounts.closed || 0)}
          </p>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No support tickets found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">User</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Message</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{ticket.name}</p>
                        <p className="text-sm text-gray-500">{ticket.email}</p>
                        {ticket.phone && (
                          <p className="text-sm text-gray-500">{ticket.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 text-sm line-clamp-2 max-w-xs">
                        {ticket.message}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">{formatDate(ticket.created_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setAdminNotes(ticket.admin_notes || '');
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTicket(ticket.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Support Ticket</h2>
                <p className="text-sm text-gray-500">{formatDate(selectedTicket.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{selectedTicket.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <a href={`mailto:${selectedTicket.email}`} className="font-medium text-blue-600 hover:underline">
                      {selectedTicket.email}
                    </a>
                  </div>
                </div>
                {selectedTicket.phone && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <a href={`tel:${selectedTicket.phone}`} className="font-medium text-blue-600 hover:underline">
                        {selectedTicket.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-800 whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                <div className="flex flex-wrap gap-2">
                  {['new', 'in_progress', 'resolved', 'closed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateTicketStatus(selectedTicket.id, status)}
                      disabled={updating}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        selectedTicket.status === status
                          ? getStatusColor(status)
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this ticket..."
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
                <button
                  onClick={() => saveAdminNotes(selectedTicket.id)}
                  disabled={updating}
                  className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition flex items-center gap-2"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPanel;

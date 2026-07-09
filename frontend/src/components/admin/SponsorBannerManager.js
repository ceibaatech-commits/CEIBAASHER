import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Plus, Trash2, Edit2, X, Save, Eye, EyeOff,
  Image, Link, ArrowUp, ArrowDown, Loader2, ExternalLink
} from 'lucide-react';

const BACKEND_URL = window.location.origin;

const emptyForm = { title: '', image_url: '', link_url: '', active: true, order: 0 };

const SponsorBannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/admin/banners`, { withCredentials: true });
      setBanners(res.data.banners || []);
    } catch (err) {
      toast.error('Failed to load sponsor banners');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, order: banners.length });
    setShowForm(true);
  };

  const openEdit = (banner) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title || '',
      image_url: banner.image_url || '',
      link_url: banner.link_url || '',
      active: banner.active ?? true,
      order: banner.order ?? 0,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.image_url.trim()) {
      toast.error('Image URL is required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${BACKEND_URL}/api/admin/banners/${editingId}`, form, { withCredentials: true });
        toast.success('Banner updated');
      } else {
        await axios.post(`${BACKEND_URL}/api/admin/banners`, form, { withCredentials: true });
        toast.success('Banner created');
      }
      closeForm();
      fetchBanners();
    } catch (err) {
      toast.error(editingId ? 'Failed to update banner' : 'Failed to create banner');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (banner) => {
    setTogglingId(banner.id);
    try {
      const res = await axios.patch(
        `${BACKEND_URL}/api/admin/banners/${banner.id}/toggle`,
        {},
        { withCredentials: true }
      );
      setBanners(prev =>
        prev.map(b => b.id === banner.id ? { ...b, active: res.data.active } : b)
      );
      toast.success(res.data.active ? 'Banner activated' : 'Banner deactivated');
    } catch {
      toast.error('Failed to toggle banner');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (bannerId) => {
    if (!window.confirm('Delete this sponsor banner? This cannot be undone.')) return;
    setDeletingId(bannerId);
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/banners/${bannerId}`, { withCredentials: true });
      setBanners(prev => prev.filter(b => b.id !== bannerId));
      toast.success('Banner deleted');
    } catch {
      toast.error('Failed to delete banner');
    } finally {
      setDeletingId(null);
    }
  };

  const moveOrder = async (banner, direction) => {
    const newOrder = banner.order + direction;
    try {
      await axios.put(
        `${BACKEND_URL}/api/admin/banners/${banner.id}`,
        { ...banner, order: newOrder },
        { withCredentials: true }
      );
      fetchBanners();
    } catch {
      toast.error('Failed to reorder banner');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sponsor Banners</h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage the banner carousel shown on the home page ({banners.filter(b => b.active).length} active)
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Banner
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-lg">
              {editingId ? 'Edit Banner' : 'Add New Banner'}
            </h3>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><Image className="w-4 h-4" /> Banner Image URL <span className="text-red-500">*</span></span>
              </label>
              <input
                type="url"
                value={form.image_url}
                onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://example.com/banner.jpg (1200×400 recommended)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Preview */}
            {form.image_url && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                <img
                  src={form.image_url}
                  alt="Banner preview"
                  className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Summer Sale — 30% Off"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Link URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><Link className="w-4 h-4" /> Click-through URL (optional)</span>
              </label>
              <input
                type="url"
                value={form.link_url}
                onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                placeholder="https://... (leave blank if not clickable)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                value={form.order}
                onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Active */}
            <div className="flex items-center gap-3 self-end pb-1">
              <label className="text-sm font-medium text-gray-700">Active on home page</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.active ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className={`text-sm font-medium ${form.active ? 'text-blue-600' : 'text-gray-400'}`}>
                {form.active ? 'Yes' : 'No'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
            <button onClick={closeForm} className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.image_url.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Save Changes' : 'Create Banner'}
            </button>
          </div>
        </div>
      )}

      {/* Banners List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <Image className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No sponsor banners yet</p>
          <p className="text-gray-400 text-sm mt-1">Add a banner to display it on the home page carousel.</p>
          <button
            onClick={openAdd}
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add First Banner
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, idx) => (
            <div
              key={banner.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${banner.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
            >
              <div className="flex items-center gap-4 p-4">
                {/* Thumbnail */}
                <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={banner.image_url}
                    alt={banner.title || 'Banner'}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="80"><rect width="128" height="80" fill="%23e5e7eb"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12">No image</text></svg>'; }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {banner.title || <span className="text-gray-400 font-normal italic">Untitled banner</span>}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${banner.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {banner.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{banner.image_url}</p>
                  {banner.link_url && (
                    <a
                      href={banner.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <ExternalLink className="w-3 h-3" /> {banner.link_url}
                    </a>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Order: {banner.order}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Reorder */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveOrder(banner, -1)}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveOrder(banner, 1)}
                      disabled={idx === banners.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Toggle active */}
                  <button
                    onClick={() => handleToggle(banner)}
                    disabled={togglingId === banner.id}
                    className={`p-2 rounded-lg transition ${banner.active ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    title={banner.active ? 'Deactivate' : 'Activate'}
                  >
                    {togglingId === banner.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : banner.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />
                    }
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEdit(banner)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(banner.id)}
                    disabled={deletingId === banner.id}
                    className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                    title="Delete"
                  >
                    {deletingId === banner.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1">💡 Tips</p>
        <ul className="list-disc list-inside space-y-1 text-blue-600">
          <li>Recommended image size: <strong>1200 × 400 px</strong> (3:1 ratio)</li>
          <li>Only <strong>active</strong> banners appear on the home page carousel</li>
          <li>Use the arrows to control display order; lower order = shown first</li>
          <li>Click-through URL is optional — leave blank for a non-clickable banner</li>
        </ul>
      </div>
    </div>
  );
};

export default SponsorBannerManager;

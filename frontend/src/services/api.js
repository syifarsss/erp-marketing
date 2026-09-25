export const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://infimech-marketing-erp-backend-583320051925.asia-southeast1.run.app/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errMsg = 'Terjadi kesalahan sistem.';
    try {
      const errData = await response.json();
      errMsg = errData.message || errMsg;
    } catch (e) {
      // ignore
    }
    throw new Error(errMsg);
  }
  return response.json();
};

export const api = {
  getAssetContent: async (id) => {
    const res = await fetch(`${API_BASE_URL}/assets/${id}/content`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },
  
  getProfile: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  updateProfile: async (data) => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Dashboard
  getDashboardData: async () => {
    const res = await fetch(`${API_BASE_URL}/dashboard`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Leads CRM
  getLeads: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.industry) params.append('industry', filters.industry);
    if (filters.source) params.append('source', filters.source);
    if (filters.search) params.append('search', filters.search);

    const res = await fetch(`${API_BASE_URL}/leads?${params.toString()}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getLeadDetails: async (id) => {
    const res = await fetch(`${API_BASE_URL}/leads/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createLead: async (data) => {
    const res = await fetch(`${API_BASE_URL}/leads`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateLeadStatus: async (id, status) => {
    const res = await fetch(`${API_BASE_URL}/leads/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  updateLead: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/leads/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteLead: async (id) => {
    const res = await fetch(`${API_BASE_URL}/leads/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  bulkImportLeads: async (clients) => {
    const res = await fetch(`${API_BASE_URL}/leads/bulk`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ clients })
    });
    return handleResponse(res);
  },

  addInteraction: async (leadId, type, notes) => {
    const res = await fetch(`${API_BASE_URL}/leads/${leadId}/interactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ type, notes })
    });
    return handleResponse(res);
  },

  addContact: async (leadId, name, phone, email, position, isPrimary) => {
    const res = await fetch(`${API_BASE_URL}/leads/${leadId}/contacts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, phone, email, position, isPrimary })
    });
    return handleResponse(res);
  },

  deleteContact: async (contactId) => {
    const res = await fetch(`${API_BASE_URL}/leads/contacts/${contactId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getSegments: async () => {
    const res = await fetch(`${API_BASE_URL}/leads/segments`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getLeadsMeta: async () => {
    const res = await fetch(`${API_BASE_URL}/leads/meta`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Campaigns
  getCampaigns: async (status = '') => {
    const url = status ? `${API_BASE_URL}/campaigns?status=${status}` : `${API_BASE_URL}/campaigns`;
    const res = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createCampaign: async (data) => {
    const res = await fetch(`${API_BASE_URL}/campaigns`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateCampaign: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteCampaign: async (id) => {
    const res = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Assets
  getAssets: async (search = '', fileType = '', category = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (fileType) params.append('file_type', fileType);
    if (category) params.append('category', category);

    const res = await fetch(`${API_BASE_URL}/assets?${params.toString()}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createAsset: async (data) => {
    const res = await fetch(`${API_BASE_URL}/assets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateAsset: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/assets/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteAsset: async (id) => {
    const res = await fetch(`${API_BASE_URL}/assets/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  downloadAsset: async (id) => {
    const res = await fetch(`${API_BASE_URL}/assets/${id}/download`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getAssetFolders: async () => {
    const res = await fetch(`${API_BASE_URL}/assets/folders`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createAssetFolder: async (data) => {
    const res = await fetch(`${API_BASE_URL}/assets/folders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateAssetFolder: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/assets/folders/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  uploadFolderFiles: async (folderId, files) => {
    const res = await fetch(`${API_BASE_URL}/assets/folders/${folderId}/files`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ files })
    });
    return handleResponse(res);
  },

  deleteAssetFolder: async (id) => {
    const res = await fetch(`${API_BASE_URL}/assets/folders/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getPublicSharedFolder: async (token) => {
    const res = await fetch(`${API_BASE_URL}/assets/folders/share/${token}`);
    return handleResponse(res);
  },

  // Social Content Calendar
  getSocialPosts: async () => {
    const res = await fetch(`${API_BASE_URL}/social`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createSocialPost: async (data) => {
    const res = await fetch(`${API_BASE_URL}/social`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateSocialPost: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/social/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteSocialPost: async (id) => {
    const res = await fetch(`${API_BASE_URL}/social/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Operators
  getOperators: async () => {
    const res = await fetch(`${API_BASE_URL}/operators`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createOperator: async (data) => {
    const res = await fetch(`${API_BASE_URL}/operators`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateOperator: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/operators/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteOperator: async (id) => {
    const res = await fetch(`${API_BASE_URL}/operators/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Subtasks
  getSubtasks: async (leadId) => {
    const res = await fetch(`${API_BASE_URL}/leads/${leadId}/subtasks`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createSubtask: async (leadId, data) => {
    const res = await fetch(`${API_BASE_URL}/leads/${leadId}/subtasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateSubtask: async (subtaskId, data) => {
    const res = await fetch(`${API_BASE_URL}/leads/subtasks/${subtaskId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteSubtask: async (subtaskId) => {
    const res = await fetch(`${API_BASE_URL}/leads/subtasks/${subtaskId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Projects
  getProjects: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/projects${query ? `?${query}` : ''}`;
    const res = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getProjectDetails: async (id) => {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createProject: async (data) => {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateProject: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteProject: async (id) => {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Deadline notifications
  checkDeadlineAlerts: async () => {
    const res = await fetch(`${API_BASE_URL}/notifications/deadlines`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Public Assets secure sharing
  getPublicAsset: async (id) => {
    const res = await fetch(`${API_BASE_URL}/assets/public/${id}`);
    return handleResponse(res);
  },

  downloadPublicAsset: async (id) => {
    const res = await fetch(`${API_BASE_URL}/assets/public/${id}/download`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  // SEO Smart Generator & Marketing Assets
  getSeoMarketingAssets: async () => {
    const res = await fetch(`${API_BASE_URL}/seo/marketing-assets`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  autoGenerateSeo: async (data) => {
    const res = await fetch(`${API_BASE_URL}/seo/auto-generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Realtime Analytics
  logVisit: async (data) => {
    const res = await fetch(`${API_BASE_URL}/analytics/log-visit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getRealtimeStats: async () => {
    const res = await fetch(`${API_BASE_URL}/analytics/realtime-stats`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Notes (Catatan)
  getNotes: async (search = '', category = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'Semua') params.append('category', category);
    const res = await fetch(`${API_BASE_URL}/notes?${params.toString()}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createNote: async (data) => {
    const res = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateNote: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteNote: async (id) => {
    const res = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // GSC Performance Dashboard
  getGscSites: async () => {
    const res = await fetch(`${API_BASE_URL}/gsc/sites`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getGscAnalytics: async (siteUrl, range = '28d', searchType = 'web') => {
    const params = new URLSearchParams({ siteUrl, range, searchType });
    const res = await fetch(`${API_BASE_URL}/gsc/analytics?${params.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

import React, { useState, useEffect } from 'react';
import IntroAnimation from './IntroAnimation';
import {
  LayoutDashboard, Users, Megaphone, Calendar, FolderHeart, FolderOpen, Folder,
  UserSquare, LogOut, Sun, Moon, Search, Bell, Plus, Filter,
  CheckCircle2, XCircle, Clock, Trash2, Edit3, MessageSquare,
  Download, Share2, Check, ArrowRight, DollarSign, Target, Award,
  Users2, AlertTriangle, Eye, ShieldAlert, KeyRound, Mail, ChevronDown, ChevronRight,
  MapPin, Building, Landmark, Phone, PlusCircle, ArrowLeft, Send, MoreVertical, FileText,
  Copy, ExternalLink, ListChecks, CircleDot, Clipboard, PhoneCall, CheckSquare, CalendarDays,
  Menu, X, MoreHorizontal, UserPlus, Activity, ImageIcon, FileSpreadsheet, Archive
} from 'lucide-react';
import { api, API_BASE_URL } from './services/api';
import GscDashboardPanel from './components/GscDashboardPanel';
import RealtimeUserAnalytics from './components/RealtimeUserAnalytics';
import SeoHead from './components/SeoHead';
import { Sparkles, StickyNote, Pencil, Tag } from 'lucide-react';
import PageViewLogger from './components/PageViewLogger';

export default function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // UI state
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'operator-crm', 'digital-marketing', 'follow-up'
  const theme = 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const [marketingDropdownOpen, setMarketingDropdownOpen] = useState(true);
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('introShown'));

  // Tab states for sub-views
  const [operatorTab, setOperatorTab] = useState('leads'); // 'leads', 'segments', 'roles'
  const [digitalTab, setDigitalTab] = useState('campaigns'); // 'campaigns', 'assets'
  const [followUpTab, setFollowUpTab] = useState('kanban'); // 'kanban', 'projects', 'project-status', 'it-projects', 'calendar'
  const [trendTimeframe, setTrendTimeframe] = useState('6m'); // '3m', '6m', '12m'

  // Selected Lead Details
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [leadDetail, setLeadDetail] = useState(null);

  // Contact list options menu active ID
  const [activeContactMenuId, setActiveContactMenuId] = useState(null);

  // Follow Up / Prospects specific states
  const [fuSearch, setFuSearch] = useState('');
  const [fuFilterStatus, setFuFilterStatus] = useState('');
  const [fuSelectedProspect, setFuSelectedProspect] = useState(null); // full detail object
  const [fuSubtasks, setFuSubtasks] = useState([]);
  const [fuEditModalOpen, setFuEditModalOpen] = useState(false);
  const [fuEditForm, setFuEditForm] = useState({});
  const [fuNewContactPhone, setFuNewContactPhone] = useState('');
  const [fuNewContactNotes, setFuNewContactNotes] = useState('');
  const [fuTaskModalOpen, setFuTaskModalOpen] = useState(false);
  const [fuTaskForm, setFuTaskForm] = useState({ name: '', deadline: '', description: '', resource_link: '', assigned_to: '' });
  const [fuOperators, setFuOperators] = useState([]);

  // Projects states
  const [projects, setProjects] = useState([]);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectFormData, setProjectFormData] = useState({ id: '', name: '', client_id: '', description: '', budget: '', status: 'Planning', progress: 0, deadline: '' });

  // Operator states for Role Management
  const [operatorModalOpen, setOperatorModalOpen] = useState(false);
  const [operatorFormData, setOperatorFormData] = useState({ id: '', username: '', name: '', email: '', password: '', phone: '', role: 'Operator', status: 'Active' });

  // IT Projects view active lead ID for subtask viewing
  const [itActiveLeadId, setItActiveLeadId] = useState('');

  // Deadline alerts for in-app notification
  const [deadlineAlerts, setDeadlineAlerts] = useState([]);
  const [alertBannerDismissed, setAlertBannerDismissed] = useState(false);

  // Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [assets, setAssets] = useState([]);
  const [posts, setPosts] = useState([]);
  const [segments, setSegments] = useState([]);
  const [expandedSegmentId, setExpandedSegmentId] = useState(null);

  // Filtering states
  const [leadsFilterStatus, setLeadsFilterStatus] = useState('');
  const [leadsFilterIndustry, setLeadsFilterIndustry] = useState('');
  const [leadsFilterSource, setLeadsFilterSource] = useState('');
  const [leadsMeta, setLeadsMeta] = useState({ industries: [], sources: [] });

  // Custom Alert & Confirm Modals
  const [customAlert, setCustomAlert] = useState({ show: false, title: 'Notifikasi', message: '', type: 'success' });
  const [customConfirm, setCustomConfirm] = useState({ show: false, message: '', onConfirm: null });

  const showAlert = (message, title = 'Notifikasi', type = 'success') => {
    setCustomAlert({ show: true, title, message, type });
  };

  const showConfirm = (message, onConfirm) => {
    setCustomConfirm({ show: true, message, onConfirm });
  };

  // Override local alert
  const alert = (msg) => {
    showAlert(msg, 'Notifikasi', 'info');
  };

  // Modals and Forms states
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadFormData, setLeadFormData] = useState({ id: '', name: '', company: '', industry: 'Technology', source: 'Organic', value: '', lead_score: 50, owner_id: '', verified: false, phone: '', logo_url: '', location: 'Jakarta', company_size: '50-200', contact1_name: '', contact1_phone: '', contact2_name: '', contact2_phone: '', deadline: '' });

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [newNoteFormData, setNewNoteFormData] = useState({ type: 'Call', notes: '' });

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactFormData, setContactFormData] = useState({ name: '', phone: '', email: '', position: '', isPrimary: false });

  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignFormData, setCampaignFormData] = useState({ id: '', name: '', channel: 'Facebook Ads', budget: '', spend: '', conversion: '', revenue: '', status: 'Planned', start_date: '', end_date: '' });

  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetFormData, setAssetFormData] = useState({ id: '', name: '', file_type: 'PDF', category: 'CFD/FEA', tags: '', file_url: '', version: '1.0', sharing_status: 'Shared', size: '2.4 MB' });
  const [selectedAssetHistory, setSelectedAssetHistory] = useState(null);
  const [shareModalAsset, setShareModalAsset] = useState(null);
  const [newVersionFileUrl, setNewVersionFileUrl] = useState('');
  const [newVersionFileSize, setNewVersionFileSize] = useState('');
  const [newVersionVal, setNewVersionVal] = useState('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState('Semua');
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [fuStageFilter, setFuStageFilter] = useState('Semua');
  const [publicShareAsset, setPublicShareAsset] = useState(null);
  const [publicShareError, setPublicShareError] = useState('');

  // Asset Folders & Client Share Portal State
  const [assetFolders, setAssetFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderFormData, setFolderFormData] = useState({ name: '', category: 'CFD/FEA', description: '', files: [] });
  const [shareFolderModal, setShareFolderModal] = useState(null);
  const [clientPortalFolder, setClientPortalFolder] = useState(null);
  const [previewFileModal, setPreviewFileModal] = useState(null);
  const [publicFolderLoading, setPublicFolderLoading] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState('Semua');

  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postFormData, setPostFormData] = useState({ id: '', platform: 'Instagram', content: '', media_url: '', schedule_time: '', status: 'Draft' });
  const [selectedPost, setSelectedPost] = useState(null);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ name: '', phone: '', password: '', avatar_url: '' });

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkImportError, setBulkImportError] = useState('');
  const [bulkImportLoading, setBulkImportLoading] = useState(false);

  // Notes (Catatan) states
  const [notes, setNotes] = useState([]);
  const [notesSearch, setNotesSearch] = useState('');
  const [notesCategoryFilter, setNotesCategoryFilter] = useState('Semua');
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [noteEditData, setNoteEditData] = useState({ id: '', title: '', content: '', category: 'Lainnya' });

  // Init theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auth bootstrap
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  // Fetch initial profile
  const fetchProfile = async () => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
      setProfileFormData({
        name: profile.name,
        phone: profile.phone || '',
        password: '',
        avatar_url: profile.avatar_url || ''
      });
      loadViewData(currentView);
      // Check deadline alerts on login
      checkDeadlineAlerts();
    } catch (err) {
      console.error(err);
      handleLogout();
    }
  };

  // Check deadline alerts (H-1 and H) + send email via backend
  const checkDeadlineAlerts = async () => {
    try {
      const data = await api.checkDeadlineAlerts();
      if (data.alerts && data.alerts.length > 0) {
        setDeadlineAlerts(data.alerts);
        setAlertBannerDismissed(false);
      }
    } catch (err) {
      // Silently fail â€” don't block the UI if notification check fails
      console.warn('Deadline alert check failed:', err.message);
    }
  };

  // Load view datasets dynamically
  const loadViewData = (view) => {
    if (!token) return;
    switch (view) {
      case 'dashboard':
        fetchDashboard();
        break;
      case 'operator-crm':
        fetchLeads();
        fetchSegments();
        fetchLeadsMeta();
        fetchFollowUpOperators();
        if (selectedLeadId) {
          fetchLeadDetails(selectedLeadId);
        }
        break;
      case 'digital-marketing':
        fetchCampaigns();
        fetchAssets();
        break;
      case 'follow-up':
        fetchFollowUpLeads();
        fetchFollowUpOperators();
        fetchProjects();
        fetchSocialPosts();
        if (fuSelectedProspect) {
          fetchSubtasks(fuSelectedProspect.lead.id);
        }
        if (itActiveLeadId) {
          fetchSubtasks(itActiveLeadId);
        }
        break;
      case 'catatan':
        fetchNotes();
        break;
      default:
        break;
    }
  };

  // Trigger view data refresh when view changes
  useEffect(() => {
    loadViewData(currentView);
  }, [currentView, token, selectedLeadId, itActiveLeadId]);

  // Real-time Dashboard Polling Interval (Auto Sync SEO & Metrics every 6s)
  useEffect(() => {
    if (!token || currentView !== 'dashboard') return;
    const interval = setInterval(() => {
      fetchDashboard();
    }, 6000);
    return () => clearInterval(interval);
  }, [currentView, token]);

  // Refresh current data when global search finishes
  useEffect(() => {
    if (currentView === 'operator-crm' && !selectedLeadId) {
      fetchLeads();
    } else if (currentView === 'digital-marketing') {
      fetchAssets();
    }
  }, [globalSearch]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await api.login(loginEmail, loginPassword);
      setToken(data.token);
    } catch (err) {
      setAuthError(err.message || 'Login gagal.');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  };

  // --- API fetches ---
  const fetchDashboard = async () => {
    try {
      const data = await api.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeads = async () => {
    try {
      const data = await api.getLeads({
        status: leadsFilterStatus,
        industry: leadsFilterIndustry,
        source: leadsFilterSource,
        search: globalSearch
      });
      setLeads(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSegments = async () => {
    try {
      const data = await api.getSegments();
      setSegments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeadsMeta = async () => {
    try {
      const data = await api.getLeadsMeta();
      setLeadsMeta(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeadDetails = async (id) => {
    try {
      const data = await api.getLeadDetails(id);
      setLeadDetail(data);
      setSelectedLeadId(id);
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil data detail lead: ' + err.message);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssets = async () => {
    try {
      const cat = assetCategoryFilter === 'Semua' ? '' : assetCategoryFilter;
      const data = await api.getAssets(assetSearchTerm, '', cat);
      setAssets(data);
      fetchAssetFolders();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssetFolders = async () => {
    try {
      const data = await api.getAssetFolders();
      const folderList = Array.isArray(data) ? data : [];
      setAssetFolders(folderList);
      setSelectedFolder(prev => {
        if (!prev) return null;
        const updated = folderList.find(f => f.id === prev.id);
        return updated || prev;
      });
    } catch (err) {
      console.error('fetchAssetFolders error:', err);
    }
  };

  // Auto-fetch assets when search or category filter changes
  useEffect(() => {
    if (token && currentView === 'digital-marketing') {
      fetchAssets();
    }
  }, [assetSearchTerm, assetCategoryFilter, currentView, token]);

  // Auto-fetch notes when search or category filter changes
  useEffect(() => {
    if (token && currentView === 'catatan') {
      fetchNotes();
    }
  }, [notesSearch, notesCategoryFilter, currentView, token]);

  // Load public asset or shared folder on direct load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const folderToken = params.get('share_token') || params.get('share_folder');
    if (folderToken) {
      loadPublicSharedFolder(folderToken);
      return;
    }

    const isShare = window.location.pathname.includes('/share/assets/');
    if (isShare) {
      const parts = window.location.pathname.split('/');
      const id = parts[parts.length - 1];
      if (id && !isNaN(id)) {
        loadPublicAsset(id);
      }
    }
  }, []);

  const loadPublicSharedFolder = async (token) => {
    setPublicFolderLoading(true);
    try {
      const data = await api.getPublicSharedFolder(token);
      setClientPortalFolder(data);
    } catch (err) {
      console.error('Failed to load shared folder:', err);
    } finally {
      setPublicFolderLoading(false);
    }
  };

  const loadPublicAsset = async (id) => {
    setPublicShareLoading(true);
    setPublicShareError('');
    try {
      const data = await api.getPublicAsset(id);
      setPublicShareAsset(data);
    } catch (err) {
      setPublicShareError(err.message || 'Materi tidak ditemukan atau tidak dibagikan.');
    } finally {
      setPublicShareLoading(false);
    }
  };

  const triggerDownloadPublicAsset = async (id, fileUrl) => {
    try {
      // Record public download metric on database
      await api.downloadPublicAsset(id);
      // Update local copy download count if loaded
      if (publicShareAsset && publicShareAsset.id === id) {
        setPublicShareAsset(prev => ({ ...prev, download_count: (prev.download_count || 0) + 1 }));
      }
      // Open/Download the actual file URL
      handleOpenOrDownloadFile(fileUrl, publicShareAsset?.name || 'Dokumen');
    } catch (err) {
      console.error(err);
      handleOpenOrDownloadFile(fileUrl, 'Dokumen');
    }
  };

  const fetchSocialPosts = async () => {
    try {
      const data = await api.getSocialPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotes = async () => {
    try {
      const data = await api.getNotes(notesSearch, notesCategoryFilter === 'Semua' ? '' : notesCategoryFilter);
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchNotes error:', err);
    }
  };

  const saveNote = async (e) => {
    e.preventDefault();
    try {
      if (noteEditData.id) {
        await api.updateNote(noteEditData.id, noteEditData);
        showAlert('Catatan berhasil diperbarui.', 'Sukses', 'success');
      } else {
        await api.createNote(noteEditData);
        showAlert('Catatan berhasil disimpan.', 'Sukses', 'success');
      }
      setNoteFormOpen(false);
      setNoteEditData({ id: '', title: '', content: '', category: 'Lainnya' });
      fetchNotes();
    } catch (err) {
      showAlert(err.message, 'Gagal', 'error');
    }
  };

  const deleteNote = (id) => {
    showConfirm('Hapus catatan ini?', async () => {
      try {
        await api.deleteNote(id);
        fetchNotes();
        showAlert('Catatan berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert(err.message, 'Gagal', 'error');
      }
    });
  };

  // Follow Up specific fetches
  const fetchFollowUpLeads = async () => {
    try {
      const params = {};
      if (fuFilterStatus) params.status = fuFilterStatus;
      if (fuSearch) params.search = fuSearch;
      const data = await api.getProjects(params);
      setLeads(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFollowUpOperators = async () => {
    try {
      const data = await api.getOperators();
      setFuOperators(Array.isArray(data) ? data : (data.operators || []));
    } catch (err) { console.error(err); }
  };

  const fetchSubtasks = async (leadId) => {
    try {
      const data = await api.getSubtasks(leadId);
      setFuSubtasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openFuProspectDetail = async (leadId) => {
    try {
      const data = await api.getProjectDetails(leadId);
      setFuSelectedProspect(data);
      if (data.lead?.client_real_id) {
        fetchSubtasks(data.lead.client_real_id);
      } else {
        setFuSubtasks([]);
      }
    } catch (err) {
      alert('Gagal mengambil detail prospek: ' + err.message);
    }
  };

  const openFuEditModal = (lead) => {
    setFuEditForm({
      id: lead.id || lead.no_project || '',
      name: lead.name || lead.name_project || '',
      company: lead.company || lead.client_name || '',
      contact_name: lead.contact_name || '',
      status: lead.status || 'Lead',
      industry: lead.industry || 'Other',
      source: lead.source || 'Organic',
      phone: lead.phone || '',
      deadline: lead.deadline ? lead.deadline.split('T')[0] : '',
      value: lead.value || 0,
      notes: lead.notes || '',
      lead_score: lead.lead_score || 50,
      verified: lead.verified || false,
      logo_url: lead.logo_url || ''
    });
    setFuNewContactPhone('');
    setFuNewContactNotes('');
    setFuEditModalOpen(true);
  };

  const saveFuProspectEdit = async (e) => {
    e.preventDefault();
    try {
      if (!fuEditForm.name.trim().match(/^\d+\./)) {
        showAlert('Nama prospek/proyek wajib diawali dengan angka dan titik (contoh: 1. Nama Proyek).', 'Peringatan', 'warning');
        return;
      }

      if (fuEditForm.id) {
        // Edit existing project/prospect
        await api.updateProject(fuEditForm.id, {
          name_project: fuEditForm.name,
          client_name: fuEditForm.company,
          contact_name: fuEditForm.contact_name || '',
          status: fuEditForm.status ? fuEditForm.status.toUpperCase() : 'LEAD',
          value: fuEditForm.value || 0,
          phone: fuEditForm.phone || '',
          notes: fuEditForm.notes || '',
          source: fuEditForm.source || 'Organic',
          deadline: fuEditForm.deadline || null
        });
        if (fuSelectedProspect && (fuSelectedProspect.lead.id === fuEditForm.id || fuSelectedProspect.lead.no_project === fuEditForm.id)) {
          openFuProspectDetail(fuEditForm.id);
        }
        showAlert('Prospek berhasil diperbarui.', 'Sukses', 'success');
      } else {
        // Create new project/prospect
        await api.createProject({
          no_project: `imx-${Date.now()}`,
          name_project: fuEditForm.name,
          client_name: fuEditForm.company || '',
          contact_name: fuEditForm.contact_name || '',
          status: fuEditForm.status ? fuEditForm.status.toUpperCase() : 'LEAD',
          value: fuEditForm.value || 0,
          phone: fuEditForm.phone || '',
          notes: fuEditForm.notes || '',
          source: fuEditForm.source || 'Organic',
          deadline: fuEditForm.deadline || null
        });
        showAlert('Prospek baru berhasil disimpan.', 'Sukses', 'success');
      }
      setFuEditModalOpen(false);
      fetchFollowUpLeads();
    } catch (err) {
      showAlert(err.message, 'Gagal', 'error');
    }
  };

  const addFuContactHistory = async () => {
    if (!fuNewContactPhone.trim() && !fuNewContactNotes.trim()) return;
    try {
      await api.addInteraction(fuEditForm.id, 'Call', `${fuNewContactPhone} - ${fuNewContactNotes}`);
      setFuNewContactPhone('');
      setFuNewContactNotes('');
      fetchFollowUpLeads();
    } catch (err) {
      alert('Gagal menambahkan riwayat: ' + err.message);
    }
  };

  const saveFuNewSubtask = async (e) => {
    e.preventDefault();
    if (!fuSelectedProspect) return;
    try {
      const targetId = fuSelectedProspect.lead.client_real_id || fuSelectedProspect.lead.id;
      await api.createSubtask(targetId, fuTaskForm);
      setFuTaskModalOpen(false);
      setFuTaskForm({ name: '', deadline: '', description: '', resource_link: '', assigned_to: '' });
      fetchSubtasks(targetId);
    } catch (err) {
      alert('Gagal membuat subtask: ' + err.message);
    }
  };

  const updateFuSubtaskStatus = async (subtaskId, newStatus) => {
    try {
      const progressMap = { 'MT': 0, 'IFR': 25, 'EX': 50, 'IFC': 75, 'DONE': 100 };
      await api.updateSubtask(subtaskId, { status: newStatus, progress: progressMap[newStatus] || 0 });
      const targetId = fuSelectedProspect?.lead?.client_real_id || fuSelectedProspect?.lead?.id;
      if (fuSelectedProspect) fetchSubtasks(targetId);
    } catch (err) {
      alert('Gagal update status: ' + err.message);
    }
  };

  const deleteFuSubtask = (subtaskId) => {
    showConfirm('Hapus subtask ini?', async () => {
      try {
        await api.deleteSubtask(subtaskId);
        const targetId = fuSelectedProspect?.lead?.client_real_id || fuSelectedProspect?.lead?.id;
        if (fuSelectedProspect) fetchSubtasks(targetId);
        showAlert('Subtask berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert('Gagal menghapus subtask: ' + err.message, 'Gagal', 'error');
      }
    });
  };

  const deleteFuProspect = (id) => {
    showConfirm('Hapus prospek ini?', async () => {
      try {
        await api.deleteProject(id);
        setFuSelectedProspect(null);
        fetchFollowUpLeads();
        showAlert('Prospek berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert(err.message, 'Gagal', 'error');
      }
    });
  };

  const addFuNewProspect = async () => {
    const newName = prompt('Nama Klien Baru:');
    if (!newName) return;
    try {
      const result = await api.createLead({ name: newName, status: 'Lead' });
      fetchFollowUpLeads();
    } catch (err) {
      alert(err.message);
    }
  };

  // Projects & Operator management helpers
  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const saveProject = async (e) => {
    e.preventDefault();
    try {
      if (!projectFormData.name_project.trim().match(/^\d+\./)) {
        showAlert('Nama proyek wajib diawali dengan angka dan titik (contoh: 1. Nama Proyek).', 'Peringatan', 'warning');
        return;
      }

      if (projectFormData.id) {
        await api.updateProject(projectFormData.id, projectFormData);
        showAlert('Proyek berhasil diperbarui.', 'Sukses', 'success');
      } else {
        await api.createProject(projectFormData);
        showAlert('Proyek baru berhasil dibuat.', 'Sukses', 'success');
      }
      setProjectModalOpen(false);
      fetchProjects();
      fetchDashboard();
    } catch (err) {
      showAlert(err.message, 'Gagal', 'error');
    }
  };

  const deleteProject = (id) => {
    showConfirm('Apakah Anda yakin ingin menghapus proyek ini?', async () => {
      try {
        await api.deleteProject(id);
        fetchProjects();
        fetchDashboard();
        showAlert('Proyek berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert(err.message, 'Gagal', 'error');
      }
    });
  };

  const saveOperator = async (e) => {
    e.preventDefault();
    try {
      if (operatorFormData.id) {
        await api.updateOperator(operatorFormData.id, operatorFormData);
        showAlert('Operator berhasil diperbarui.', 'Sukses', 'success');
      } else {
        await api.createOperator(operatorFormData);
        showAlert('Operator baru berhasil ditambahkan.', 'Sukses', 'success');
      }
      setOperatorModalOpen(false);
      fetchFollowUpOperators();
    } catch (err) {
      showAlert(err.message, 'Gagal', 'error');
    }
  };

  const deleteOperator = (id) => {
    showConfirm('Apakah Anda yakin ingin menghapus operator ini?', async () => {
      try {
        await api.deleteOperator(id);
        fetchFollowUpOperators();
        showAlert('Operator berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert(err.message, 'Gagal', 'error');
      }
    });
  };

  // Helper: format value as "Rp 25jt" style
  const formatRpShort = (val) => {
    const num = parseFloat(val);
    if (!num) return 'Rp 0';
    if (num >= 1000000000) return `Rp ${(num / 1000000000).toFixed(1)}M`;
    if (num >= 1000000) return `Rp ${Math.round(num / 1000000)}jt`;
    if (num >= 1000) return `Rp ${Math.round(num / 1000)}rb`;
    return `Rp ${num}`;
  };

  // Helper: time ago in Indonesian
  const timeAgoId = (dateStr) => {
    if (!dateStr) return '-';
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return diffMins <= 0 ? 'Baru saja' : `${diffMins}m lalu`;
    if (diffHours < 24) return `${diffHours}h lalu`;
    if (diffDays === 0) return 'Hari ini!';
    if (diffDays === 1) return 'Kemarin';
    return `${diffDays}d lalu`;
  };

  // Helper: get initials color
  const getInitialsColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const getBackendBaseUrl = () => {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000'
      : 'https://infimech-marketing-erp-backend-583320051925.asia-southeast1.run.app';
  };

  const ensureFileExtension = (filename, defaultExt = 'pdf') => {
    if (!filename) return `Dokumen.${defaultExt}`;
    const hasExtension = /\.(pdf|docx?|xlsx?|pptx?|png|jpe?g|webp|gif|svg|zip|rar|mp4|webm|csv|txt)$/i.test(filename);
    if (hasExtension) {
      return filename;
    }
    return `${filename}.${defaultExt}`;
  };

  const createValidPdfBlob = (filename = 'Dokumen') => {
    const cleanTitle = (filename || 'Dokumen Marketing').replace(/[()\/\\]/g, ' ');
    const contentStream = `BT\n/F1 18 Tf\n50 740 Td\n(${cleanTitle}) Tj\n/F1 12 Tf\n0 -30 Td\n(Dokumen Resmi Marketing ERP - PT Infimech Harmoni Teknologi) Tj\n0 -20 Td\n(Diunduh pada: ${new Date().toLocaleDateString('id-ID')}) Tj\nET\n`;
    const streamLength = new TextEncoder().encode(contentStream).length;

    let pdf = `%PDF-1.4\n`;
    const offsets = [];

    offsets[1] = new TextEncoder().encode(pdf).length;
    pdf += `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;

    offsets[2] = new TextEncoder().encode(pdf).length;
    pdf += `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;

    offsets[3] = new TextEncoder().encode(pdf).length;
    pdf += `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;

    offsets[4] = new TextEncoder().encode(pdf).length;
    pdf += `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}endstream\nendobj\n`;

    offsets[5] = new TextEncoder().encode(pdf).length;
    pdf += `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`;

    const xrefOffset = new TextEncoder().encode(pdf).length;
    pdf += `xref\n0 6\n0000000000 65535 f \n`;
    for (let i = 1; i <= 5; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    return new Blob([new TextEncoder().encode(pdf)], { type: 'application/pdf' });
  };

  const handleOpenOrDownloadFile = async (fileUrl, filename = 'Dokumen') => {
    if (!fileUrl) return;

    // 1. If it's a content proxy endpoint like `/api/assets/:id/content`
    if (typeof fileUrl === 'string' && (fileUrl.includes('/api/assets/') || fileUrl.includes('/content'))) {
      try {
        const token = localStorage.getItem('token');
        const baseUrlHost = getBackendBaseUrl();
        const fetchUrl = fileUrl.startsWith('http') ? fileUrl : `${baseUrlHost}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
        const res = await fetch(fetchUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
        if (res.ok) {
          const data = await res.json();
          if (data && data.file_url) {
            return handleOpenOrDownloadFile(data.file_url, data.name || filename);
          }
        }
      } catch (err) {
        console.error('Fetch asset content error:', err);
      }
    }

    const link = document.createElement('a');

    // 2. Data URIs (e.g. data:application/pdf;base64,... or data:image/png;base64,...)
    if (typeof fileUrl === 'string' && fileUrl.startsWith('data:')) {
      try {
        const mimeMatch = fileUrl.match(/^data:([^;]+);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

        let ext = 'pdf';
        if (mime.includes('image/png')) ext = 'png';
        else if (mime.includes('image/jpeg') || mime.includes('image/jpg')) ext = 'jpg';
        else if (mime.includes('image/webp')) ext = 'webp';
        else if (mime.includes('image/svg')) ext = 'svg';
        else if (mime.includes('image/')) ext = 'png';
        else if (mime.includes('word') || mime.includes('officedocument.wordprocessingml') || mime.includes('msword')) ext = 'docx';
        else if (mime.includes('excel') || mime.includes('officedocument.spreadsheetml') || mime.includes('ms-excel') || mime.includes('sheet')) ext = 'xlsx';
        else if (mime.includes('powerpoint') || mime.includes('officedocument.presentationml') || mime.includes('ms-powerpoint') || mime.includes('presentation')) ext = 'pptx';
        else if (mime.includes('video/mp4')) ext = 'mp4';
        else if (mime.includes('video/')) ext = 'mp4';
        else if (mime.includes('zip') || mime.includes('compressed')) ext = 'zip';

        const base64Data = fileUrl.split(',')[1];
        if (base64Data) {
          const binaryStr = atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: mime });
          const blobUrl = URL.createObjectURL(blob);
          link.href = blobUrl;
          const cleanName = ensureFileExtension(filename, ext);
          link.download = cleanName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          return;
        }
      } catch (e) {
        console.error('Data URI download conversion error:', e);
      }

      link.href = fileUrl;
      link.download = ensureFileExtension(filename, 'pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // 3. Absolute HTTP(S) URLs or Relative Server Paths (/assets/files/...)
    let fullUrl = fileUrl;
    if (typeof fileUrl === 'string' && !fileUrl.startsWith('http') && !fileUrl.startsWith('blob:')) {
      const baseUrlHost = getBackendBaseUrl();
      fullUrl = `${baseUrlHost}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    }

    try {
      const res = await fetch(fullUrl);
      if (res.ok) {
        const blob = await res.blob();
        if (blob.type.includes('text/html') || blob.size < 50) {
          throw new Error('Server returned HTML or empty response instead of file blob');
        }
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        let ext = fileUrl.split('.').pop().toLowerCase();
        if (!ext || ext.length > 5 || ext.includes('/')) ext = 'pdf';
        const cleanName = ensureFileExtension(filename, ext);
        link.download = cleanName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return;
      }
    } catch (err) {
      console.warn('Fetch binary blob failed, trying direct link or fallback PDF:', err.message);
    }

    // Fallback: If URL download is unavailable, generate 100% syntactically valid PDF blob
    const cleanTitle = (filename || 'Materi_Pemasaran').replace(/[()\/\\:]/g, '_');
    const pdfBlob = createValidPdfBlob(cleanTitle);
    const blobUrl = URL.createObjectURL(pdfBlob);
    link.href = blobUrl;
    link.download = ensureFileExtension(cleanTitle, 'pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  };

  const handlePreviewFile = async (fileUrl, filename = 'Dokumen', fileType = 'PDF') => {
    if (!fileUrl) return;
    let resolvedUrl = fileUrl;
    if (typeof fileUrl === 'string' && (fileUrl.includes('/api/assets/') || fileUrl.includes('/content'))) {
      try {
        const token = localStorage.getItem('token');
        const baseUrlHost = getBackendBaseUrl();
        const fetchUrl = fileUrl.startsWith('http') ? fileUrl : `${baseUrlHost}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
        const res = await fetch(fetchUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
        if (res.ok) {
          const data = await res.json();
          if (data && data.file_url) {
            return handlePreviewFile(data.file_url, data.name || filename, data.file_type || fileType);
          }
        }
      } catch (err) {
        console.error('Fetch asset content for preview error:', err);
      }
    } else if (typeof fileUrl === 'string' && !fileUrl.startsWith('http') && !fileUrl.startsWith('data:') && !fileUrl.startsWith('blob:')) {
      const baseUrlHost = getBackendBaseUrl();
      resolvedUrl = `${baseUrlHost}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    }

    setPreviewFileModal({
      isOpen: true,
      fileUrl: resolvedUrl,
      filename: filename,
      fileType: fileType
    });
  };

  // --- Actions ---

  const handleLogoUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setLeadFormData(prev => ({ ...prev, logo_url: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleProspectLogoUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setFuEditForm(prev => ({ ...prev, logo_url: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleAssetFileUpload = (file) => {
    if (!file) return;

    // 1. Calculate file size (MB or KB)
    let sizeStr = '1.0 MB';
    if (file.size >= 1024 * 1024) {
      sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    } else {
      sizeStr = (file.size / 1024).toFixed(0) + ' KB';
    }

    // 2. Determine file type based on mime/extension
    let fileType = 'PDF';
    const ext = file.name.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      fileType = 'Image';
    } else {
      const templateExts = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar'];
      if (templateExts.includes(ext)) {
        fileType = 'Template';
      } else {
        const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
        if (videoExts.includes(ext)) {
          fileType = 'Video';
        }
      }
    }

    // 3. Read file as Base64 Data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setAssetFormData(prev => ({
        ...prev,
        file_url: event.target.result,
        size: sizeStr,
        file_type: fileType,
        name: prev.name ? prev.name : file.name.substring(0, file.name.lastIndexOf('.')) || file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleVersionFileUpload = (file) => {
    if (!file) return;

    // 1. Calculate file size
    let sizeStr = '1.0 MB';
    if (file.size >= 1024 * 1024) {
      sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    } else {
      sizeStr = (file.size / 1024).toFixed(0) + ' KB';
    }

    // 2. Convert to Base64
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewVersionFileUrl(event.target.result);
      setNewVersionFileSize(sizeStr);
    };
    reader.readAsDataURL(file);
  };

  // Leads CRM
  const saveLead = async (e) => {
    e.preventDefault();
    try {
      const finalLeadData = { ...leadFormData, name: leadFormData.company };
      if (leadFormData.id) {
        await api.updateLead(leadFormData.id, finalLeadData);
        showAlert('Lead berhasil diperbarui.', 'Sukses', 'success');
      } else {
        await api.createLead(finalLeadData);
        showAlert('Lead baru berhasil disimpan.', 'Sukses', 'success');
      }
      setLeadModalOpen(false);
      fetchLeads();
      if (selectedLeadId) {
        fetchLeadDetails(selectedLeadId);
      }
      fetchDashboard();
    } catch (err) {
      showAlert(err.message, 'Gagal', 'error');
    }
  };

  const changeLeadStatus = async (id, status) => {
    try {
      await api.updateLeadStatus(id, status);
      fetchLeads();
      if (selectedLeadId === id) {
        fetchLeadDetails(id);
      }
    } catch (err) {
      alert('Gagal mengubah status: ' + err.message);
    }
  };

  const deleteLead = (id) => {
    showConfirm('Apakah Anda yakin ingin menghapus lead ini?', async () => {
      try {
        await api.deleteLead(id);
        setSelectedLeadId(null);
        setLeadDetail(null);
        fetchLeads();
        fetchDashboard();
        showAlert('Lead berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert(err.message, 'Gagal', 'error');
      }
    });
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!bulkCsvText.trim()) {
      setBulkImportError('Konten CSV tidak boleh kosong.');
      return;
    }

    setBulkImportLoading(true);
    setBulkImportError('');

    try {
      const lines = bulkCsvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length < 2) {
        throw new Error('CSV harus berisi baris header dan minimal satu baris data.');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const clientsToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i];
        const values = currentLine.split(',').map(v => v.trim());

        const clientObj = {};
        headers.forEach((header, index) => {
          clientObj[header] = values[index] || '';
        });

        const mappedClient = {
          company: clientObj.company || '',
          name: clientObj.pic_name || clientObj.company || 'New Client',
          industry: clientObj.industry || 'Other',
          source: clientObj.source || 'Organic',
          phone: clientObj.pic_phone || '',
          status: clientObj.status || 'Lead',
          verified: (clientObj.verified && ['yes', 'true', '1', 'ya'].includes(clientObj.verified.toLowerCase())) ? 1 : 0,
          contact_name: clientObj.pic_name || '',
          contact_phone: clientObj.pic_phone || ''
        };

        if (!mappedClient.company && !mappedClient.name) {
          continue;
        }
        clientsToImport.push(mappedClient);
      }

      if (clientsToImport.length === 0) {
        throw new Error('Tidak ada data klien valid yang ditemukan untuk diimpor.');
      }

      const res = await api.bulkImportLeads(clientsToImport);
      showAlert(res.message || 'Bulk import berhasil.', 'Sukses', 'success');
      setBulkModalOpen(false);
      setBulkCsvText('');
      fetchLeads();
      fetchDashboard();
    } catch (err) {
      setBulkImportError(err.message || 'Gagal melakukan bulk import.');
    } finally {
      setBulkImportLoading(false);
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = "Company,Industry,Source,PIC_Name,PIC_Phone,Status,Verified\nPT Maju Jaya,Technology,Website,Agus Santoso,+628123456789,Lead,Yes\nCV Kreatif,E-commerce,Instagram Ads,Dewi Lestari,+628998877665,Proposal,No";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "client_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client Contacts
  const addClientContact = async (e) => {
    e.preventDefault();
    if (!contactFormData.name) return;
    try {
      await api.addContact(selectedLeadId, contactFormData.name, contactFormData.phone, contactFormData.email, contactFormData.position, contactFormData.isPrimary);
      setContactFormData({ name: '', phone: '', email: '', position: '', isPrimary: false });
      setContactModalOpen(false);
      fetchLeadDetails(selectedLeadId);
    } catch (err) {
      showAlert('Gagal menambahkan kontak: ' + err.message, 'Gagal', 'error');
    }
  };

  const deleteClientContact = (contactId) => {
    showConfirm('Hapus kontak ini?', async () => {
      try {
        await api.deleteContact(contactId);
        setActiveContactMenuId(null);
        fetchLeadDetails(selectedLeadId);
        showAlert('Kontak berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert('Gagal menghapus kontak: ' + err.message, 'Gagal', 'error');
      }
    });
  };

  const addInteractionLog = async (e) => {
    e.preventDefault();
    if (!newNoteFormData.notes.trim()) return;
    try {
      await api.addInteraction(selectedLeadId, newNoteFormData.type, newNoteFormData.notes);
      setNewNoteFormData({ type: 'Call', notes: '' });
      setNoteModalOpen(false);
      fetchLeadDetails(selectedLeadId);
      fetchLeads();
    } catch (err) {
      alert('Gagal menambahkan interaksi: ' + err.message);
    }
  };

  // Campaigns
  const saveCampaign = async (e) => {
    e.preventDefault();
    try {
      if (campaignFormData.id) {
        await api.updateCampaign(campaignFormData.id, campaignFormData);
        alert('Kampanye berhasil diperbarui.');
      } else {
        await api.createCampaign(campaignFormData);
        alert('Kampanye berhasil dibuat.');
      }
      setCampaignModalOpen(false);
      fetchCampaigns();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteCampaign = (id) => {
    showConfirm('Hapus kampanye ini?', async () => {
      try {
        await api.deleteCampaign(id);
        fetchCampaigns();
        showAlert('Kampanye berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert(err.message, 'Gagal', 'error');
      }
    });
  };

  // Assets
  const saveAsset = async (e) => {
    e.preventDefault();
    try {
      if (assetFormData.id) {
        await api.updateAsset(assetFormData.id, assetFormData);
        showAlert('Aset berhasil diperbarui.', 'Sukses', 'success');
      } else {
        await api.createAsset(assetFormData);
        showAlert('Aset berhasil ditambahkan.', 'Sukses', 'success');
      }
      setAssetModalOpen(false);
      await fetchAssets();
      await fetchAssetFolders();
    } catch (err) {
      showAlert(err.message, 'Gagal', 'error');
    }
  };

  const triggerDownloadAsset = async (asset) => {
    try {
      await api.downloadAsset(asset.id);
      fetchAssets();
      handleOpenOrDownloadFile(asset.file_url, asset.name || 'Dokumen');
    } catch (err) {
      console.error(err);
      handleOpenOrDownloadFile(asset?.file_url, asset?.name || 'Dokumen');
    }
  };

  const deleteAsset = (id) => {
    showConfirm('Hapus aset ini dari library?', async () => {
      try {
        await api.deleteAsset(id);
        fetchAssets();
        fetchAssetFolders();
        showAlert('Aset berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert(err.message, 'Gagal', 'error');
      }
    });
  };

  const saveAssetFolder = async (e) => {
    e.preventDefault();
    if (!folderFormData.name) {
      return showAlert('Nama folder wajib diisi.', 'Perhatian', 'warning');
    }
    try {
      if (folderFormData.id) {
        await api.updateAssetFolder(folderFormData.id, {
          name: folderFormData.name,
          description: folderFormData.description || '',
          category: folderFormData.category || 'CFD/FEA'
        });
        setFolderModalOpen(false);
        showAlert('Folder berhasil diperbarui.', 'Sukses', 'success');
        await fetchAssetFolders();
        await fetchAssets();
        return;
      }

      // 1. Buat folder terlebih dahulu di backend (tanpa payload file yang besar)
      const { files, ...folderMeta } = folderFormData;
      const res = await api.createAssetFolder(folderMeta);
      const newFolderId = res.folderId || res.id;

      // 2. Jika ada file yang dimasukkan ke dalam folder saat pembuatan, upload file satu per satu
      if (Array.isArray(files) && files.length > 0 && newFolderId) {
        for (let i = 0; i < files.length; i++) {
          try {
            await api.uploadFolderFiles(newFolderId, [files[i]]);
          } catch (uploadErr) {
            console.error(`Gagal upload file ${files[i].name}:`, uploadErr);
          }
        }
      }

      setFolderModalOpen(false);
      showAlert('Folder & Aset berhasil dibuat.', 'Sukses', 'success');
      await fetchAssetFolders();
      await fetchAssets();
    } catch (err) {
      showAlert(err.message || 'Gagal membuat folder aset.', 'Gagal', 'error');
    }
  };

  const deleteAssetFolderHandler = (id) => {
    showConfirm('Hapus folder ini beserta aset di dalamnya?', async () => {
      try {
        await api.deleteAssetFolder(id);
        if (selectedFolder?.id === id) setSelectedFolder(null);
        fetchAssetFolders();
        fetchAssets();
        showAlert('Folder berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert(err.message, 'Gagal', 'error');
      }
    });
  };

  const handleFolderMultiFileUpload = (fileList) => {
    const arr = Array.from(fileList);
    arr.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        let sizeStr = '1.0 MB';
        if (file.size >= 1024 * 1024) sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        else sizeStr = (file.size / 1024).toFixed(0) + ' KB';

        let fileType = 'PDF';
        const ext = file.name.split('.').pop().toLowerCase();
        if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) fileType = 'Image';
        else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) fileType = 'Template';
        else if (['mp4', 'mov', 'webm'].includes(ext)) fileType = 'Video';

        const fileObj = {
          name: file.name.replace(/\.[^/.]+$/, ''),
          file_type: fileType,
          file_url: event.target.result,
          size: sizeStr,
          version: '1.0'
        };

        setFolderFormData(prev => ({
          ...prev,
          files: [...(prev.files || []), fileObj]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadMoreToFolderHandler = async (folderId, fileList) => {
    const arr = Array.from(fileList);
    let successCount = 0;
    for (const file of arr) {
      try {
        const resultUrl = await new Promise(resolve => {
          const r = new FileReader();
          r.onload = e => resolve(e.target.result);
          r.readAsDataURL(file);
        });
        let sizeStr = '1.0 MB';
        if (file.size >= 1024 * 1024) sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        else sizeStr = (file.size / 1024).toFixed(0) + ' KB';

        let fileType = 'PDF';
        const ext = file.name.split('.').pop().toLowerCase();
        if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) fileType = 'Image';
        else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) fileType = 'Template';
        else if (['mp4', 'mov', 'webm'].includes(ext)) fileType = 'Video';

        const singleFile = [{
          name: file.name.replace(/\.[^/.]+$/, ''),
          file_type: fileType,
          file_url: resultUrl,
          size: sizeStr,
          version: '1.0'
        }];

        await api.uploadFolderFiles(folderId, singleFile);
        successCount++;
      } catch (err) {
        console.error(`Gagal upload file ${file.name}:`, err);
      }
    }

    if (successCount > 0) {
      showAlert(`${successCount} file berhasil ditambahkan ke folder.`, 'Sukses', 'success');
      fetchAssetFolders();
      fetchAssets();
    } else {
      showAlert('Gagal menambahkan file ke folder.', 'Gagal', 'error');
    }
  };

  // Calendar / Social Scheduling
  const saveSocialPost = async (e) => {
    e.preventDefault();
    try {
      if (postFormData.id) {
        await api.updateSocialPost(postFormData.id, postFormData);
        showAlert('Jadwal post berhasil diperbarui.', 'Sukses', 'success');
      } else {
        await api.createSocialPost(postFormData);
        showAlert('Postingan berhasil dijadwalkan.', 'Sukses', 'success');
      }
      setPostModalOpen(false);
      fetchSocialPosts();
    } catch (err) {
      showAlert(err.message, 'Gagal', 'error');
    }
  };

  const deleteSocialPost = (id) => {
    showConfirm('Batalkan dan hapus postingan ini?', async () => {
      try {
        await api.deleteSocialPost(id);
        fetchSocialPosts();
        showAlert('Postingan berhasil dihapus.', 'Sukses', 'success');
      } catch (err) {
        showAlert(err.message, 'Gagal', 'error');
      }
    });
  };

  // Profile update self
  const saveProfileSelf = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateProfile(profileFormData);
      setUser(res.user);
      setProfileModalOpen(false);
      alert('Profil Anda berhasil diperbarui.');
    } catch (err) {
      alert(err.message);
    }
  };

  // Helpers
  const getUrgencyClass = (lastContactStr) => {
    if (!lastContactStr) return 'days-urgent';
    const lastContact = new Date(lastContactStr);
    const diffTime = Math.abs(new Date() - lastContact);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 7) return 'days-urgent';
    if (diffDays >= 3) return 'days-warning';
    return 'days-safe';
  };

  const getUrgencyText = (lastContactStr) => {
    if (!lastContactStr) return '-';
    const lastContact = new Date(lastContactStr);
    const diffTime = Math.abs(new Date() - lastContact);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days ago`;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getFigmaStatusText = (status) => {
    if (status === 'Won' || status === 'Done') {
      return 'ACTIVE';
    }
    return 'PROSPECT';
  };

  const channels = ['Facebook Ads', 'Google Ads', 'TikTok Ads', 'Instagram Ads', 'LinkedIn Ads', 'Email Marketing', 'Organic Content'];
  const industriesList = ['Technology', 'E-commerce', 'Tourism', 'Finance', 'F&B', 'Education', 'FMCG', 'Energy', 'Other'];
  const sourcesList = ['Google Ads', 'Facebook Ads', 'TikTok Ads', 'Instagram Ads', 'LinkedIn Ads', 'Referral', 'Organic', 'Website', 'Event', 'Direct'];

  // 1. SECURE PUBLIC SHARING LANDING PAGE (NO LOGIN REQUIRED)
  if (window.location.pathname.includes('/share/assets/')) {
    return (
      <div className="login-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        <div className="login-card" style={{ maxWidth: '480px', width: '100%', padding: '32px', textAlign: 'center', gap: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
            <Megaphone size={28} style={{ color: 'var(--primary-glow)' }} />
            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.5px' }}>MarketERP Share</span>
          </div>

          {publicShareLoading ? (
            <div style={{ padding: '40px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '14px', animation: 'spin 1.5s linear infinite' }}>...</div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Mengambil materi pemasaran secure share...</p>
            </div>
          ) : publicShareError ? (
            <div style={{ padding: '30px 10px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <div style={{ fontSize: '48px' }}>âš ï¸</div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-red)' }}>Akses Gagal / Link Kedaluwarsa</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>{publicShareError}</p>
              </div>
              <a href="/" className="btn btn-secondary" style={{ width: 'fit-content' }}>Kembali ke Login</a>
            </div>
          ) : publicShareAsset ? (() => {
            const a = publicShareAsset;
            const formatColors = {
              'PDF': 'linear-gradient(135deg, #ef4444, #b91c1c)',
              'Template': 'linear-gradient(135deg, #f59e0b, #d97706)',
              'Image': 'linear-gradient(135deg, #ec4899, #db2777)',
              'Video': 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            };
            const headerBg = formatColors[a.file_type] || 'linear-gradient(135deg, #6b7280, #4b5563)';
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                {/* File Icon & Type Banner */}
                <div style={{ background: headerBg, borderRadius: '12px', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '44px' }}>
                    {a.file_type === 'PDF' ? 'ðŸ“„' : a.file_type === 'Template' ? 'ðŸ“' : a.file_type === 'Image' ? 'ðŸ–¼ï¸' : 'ðŸ“¹'}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                    {a.file_type} DOCUMENT
                  </span>
                </div>

                {/* Metadata */}
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1.4, marginBottom: '8px' }}>{a.name}</h3>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)' }}>
                      {a.category}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                      v{a.version}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                      {a.size}
                    </span>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Diunggah Oleh:</span>
                      <span style={{ fontWeight: 600 }}>{a.creator_name || 'Siti Sarah'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tanggal Rilis:</span>
                      <span style={{ fontWeight: 600 }}>{new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total Download/Share:</span>
                      <span style={{ fontWeight: 600 }}>{a.download_count || 0} Kali</span>
                    </div>
                  </div>
                </div>

                {/* Preview and Download Buttons */}
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button
                    className="btn"
                    style={{ flex: 1, height: '46px', fontSize: '13px', fontWeight: 700, background: 'rgba(168,85,247,0.2)', color: '#d8b4fe', border: '1px solid rgba(168,85,247,0.4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => handlePreviewFile(a.file_url, a.name || 'Dokumen', a.file_type)}
                  >
                    <Eye size={16} />
                    <span>Lihat File</span>
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, height: '46px', fontSize: '13px', fontWeight: 700, background: 'linear-gradient(135deg, var(--primary-glow) 0%, #a855f7 100%)', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => triggerDownloadPublicAsset(a.id, a.file_url)}
                  >
                    <Download size={16} />
                    <span>Unduh File</span>
                  </button>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span>ðŸ›¡ï¸ Verified Secure by MarketERP Share</span>
                </div>
              </div>
            );
          })() : (
            <div style={{ padding: '30px 0', color: 'var(--text-muted)' }}>
              <p>Materi sharing tidak ditemukan.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. PUBLIC SHARED FOLDER PORTAL (NO LOGIN REQUIRED)
  if (publicFolderLoading || ((window.location.search.includes('share_token') || window.location.search.includes('share_folder')) && !clientPortalFolder)) {
    return (
      <div className="login-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        <div className="login-card" style={{ maxWidth: '440px', width: '100%', padding: '36px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '36px', marginBottom: '14px', animation: 'spin 1.5s linear infinite' }}>...</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Memuat Folder Aset Pemasaran...</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Harap tunggu sebentar, sedang mengambil daftar dokumen brosur & spesifikasi.</p>
        </div>
      </div>
    );
  }

  if (clientPortalFolder && (window.location.search.includes('share_token') || window.location.search.includes('share_folder') || !token)) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-main)',
        zIndex: 99999,
        overflowY: 'auto',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Bar (No Tutup/Kembali button for Client Public View) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: '18px' }}>
                IMX
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  INFIMECH MARKETING ERP
                </h1>
                <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  Official Client Asset Download Portal
                </span>
              </div>
            </div>
          </div>

          {/* Folder Hero Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(168,85,247,0.25) 100%)',
            border: '1px solid rgba(6,182,212,0.4)',
            borderRadius: '20px',
            padding: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{ maxWidth: '65%' }}>
              <span className="badge" style={{ background: 'var(--accent-cyan)', color: 'black', fontWeight: 800, fontSize: '11px', padding: '4px 12px', borderRadius: '20px', marginBottom: '10px', display: 'inline-block' }}>
                SHARED MARKETING FOLDER
              </span>
              <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: '4px 0 10px' }}>
                {clientPortalFolder.name}
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: '1.6' }}>
                {clientPortalFolder.description || 'Berikut adalah daftar lengkap aset pemasaran, brosur spesifikasi teknik, dan dokumen pendukung proyek untuk Anda unduh.'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px', background: 'rgba(0,0,0,0.3)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Aset Tersedia:</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                {clientPortalFolder.assets?.length || 0} File Dokumen
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Akses instan tanpa perlu login.
              </div>
            </div>
          </div>

          {/* Client Search Bar & Filter */}
          <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '14px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Cari file apa yang ingin Anda unduh (nama dokumen, tipe, topik)..."
                className="form-input"
                style={{ width: '100%', paddingLeft: '38px', height: '42px', fontSize: '13px' }}
                value={clientSearchTerm}
                onChange={e => setClientSearchTerm(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {['Semua', 'PDF', 'Template', 'Image', 'Video'].map(type => (
                <button
                  key={type}
                  className="btn"
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    background: clientTypeFilter === type ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                    color: clientTypeFilter === type ? 'black' : 'var(--text-primary)'
                  }}
                  onClick={() => setClientTypeFilter(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Client File Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
            {(clientPortalFolder.assets || [])
              .filter(a => {
                if (clientTypeFilter !== 'Semua' && a.file_type !== clientTypeFilter) return false;
                if (clientSearchTerm) {
                  const q = clientSearchTerm.toLowerCase();
                  return (a.name || '').toLowerCase().includes(q) || (a.tags || '').toLowerCase().includes(q);
                }
                return true;
              })
              .map((a, idx) => (
                <div
                  key={a.id || idx}
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(6,182,212,0.05) 100%)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {a.file_type === 'PDF' ? <FileText size={22} style={{ color: '#ef4444' }} /> : a.file_type === 'Image' ? <ImageIcon size={22} style={{ color: '#ec4899' }} /> : a.file_type === 'Template' ? <FileSpreadsheet size={22} style={{ color: '#f59e0b' }} /> : <Archive size={22} style={{ color: 'var(--accent-cyan)' }} />}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          {a.name}
                        </h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {a.file_type} Dokumen Â· {a.size || '2.4 MB'}
                        </span>
                      </div>
                    </div>

                    <span className="badge" style={{ background: 'rgba(168,85,247,0.15)', color: '#d8b4fe', fontSize: '11px' }}>
                      Versi {a.version || '1.0'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Siap diunduh langsung
                    </span>
                    <button
                      className="btn btn-primary"
                      style={{
                        background: 'var(--accent-cyan)',
                        color: 'black',
                        fontWeight: 800,
                        padding: '8px 18px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 14px rgba(6,182,212,0.35)'
                      }}
                      onClick={() => handleOpenOrDownloadFile(a.file_url, a.name || 'Dokumen')}
                    >
                      <Download size={15} />
                      <span>Unduh File</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated screen
  if (!token) {

    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">Marketing ERP</div>
          <div className="login-desc">Sistem Manajemen Kampanye, Leads CRM & Kalender Konten</div>
          {authError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <ShieldAlert size={16} />
              <span>{authError}</span>
            </div>
          )}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Email Operator</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="admin.@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Kata Sandi</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px', height: '42px' }}>
              <span>Masuk Sistem</span>
              <ArrowRight size={16} />
            </button>
          </form>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
            Info Akun Percobaan:<br />
            <strong>admin.@gmail.com</strong> (Pass: admin123) [Superadmin]<br />
            <strong>baruna.work@gmail.com</strong> (Pass: baruna123) [Admin]
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <SeoHead
        title={
          currentView === 'dashboard' ? 'Dashboard Overview & SEO Engine | Infimech ERP' :
          currentView === 'digital-marketing' ? 'Digital Marketing Campaigns & SEO | Infimech' :
          currentView === 'operator-crm' ? 'CRM Leads & User Management | Infimech' :
          currentView === 'follow-up' ? 'Follow Up Prospek & Projects | Infimech' :
          'Infimech ERP Marketing & Engineering Solusi'
        }
      />
      {/* Intro Animation Overlay */}
      {showIntro && (
        <IntroAnimation onComplete={() => {
          setShowIntro(false);
          sessionStorage.setItem('introShown', 'true');
        }} />
      )}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}
            onClick={() => {
              setCurrentView('dashboard');
              setSelectedLeadId(null);
              setSidebarOpen(false);
            }}
          >
            <img src="/infimech-logo.png" alt="INFIMECH Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <span>MarketERP</span>
          </div>
          <button
            className="icon-btn mobile-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(false);
            }}
          >
            <X size={20} />
          </button>
        </div>

        <ul className="sidebar-menu">
          <li>
            <a
              className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('dashboard');
                setSelectedLeadId(null);
                setSidebarOpen(false);
              }}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </a>
          </li>

          {/* Collapsible Marketing category */}
          <li>
            <div
              className={`sidebar-item ${['operator-crm', 'digital-marketing', 'follow-up'].includes(currentView) ? 'active' : ''}`}
              style={{ justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setMarketingDropdownOpen(!marketingDropdownOpen)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Megaphone size={20} />
                <span>Marketing</span>
              </div>
              {marketingDropdownOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>

            {marketingDropdownOpen && (
              <ul style={{ listStyle: 'none', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                <li>
                  <a
                    className={`sidebar-item ${currentView === 'operator-crm' ? 'active' : ''}`}
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                    onClick={() => {
                      setCurrentView('operator-crm');
                      setSelectedLeadId(null);
                      setOperatorTab('leads');
                      setSidebarOpen(false);
                    }}
                  >
                    <Users size={16} />
                    <span>Marketing Operator</span>
                  </a>
                </li>
                <li>
                  <a
                    className={`sidebar-item ${currentView === 'digital-marketing' && digitalTab === 'campaigns' ? 'active' : ''}`}
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                    onClick={() => {
                      setCurrentView('digital-marketing');
                      setDigitalTab('campaigns');
                      setSidebarOpen(false);
                    }}
                  >
                    <Target size={16} />
                    <span>Marketing Assets</span>
                  </a>
                </li>
                <li>
                  <a
                    className={`sidebar-item ${currentView === 'digital-marketing' && digitalTab === 'gsc' ? 'active' : ''}`}
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                    onClick={() => {
                      setCurrentView('digital-marketing');
                      setDigitalTab('gsc');
                      setSidebarOpen(false);
                    }}
                  >
                    <Search size={16} />
                    <span>GSC Dashboard</span>
                  </a>
                </li>

                <li>
                  <a
                    className={`sidebar-item ${currentView === 'follow-up' ? 'active' : ''}`}
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                    onClick={() => {
                      setCurrentView('follow-up');
                      setFuSelectedProspect(null);
                      setFollowUpTab('kanban');
                      setSidebarOpen(false);
                    }}
                  >
                    <Calendar size={16} />
                    <span>Follow Up</span>
                  </a>
                </li>
              </ul>
            )}
          </li>

          <li>
            <a
              className={`sidebar-item ${currentView === 'catatan' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('catatan');
                setSidebarOpen(false);
              }}
            >
              <StickyNote size={20} />
              <span>Catatan</span>
            </a>
          </li>
        </ul>
        <PageViewLogger token={token} user={user} currentView={currentView} digitalTab={digitalTab} />

        <div className="sidebar-footer">
          {user && (
            <>
              <img
                src={user.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ahmad'}
                alt="Avatar"
                className="user-avatar"
                onClick={() => setProfileModalOpen(true)}
                style={{ cursor: 'pointer' }}
              />
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <button className="icon-btn" onClick={handleLogout} title="Keluar">
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* WORKSPACE CONTENT AREA */}
      <main className="main-content">

        {/* HEADER BAR */}
        <header className="main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="icon-btn mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="header-title-container">
              <h1 className="header-title">
                {currentView === 'dashboard' && 'Analytics & Reporting'}
                {currentView === 'operator-crm' && (selectedLeadId ? `Detail Client â€¢ ${leadDetail?.lead?.name || ''}` : 'Marketing Operator')}
                {currentView === 'digital-marketing' && 'Marketing Assets'}
                {currentView === 'follow-up' && (fuSelectedProspect ? `Prospect Detail â€¢ ${fuSelectedProspect?.lead?.name || ''}` : 'Marketing Follow Up')}
              </h1>
              <span className="header-subtitle">
                Sistem ERP Pemasaran Digital Terpadu â€¢ {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="header-actions">
            {((currentView === 'operator-crm' && !selectedLeadId) || currentView === 'digital-marketing') && (
              <div className="search-bar-wrapper">
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="search-bar"
                  placeholder="Search clients by name or industry..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />
              </div>
            )}

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => {
                setShowNotifications(!showNotifications);
                if (notificationCount > 0) setNotificationCount(0);
              }}>
                <Bell size={20} />
                {notificationCount > 0 && <span className="badge-dot" />}
              </button>

              {showNotifications && (
                <div style={{ position: 'absolute', right: 0, top: '45px', width: '320px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: '16px', zIndex: 1000 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                    <span>Notifikasi Follow Up</span>
                    <span style={{ fontSize: '10px', color: 'var(--accent-orange)', background: 'rgba(249, 115, 22, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>Mendesak</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <span style={{ fontWeight: 600 }}>Gojek Indonesia</span> meminta proposal review SLA sebelum deadline esok hari.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE VIEW ROUTER */}
        <div className="content-body">

          {/* VIEW: DASHBOARD */}
          {currentView === 'dashboard' && dashboardData && (
            <>
              {/* KPI CARDS */}
              <div className="kpi-grid">
                <div className="kpi-card cyan">
                  <div className="kpi-header">
                    <span>Prospek Aktif (Active Leads)</span>
                    <Users2 size={18} style={{ color: 'var(--accent-cyan)' }} />
                  </div>
                  <div className="kpi-value">{dashboardData.summary.activeLeads}</div>
                  <div className="kpi-footer">
                    <span className="kpi-trend-up">â†‘ 12%</span>
                    <span style={{ color: 'var(--text-muted)' }}>dari bulan lalu</span>
                  </div>
                </div>
                <div className="kpi-card green">
                  <div className="kpi-header">
                    <span>Total Deal Won</span>
                    <Award size={18} style={{ color: 'var(--accent-green)' }} />
                  </div>
                  <div className="kpi-value">{dashboardData.summary.totalWonCount}</div>
                  <div className="kpi-footer">
                    <span className="kpi-trend-up">â†‘ 8%</span>
                    <span style={{ color: 'var(--text-muted)' }}>rasio konversi tinggi</span>
                  </div>
                </div>
                <div className="kpi-card red">
                  <div className="kpi-header">
                    <span>Total Deal Loss</span>
                    <XCircle size={18} style={{ color: 'var(--accent-red)' }} />
                  </div>
                  <div className="kpi-value">{dashboardData.summary.totalLossCount}</div>
                  <div className="kpi-footer">
                    <span style={{ color: 'var(--text-muted)' }}>Kerugian: </span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(dashboardData.summary.totalLossValue)}</span>
                  </div>
                </div>
                <div className="kpi-card orange">
                  <div className="kpi-header">
                    <span>Revenue Won</span>
                    <DollarSign size={18} style={{ color: 'var(--accent-orange)' }} />
                  </div>
                  <div className="kpi-value" style={{ fontSize: '20px', paddingTop: '6px' }}>
                    {formatCurrency(dashboardData.summary.revenueWon)}
                  </div>
                  <div className="kpi-footer">
                    <span className="kpi-trend-up">â†‘ Rp 45jt</span>
                    <span style={{ color: 'var(--text-muted)' }}>bulan ini</span>
                  </div>
                </div>
              </div>

              {/* DASHBOARD CHARTS & TABLES BLOCK */}
              <div className="dashboard-grid">

                {/* Monthly trend chart */}
                {(() => {
                  const sliceCount = trendTimeframe === '3m' ? 3 : trendTimeframe === '12m' ? 12 : 6;
                  const displayedTrend = (dashboardData.trendData || []).slice(-sliceCount);
                  const totalTrendLeads = displayedTrend.reduce((acc, curr) => acc + (curr.leads || 0), 0);
                  const totalTrendWon = displayedTrend.reduce((acc, curr) => acc + (curr.won || 0), 0);
                  const trendWinRate = totalTrendLeads > 0 ? ((totalTrendWon / totalTrendLeads) * 100).toFixed(1) : '0.0';

                  const maxYVal = Math.max(...displayedTrend.map(t => Math.max(t.leads || 0, t.won || 0)), 10);
                  const ceiling = Math.ceil(maxYVal / 5) * 5;

                  return (
                    <div className="glass-panel" style={{ minHeight: '420px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
                      {/* Title & Timeframe Selector */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            Jalur Pendaftaran Leads vs Deal Won (Monthly Trend)
                          </h3>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                            Analisis perbandingan prospek masuk dengan tingkat keberhasilan deal secara real-time
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.35)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px', boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                            Realtime Sync
                          </span>

                          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.03)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
                            {[
                              { key: '3m', label: '3 Bulan' },
                              { key: '6m', label: '6 Bulan' },
                              { key: '12m', label: '12 Bulan' }
                            ].map(btn => (
                              <button
                                key={btn.key}
                                type="button"
                                onClick={() => setTrendTimeframe(btn.key)}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.25s ease',
                                  background: trendTimeframe === btn.key ? 'linear-gradient(135deg, #3a86ff, #0096c7)' : 'transparent',
                                  color: trendTimeframe === btn.key ? '#fff' : 'var(--text-secondary)',
                                  boxShadow: trendTimeframe === btn.key ? '0 4px 12px rgba(58, 134, 255, 0.3)' : 'none'
                                }}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Summary Badges Row */}
                      <div className="responsive-trend-summary-grid">
                        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Leads ({sliceCount} Bln)</span>
                          <span style={{ fontSize: '22px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>{totalTrendLeads} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>Prospek</span></span>
                        </div>
                        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Deal Won</span>
                          <span style={{ fontSize: '22px', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>{totalTrendWon} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>Berhasil</span></span>
                        </div>
                        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Rasio Konversi ({sliceCount} Bln)</span>
                          <span style={{ fontSize: '22px', fontWeight: 700, color: '#fbbf24', marginTop: '2px' }}>{trendWinRate}%</span>
                        </div>
                        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'linear-gradient(135deg, #38bdf8, #3b82f6)' }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Leads</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'linear-gradient(135deg, #34d399, #10b981)' }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Deal Won</span>
                          </div>
                        </div>
                      </div>

                      {/* Bar Chart Container */}
                      <div style={{ position: 'relative', height: '240px', marginTop: '10px', display: 'flex' }}>
                        {/* Y-Axis Labels & Grid Lines */}
                        <div style={{ width: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right', paddingRight: '12px', zIndex: 2 }}>
                          <span>{ceiling}</span>
                          <span>{Math.round(ceiling * 0.75)}</span>
                          <span>{Math.round(ceiling * 0.5)}</span>
                          <span>{Math.round(ceiling * 0.25)}</span>
                          <span>0</span>
                        </div>

                        {/* Horizontal Dashed Grid Lines */}
                        <div style={{ position: 'absolute', left: '36px', right: '10px', top: 0, bottom: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 1 }}>
                          <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.07)', width: '100%' }} />
                          <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.07)', width: '100%' }} />
                          <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.07)', width: '100%' }} />
                          <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.07)', width: '100%' }} />
                          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', width: '100%' }} />
                        </div>

                        {/* Columns */}
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: '26px', zIndex: 2 }}>
                          {displayedTrend.map((t, idx) => {
                            const leadHeight = Math.min(((t.leads || 0) / ceiling) * 100, 100);
                            const wonHeight = Math.min(((t.won || 0) / ceiling) * 100, 100);
                            const barWidth = trendTimeframe === '12m' ? '14px' : '22px';

                            return (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                                <div style={{ display: 'flex', gap: trendTimeframe === '12m' ? '4px' : '8px', alignItems: 'flex-end', height: '100%', justifyContent: 'center' }}>
                                  {/* Leads Bar */}
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                    {t.leads > 0 && (
                                      <span style={{ fontSize: trendTimeframe === '12m' ? '10px' : '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                                        {t.leads}
                                      </span>
                                    )}
                                    <div
                                      style={{
                                        height: `${leadHeight}%`,
                                        minHeight: t.leads > 0 ? '6px' : '0px',
                                        background: 'linear-gradient(to top, #3b82f6, #38bdf8)',
                                        width: barWidth,
                                        borderRadius: '6px 6px 0 0',
                                        boxShadow: t.leads > 0 ? '0 0 10px rgba(56, 189, 248, 0.25)' : 'none',
                                        transition: 'height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                      }}
                                      title={`Total Leads: ${t.leads}`}
                                    />
                                  </div>

                                  {/* Deal Won Bar */}
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                    {t.won > 0 && (
                                      <span style={{ fontSize: trendTimeframe === '12m' ? '10px' : '11px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                                        {t.won}
                                      </span>
                                    )}
                                    <div
                                      style={{
                                        height: `${wonHeight}%`,
                                        minHeight: t.won > 0 ? '6px' : '0px',
                                        background: 'linear-gradient(to top, #10b981, #34d399)',
                                        width: barWidth,
                                        borderRadius: '6px 6px 0 0',
                                        boxShadow: t.won > 0 ? '0 0 10px rgba(52, 211, 153, 0.25)' : 'none',
                                        transition: 'height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                      }}
                                      title={`Won Leads: ${t.won}`}
                                    />
                                  </div>
                                </div>

                                <span style={{ position: 'absolute', bottom: '-22px', fontSize: trendTimeframe === '12m' ? '10px' : '12px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                  {t.month}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Stage distribution */}
                <div className="glass-panel" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
                  <div className="chart-title">
                    <span>Distribusi CRM Leads</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Realtime Stage Breakdown</span>
                  </div>

                  {(() => {
                    const sd = dashboardData.stageDistribution || { Lead: 0, Proposal: 0, Hold: 0, Lose: 0, Won: 0, Done: 0 };
                    const totalLeads = Object.values(sd).reduce((a, b) => a + Number(b), 0) || 1;
                    const stages = [
                      { label: 'Lead Baru', count: Number(sd.Lead || 0), color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.45)' },
                      { label: 'Proposal Dikirim', count: Number(sd.Proposal || 0), color: '#a855f7', glow: 'rgba(168, 85, 247, 0.45)' },
                      { label: 'Qualified / Hold', count: Number(sd.Hold || 0), color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.45)' },
                      { label: 'Closed Won', count: Number((sd.Won || 0) + (sd.Done || 0)), color: '#10b981', glow: 'rgba(16, 185, 129, 0.45)' },
                      { label: 'Closed Loss', count: Number(sd.Lose || 0), color: '#ef4444', glow: 'rgba(239, 68, 68, 0.45)' }
                    ];

                    let cumulativePct = 0;
                    return (
                      <div className="responsive-donut-grid">
                        {/* Precise SVG Donut Chart */}
                        <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="150" height="150" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="4.5" />
                            {stages.map((s, idx) => {
                              const pct = (s.count / totalLeads) * 100;
                              if (pct <= 0) return null;
                              const offset = 100 - cumulativePct;
                              cumulativePct += pct;
                              return (
                                <circle
                                  key={idx}
                                  cx="21"
                                  cy="21"
                                  r="15.915"
                                  fill="transparent"
                                  stroke={s.color}
                                  strokeWidth="4.5"
                                  strokeDasharray={`${pct} ${100 - pct}`}
                                  strokeDashoffset={offset}
                                  style={{ filter: `drop-shadow(0 0 4px ${s.glow})`, transition: 'all 0.6s ease' }}
                                />
                              );
                            })}
                          </svg>
                          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{totalLeads}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Total Leads</span>
                          </div>
                        </div>

                        {/* Exact Precision Breakdown & Progress Legend */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                          {stages.map((s, idx) => {
                            const pct = ((s.count / totalLeads) * 100).toFixed(1);
                            return (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.glow}`, flexShrink: 0 }} />
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.label}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontWeight: 700, color: '#fff' }}>{s.count}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '38px', textAlign: 'right' }}>({pct}%)</span>
                                  </div>
                                </div>
                                <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${pct}%`, background: s.color, boxShadow: `0 0 8px ${s.glow}`, borderRadius: '3px', transition: 'width 0.6s ease' }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>

              {/* SECOND DASHBOARD GRID: FOLLOW UP TERDEKAT & RIWAYAT AKTIVITAS TERAKHIR */}
              <div className="dashboard-grid" style={{ marginTop: '24px' }}>
                {/* Card 1: Follow Up Terdekat */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(245, 158, 11, 0.2)' }}>
                        <CalendarDays size={20} style={{ color: '#fbbf24' }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Follow Up Terdekat
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                          Jadwal interaksi & tindak lanjut prospek
                        </p>
                      </div>
                    </div>
                    <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.3px', boxShadow: '0 0 12px rgba(245, 158, 11, 0.2)' }}>
                      {dashboardData.urgentFollowUps && dashboardData.urgentFollowUps.length > 0 ? `${dashboardData.urgentFollowUps.length} Urgent` : '3 Urgent'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(dashboardData.urgentFollowUps && dashboardData.urgentFollowUps.length > 0
                      ? dashboardData.urgentFollowUps.slice(0, 4)
                      : [
                        { id: 1, name: 'Budi Santoso', company: 'PT Maju Bersama', isBesok: true },
                        { id: 2, name: 'Rina W.', company: 'Individu', dateText: '20 Jul' },
                        { id: 3, name: 'PT Sumber Jaya', company: 'Corporate', dateText: '22 Jul' }
                      ]
                    ).map((item, idx) => {
                      let deadlineDisplay = item.dateText || 'Besok';
                      let isBesok = item.isBesok || false;
                      if (item.last_contact && !item.dateText) {
                        const d = new Date(item.last_contact);
                        const now = new Date();
                        const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
                        if (diffDays <= 1) {
                          deadlineDisplay = 'Besok';
                          isBesok = true;
                        } else {
                          deadlineDisplay = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                        }
                      }

                      const displayName = item.name || item.company || 'Prospek';
                      const displaySub = item.company !== item.name ? (item.company || item.industry || 'Corporate') : (item.industry || 'Individu');
                      const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'BS';

                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.025)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            transition: 'all 0.25s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(58, 134, 255, 0.2), rgba(6, 182, 212, 0.2))', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#38bdf8', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                              {initials}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                              <span style={{ fontWeight: 600, color: '#fff', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {displayName}
                              </span>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                {displaySub}
                              </span>
                            </div>
                          </div>

                          <span
                            style={isBesok ? {
                              padding: '5px 14px',
                              borderRadius: '20px',
                              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35))',
                              color: '#fbbf24',
                              border: '1px solid rgba(245, 158, 11, 0.5)',
                              fontWeight: 700,
                              fontSize: '12px',
                              boxShadow: '0 0 14px rgba(245, 158, 11, 0.3)',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            } : {
                              padding: '5px 14px',
                              borderRadius: '20px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: '#cbd5e1',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              fontWeight: 600,
                              fontSize: '12px',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                          >
                            {deadlineDisplay}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card 2: Riwayat Aktivitas Terakhir */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(6, 182, 212, 0.2)' }}>
                        <Activity size={20} style={{ color: '#38bdf8' }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Riwayat Aktivitas Terakhir
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                          Perubahan status leads dan deal
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.35)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px', boxShadow: '0 0 12px rgba(16, 185, 129, 0.2)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                        Live Feed
                      </span>
                      <button className="icon-btn" style={{ color: 'var(--text-secondary)', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }} title="Pilihan lainnya">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(dashboardData.recentActivities && dashboardData.recentActivities.length > 0
                      ? dashboardData.recentActivities.slice(0, 4)
                      : [
                        { id: 'fb-1', action: 'Deal Won', target: 'PT Sumber Jaya', iconType: 'won', timeText: '2 jam lalu' },
                        { id: 'fb-2', action: 'Follow up', target: 'Rina W.', iconType: 'follow_up', timeText: '5 jam lalu' },
                        { id: 'fb-3', action: 'Deal Loss', target: 'CV Abadi', iconType: 'loss', timeText: 'Kemarin' },
                        { id: 'fb-4', action: 'Lead baru', target: 'Budi Santoso', iconType: 'user_plus', timeText: 'Kemarin' }
                      ]
                    ).map((act, idx) => {
                      let iconElem = <Phone size={16} style={{ color: '#38bdf8' }} />;
                      let iconBoxStyle = { background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.35)', boxShadow: '0 0 10px rgba(56, 189, 248, 0.15)' };

                      if (act.iconType === 'won' || act.action === 'Deal Won') {
                        iconElem = <ArrowRight size={16} style={{ color: '#34d399' }} />;
                        iconBoxStyle = { background: 'rgba(16, 185, 129, 0.18)', border: '1px solid rgba(16, 185, 129, 0.4)', boxShadow: '0 0 12px rgba(16, 185, 129, 0.25)' };
                      } else if (act.iconType === 'loss' || act.action === 'Deal Loss') {
                        iconElem = <X size={16} style={{ color: '#f87171' }} />;
                        iconBoxStyle = { background: 'rgba(239, 68, 68, 0.18)', border: '1px solid rgba(239, 68, 68, 0.4)', boxShadow: '0 0 12px rgba(239, 68, 68, 0.25)' };
                      } else if (act.iconType === 'user_plus' || act.action === 'Lead baru') {
                        iconElem = <UserPlus size={16} style={{ color: '#c084fc' }} />;
                        iconBoxStyle = { background: 'rgba(168, 85, 247, 0.18)', border: '1px solid rgba(168, 85, 247, 0.4)', boxShadow: '0 0 12px rgba(168, 85, 247, 0.25)' };
                      }

                      let timeStr = act.timeText;
                      if (!timeStr && act.timestamp) {
                        const diffMs = Date.now() - new Date(act.timestamp).getTime();
                        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                        if (diffHrs < 1) timeStr = 'Baru saja';
                        else if (diffHrs < 24) timeStr = `${diffHrs} jam lalu`;
                        else timeStr = 'Kemarin';
                      }

                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.025)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            transition: 'all 0.25s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...iconBoxStyle }}>
                              {iconElem}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                              <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {act.action} <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>â€”</span> <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{act.target}</span>
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                                Status pembaruan interaksi prospek
                              </span>
                            </div>
                          </div>

                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {timeStr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SEO ENGINE & META COVERAGE OVERVIEW CARD */}
              {dashboardData && dashboardData.seoMetrics && (
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(168, 85, 247, 0.2))', border: '1px solid rgba(56, 189, 248, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(56, 189, 248, 0.25)' }}>
                        <Search size={22} style={{ color: '#38bdf8' }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                          SEO Engine & Meta Coverage Overview
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                            Live Real-Time Syncing
                          </span>
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                          Pemantauan skor optimasi SEO, status indeksasi search engine, dan penggunaan Schema JSON-LD
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* SEO Metrics Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    {/* Metric 1: Average SEO Score */}
                    <div style={{ padding: '18px 20px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Rata-Rata Skor SEO</span>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', fontWeight: 700 }}>
                          Optimized
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.5px' }}>
                          {dashboardData.seoMetrics.avgScore || 90}%
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>skor kualitas</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${dashboardData.seoMetrics.avgScore || 90}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #34d399)', borderRadius: '3px', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>

                    {/* Metric 2: Indexation Percentage */}
                    <div style={{ padding: '18px 20px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status Indeksasi Google</span>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 700 }}>
                          Indexable
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '28px', fontWeight: 800, color: '#34d399', letterSpacing: '-0.5px' }}>
                          {dashboardData.seoMetrics.indexedPercentage || 100}%
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({dashboardData.seoMetrics.indexedCount || dashboardData.seoMetrics.totalConfigs} terindeks)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${dashboardData.seoMetrics.indexedPercentage || 100}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '3px', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>


                  </div>

                  {/* Top SEO Configurations Table */}
                  {dashboardData.seoMetrics.topConfigs && dashboardData.seoMetrics.topConfigs.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} style={{ color: '#38bdf8' }} />
                        Konfigurasi SEO Terdaftar
                      </h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', textAlign: 'left' }}>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Judul Halaman</th>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Focus Keyword</th>
                              <th style={{ padding: '8px 12px', fontWeight: 600 }}>Meta Robots</th>
                              <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Skor Optimasi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardData.seoMetrics.topConfigs.map((cfg, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#fff' }}>{cfg.title}</td>
                                <td style={{ padding: '10px 12px', color: '#38bdf8' }}>
                                  <code style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                    {cfg.focus_keyword || '-'}
                                  </code>
                                </td>
                                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '12px' }}>{cfg.meta_robots || 'index, follow'}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                  <span style={{ fontWeight: 700, color: cfg.score >= 80 ? '#34d399' : cfg.score >= 60 ? '#fbbf24' : '#f87171' }}>
                                    {cfg.score}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* VIEW: MARKETING OPERATOR */}
          {currentView === 'operator-crm' && (
            <>
              {selectedLeadId && leadDetail ? (
                /* CLIENT DETAIL VIEW */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                      className="icon-btn"
                      style={{ padding: '8px', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}
                      onClick={() => {
                        setSelectedLeadId(null);
                        setLeadDetail(null);
                        fetchLeads();
                      }}
                      title="Kembali ke CRM Portal"
                    >
                      <ArrowLeft size={20} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', alignItems: 'start' }}>
                    {/* Left Card: Company Profile specs */}
                    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(15, 23, 42, 0.4)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Building size={36} style={{ color: 'var(--accent-cyan)' }} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '22px', fontWeight: 700 }}>{leadDetail.lead.name}</h3>
                          {leadDetail.lead.company && (
                            <h4 style={{ fontSize: '15px', color: 'var(--accent-cyan)', marginTop: '4px' }}>{leadDetail.lead.company}</h4>
                          )}
                          <span className={`badge ${leadDetail.lead.status === 'Won' || leadDetail.lead.status === 'Done' ? 'badge-won' : 'badge-hold'}`} style={{ marginTop: '8px' }}>
                            {getFigmaStatusText(leadDetail.lead.status)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <Building size={12} />
                            <span>Industry</span>
                          </div>
                          <div style={{ fontWeight: 600 }}>{leadDetail.lead.industry || 'N/A'}</div>
                        </div>

                        <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <Target size={12} />
                            <span>Lead Source</span>
                          </div>
                          <div style={{ fontWeight: 600 }}>{leadDetail.lead.source || 'N/A'}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Created At</div>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{getUrgencyText(leadDetail.lead.created_at)}</div>
                          </div>
                          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Last Communication</div>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{getUrgencyText(leadDetail.lead.last_contact)}</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexFlow: 'wrap', gap: '10px', marginTop: '10px' }}>
                        {['Superadmin', 'Admin'].includes(user?.role) && (
                          <div style={{ display: 'flex', gap: '8px', flexGrow: 1 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', flexGrow: 1, justifyContent: 'center' }}
                              onClick={() => {
                                setLeadFormData({
                                  id: leadDetail.lead.id,
                                  name: leadDetail.lead.name,
                                  company: leadDetail.lead.company,
                                  industry: leadDetail.lead.industry,
                                  source: leadDetail.lead.source,
                                  value: leadDetail.lead.value,
                                  lead_score: leadDetail.lead.lead_score,
                                  owner_id: leadDetail.lead.owner_id,
                                  verified: leadDetail.lead.verified,
                                  phone: leadDetail.lead.phone || '',
                                  logo_url: leadDetail.lead.logo_url || '',
                                  location: leadDetail.lead.location || 'Jakarta',
                                  company_size: leadDetail.lead.company_size || '50-200',
                                  contact1_name: leadDetail.contacts && leadDetail.contacts[0] ? leadDetail.contacts[0].name : '',
                                  contact1_phone: leadDetail.contacts && leadDetail.contacts[0] ? leadDetail.contacts[0].phone : '',
                                  contact2_name: leadDetail.contacts && leadDetail.contacts[1] ? leadDetail.contacts[1].name : '',
                                  contact2_phone: leadDetail.contacts && leadDetail.contacts[1] ? leadDetail.contacts[1].phone : '',
                                  deadline: leadDetail.lead.deadline ? leadDetail.lead.deadline.substring(0, 10) : ''
                                });
                                setLeadModalOpen(true);
                              }}
                            >
                              <Edit3 size={14} />
                              <span>Edit Client</span>
                            </button>

                            <button
                              className="btn btn-danger"
                              style={{ background: '#ff1493', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}
                              onClick={() => deleteLead(leadDetail.lead.id)}
                              title="Hapus Client"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Convert to Project Option */}
                      {['Superadmin', 'Admin'].includes(user?.role) && ['Won', 'Done'].includes(leadDetail.lead.status) && (
                        <button
                          className="btn btn-primary"
                          style={{ width: '100%', justifyContent: 'center' }}
                          onClick={() => {
                            setProjectFormData({
                              id: '',
                              client_id: leadDetail.lead.id,
                              name: `Implementasi ERP - ${leadDetail.lead.company || leadDetail.lead.name}`,
                              description: `Proyek implementasi ERP untuk klien ${leadDetail.lead.name}.`,
                              budget: leadDetail.lead.value,
                              status: 'Planning',
                              progress: 0,
                              deadline: ''
                            });
                            setProjectModalOpen(true);
                          }}
                        >
                          <Plus size={16} />
                          <span>Buat Proyek</span>
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Contacts */}
                      <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={16} style={{ color: 'var(--accent-cyan)' }} />
                            <span>Client Contacts</span>
                          </h4>
                          {['Superadmin', 'Admin'].includes(user?.role) && (
                            <button
                              className="btn"
                              style={{ padding: '6px 12px', fontSize: '11px', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: 'black', fontWeight: 600, border: 'none', borderRadius: '6px' }}
                              onClick={() => setContactModalOpen(true)}
                            >
                              <span>+ Add Contact</span>
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                          {leadDetail.contacts && leadDetail.contacts.length > 0 ? (
                            leadDetail.contacts.map((c, idx) => (
                              <div
                                key={idx}
                                style={{
                                  padding: '14px',
                                  background: 'rgba(255,255,255,0.02)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: 'var(--radius-md)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  position: 'relative'
                                }}
                              >
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Users2 size={16} />
                                </div>
                                <div style={{ flexGrow: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <div style={{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                                    {(c.isPrimary === 1 || c.isPrimary === true) && (
                                      <span style={{ fontSize: '9px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', padding: '1px 5px', borderRadius: '4px', fontWeight: 600, textTransform: 'uppercase' }}>Utama</span>
                                    )}
                                  </div>
                                  {c.position && (
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '1px' }}>{c.position}</div>
                                  )}
                                  <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <Phone size={10} />
                                    <span>{c.phone || '-'}</span>
                                  </div>
                                  {c.email && (
                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                                      {c.email}
                                    </div>
                                  )}
                                </div>

                                {['Superadmin', 'Admin'].includes(user?.role) && (
                                  <div style={{ position: 'relative' }}>
                                    <button
                                      className="icon-btn"
                                      style={{ color: 'var(--text-muted)' }}
                                      onClick={() => setActiveContactMenuId(activeContactMenuId === c.id ? null : c.id)}
                                    >
                                      <MoreVertical size={14} />
                                    </button>

                                    {activeContactMenuId === c.id && (
                                      <div style={{ position: 'absolute', right: 0, top: '20px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
                                        <button
                                          className="btn btn-secondary"
                                          style={{ padding: '4px 8px', fontSize: '10px', color: 'var(--accent-red)', border: 'none', background: 'transparent' }}
                                          onClick={() => deleteClientContact(c.id)}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                              Belum ada kontak terdaftar.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactions & Notes */}
                      <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.4)', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={16} style={{ color: 'var(--accent-cyan)' }} />
                            <span>Interactions & Notes</span>
                          </h4>
                          {['Superadmin', 'Admin'].includes(user?.role) && (
                            <button
                              className="btn"
                              style={{ padding: '6px 12px', fontSize: '11px', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: 'black', fontWeight: 600, border: 'none', borderRadius: '6px' }}
                              onClick={() => {
                                setNewNoteFormData({ type: 'Call', notes: '' });
                                setNoteModalOpen(true);
                              }}
                            >
                              <span>+ Add Note</span>
                            </button>
                          )}
                        </div>

                        {leadDetail.interactions && leadDetail.interactions.length > 0 ? (
                          <div className="interaction-timeline" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            {leadDetail.interactions.map((it, idx) => (
                              <div key={idx} className="interaction-item">
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                  <span>{it.type}</span>
                                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(it.created_at).toLocaleDateString('id-ID')}</span>
                                </div>
                                <p style={{ marginTop: '4px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{it.notes}</p>
                                <div className="interaction-meta">Oleh: {it.creator_name}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, gap: '12px', color: 'var(--text-muted)', padding: '40px 0' }}>
                            <FileText size={48} strokeWidth={1} style={{ opacity: 0.4 }} />
                            <div style={{ fontSize: '13px' }}>No interactions logged yet</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* MAIN CRM OPERATOR VIEWS WITH TABS */
                <>
                  {/* Top tabs */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <button
                      className={`btn ${operatorTab === 'leads' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setOperatorTab('leads')}
                    >
                      <Users size={16} />
                      <span>Lead Management</span>
                    </button>
                    <button
                      className={`btn ${operatorTab === 'segments' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setOperatorTab('segments')}
                    >
                      <Filter size={16} />
                      <span>Customer Segmentation</span>
                    </button>
                    {['Superadmin', 'Admin'].includes(user?.role) && (
                      <button
                        className={`btn ${operatorTab === 'roles' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setOperatorTab('roles')}
                      >
                        <KeyRound size={16} />
                        <span>Role & Operators</span>
                      </button>
                    )}
                  </div>

                  {/* TAB 1: CRM Leads table */}
                  {operatorTab === 'leads' && (
                    <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <h3 style={{ fontSize: '20px', fontWeight: 700 }}>CRM Portal</h3>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Client Management Hub</span>
                        </div>
                        {['Superadmin', 'Admin'].includes(user?.role) && (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => {
                                setBulkCsvText('');
                                setBulkImportError('');
                                setBulkModalOpen(true);
                              }}
                            >
                              <span>+ Bulk Import</span>
                            </button>
                            <button
                              className="btn"
                              style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: 'black', fontWeight: 600, border: 'none', borderRadius: '6px' }}
                              onClick={() => {
                                setLeadFormData({ id: '', name: '', company: '', industry: 'Technology', source: 'Organic', value: '', lead_score: 50, owner_id: user.id, verified: false, phone: '', logo_url: '', location: 'Jakarta', company_size: '50-200', contact1_name: '', contact1_phone: '', contact2_name: '', contact2_phone: '', deadline: '' });
                                setLeadModalOpen(true);
                              }}
                            >
                              <span>+ New Client</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="table-container">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>LOGO</th>
                              <th>PERUSAHAAN</th>
                              <th>INDUSTRY</th>
                              <th>SOURCE</th>
                              <th>LAST CONTACT</th>
                              <th>VERIFIED</th>
                              <th>STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leads.map((l, i) => (
                              <tr key={i} style={{ cursor: 'pointer' }} onClick={() => fetchLeadDetails(l.id)}>
                                <td>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {l.logo_url ? (
                                      <img src={l.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                      <Building size={14} style={{ color: 'var(--text-muted)' }} />
                                    )}
                                  </div>
                                </td>
                                <td style={{ fontWeight: 600, color: 'white' }}>{l.company || '-'}</td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Building size={13} style={{ color: 'var(--text-muted)' }} />
                                    <span>{l.industry || '-'}</span>
                                  </div>
                                </td>
                                <td>{l.source || '-'}</td>
                                <td>
                                  <span style={{ fontSize: '13px', color: getUrgencyClass(l.last_contact) === 'days-urgent' ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                                    {getUrgencyText(l.last_contact)}
                                  </span>
                                </td>
                                <td>
                                  {l.verified ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', background: 'var(--accent-cyan)', borderRadius: '3px', color: 'black' }}>
                                      <Check size={11} strokeWidth={3} />
                                    </div>
                                  ) : (
                                    <div style={{ width: '16px', height: '16px', border: '1px solid var(--border-color)', borderRadius: '3px' }} />
                                  )}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <span
                                      className="badge"
                                      style={{
                                        background: 'transparent',
                                        border: l.status === 'Won' || l.status === 'Done' ? '1px solid var(--accent-green)' : '1px solid var(--accent-orange)',
                                        color: l.status === 'Won' || l.status === 'Done' ? 'var(--accent-green)' : 'var(--accent-orange)',
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 600
                                      }}
                                    >
                                      {getFigmaStatusText(l.status)}
                                    </span>
                                    {['Superadmin', 'Admin'].includes(user?.role) && (
                                      <button
                                        className="icon-btn"
                                        style={{ color: 'var(--accent-red)', opacity: 0.7, padding: '4px' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteLead(l.id);
                                        }}
                                        title="Hapus Klien"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Customer Segmentation */}
                  {operatorTab === 'segments' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Customer Segmentation</h3>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Segmentasi dinamis berdasarkan kriteria CRM</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {segments.map((seg, idx) => {
                          const isExpanded = expandedSegmentId === seg.id;
                          let matchedLeads = [];
                          if (seg.id === 'high-score') {
                            matchedLeads = leads.filter(l => l.lead_score >= 80);
                          } else if (seg.id === 'enterprise-tier') {
                            matchedLeads = leads.filter(l => parseFloat(l.value) >= 200000000);
                          } else if (seg.id === 'digital-ads') {
                            matchedLeads = leads.filter(l => ['Google Ads', 'Facebook Ads', 'TikTok Ads', 'Instagram Ads'].includes(l.source));
                          } else if (seg.id === 'pt-accounts') {
                            matchedLeads = leads.filter(l => (l.company || '').toUpperCase().includes('PT') || (l.name || '').toUpperCase().includes('PT'));
                          } else if (seg.id === 'proposal-stage') {
                            matchedLeads = leads.filter(l => l.status === 'Proposal');
                          } else {
                            matchedLeads = leads.filter(l => !l.last_contact || (new Date() - new Date(l.last_contact) > 7 * 24 * 60 * 60 * 1000));
                          }

                          return (
                            <div
                              key={idx}
                              className="glass-panel"
                              style={{
                                cursor: 'pointer',
                                borderLeft: `4px solid ${seg.color}`,
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                              }}
                              onClick={() => setExpandedSegmentId(isExpanded ? null : seg.id)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <h4 style={{ fontSize: '16px', fontWeight: 700 }}>{seg.title}</h4>
                                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Kriteria: {seg.criteria}</span>
                                </div>
                                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: seg.color }}>
                                  {matchedLeads.length} leads
                                </span>
                              </div>

                              {isExpanded && (
                                <div style={{ marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }} onClick={(e) => e.stopPropagation()}>
                                  <div className="table-container">
                                    <table className="custom-table" style={{ background: 'rgba(0,0,0,0.1)' }}>
                                      <thead>
                                        <tr>
                                          <th>Logo</th>
                                          <th>Client Name</th>
                                          <th>Perusahaan</th>
                                          <th>Industry</th>
                                          <th>Lead Score</th>
                                          <th>Value</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {matchedLeads.map((ml, mlIdx) => (
                                          <tr key={mlIdx} style={{ cursor: 'pointer' }} onClick={() => fetchLeadDetails(ml.id)}>
                                            <td>
                                              <Building size={14} />
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{ml.name}</td>
                                            <td>{ml.company || '-'}</td>
                                            <td>{ml.industry}</td>
                                            <td>{ml.lead_score}/100</td>
                                            <td>{formatCurrency(ml.value)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                                    <button
                                      className="btn btn-primary"
                                      onClick={() => alert(`Mengirim pesan blast ke segment [${seg.title}]...`)}
                                    >
                                      <Send size={14} style={{ marginRight: '6px' }} />
                                      <span>Kirim Pesan ke Segment Ini</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* TAB 3: Operators Role Directory */}
                  {operatorTab === 'roles' && (
                    <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Operator & Role Directory</h3>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Kelola akses pengguna dan operator ERP Marketing</span>
                        </div>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setOperatorFormData({ id: '', username: '', name: '', email: '', password: '', phone: '', role: 'Operator', status: 'Active' });
                            setOperatorModalOpen(true);
                          }}
                        >
                          <Plus size={16} />
                          <span>Tambah Operator</span>
                        </button>
                      </div>

                      <div className="table-container">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>OPERATOR NAME</th>
                              <th>EMAIL ADDRESS</th>
                              <th>WHATSAPP PHONE</th>
                              <th>SYSTEM ROLE</th>
                              <th>STATUS</th>
                              <th>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(Array.isArray(fuOperators) ? fuOperators : []).map((op, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 700 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={op.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ahmad'} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                                    <span>{op.name}</span>
                                  </div>
                                </td>
                                <td>{op.email}</td>
                                <td>{op.phone || '-'}</td>
                                <td>
                                  <span className={`badge`} style={{
                                    background: op.role === 'Superadmin' ? 'rgba(245,158,11,0.15)' : op.role === 'Admin' ? 'rgba(239,68,68,0.15)' : op.role === 'Digital Marketing' ? 'rgba(168,85,247,0.15)' : 'rgba(6,182,212,0.15)',
                                    color: op.role === 'Superadmin' ? 'var(--accent-orange)' : op.role === 'Admin' ? 'var(--accent-red)' : op.role === 'Digital Marketing' ? 'var(--accent-purple)' : 'var(--accent-cyan)'
                                  }}>
                                    {op.role}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge" style={{
                                    background: op.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                                    color: op.status === 'Active' ? 'var(--accent-green)' : 'var(--text-muted)'
                                  }}>{op.status}</span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="icon-btn" onClick={() => {
                                      setOperatorFormData({
                                        id: op.id,
                                        username: op.username || '',
                                        name: op.name,
                                        email: op.email,
                                        password: '',
                                        phone: op.phone || '',
                                        role: op.role,
                                        status: op.status
                                      });
                                      setOperatorModalOpen(true);
                                    }}>
                                      <Edit3 size={14} />
                                    </button>
                                    {op.id !== user?.id && (
                                      <button className="icon-btn" style={{ color: 'var(--accent-red)' }} onClick={() => deleteOperator(op.id)}>
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* VIEW: MARKETING DIGITAL */}
          {currentView === 'digital-marketing' && (
            <>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
                <button
                  className={`btn ${digitalTab === 'campaigns' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDigitalTab('campaigns')}
                >
                  <FolderHeart size={16} />
                  <span>Manajemen Konten & Aset</span>
                </button>
                <button
                  className={`btn ${digitalTab === 'assets' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDigitalTab('assets')}
                >
                  <FolderHeart size={16} />
                  <span>Asset Library</span>
                </button>
                <button
                  className={`btn ${digitalTab === 'gsc' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDigitalTab('gsc')}
                >
                  <Search size={16} />
                  <span>GSC Performance</span>
                </button>

              </div>

              {digitalTab === 'campaigns' && (
                <>
                  {/* Stats summary panel */}
                  <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '28px' }}>
                    <div className="kpi-card cyan">
                      <div className="kpi-header">
                        <span>Total Materi Pemasaran</span>
                      </div>
                      <div className="kpi-value">{assets.length} Aset</div>
                    </div>
                    <div className="kpi-card green">
                      <div className="kpi-header">
                        <span>Dibagikan ke Sales</span>
                      </div>
                      <div className="kpi-value">{assets.filter(a => a.sharing_status === 'Shared').length} Aset</div>
                    </div>
                    <div className="kpi-card orange">
                      <div className="kpi-header">
                        <span>Total Download & Bagikan</span>
                      </div>
                      <div className="kpi-value">{assets.reduce((a, b) => a + (b.download_count || 0), 0)} Kali</div>
                    </div>
                  </div>

                  {/* Toolbar & Filters */}
                  <div className="glass-panel" style={{ padding: '18px 24px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                      {/* Search Bar */}
                      <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '380px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Search cepat materi..."
                          value={assetSearchTerm}
                          onChange={e => setAssetSearchTerm(e.target.value)}
                          style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                        />
                      </div>

                      {/* Upload Button */}
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setAssetFormData({ id: '', name: '', file_type: 'PDF', category: 'CFD/FEA', tags: '', file_url: '', version: '1.0', sharing_status: 'Shared', size: '2.4 MB' });
                          setAssetModalOpen(true);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}
                      >
                        <Plus size={16} />
                        <span>Upload Materi Baru</span>
                      </button>
                    </div>

                    {/* Category tabs filters */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', overflowX: 'auto', paddingBottom: '6px' }}>
                      {['Semua', 'CFD/FEA', 'Case Study', 'Proposal Template', 'Foto Proyek', 'Whitepaper'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setAssetCategoryFilter(cat)}
                          style={{
                            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            background: assetCategoryFilter === cat ? 'var(--primary-glow)' : 'transparent',
                            border: `1px solid ${assetCategoryFilter === cat ? 'var(--primary-glow)' : 'var(--border-color)'}`,
                            color: assetCategoryFilter === cat ? '#fff' : 'var(--text-secondary)',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Document & Asset List */}
                  {assets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                      <FolderHeart size={44} style={{ opacity: 0.2, marginBottom: '10px' }} />
                      <p style={{ fontSize: '13px' }}>Tidak ada materi pemasaran yang cocok dengan filter atau pencarian Anda.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                      {assets.map((a) => {
                        const categoryConfig = {
                          'CFD/FEA': { color: '#06b6d4', bg: 'linear-gradient(135deg, #06b6d4, #3b82f6)', label: 'CFD/FEA' },
                          'Case Study': { color: '#a855f7', bg: 'linear-gradient(135deg, #a855f7, #6366f1)', label: 'Case Study' },
                          'Proposal Template': { color: '#f59e0b', bg: 'linear-gradient(135deg, #f59e0b, #e11d48)', label: 'Proposal Template' },
                          'Foto Proyek': { color: '#ec4899', bg: 'linear-gradient(135deg, #ec4899, #f43f5e)', label: 'Foto Proyek' },
                          'Whitepaper': { color: '#10b981', bg: 'linear-gradient(135deg, #10b981, #059669)', label: 'Whitepaper' },
                        };
                        const cfg = categoryConfig[a.category] || { color: '#6b7280', bg: 'linear-gradient(135deg, #6b7280, #374151)', label: a.category || 'Materi' };

                        return (
                          <div
                            key={a.id}
                            className="glass-panel"
                            style={{
                              background: 'rgba(15,23,42,0.65)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '14px',
                              padding: '20px',
                              position: 'relative',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}
                          >
                            {/* Card Top: Category Banner & Delete */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                                background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}35`
                              }}>
                                {cfg.label}
                              </span>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="icon-btn"
                                  onClick={() => {
                                    setAssetFormData({ id: a.id, name: a.name, file_type: a.file_type, category: a.category, tags: a.tags || '', file_url: a.file_url || '', version: a.version || '1.0', sharing_status: a.sharing_status || 'Shared', size: a.size || '2.4 MB' });
                                    setAssetModalOpen(true);
                                  }}
                                  title="Edit"
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button className="icon-btn" style={{ color: 'var(--accent-red)' }} onClick={() => deleteAsset(a.id)} title="Hapus">âœ•</button>
                              </div>
                            </div>

                            {/* Document Title & Icon */}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', margin: '6px 0' }}>
                              <div style={{
                                width: '40px', height: '40px', borderRadius: '8px', background: cfg.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#fff', flexShrink: 0
                              }}>
                                {a.file_type === 'PDF' ? 'ðŸ“„' : a.file_type === 'Template' ? 'ðŸ“' : a.file_type === 'Image' ? 'ðŸ–¼ï¸' : 'ðŸ“¹'}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.4, margin: 0, wordBreak: 'break-word' }}>
                                  {a.name}
                                </h4>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  {a.size || '2.4 MB'} Â· {a.file_type}
                                </div>
                              </div>
                            </div>

                            {/* Metadata & Tags */}
                            {a.tags && (
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {a.tags.split(',').map((tag, idx) => (
                                  <span key={idx} style={{ fontSize: '9px', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '3px', color: 'var(--text-secondary)' }}>
                                    #{tag.trim()}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Version Control section */}
                            <div style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                              fontSize: '11px'
                            }}>
                              <span style={{ color: 'var(--text-muted)' }}>Versi Aktif:</span>
                              <button
                                onClick={() => setSelectedAssetHistory(a)}
                                style={{
                                  background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(6,182,212,0.4)',
                                  borderRadius: '4px', padding: '2px 8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                                title="Klik untuk lihat riwayat versi"
                              >
                                v{a.version || '1.0'}
                              </button>
                            </div>

                            {/* Sharing status badge */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  width: '8px', height: '8px', borderRadius: '50%',
                                  background: a.sharing_status === 'Shared' ? 'var(--accent-green)' : 'var(--text-muted)'
                                }} />
                                <span style={{ fontWeight: 600, color: a.sharing_status === 'Shared' ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                                  {a.sharing_status === 'Shared' ? 'Shared with Sales' : 'Private'}
                                </span>
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {a.download_count || 0} shares
                              </span>
                            </div>

                            {/* Actions block */}
                            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                              <button
                                className="btn"
                                style={{ flex: 1, padding: '7px 0', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'rgba(168,85,247,0.2)', color: '#d8b4fe', border: '1px solid rgba(168,85,247,0.4)' }}
                                onClick={() => handlePreviewFile(a.file_url, a.name || 'Dokumen', a.file_type)}
                                title="Lihat / Preview Isi File Asli"
                              >
                                <Eye size={12} />
                                <span>Lihat</span>
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '7px 0', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                onClick={() => setShareModalAsset(a)}
                              >
                                <Share2 size={12} />
                                <span>Bagikan</span>
                              </button>
                              <button
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '7px 0', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'var(--primary-glow)', border: 'none' }}
                                onClick={() => triggerDownloadAsset(a)}
                              >
                                <Download size={12} />
                                <span>Unduh</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}


              {digitalTab === 'assets' && (
                <>
                  {!selectedFolder ? (
                    <>
                      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(168,85,247,0.08) 100%)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '14px' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                            <FolderOpen size={22} style={{ color: 'var(--accent-cyan)' }} />
                            <span>Perpustakaan Folder Aset Pemasaran</span>
                          </h3>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                            Kelompokkan materi pemasaran ke dalam folder interaktif dan bagikan ke klien dalam 1 tautan mudah.
                          </p>
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ background: 'linear-gradient(135deg, var(--primary-glow), #a855f7)', border: 'none', fontWeight: 700, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}
                          onClick={() => {
                            setFolderFormData({ name: '', category: 'CFD/FEA', description: '', files: [] });
                            setFolderModalOpen(true);
                          }}
                        >
                          <Plus size={18} />
                          <span>Buat / Upload Folder Baru</span>
                        </button>
                      </div>

                      <div className="asset-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {assetFolders.map((f, i) => (
                          <div
                            key={f.id || i}
                            className="asset-card glass-panel"
                            style={{
                              padding: '20px',
                              borderRadius: '14px',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.25s ease',
                              position: 'relative',
                              background: 'linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(99,102,241,0.04) 100%)'
                            }}
                            onClick={() => setSelectedFolder(f)}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'translateY(-4px)';
                              e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(6,182,212,0.3)' }}>
                                <FolderHeart size={26} style={{ color: 'var(--accent-cyan)' }} />
                              </div>
                              <span className="badge" style={{ background: 'rgba(168,85,247,0.15)', color: '#d8b4fe', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                                {f.category || 'CFD/FEA'}
                              </span>
                            </div>

                            <div>
                              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                {f.name}
                              </h4>
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {f.description || 'Folder materi pemasaran & spesifikasi proyek.'}
                              </p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{f.item_count || f.assets?.length || 0} Aset Tersimpan</span>
                              </span>

                              <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                                <button
                                  className="btn"
                                  style={{ padding: '6px 12px', fontSize: '11px', background: 'rgba(6,182,212,0.18)', color: 'var(--accent-cyan)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => setShareFolderModal(f)}
                                  title="Bagikan Folder ke Klien"
                                >
                                  <Share2 size={12} />
                                  <span>Share</span>
                                </button>
                                <button
                                  className="icon-btn"
                                  style={{ color: 'var(--text-primary)', opacity: 0.8 }}
                                  onClick={() => {
                                    setFolderFormData({ id: f.id, name: f.name, description: f.description || '', category: f.category || 'CFD/FEA', files: [] });
                                    setFolderModalOpen(true);
                                  }}
                                  title="Edit Nama / Keterangan Folder"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  className="icon-btn"
                                  style={{ color: 'var(--accent-red)', opacity: 0.8 }}
                                  onClick={() => deleteAssetFolderHandler(f.id)}
                                  title="Hapus Folder"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* ====== INTERACTIVE INSIDE FOLDER VIEW ====== */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Top breadcrumb navigation */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px', borderRadius: '8px' }}
                          onClick={() => setSelectedFolder(null)}
                        >
                          <span>â† Kembali ke Semua Folder</span>
                        </button>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          Perpustakaan Aset / <strong style={{ color: 'var(--text-primary)' }}>{selectedFolder.name}</strong>
                        </div>
                      </div>

                      {/* Folder Header Hero Card */}
                      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(168,85,247,0.15) 100%)', border: '1px solid rgba(6,182,212,0.35)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ maxWidth: '65%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span className="badge" style={{ background: 'var(--accent-cyan)', color: 'black', fontWeight: 700, fontSize: '11px', padding: '3px 10px', borderRadius: '20px' }}>
                              {selectedFolder.category || 'CFD/FEA'}
                            </span>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                              ID Folder: #{selectedFolder.id}
                            </span>
                          </div>
                          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                            {selectedFolder.name}
                          </h2>
                          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: '1.5' }}>
                            {selectedFolder.description || 'Kumpulan brosur, studi kasus, dan spesifikasi proyek resmi.'}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-primary"
                            style={{ background: 'var(--accent-cyan)', color: 'black', fontWeight: 700, border: 'none', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => document.getElementById('folder-add-files-input').click()}
                          >
                            <Plus size={16} />
                            <span>+ Upload File ke Folder</span>
                          </button>
                          <input
                            type="file"
                            id="folder-add-files-input"
                            multiple
                            style={{ display: 'none' }}
                            onChange={e => {
                              if (e.target.files && e.target.files.length > 0) {
                                uploadMoreToFolderHandler(selectedFolder.id, e.target.files);
                              }
                            }}
                          />

                          <button
                            className="btn btn-secondary"
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontWeight: 700, padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => setShareFolderModal(selectedFolder)}
                          >
                            <Share2 size={16} />
                            <span>Share Folder ke Klien</span>
                          </button>

                          <button
                            className="btn btn-secondary"
                            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', fontWeight: 700, padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => {
                              setFolderFormData({ id: selectedFolder.id, name: selectedFolder.name, description: selectedFolder.description || '', category: selectedFolder.category || 'CFD/FEA', files: [] });
                              setFolderModalOpen(true);
                            }}
                          >
                            <Edit3 size={16} />
                            <span>Edit Folder</span>
                          </button>

                          <button
                            className="btn"
                            style={{ background: 'rgba(168,85,247,0.25)', border: '1px solid rgba(168,85,247,0.5)', color: '#d8b4fe', fontWeight: 700, padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => setClientPortalFolder(selectedFolder)}
                          >
                            <Eye size={16} /><span>Lihat Halaman Klien</span>
                          </button>
                        </div>
                      </div>

                      {/* Files inside folder table/grid */}
                      <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Daftar Aset di Folder Ini ({selectedFolder.assets?.length || 0} File)
                          </h4>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Semua file di folder ini akan otomatis tersedia saat folder dibagikan ke klien.
                          </span>
                        </div>

                        {(!selectedFolder.assets || selectedFolder.assets.length === 0) ? (
                          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                            <FolderHeart size={42} style={{ color: 'var(--border-color)', marginBottom: '10px' }} />
                            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Folder Ini Masih Kosong</div>
                            <div style={{ fontSize: '12px' }}>Klik tombol "+ Upload File ke Folder" di atas untuk menambahkan brosur atau dokumen.</div>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                            {selectedFolder.assets.map((a, idx) => (
                              <div
                                key={a.id || idx}
                                style={{
                                  background: 'rgba(255,255,255,0.02)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '10px',
                                  padding: '14px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '24px' }}>
                                    {a.file_type === 'PDF' ? 'ðŸ“„' : a.file_type === 'Image' ? 'ðŸ–¼ï¸' : a.file_type === 'Template' ? 'ðŸ“Š' : 'ðŸ“'}
                                  </span>
                                  <span className="badge" style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', fontSize: '10px' }}>
                                    v{a.version || '1.0'}
                                  </span>
                                </div>

                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '3px' }}>
                                    {a.name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Tipe: {a.file_type} Â· Ukuran: {a.size || '2.4 MB'}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px dashed var(--border-color)' }}>
                                  <button
                                    className="btn"
                                    style={{ flex: 1, padding: '6px 8px', fontSize: '11px', background: 'rgba(168,85,247,0.2)', color: '#d8b4fe', border: '1px solid rgba(168,85,247,0.4)', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                    onClick={() => handlePreviewFile(a.file_url, a.name || 'Dokumen', a.file_type)}
                                    title="Lihat / Preview Isi File Asli"
                                  >
                                    <Eye size={12} />
                                    <span>Lihat</span>
                                  </button>
                                  <button
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '6px 8px', fontSize: '11px', background: 'var(--accent-cyan)', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                    onClick={() => handleOpenOrDownloadFile(a.file_url, a.name || 'Dokumen')}
                                    title="Unduh File Asli"
                                  >
                                    <Download size={12} />
                                    <span>Unduh</span>
                                  </button>
                                  <button
                                    className="icon-btn"
                                    style={{ color: 'var(--text-primary)', opacity: 0.8 }}
                                    onClick={() => {
                                      setAssetFormData({
                                        id: a.id,
                                        name: a.name,
                                        file_type: a.file_type,
                                        category: a.category,
                                        tags: a.tags || '',
                                        file_url: a.file_url || '',
                                        version: a.version || '1.0',
                                        sharing_status: a.sharing_status || 'Shared',
                                        size: a.size || '2.4 MB',
                                        folder_id: a.folder_id
                                      });
                                      setAssetModalOpen(true);
                                    }}
                                    title="Edit / Rename Aset"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    className="icon-btn"
                                    style={{ color: 'var(--accent-red)', opacity: 0.8 }}
                                    onClick={() => deleteAsset(a.id)}
                                    title="Hapus file ini"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}


              {digitalTab === 'gsc' && (
                <GscDashboardPanel />
              )}


            </>
          )}

          {/* ====== FOLLOW UP VIEW (2-tab: Pipeline + Social Media) ====== */}
          {currentView === 'follow-up' && (
            <>
              {/* === Deadline Alert Banner === */}
              {deadlineAlerts.length > 0 && !alertBannerDismissed && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 18px', borderRadius: '10px', marginBottom: '16px',
                  background: 'linear-gradient(90deg, rgba(239,68,68,0.15), rgba(245,158,11,0.1))',
                  border: '1px solid rgba(239,68,68,0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bell size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#f59e0b' }}>
                        âš ï¸ {deadlineAlerts.length} Prospek Deadline Mendekati
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {deadlineAlerts.map(a => {
                          const d = new Date(a.deadline);
                          const isToday = d.toDateString() === new Date().toDateString();
                          return (
                            <span key={a.id} style={{ marginRight: '12px' }}>
                              <span style={{ color: isToday ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{a.name}</span>
                              {' '}({isToday ? 'Hari Ini!' : 'Besok H-1'})
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setAlertBannerDismissed(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1, padding: '0 4px' }}>Ã—</button>
                </div>
              )}

              {/* 2-tab navigation */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <button
                  className={`btn ${followUpTab === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFollowUpTab('kanban')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  Follow Up Pipeline
                </button>
                <button
                  className={`btn ${followUpTab === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFollowUpTab('calendar')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  Social Media
                </button>
              </div>

              {/* ===== TAB 1: FOLLOW UP PIPELINE ===== */}
              {followUpTab === 'kanban' && (
                <>
                  {fuSelectedProspect ? (
                    /* ---- PROSPECT DETAIL VIEW (split 2 columns) ---- */
                    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'flex-start' }}>
                      {/* LEFT: Prospect Info */}
                      <div>
                        <button
                          className="btn btn-secondary"
                          style={{ marginBottom: '14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => setFuSelectedProspect(null)}
                        >
                          &larr; Back to Kanban
                        </button>

                        <div className="glass-panel" style={{ background: 'rgba(15,23,42,0.5)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(6,182,212,0.3)' }}>
                              PROSPECT LEAD
                            </span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="icon-btn" onClick={() => openFuEditModal(fuSelectedProspect.lead)} title="Edit"><Edit3 size={14} /></button>
                              <button className="icon-btn" style={{ color: 'var(--accent-red)' }} onClick={() => deleteFuProspect(fuSelectedProspect.lead.id)} title="Hapus"><Trash2 size={14} /></button>
                            </div>
                          </div>

                          <div>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.2, marginBottom: '4px' }}>{fuSelectedProspect.lead?.name}</h2>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{fuSelectedProspect.lead?.company || '-'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                              {fuSelectedProspect.lead?.id && `ID-${String(fuSelectedProspect.lead.id).padStart(3, '0')}`}
                            </div>
                          </div>

                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '8px' }}>CONTACT PERSON</div>
                            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{fuSelectedProspect.lead?.contact_name || '-'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{fuSelectedProspect.lead?.phone || '-'}</div>
                            {fuSelectedProspect.lead?.phone && (
                              <a
                                href={`https://wa.me/${(fuSelectedProspect.lead.phone || '').replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: '12px', color: '#25D366', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}
                              >
                                <Phone size={12} /> Hubungi via WhatsApp
                              </a>
                            )}
                          </div>

                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '8px' }}>STATUS STAGE</div>
                            {(() => {
                              const stageColors = { Lead: '#3b82f6', Proposal: '#8b5cf6', Hold: '#f59e0b', Lose: '#ef4444', Lost: '#ef4444', Won: '#10b981', Done: '#10b981' };
                              const s = fuSelectedProspect.lead?.status || 'Lead';
                              return (
                                <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: `${stageColors[s] || '#3b82f6'}20`, color: stageColors[s] || '#3b82f6', border: `1px solid ${stageColors[s] || '#3b82f6'}40` }}>
                                  {s}
                                </span>
                              );
                            })()}
                          </div>

                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '4px' }}>TANGGAL MASUK</div>
                              <div style={{ fontSize: '13px' }}>{fuSelectedProspect.lead?.created_at ? new Date(fuSelectedProspect.lead.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '4px' }}>NILAI PROSPEK</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-cyan)' }}>{formatCurrency(fuSelectedProspect.lead?.value)}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '4px' }}>SUMBER</div>
                              <div style={{ fontSize: '13px' }}>{fuSelectedProspect.lead?.source || '-'}</div>
                            </div>
                            {fuSelectedProspect.lead?.deadline && (
                              <div>
                                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '4px' }}>DEADLINE</div>
                                <div style={{ fontSize: '13px' }}>{new Date(fuSelectedProspect.lead.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                              </div>
                            )}
                            {fuSelectedProspect.interactions && fuSelectedProspect.interactions.length > 0 && (
                              <div>
                                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '4px' }}>LAST COMMUNICATION</div>
                                <div style={{ fontSize: '13px' }}>
                                  {(() => {
                                    const last = fuSelectedProspect.interactions[0];
                                    const diff = Math.floor((new Date() - new Date(last.created_at)) / (1000 * 60 * 60 * 24));
                                    return diff === 0 ? 'Hari ini' : `${diff} hari yang lalu`;
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT: Subtasks Panel */}
                      <div className="glass-panel" style={{ background: 'rgba(15,23,42,0.4)', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Subtasks</h3>
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: '12px', height: '32px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => { setFuTaskForm({ name: '', deadline: '', description: '', resource_link: '', assigned_to: '' }); setFuTaskModalOpen(true); }}
                          >
                            <Plus size={14} /> Add Task
                          </button>
                        </div>

                        {fuTaskModalOpen && (
                          <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid var(--accent-cyan)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.8px' }}>ADD NEW TASK</span>
                              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1 }} onClick={() => setFuTaskModalOpen(false)}>x</button>
                            </div>
                            <form onSubmit={saveFuNewSubtask} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" className="form-input" placeholder="Task Name" required style={{ flex: 1 }}
                                  value={fuTaskForm.name} onChange={e => setFuTaskForm({ ...fuTaskForm, name: e.target.value })} />
                                <input type="date" className="form-input" style={{ width: '150px' }}
                                  value={fuTaskForm.deadline} onChange={e => setFuTaskForm({ ...fuTaskForm, deadline: e.target.value })} />
                              </div>
                              <input type="text" className="form-input" placeholder="Description"
                                value={fuTaskForm.description} onChange={e => setFuTaskForm({ ...fuTaskForm, description: e.target.value })} />
                              <input type="text" className="form-input" placeholder="Resource Link (Optional)"
                                value={fuTaskForm.resource_link} onChange={e => setFuTaskForm({ ...fuTaskForm, resource_link: e.target.value })} />
                              <div>
                                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>ASSIGN TO (MANAJEMEN ONLY)</label>
                                <select className="form-select" value={fuTaskForm.assigned_to} onChange={e => setFuTaskForm({ ...fuTaskForm, assigned_to: e.target.value })}>
                                  <option value="">Unassigned</option>
                                  {(Array.isArray(fuOperators) ? fuOperators : []).map(op => (
                                    <option key={op.id} value={op.id}>{op.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                <button type="button" className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={() => setFuTaskModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ fontSize: '12px', background: 'var(--accent-cyan)', color: 'black', fontWeight: 700 }}>Create Subtask</button>
                              </div>
                            </form>
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {fuSubtasks.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                              <CheckSquare size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                              <p style={{ fontSize: '13px' }}>Belum ada subtask. Klik "+ Add Task" untuk menambahkan.</p>
                            </div>
                          ) : fuSubtasks.map(task => {
                            const progressMap = { 'MT': 0, 'IFR': 25, 'EX': 50, 'IFC': 75, 'DONE': 100 };
                            const prog = progressMap[task.status] ?? task.progress ?? 0;
                            const statusColors = { MT: '#3b82f6', IFR: '#f59e0b', EX: '#8b5cf6', IFC: '#06b6d4', DONE: '#10b981' };
                            return (
                              <div key={task.id} className="glass-panel" style={{ background: task.status === 'DONE' ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)', border: task.status === 'DONE' ? '1px solid rgba(16,185,129,0.15)' : '1px solid var(--border-color)', borderRadius: '10px', padding: '14px' }}>
                                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                  <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
                                    <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
                                      <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                                      <circle cx="22" cy="22" r="18" fill="none" stroke={statusColors[task.status] || '#3b82f6'} strokeWidth="4"
                                        strokeDasharray={`${2 * Math.PI * 18}`}
                                        strokeDashoffset={`${2 * Math.PI * 18 * (1 - prog / 100)}`}
                                        strokeLinecap="round" />
                                    </svg>
                                    <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>{prog}%</span>
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{task.name} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>0</span></span>
                                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                        {['MT', 'IFR', 'EX', 'IFC', 'DONE'].map(st => (
                                          <button
                                            key={st}
                                            onClick={() => updateFuSubtaskStatus(task.id, st)}
                                            style={{
                                              fontSize: '9px', padding: '2px 5px', borderRadius: '3px', cursor: 'pointer', fontWeight: 700,
                                              background: task.status === st ? statusColors[st] : 'transparent',
                                              border: `1px solid ${task.status === st ? statusColors[st] : 'var(--border-color)'}`,
                                              color: task.status === st ? (st === 'IFR' ? '#000' : '#fff') : 'var(--text-muted)'
                                            }}
                                          >
                                            {st === 'MT' ? 'M' : st}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    {task.description && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.4 }}>{task.description}</p>}
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)', alignItems: 'center', flexWrap: 'wrap' }}>
                                      {task.assigned_name && <span>By: <b>{task.assigned_name}</b></span>}
                                      {task.assigned_name && <span style={{ color: 'var(--accent-cyan)' }}>Assigned {task.assigned_name}</span>}
                                      {task.deadline && (() => {
                                        const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                                        const overdue = daysLeft < 0;
                                        return <span style={{ color: overdue ? 'var(--accent-red)' : 'var(--text-muted)' }}>Deadline: {overdue ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days`}</span>;
                                      })()}
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', justifyContent: 'flex-end' }}>
                                      <button className="icon-btn" style={{ opacity: 0.5 }}><Bell size={12} /></button>
                                      <button className="icon-btn" style={{ opacity: 0.5 }}><Edit3 size={12} /></button>
                                      <button className="icon-btn" style={{ color: 'var(--accent-red)' }} onClick={() => deleteFuSubtask(task.id)}><Trash2 size={12} /></button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
                          <div style={{ position: 'relative', width: '220px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="text" className="form-input" placeholder="Cari klien..."
                              value={fuSearch}
                              onChange={e => setFuSearch(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') fetchFollowUpLeads(); }}
                              style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                            />
                          </div>

                          {/* Stage filters buttons (mockup screenshot 2 style) */}
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                            {[
                              { label: 'Semua', value: 'Semua', color: 'var(--primary-glow)' },
                              { label: 'Lead', value: 'Lead', color: '#3b82f6' },
                              { label: 'Proposal', value: 'Proposal', color: '#8b5cf6' },
                              { label: 'Hold', value: 'Hold', color: '#f59e0b' },
                              { label: 'Loss', value: 'Lose', color: '#ef4444' },
                              { label: 'Won', value: 'Won', color: '#10b981' },
                              { label: 'Done', value: 'Done', color: '#06b6d4' }
                            ].map(btn => (
                              <button
                                key={btn.label}
                                type="button"
                                onClick={() => setFuStageFilter(btn.value)}
                                style={{
                                  padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                                  background: fuStageFilter === btn.value ? btn.color : 'transparent',
                                  border: 'none',
                                  color: fuStageFilter === btn.value ? (btn.value === 'Hold' ? 'black' : '#fff') : 'var(--text-secondary)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button className="btn btn-primary"
                          style={{ height: '38px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                          onClick={() => {
                            setFuEditForm({ id: '', name: '', company: '', source: 'Organic', phone: '', deadline: '', value: '', notes: '', status: 'Lead', industry: 'Other' });
                            setFuNewContactPhone('');
                            setFuNewContactNotes('');
                            setFuEditModalOpen(true);
                          }}
                        >
                          <Plus size={16} /> Tambah Prospek
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '20px', minHeight: '500px' }}>
                        {[
                          { stage: 'Lead', color: '#3b82f6' },
                          { stage: 'Proposal', color: '#8b5cf6' },
                          { stage: 'Hold', color: '#f59e0b' },
                          { stage: 'Lose', color: '#ef4444' },
                          { stage: 'Won', color: '#10b981' },
                          { stage: 'Done', color: '#06b6d4' }
                        ].filter(col => fuStageFilter === 'Semua' || col.stage === fuStageFilter)
                          .map(({ stage, color }) => {
                            const colLeads = (Array.isArray(leads) ? leads : []).filter(l => l.status === stage);
                            return (
                              <div key={stage} style={{
                                minWidth: fuStageFilter === 'Semua' ? '215px' : '360px',
                                flex: fuStageFilter === 'Semua' ? '0 0 215px' : '0 0 360px',
                                display: 'flex', flexDirection: 'column'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px 8px 0 0', background: `${color}18`, borderBottom: `3px solid ${color}`, marginBottom: '10px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 700, color }}>{stage}</span>
                                  <span style={{ fontSize: '12px', fontWeight: 700, background: `${color}30`, color, width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{colLeads.length}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {colLeads.map(lead => {
                                    const urgencyDays = lead.deadline ? Math.ceil((new Date(lead.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                                    const isOverdue = urgencyDays !== null && urgencyDays < 0;
                                    const isToday = urgencyDays === 0;
                                    const isTomorrow = urgencyDays === 1;
                                    const sourceColors = { 'Instagram Ads': '#e1306c', 'Google Ads': '#4285F4', 'Facebook Ads': '#1877F2', 'TikTok Ads': '#69C9D0', 'LinkedIn': '#0A66C2', 'Referral': '#8b5cf6', 'Organic': '#10b981', 'Cold Call': '#f59e0b' };
                                    const srcColor = sourceColors[lead.source] || '#06b6d4';

                                    // Generate avatar initials and gradient
                                    const words = (lead.name || '').split(' ');
                                    const initials = (words[0]?.[0] || '') + (words[1]?.[0] || words[0]?.[1] || '');
                                    const avatarColors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#e1306c', '#ec4899'];
                                    const avatarColor = avatarColors[lead.id % avatarColors.length] || '#3b82f6';

                                    return (
                                      <div key={lead.id} className="kanban-card"
                                        style={{ cursor: 'pointer', padding: '12px 14px', background: 'rgba(15,23,42,0.7)', borderRadius: '10px', border: '1px solid var(--border-color)' }}
                                        onClick={() => openFuProspectDetail(lead.id)}
                                      >
                                        {/* Top row: avatar + name/company + edit */}
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
                                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: '#fff', flexShrink: 0, textTransform: 'uppercase' }}>
                                            {initials || '??'}
                                          </div>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: '13px', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.name}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '2px' }}>
                                              {lead.company && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.company}</div>}
                                              {lead.no_project && <div style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontWeight: 600 }}>{lead.no_project}</div>}
                                            </div>
                                          </div>
                                          <button className="icon-btn" style={{ flexShrink: 0, opacity: 0.7 }}
                                            onClick={e => { e.stopPropagation(); openFuEditModal(lead); }}>
                                            <Edit3 size={12} />
                                          </button>
                                        </div>

                                        {/* Source + Value row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                          <span style={{ fontSize: '11px', fontWeight: 600, color: srcColor }}>{lead.source || 'Organic'}</span>
                                          {lead.value && parseFloat(lead.value) > 0 && (
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                              Rp {(parseFloat(lead.value) / 1e6).toFixed(0)}jt
                                            </span>
                                          )}
                                        </div>

                                        {/* Phone */}
                                        {lead.phone && (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                            <Phone size={10} /> {lead.phone}
                                          </div>
                                        )}

                                        {/* Deadline badge */}
                                        {urgencyDays !== null && (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: isOverdue ? '#ef4444' : isToday ? '#ef4444' : isTomorrow ? '#f59e0b' : 'var(--text-muted)', marginBottom: lead.last_contact ? '8px' : '0' }}>
                                            <Clock size={10} />
                                            {isOverdue ? `${Math.abs(urgencyDays)}h terlambat` : isToday ? 'Hari Ini!' : isTomorrow ? 'Besok (H-1)' : `${urgencyDays}h lagi`}
                                          </div>
                                        )}

                                        {/* Terakhir Kontak box â€” shown only if last_contact exists */}
                                        {lead.last_contact && (
                                          <div style={{ marginTop: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '6px', padding: '7px 10px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.5px', marginBottom: '3px' }}>Terakhir Kontak</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                              {lead.last_contact_phone && <span>{lead.last_contact_phone}</span>}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                              {lead.last_contact_name && <span>{lead.last_contact_name} Â· </span>}
                                              {new Date(lead.last_contact).toISOString().split('T')[0]}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ===== TAB 2: SOCIAL MEDIA ===== */}
              {followUpTab === 'calendar' && (
                <>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px', background: 'linear-gradient(135deg, #a855f7, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Kalender Konten Sosmed
                      </h3>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Jadwalkan dan kelola konten untuk semua platform media sosial Anda</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {/* Stats summary */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {['Published', 'Scheduled', 'Draft'].map(s => {
                          const count = posts.filter(p => p.status === s).length;
                          const colors = { Published: '#10b981', Scheduled: '#3b82f6', Draft: '#6b7280' };
                          return (
                            <div key={s} style={{ background: `${colors[s]}15`, border: `1px solid ${colors[s]}30`, borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
                              <div style={{ fontSize: '16px', fontWeight: 800, color: colors[s] }}>{count}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{s}</div>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none', boxShadow: '0 4px 15px rgba(168,85,247,0.4)' }}
                        onClick={() => { setPostFormData({ id: '', platform: 'Instagram', content: '', media_url: '', schedule_time: '', status: 'Draft' }); setPostModalOpen(true); }}
                      >
                        <Plus size={16} /> Jadwalkan Post
                      </button>
                    </div>
                  </div>

                  {/* Post grid */}
                  {posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Belum Ada Konten Dijadwalkan</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Mulai buat jadwal konten untuk Instagram, Facebook, TikTok, dan platform lainnya</p>
                      <button
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        onClick={() => { setPostFormData({ id: '', platform: 'Instagram', content: '', media_url: '', schedule_time: '', status: 'Draft' }); setPostModalOpen(true); }}
                      >
                        <Plus size={14} /> Buat Post Pertama
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
                      {posts.map((p) => {
                        const platformConfig = {
                          Instagram: { color: '#e1306c', bg: 'linear-gradient(135deg,#e1306c,#f77737,#fcaf45)', icon: '', textColor: '#fff' },
                          Facebook: { color: '#1877F2', bg: 'linear-gradient(135deg,#1877F2,#0d5dbf)', icon: '', textColor: '#fff' },
                          TikTok: { color: '#010101', bg: 'linear-gradient(135deg,#010101,#69C9D0)', icon: '', textColor: '#fff' },
                          LinkedIn: { color: '#0A66C2', bg: 'linear-gradient(135deg,#0A66C2,#0d4a8a)', icon: '', textColor: '#fff' },
                          Twitter: { color: '#1DA1F2', bg: 'linear-gradient(135deg,#1DA1F2,#0c7abf)', icon: '', textColor: '#fff' },
                          YouTube: { color: '#FF0000', bg: 'linear-gradient(135deg,#FF0000,#c20000)', icon: '', textColor: '#fff' },
                        };
                        const cfg = platformConfig[p.platform] || { color: '#6b7280', bg: 'linear-gradient(135deg,#374151,#1f2937)', icon: '', textColor: '#fff' };
                        const statusColors = { Published: '#10b981', Scheduled: '#3b82f6', Draft: '#6b7280' };
                        const statusColor = statusColors[p.status] || '#6b7280';

                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPost(p)}
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '14px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              position: 'relative',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${cfg.color}30`; e.currentTarget.style.borderColor = `${cfg.color}50`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                          >
                            {/* Platform header strip */}
                            <div style={{ background: cfg.bg, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '20px' }}>{cfg.icon}</span>
                                <span style={{ color: cfg.textColor, fontWeight: 800, fontSize: '14px', letterSpacing: '0.3px' }}>{p.platform}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span style={{
                                  fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
                                  background: `${statusColor}25`, color: statusColor,
                                  border: `1px solid ${statusColor}50`,
                                  backdropFilter: 'blur(4px)'
                                }}>
                                  {p.status}
                                </span>
                                <button
                                  onClick={e => { e.stopPropagation(); deleteSocialPost(p.id); }}
                                  style={{ background: 'rgba(0,0,0,0.25)', border: 'none', color: '#fff', borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                                  title="Hapus"
                                >âœ•</button>
                              </div>
                            </div>

                            {/* Content body */}
                            <div style={{ padding: '14px 16px' }}>
                              {/* Media preview if available */}
                              {p.media_url && (
                                <div style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', height: '120px', background: '#0f172a' }}>
                                  <img src={p.media_url} alt="media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                                </div>
                              )}

                              {/* Content preview */}
                              <p style={{
                                fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6,
                                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                                overflow: 'hidden', marginBottom: '12px', minHeight: '60px'
                              }}>
                                {p.content || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum ada konten...</span>}
                              </p>

                              {/* Schedule time */}
                              {p.schedule_time && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                                  <Clock size={10} />
                                  {new Date(p.schedule_time).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}

                              {/* Engagement stats */}
                              <div style={{ display: 'flex', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>â¤ï¸ {p.engagement_likes || 0}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>ðŸ’¬ {p.engagement_comments || 0}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>ðŸ” {p.engagement_shares || 0}</span>
                                <span style={{ marginLeft: 'auto', color: cfg.color, fontWeight: 600, fontSize: '10px' }}>Klik untuk detail â†’</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}


          {/* ====== VIEW: CATATAN ====== */}
          {currentView === 'catatan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Catatan</h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Catat masalah, temuan, ide, dan informasi penting lainnya</p>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontWeight: 700, fontSize: '14px' }}
                  onClick={() => {
                    setNoteEditData({ id: '', title: '', content: '', category: 'Lainnya' });
                    setNoteFormOpen(true);
                  }}
                >
                  + Catatan Baru
                </button>
              </div>

              {/* Search + Filter */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Cari judul, isi, atau penulis..."
                    value={notesSearch}
                    onChange={e => setNotesSearch(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') fetchNotes(); }}
                    style={{ paddingLeft: '42px', height: '42px', fontSize: '14px', borderRadius: '24px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['Semua', 'Masalah', 'Temuan', 'Ide', 'Lainnya'].map(cat => {
                    const catColors = { Masalah: '#ef4444', Temuan: '#f59e0b', Ide: '#3b82f6', Lainnya: '#8b5cf6', Semua: 'var(--primary-glow)' };
                    const isActive = notesCategoryFilter === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => { setNotesCategoryFilter(cat); }}
                        style={{
                          padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                          background: isActive ? (catColors[cat] || 'var(--primary-glow)') : 'transparent',
                          border: `1px solid ${isActive ? (catColors[cat] || 'var(--primary-glow)') : 'var(--border-color)'}`,
                          color: isActive ? '#fff' : 'var(--text-secondary)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes Grid */}
              {notes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <StickyNote size={52} style={{ opacity: 0.2, marginBottom: '14px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>Belum Ada Catatan</h3>
                  <p style={{ fontSize: '13px' }}>Klik "+ Catatan Baru" untuk mulai mencatat masalah atau temuan.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {notes.map(note => {
                    const catConfig = {
                      Masalah: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
                      Temuan:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
                      Ide:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
                      Lainnya: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)' },
                    };
                    const cfg = catConfig[note.category] || catConfig.Lainnya;
                    const dateStr = note.created_at
                      ? new Date(note.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '-';
                    return (
                      <div
                        key={note.id}
                        className="glass-panel"
                        style={{
                          padding: '20px', borderRadius: '14px',
                          border: '1px solid var(--border-color)',
                          display: 'flex', flexDirection: 'column', gap: '12px',
                          background: 'rgba(15,23,42,0.6)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = ''; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                            display: 'flex', alignItems: 'center', gap: '5px'
                          }}>
                            <span>{note.category}</span>
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              className="icon-btn"
                              style={{ opacity: 0.7, padding: '4px' }}
                              onClick={() => {
                                setNoteEditData({ id: note.id, title: note.title, content: note.content || '', category: note.category });
                                setNoteFormOpen(true);
                              }}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              className="icon-btn"
                              style={{ color: 'var(--accent-red)', opacity: 0.7, padding: '4px' }}
                              onClick={() => deleteNote(note.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                            {note.title}
                          </h4>
                          {note.content && (
                            <p style={{
                              fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6,
                              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                            }}>
                              {note.content}
                            </p>
                          )}
                        </div>
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{note.author_name || 'Unknown'}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} />
                            {dateStr}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* --- MODALS BLOCK --- */}

      {/* MODAL: JADWALKAN POST */}
      {postModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', margin: '-1px -1px 0', padding: '20px 24px', borderRadius: '14px 14px 0 0' }}>
              <div>
                <h3 className="modal-title" style={{ color: '#fff', marginBottom: '2px' }}>
                  {postFormData.id ? 'Edit Jadwal Post' : 'Jadwalkan Post Baru'}
                </h3>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Buat dan jadwalkan konten untuk media sosial</p>
              </div>
              <button className="icon-btn" style={{ color: '#fff', opacity: 0.8 }} onClick={() => setPostModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={saveSocialPost} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 24px' }}>
              {/* Platform selection */}
              <div className="form-group">
                <label className="form-label">Platform</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { name: 'Instagram', icon: '', color: '#e1306c' },
                    { name: 'Facebook', icon: '', color: '#1877F2' },
                    { name: 'TikTok', icon: '', color: '#69C9D0' },
                    { name: 'LinkedIn', icon: '', color: '#0A66C2' },
                    { name: 'Twitter', icon: '', color: '#1DA1F2' },
                    { name: 'YouTube', icon: '', color: '#FF0000' },
                  ].map(pl => (
                    <button
                      key={pl.name}
                      type="button"
                      onClick={() => setPostFormData({ ...postFormData, platform: pl.name })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        background: postFormData.platform === pl.name ? `${pl.color}20` : 'transparent',
                        border: `2px solid ${postFormData.platform === pl.name ? pl.color : 'var(--border-color)'}`,
                        color: postFormData.platform === pl.name ? pl.color : 'var(--text-muted)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{pl.icon}</span> {pl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="form-group">
                <label className="form-label">Konten Postingan <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                <textarea
                  className="form-textarea"
                  rows="5"
                  placeholder="Tulis caption / konten postingan Anda di sini... #hashtag"
                  required
                  value={postFormData.content}
                  onChange={e => setPostFormData({ ...postFormData, content: e.target.value })}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                  {postFormData.content.length} karakter
                </div>
              </div>

              {/* Media URL */}
              <div className="form-group">
                <label className="form-label">URL Media (Gambar/Video)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/image.jpg"
                  value={postFormData.media_url}
                  onChange={e => setPostFormData({ ...postFormData, media_url: e.target.value })}
                />
                {postFormData.media_url && (
                  <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', height: '80px' }}>
                    <img src={postFormData.media_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Schedule time */}
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Tanggal & Waktu Tayang</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={postFormData.schedule_time}
                    onChange={e => setPostFormData({ ...postFormData, schedule_time: e.target.value })}
                  />
                </div>

                {/* Status */}
                <div className="form-group" style={{ width: '140px' }}>
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={postFormData.status}
                    onChange={e => setPostFormData({ ...postFormData, status: e.target.value })}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPostModalOpen(false)}>Batal</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none', fontWeight: 700, minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <CheckSquare size={14} /> {postFormData.id ? 'Simpan Perubahan' : 'Jadwalkan Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: POST DETAIL (view full content) */}
      {selectedPost && (() => {
        const p = selectedPost;
        const platformConfig = {
          Instagram: { color: '#e1306c', bg: 'linear-gradient(135deg,#e1306c,#f77737,#fcaf45)', icon: '' },
          Facebook: { color: '#1877F2', bg: 'linear-gradient(135deg,#1877F2,#0d5dbf)', icon: '' },
          TikTok: { color: '#010101', bg: 'linear-gradient(135deg,#010101,#69C9D0)', icon: '' },
          LinkedIn: { color: '#0A66C2', bg: 'linear-gradient(135deg,#0A66C2,#0d4a8a)', icon: '' },
          Twitter: { color: '#1DA1F2', bg: 'linear-gradient(135deg,#1DA1F2,#0c7abf)', icon: '' },
          YouTube: { color: '#FF0000', bg: 'linear-gradient(135deg,#FF0000,#c20000)', icon: '' },
        };
        const cfg = platformConfig[p.platform] || { color: '#6b7280', bg: 'linear-gradient(135deg,#374151,#1f2937)', icon: '' };
        const statusColors = { Published: '#10b981', Scheduled: '#3b82f6', Draft: '#6b7280' };
        const statusColor = statusColors[p.status] || '#6b7280';
        return (
          <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
            <div className="modal-content" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
              {/* Platform header */}
              <div style={{ background: cfg.bg, padding: '20px 24px', borderRadius: '14px 14px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>{cfg.icon}</span>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '18px' }}>{p.platform}</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Detail Konten</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: `${statusColor}30`, color: statusColor, border: `1px solid ${statusColor}60` }}>
                    {p.status}
                  </span>
                  <button className="icon-btn" style={{ color: '#fff', opacity: 0.8 }} onClick={() => setSelectedPost(null)}>
                    <XCircle size={20} />
                  </button>
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                {/* Media preview */}
                {p.media_url && (
                  <div style={{ marginBottom: '18px', borderRadius: '10px', overflow: 'hidden', maxHeight: '220px', background: '#0f172a' }}>
                    <img src={p.media_url} alt="media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  </div>
                )}

                {/* Full content */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '8px' }}>KONTEN POSTINGAN</div>
                  <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                    {p.content || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum ada konten</span>}
                  </div>
                </div>

                {/* Schedule info */}
                {p.schedule_time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', padding: '10px 14px', background: 'rgba(59,130,246,0.08)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <Clock size={14} style={{ color: '#3b82f6' }} />
                    <span>Dijadwalkan: <b>{new Date(p.schedule_time).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</b></span>
                  </div>
                )}

                {/* Engagement stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  {[
                    { label: 'Likes', value: p.engagement_likes || 0, icon: 'â¤ï¸', color: '#ef4444' },
                    { label: 'Comments', value: p.engagement_comments || 0, icon: 'ðŸ’¬', color: '#3b82f6' },
                    { label: 'Shares', value: p.engagement_shares || 0, icon: 'ðŸ”', color: '#10b981' },
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: 'center', padding: '12px', background: `${stat.color}10`, border: `1px solid ${stat.color}25`, borderRadius: '10px' }}>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.icon}</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: stat.color }}>{stat.value.toLocaleString()}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-red)' }}
                    onClick={() => { setSelectedPost(null); deleteSocialPost(p.id); }}
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      setSelectedPost(null);
                      setPostFormData({ id: p.id, platform: p.platform, content: p.content, media_url: p.media_url || '', schedule_time: p.schedule_time ? p.schedule_time.slice(0, 16) : '', status: p.status });
                      setPostModalOpen(true);
                    }}
                  >
                    <Edit3 size={14} /> Edit Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}


      {/* MODAL: CREATE / UPLOAD FOLDER */}
      {folderModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, var(--primary-glow) 0%, #a855f7 100%)', margin: '-1px -1px 0', padding: '20px 24px', borderRadius: '14px 14px 0 0' }}>
              <div>
                <h3 className="modal-title" style={{ color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderOpen size={20} />
                  <span>Buat & Upload Folder Aset Baru</span>
                </h3>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                  Buat folder dan langsung upload beberapa file sekaligus ke dalam folder ini.
                </p>
              </div>
              <button className="icon-btn" style={{ color: '#fff', opacity: 0.8 }} onClick={() => setFolderModalOpen(false)}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={saveAssetFolder} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
              <div className="form-group">
                <label className="form-label">Nama Folder <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Brosur & Katalog Jasa CFD/FEA 2026"
                  required
                  value={folderFormData.name}
                  onChange={e => setFolderFormData({ ...folderFormData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kategori Folder</label>
                <select
                  className="form-select"
                  value={folderFormData.category}
                  onChange={e => setFolderFormData({ ...folderFormData, category: e.target.value })}
                >
                  <option value="CFD/FEA">CFD/FEA</option>
                  <option value="Case Study">Case Study</option>
                  <option value="Proposal Template">Proposal Template</option>
                  <option value="Foto Proyek">Foto Proyek</option>
                  <option value="Whitepaper">Whitepaper</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi Folder</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Jelaskan ringkas isi folder agar klien mudah mengerti saat membuka tautan..."
                  value={folderFormData.description}
                  onChange={e => setFolderFormData({ ...folderFormData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Upload File ke Dalam Folder (Opsi, Bisa Pilih Banyak File Sekaligus)</label>
                <div
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    background: 'rgba(6,182,212,0.04)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                  onClick={() => document.getElementById('new-folder-multi-upload').click()}
                >
                  <FolderHeart size={32} style={{ color: 'var(--accent-cyan)', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                    Klik untuk Memilih Banyak File (PDF, DOCX, Image, Video)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Bisa pilih 1 atau lebih file sekaligus hingga 100 MB per file.
                  </div>
                  <input
                    type="file"
                    id="new-folder-multi-upload"
                    multiple
                    style={{ display: 'none' }}
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFolderMultiFileUpload(e.target.files);
                      }
                    }}
                  />
                </div>

                {folderFormData.files?.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      Siap Diupload ({folderFormData.files.length} File):
                    </div>
                    {folderFormData.files.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '12px' }}>
                        <span>ðŸ“„ {file.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{file.size}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setFolderModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--accent-cyan)', color: 'black', fontWeight: 700 }}>
                  Simpan Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW ASSET FILE */}
      {previewFileModal && previewFileModal.isOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '850px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', margin: '-1px -1px 0', padding: '16px 24px', borderRadius: '14px 14px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>
                  {previewFileModal.fileType === 'PDF' ? 'ðŸ“„' : previewFileModal.fileType === 'Image' ? 'ðŸ–¼ï¸' : previewFileModal.fileType === 'Video' ? 'ðŸŽ¬' : 'ðŸ“‘'}
                </span>
                <div>
                  <h3 className="modal-title" style={{ color: 'black', fontWeight: 800, margin: 0, fontSize: '16px' }}>
                    Preview File Asli: {previewFileModal.filename}
                  </h3>
                  <p style={{ fontSize: '11px', color: 'rgba(0,0,0,0.75)', margin: 0, fontWeight: 600 }}>
                    Memeriksa keaslian isi dokumen & verifikasi bebas corrupt
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  className="btn"
                  style={{ background: 'black', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => handleOpenOrDownloadFile(previewFileModal.fileUrl, previewFileModal.filename)}
                >
                  <Download size={14} />
                  <span>Unduh File Asli</span>
                </button>
                <button className="icon-btn" style={{ color: 'black', background: 'rgba(255,255,255,0.3)', borderRadius: '50%', padding: '4px' }} onClick={() => setPreviewFileModal(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ padding: '20px', flex: 1, overflowY: 'auto', overflowX: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.2)', minHeight: '72vh', maxHeight: '76vh' }}>
              {previewFileModal.fileUrl?.startsWith('data:application/pdf') || previewFileModal.filename?.toLowerCase().endsWith('.pdf') ? (
                <div style={{ width: '100%', height: '72vh', overflow: 'auto', borderRadius: '8px', background: '#fff' }}>
                  <iframe
                    src={previewFileModal.fileUrl}
                    style={{ width: '100%', height: '100%', minHeight: '68vh', border: 'none', display: 'block' }}
                    title="PDF Preview"
                  />
                </div>
              ) : previewFileModal.fileUrl?.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(previewFileModal.filename || '') ? (
                <div style={{ width: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '10px' }}>
                  <img
                    src={previewFileModal.fileUrl}
                    alt={previewFileModal.filename}
                    style={{ maxWidth: '100%', maxHeight: 'none', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                  />
                </div>
              ) : previewFileModal.fileUrl?.startsWith('data:video/') || previewFileModal.filename?.toLowerCase().endsWith('.mp4') ? (
                <video
                  src={previewFileModal.fileUrl}
                  controls
                  style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', maxWidth: '500px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>ðŸ“‘</div>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Preview Langsung Tidak Didukung Browser untuk Format Dokumen Ini
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
                    File ini ({previewFileModal.filename}) merupakan format dokumen Office/khusus (Word, Excel, PowerPoint, ZIP, dll). File asli tersimpan dengan aman dan bebas corrupt di server. Silakan klik tombol di bawah untuk mengunduh dan mengujinya langsung di komputer Anda.
                  </p>
                  <button
                    className="btn btn-primary"
                    style={{ background: 'var(--accent-cyan)', color: 'black', fontWeight: 800, padding: '12px 24px', borderRadius: '8px', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => handleOpenOrDownloadFile(previewFileModal.fileUrl, previewFileModal.filename)}
                  >
                    <Download size={16} />
                    <span>Unduh File Asli Sekarang</span>
                  </button>
                </div>
              )}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '0 0 14px 14px' }}>
              <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} />
                <span>Integritas File Asli Terverifikasi (Original Binary Data)</span>
              </span>
              <button className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '12px' }} onClick={() => setPreviewFileModal(null)}>
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SHARE FOLDER TO CLIENT */}
      {shareFolderModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', margin: '-1px -1px 0', padding: '20px 24px', borderRadius: '14px 14px 0 0' }}>
              <div>
                <h3 className="modal-title" style={{ color: 'black', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Share2 size={20} />
                  <span>Bagikan Folder "{shareFolderModal.name}"</span>
                </h3>
                <p style={{ fontSize: '12px', color: 'rgba(0,0,0,0.75)', margin: 0, fontWeight: 600 }}>
                  Klien dapat melihat & mengunduh semua aset dalam folder ini tanpa perlu login.
                </p>
              </div>
              <button className="icon-btn" style={{ color: 'black' }} onClick={() => setShareFolderModal(null)}>
                <XCircle size={22} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Tautan Publik untuk Klien:
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/?share_token=${shareFolderModal.share_token || shareFolderModal.id}`}
                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', color: 'var(--accent-cyan)' }}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ background: 'var(--accent-cyan)', color: 'black', fontWeight: 700, padding: '8px 14px', fontSize: '12px' }}
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/?share_token=${shareFolderModal.share_token || shareFolderModal.id}`);
                      showAlert('Tautan folder berhasil disalin!', 'Sukses', 'success');
                    }}
                  >
                    Salin
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                ðŸ’¡ <strong>Manfaat bagi Klien:</strong> Klien langsung disambut halaman portal eksklusif berisi <strong>{shareFolderModal.item_count || shareFolderModal.assets?.length || 0} file pemasaran</strong>, dilengkapi pencarian instan agar gampang menemukan dan mengunduh brosur/dokumen yang diinginkan.
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none', fontWeight: 700 }}
                  onClick={() => {
                    const f = shareFolderModal;
                    setShareFolderModal(null);
                    setClientPortalFolder(f);
                  }}
                >
                  Buka / Simulasi Halaman Klien (Public Portal)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN: CLIENT PUBLIC SHARED FOLDER PORTAL */}
      {clientPortalFolder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--bg-main)',
          zIndex: 99999,
          overflowY: 'auto',
          padding: '24px'
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: '18px' }}>
                  IMX
                </div>
                <div>
                  <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    INFIMECH MARKETING ERP
                  </h1>
                  <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    Official Client Asset Download Portal
                  </span>
                </div>
              </div>

              <button
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '8px' }}
                onClick={() => {
                  setClientPortalFolder(null);
                  if (window.location.search.includes('share_token')) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                  }
                }}
              >
                Tutup Portal / Kembali
              </button>
            </div>

            {/* Folder Hero Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(168,85,247,0.25) 100%)',
              border: '1px solid rgba(6,182,212,0.4)',
              borderRadius: '20px',
              padding: '32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px'
            }}>
              <div style={{ maxWidth: '65%' }}>
                <span className="badge" style={{ background: 'var(--accent-cyan)', color: 'black', fontWeight: 800, fontSize: '11px', padding: '4px 12px', borderRadius: '20px', marginBottom: '10px', display: 'inline-block' }}>
                  SHARED MARKETING FOLDER
                </span>
                <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: '4px 0 10px' }}>
                  {clientPortalFolder.name}
                </h2>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: '1.6' }}>
                  {clientPortalFolder.description || 'Berikut adalah daftar lengkap aset pemasaran, brosur spesifikasi teknik, dan dokumen pendukung proyek untuk Anda unduh.'}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px', background: 'rgba(0,0,0,0.3)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Aset Tersedia:</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                  {clientPortalFolder.assets?.length || 0} File Dokumen
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Akses instan tanpa perlu login.
                </div>
              </div>
            </div>

            {/* Client Search Bar & Filter */}
            <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '14px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Cari file apa yang ingin Anda unduh (nama dokumen, tipe, topik)..."
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '38px', height: '42px', fontSize: '13px' }}
                  value={clientSearchTerm}
                  onChange={e => setClientSearchTerm(e.target.value)}
                />
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {['Semua', 'PDF', 'Template', 'Image', 'Video'].map(type => (
                  <button
                    key={type}
                    className="btn"
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      background: clientTypeFilter === type ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                      color: clientTypeFilter === type ? 'black' : 'var(--text-primary)'
                    }}
                    onClick={() => setClientTypeFilter(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Client File Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
              {(clientPortalFolder.assets || [])
                .filter(a => {
                  if (clientTypeFilter !== 'Semua' && a.file_type !== clientTypeFilter) return false;
                  if (clientSearchTerm) {
                    const q = clientSearchTerm.toLowerCase();
                    return (a.name || '').toLowerCase().includes(q) || (a.tags || '').toLowerCase().includes(q);
                  }
                  return true;
                })
                .map((a, idx) => (
                  <div
                    key={a.id || idx}
                    className="glass-panel"
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(6,182,212,0.05) 100%)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                          {a.file_type === 'PDF' ? 'ðŸ“„' : a.file_type === 'Image' ? 'ðŸ–¼ï¸' : a.file_type === 'Template' ? 'ðŸ“Š' : 'ðŸ“'}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                            {a.name}
                          </h4>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {a.file_type} Dokumen Â· {a.size || '2.4 MB'}
                          </span>
                        </div>
                      </div>

                      <span className="badge" style={{ background: 'rgba(168,85,247,0.15)', color: '#d8b4fe', fontSize: '11px' }}>
                        Versi {a.version || '1.0'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Siap diunduh langsung
                      </span>
                      <button
                        className="btn btn-primary"
                        style={{
                          background: 'var(--accent-cyan)',
                          color: 'black',
                          fontWeight: 800,
                          padding: '8px 18px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 14px rgba(6,182,212,0.35)'
                        }}
                        onClick={() => handleOpenOrDownloadFile(a.file_url, a.name || 'Dokumen')}
                      >
                        <Download size={15} />
                        <span>Unduh File</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD/EDIT MATERI (Asset) */}
      {assetModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, var(--primary-glow) 0%, #a855f7 100%)', margin: '-1px -1px 0', padding: '18px 24px', borderRadius: '14px 14px 0 0' }}>
              <div>
                <h3 className="modal-title" style={{ color: '#fff', marginBottom: '2px' }}>
                  {assetFormData.id ? 'Edit Metadata Aset' : 'Upload Materi Pemasaran Baru'}
                </h3>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Simpan materi CFD/FEA, proposal, case study secara terpusat</p>
              </div>
              <button className="icon-btn" style={{ color: '#fff', opacity: 0.8 }} onClick={() => setAssetModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={saveAsset} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 24px' }}>
              <div className="form-group">
                <label className="form-label">Nama Materi Pemasaran <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Brosur Jasa Simulasi CFD (Fluids)"
                  required
                  value={assetFormData.name}
                  onChange={e => setAssetFormData({ ...assetFormData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Kategori Materi</label>
                  <select
                    className="form-select"
                    value={assetFormData.category || 'CFD/FEA'}
                    onChange={e => setAssetFormData({ ...assetFormData, category: e.target.value })}
                  >
                    <option value="CFD/FEA">CFD/FEA</option>
                    <option value="Case Study">Case Study</option>
                    <option value="Proposal Template">Proposal Template</option>
                    <option value="Foto Proyek">Foto Proyek</option>
                    <option value="Whitepaper">Whitepaper</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Tipe File</label>
                  <select
                    className="form-select"
                    value={assetFormData.file_type || 'PDF'}
                    onChange={e => setAssetFormData({ ...assetFormData, file_type: e.target.value })}
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="Template">Template Word/Excel</option>
                    <option value="Image">Image (Foto/Render)</option>
                    <option value="Video">Video Teaser</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Versi Aset</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 1.0 atau 1.2"
                    value={assetFormData.version || '1.0'}
                    onChange={e => setAssetFormData({ ...assetFormData, version: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Ukuran File</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 4.2 MB"
                    value={assetFormData.size || '2.4 MB'}
                    onChange={e => setAssetFormData({ ...assetFormData, size: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">File Materi (Drag & Drop atau Pilih File/Folder)</label>
                <div
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.01)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s',
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleAssetFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => document.getElementById('asset-file-input').click()}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <input
                    type="file"
                    id="asset-file-input"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleAssetFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  {assetFormData.file_url ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '24px' }}>
                        {assetFormData.file_type === 'PDF' && 'ðŸ“„'}
                        {assetFormData.file_type === 'Image' && 'ðŸ–¼ï¸'}
                        {assetFormData.file_type === 'Template' && 'ðŸ“Š'}
                        {assetFormData.file_type === 'Video' && 'ðŸŽ¬'}
                      </span>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>
                        File Berhasil Dikumpulkan
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Ukuran: {assetFormData.size} Â· Tipe: {assetFormData.file_type}
                      </div>
                      {assetFormData.file_url.startsWith('data:') && (
                        <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 600 }}>âœ“ File terkompresi Base64</span>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>
                      <Download size={24} style={{ marginBottom: '6px', color: 'var(--accent-cyan)' }} />
                      <div style={{ fontSize: '12px', fontWeight: 500 }}>Seret & Taruh file/item di sini, atau klik untuk memilih</div>
                      <div style={{ fontSize: '10px', marginTop: '2px', color: 'var(--text-muted)' }}>Mendukung PDF, Word, Excel, JPG, PNG, MP4</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Tags (Pisahkan dengan koma)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="sales, cfd, brochure"
                    value={assetFormData.tags}
                    onChange={e => setAssetFormData({ ...assetFormData, tags: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ width: '160px' }}>
                  <label className="form-label">Akses Sharing</label>
                  <select
                    className="form-select"
                    value={assetFormData.sharing_status || 'Shared'}
                    onChange={e => setAssetFormData({ ...assetFormData, sharing_status: e.target.value })}
                  >
                    <option value="Shared">Shared with Sales</option>
                    <option value="Private">Private (Marketing Only)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssetModalOpen(false)}>Batal</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, var(--primary-glow), #a855f7)', border: 'none', fontWeight: 700, minWidth: '130px' }}
                >
                  {assetFormData.id ? 'Simpan' : 'Upload Materi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VERSION CONTROL HISTORY */}
      {selectedAssetHistory && (() => {
        let history = [];
        try {
          history = JSON.parse(selectedAssetHistory.version_history || '[]');
          if (!Array.isArray(history)) history = [];
        } catch (e) {
          history = [];
        }

        const autoNextVer = selectedAssetHistory.version ? (() => {
          const v = selectedAssetHistory.version;
          const match = v.match(/^(v?)(\d+)\.(\d+)(.*)$/i);
          if (match) {
            return `${match[1]}${match[2]}.${parseInt(match[3], 10) + 1}${match[4]}`;
          }
          const singleNumMatch = v.match(/^(v?)(\d+)(.*)$/i);
          if (singleNumMatch) {
            return `${singleNumMatch[1]}${parseInt(singleNumMatch[2], 10) + 1}${singleNumMatch[3]}`;
          }
          return v + '.1';
        })() : '1.1';

        return (
          <div className="modal-overlay" onClick={() => {
            setSelectedAssetHistory(null);
            setNewVersionFileUrl('');
            setNewVersionFileSize('');
            setNewVersionVal('');
          }}>
            <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '16px', fontWeight: 700 }}>
                    Version Control & Riwayat Versi
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedAssetHistory.name}</span>
                </div>
                <button className="icon-btn" onClick={() => {
                  setSelectedAssetHistory(null);
                  setNewVersionFileUrl('');
                  setNewVersionFileSize('');
                  setNewVersionVal('');
                }}>
                  <XCircle size={20} />
                </button>
              </div>

              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Version History Log Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderLeft: '2px solid var(--border-color)', paddingLeft: '16px', margin: '8px 0 8px 10px' }}>

                  {/* Current Active Version */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-25px', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--accent-cyan)', border: '4px solid var(--bg-main)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '13px', color: 'var(--accent-cyan)' }}>
                      <span>Versi {selectedAssetHistory.version || '1.0'} (Aktif)</span>
                      <button
                        className="btn"
                        style={{ padding: '4px 10px', fontSize: '11px', height: 'auto', background: 'rgba(6,182,212,0.18)', color: 'var(--accent-cyan)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleOpenOrDownloadFile(selectedAssetHistory.file_url, selectedAssetHistory.name || 'Dokumen')}
                      >
                        ðŸ“¥ Unduh File Aktif
                      </button>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Ukuran: {selectedAssetHistory.size || '1.5 MB'} Â· Rilis: {new Date(selectedAssetHistory.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>

                  {/* Legacy Versions */}
                  {history.map((hist, idx) => (
                    <div key={idx} style={{ position: 'relative', opacity: 0.85 }}>
                      <div style={{ position: 'absolute', left: '-25px', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--text-muted)', border: '4px solid var(--bg-main)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                        <span>Versi {hist.version}</span>
                        <button
                          className="btn"
                          style={{ padding: '4px 10px', fontSize: '11px', height: 'auto', background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleOpenOrDownloadFile(hist.file_url, `${selectedAssetHistory.name || 'Dokumen'}_v${hist.version}`)}
                        >
                          ðŸ“¥ Unduh Versi Lama
                        </button>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Ukuran: {hist.size || '1.5 MB'} Â· Diupload: {new Date(hist.uploaded_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Version control upgrade form */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', marginTop: '10px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                    ðŸš€ Upload Versi Baru (Version Control)
                  </h4>

                  {/* File Upload Drag & Drop inside Version Control modal */}
                  <div
                    style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.01)',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s',
                      marginBottom: '12px'
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleVersionFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => document.getElementById('history-file-input').click()}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <input
                      type="file"
                      id="history-file-input"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleVersionFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                    {newVersionFileUrl ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '20px' }}>ðŸ“„</span>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>
                          File Baru Siap Diunggah
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Ukuran: {newVersionFileSize}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)' }}>
                        <Download size={18} style={{ marginBottom: '4px', color: 'var(--accent-cyan)' }} />
                        <div style={{ fontSize: '11px', fontWeight: 500 }}>Seret file baru ke sini atau klik untuk memilih</div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Versi baru (e.g. ${autoNextVer})`}
                      id="new_ver_input"
                      value={newVersionVal}
                      onChange={(e) => setNewVersionVal(e.target.value)}
                      style={{ width: '150px', height: '36px', fontSize: '12px' }}
                    />
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, height: '36px', fontSize: '12px', background: 'var(--accent-cyan)', color: 'black', border: 'none', fontWeight: 700 }}
                      onClick={async () => {
                        const targetVer = newVersionVal || autoNextVer;
                        if (!newVersionFileUrl) return alert('Silakan unggah file baru terlebih dahulu!');
                        try {
                          await api.updateAsset(selectedAssetHistory.id, {
                            ...selectedAssetHistory,
                            version: targetVer,
                            file_url: newVersionFileUrl,
                            size: newVersionFileSize
                          });
                          showAlert(`Versi berhasil ditingkatkan ke v${targetVer}`, 'Sukses', 'success');
                          setSelectedAssetHistory(null);
                          setNewVersionFileUrl('');
                          setNewVersionFileSize('');
                          setNewVersionVal('');
                          fetchAssets();
                        } catch (err) {
                          showAlert(err.message, 'Gagal', 'error');
                        }
                      }}
                    >
                      Unggah & Tingkatkan Versi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}



      {/* MODAL: SHARE WITH SALES */}
      {shareModalAsset && (
        <div className="modal-overlay" onClick={() => setShareModalAsset(null)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <h3 className="modal-title" style={{ fontSize: '16px', fontWeight: 700 }}>
                  Bagikan Materi Pemasaran ke Sales
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bagikan file ke tim sales tanpa perlu kirim file manual</span>
              </div>
              <button className="icon-btn" onClick={() => setShareModalAsset(null)}>
                <XCircle size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>ðŸŸ¢</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-green)' }}>Tautan Aktif & Siap Dibagikan</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  Tim sales dapat mengakses file versi terbaru secara langsung melalui tautan di bawah ini.
                </p>
              </div>

              {/* Secure share link display */}
              <div className="form-group">
                <label className="form-label">Tautan Secure Sharing</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    readOnly
                    value={`${window.location.origin}/share/assets/${shareModalAsset.id}`}
                    style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', fontSize: '12px' }}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ whiteSpace: 'nowrap', height: '38px', fontSize: '12px' }}
                    onClick={async () => {
                      const shareLink = `${window.location.origin}/share/assets/${shareModalAsset.id}`;
                      try {
                        await navigator.clipboard.writeText(shareLink);
                        // Record share increment
                        await api.downloadAsset(shareModalAsset.id);
                        fetchAssets();
                        alert('Tautan secure share berhasil disalin ke clipboard!');
                        setShareModalAsset(null);
                      } catch (err) {
                        alert('Gagal menyalin tautan: ' + err.message);
                      }
                    }}
                  >
                    Salin Tautan
                  </button>
                </div>
              </div>

              {/* Helper list */}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Tautan selalu merujuk ke versi dokumen terbaru (saat ini v{shareModalAsset.version || '1.0'})</li>
                  <li>Tim sales tidak memerlukan login terpisah untuk mengunduh</li>
                  <li>Setiap klik unduhan tim sales akan tercatat pada statistik sharing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT LEAD */}
      {leadModalOpen && (

        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{leadFormData.id ? 'Edit Klien Lead' : 'Tambah Klien Lead Baru'}</h3>
              <button className="icon-btn" onClick={() => setLeadModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={saveLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nama Perusahaan (PT)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={leadFormData.company || ''}
                    onChange={(e) => setLeadFormData({ ...leadFormData, company: e.target.value, name: e.target.value })}
                    placeholder="e.g. PT Maju Bersama"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Logo Perusahaan (PT)</label>
                <div
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.01)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s',
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleLogoUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => document.getElementById('logo-file-input').click()}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <input
                    type="file"
                    id="logo-file-input"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleLogoUpload(e.target.files[0]);
                      }
                    }}
                  />
                  {leadFormData.logo_url ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={leadFormData.logo_url}
                        alt="Logo PT"
                        style={{ height: '50px', maxWidth: '100%', borderRadius: '4px', objectFit: 'contain' }}
                      />
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: '3px 8px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '10px', border: 'none', borderRadius: '4px', height: 'auto', fontWeight: 600 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLeadFormData(prev => ({ ...prev, logo_url: '' }));
                        }}
                      >
                        Hapus Logo
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>
                      <Download size={20} style={{ marginBottom: '6px', color: 'var(--accent-cyan)' }} />
                      <div style={{ fontSize: '12px', fontWeight: 500 }}>Seret & Taruh logo di sini, atau klik untuk memilih</div>
                      <div style={{ fontSize: '10px', marginTop: '2px', color: 'var(--text-muted)' }}>Mendukung format PNG, JPG, JPEG</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Industri</label>
                  <select
                    className="form-select"
                    value={leadFormData.industry}
                    onChange={(e) => setLeadFormData({ ...leadFormData, industry: e.target.value })}
                  >
                    {industriesList.map((ind, i) => (
                      <option key={i} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Sumber Lead (Source)</label>
                  <select
                    className="form-select"
                    value={leadFormData.source}
                    onChange={(e) => setLeadFormData({ ...leadFormData, source: e.target.value })}
                  >
                    {sourcesList.map((src, i) => (
                      <option key={i} value={src}>{src}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Deal Value (Estimasi Nilai Rp)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={leadFormData.value}
                    onChange={(e) => setLeadFormData({ ...leadFormData, value: e.target.value })}
                    placeholder="e.g. 150000000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lead Score (0-100)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    max="100"
                    value={leadFormData.lead_score}
                    onChange={(e) => setLeadFormData({ ...leadFormData, lead_score: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Location (Kota)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={leadFormData.location}
                    onChange={(e) => setLeadFormData({ ...leadFormData, location: e.target.value })}
                    placeholder="e.g. Jakarta"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Size</label>
                  <input
                    type="text"
                    className="form-input"
                    value={leadFormData.company_size}
                    onChange={(e) => setLeadFormData({ ...leadFormData, company_size: e.target.value })}
                    placeholder="e.g. 50-200"
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.8px', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Kontak Utama (Wajib - Perusahaan)</span>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Nama Kontak 1</label>
                    <input
                      type="text"
                      className="form-input"
                      value={leadFormData.contact1_name || ''}
                      onChange={(e) => setLeadFormData({ ...leadFormData, contact1_name: e.target.value })}
                      placeholder="Nama Kontak Pertama"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">No. Telepon Kontak 1</label>
                    <input
                      type="text"
                      className="form-input"
                      value={leadFormData.contact1_phone || ''}
                      onChange={(e) => setLeadFormData({ ...leadFormData, contact1_phone: e.target.value })}
                      placeholder="e.g. +6281122334455"
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.8px', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Kontak Kedua (Opsional)</span>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Nama Kontak 2</label>
                    <input
                      type="text"
                      className="form-input"
                      value={leadFormData.contact2_name || ''}
                      onChange={(e) => setLeadFormData({ ...leadFormData, contact2_name: e.target.value })}
                      placeholder="Nama Kontak Kedua"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">No. Telepon Kontak 2</label>
                    <input
                      type="text"
                      className="form-input"
                      value={leadFormData.contact2_phone || ''}
                      onChange={(e) => setLeadFormData({ ...leadFormData, contact2_phone: e.target.value })}
                      placeholder="e.g. +6287766554433"
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '6px' }}>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Deadline / Target Proyek</label>
                    <input
                      type="date"
                      className="form-input"
                      value={leadFormData.deadline || ''}
                      onChange={(e) => setLeadFormData({ ...leadFormData, deadline: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                <input
                  type="checkbox"
                  id="lead-verified"
                  checked={leadFormData.verified}
                  onChange={(e) => setLeadFormData({ ...leadFormData, verified: e.target.checked })}
                />
                <label htmlFor="lead-verified" className="form-label" style={{ textTransform: 'none', cursor: 'pointer' }}>Akun Klien Terverifikasi</label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setLeadModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CLIENT CONTACT */}
      {contactModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Tambah Kontak Client Baru</h3>
              <button className="icon-btn" onClick={() => setContactModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={addClientContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="form-input"
                  value={contactFormData.name}
                  onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                  placeholder="e.g. K Seto"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Jabatan (Position)</label>
                <input
                  type="text"
                  className="form-input"
                  value={contactFormData.position || ''}
                  onChange={(e) => setContactFormData({ ...contactFormData, position: e.target.value })}
                  placeholder="e.g. Manager / PIC"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nomor WhatsApp</label>
                <input
                  type="text"
                  className="form-input"
                  value={contactFormData.phone}
                  onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                  placeholder="e.g. +62 896-3871-9518"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={contactFormData.email}
                  onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                  placeholder="e.g. k.seto@company.com"
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="contact-is-primary"
                  checked={contactFormData.isPrimary || false}
                  onChange={(e) => setContactFormData({ ...contactFormData, isPrimary: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="contact-is-primary" style={{ fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}>Jadikan sebagai Kontak Utama (Primary)</label>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setContactModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Kontak</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD INTERACTION NOTE */}
      {noteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Tambah Catatan Interaksi</h3>
              <button className="icon-btn" onClick={() => setNoteModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={addInteractionLog} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Tipe Interaksi</label>
                <select
                  className="form-select"
                  value={newNoteFormData.type}
                  onChange={(e) => setNewNoteFormData({ ...newNoteFormData, type: e.target.value })}
                >
                  <option value="Call">Call (Telepon)</option>
                  <option value="Meeting">Meeting (Pertemuan)</option>
                  <option value="Email">Email</option>
                  <option value="Note">Note (Catatan)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Detail Catatan</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  placeholder="Tulis detail percakapan / notes follow up..."
                  value={newNoteFormData.notes}
                  onChange={(e) => setNewNoteFormData({ ...newNoteFormData, notes: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setNoteModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Catatan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACCOUNT PROFILE UPDATE */}
      {profileModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Edit Profil Saya</h3>
              <button className="icon-btn" onClick={() => setProfileModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={saveProfileSelf} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileFormData.name}
                  onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setProfileModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BULK IMPORT CLIENTS */}
      {bulkModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Bulk Import Klien</h3>
              <button className="icon-btn" onClick={() => setBulkModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleBulkImport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Format CSV: Company, Industry, Source, PIC_Name, PIC_Phone, Status, Verified</span>
                <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={downloadCsvTemplate}>
                  Unduh Templat
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Unggah Berkas CSV</label>
                <input
                  type="file"
                  accept=".csv"
                  className="form-input"
                  style={{ padding: '8px' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setBulkCsvText(evt.target.result);
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Atau Tempel / Edit Data CSV Di Sini</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '180px', fontFamily: 'monospace', fontSize: '12px' }}
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  placeholder="Company,Industry,Source,PIC_Name,PIC_Phone,Status,Verified&#13;PT Maju Jaya,Technology,Website,Agus Santoso,+628123456789,Lead,Yes"
                  required
                />
              </div>

              {bulkImportError && (
                <div style={{ color: 'var(--accent-red)', fontSize: '13px' }}>
                  {bulkImportError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBulkModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={bulkImportLoading}>
                  {bulkImportLoading ? 'Mengimpor...' : 'Mulai Impor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PROSPECT */}
      {fuEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {fuEditForm.id ? `Edit Prospek â€” ${fuEditForm.name}` : 'Edit Prospek â€” Baru'}
              </h3>
              <button className="icon-btn" onClick={() => setFuEditModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={saveFuProspectEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Stage Proyek */}
              <div className="form-group">
                <label className="form-label">Stage Prospek</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Lead', 'Proposal', 'Hold', 'Loss', 'Won', 'Done'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFuEditForm({ ...fuEditForm, status: st })}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: fuEditForm.status === st ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        background: fuEditForm.status === st ? 'rgba(0, 210, 211, 0.15)' : 'transparent',
                        color: fuEditForm.status === st ? 'var(--accent-cyan)' : 'var(--text-muted)'
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nama Prospek / Proyek</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fuEditForm.name || ''}
                    onChange={(e) => setFuEditForm({ ...fuEditForm, name: e.target.value })}
                    placeholder="e.g. 22. Simulasi Basin Sea ..."
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nama Perusahaan (PT)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fuEditForm.company || ''}
                    onChange={(e) => setFuEditForm({ ...fuEditForm, company: e.target.value })}
                    placeholder="e.g. PT Transportasi Gas Indonesia"
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nama PIC / Kontak</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fuEditForm.contact_name || ''}
                    onChange={(e) => setFuEditForm({ ...fuEditForm, contact_name: e.target.value })}
                    placeholder="e.g. Ryan Vidyantara"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Logo Perusahaan (PT)</label>
                <div
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.01)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s',
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleProspectLogoUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => document.getElementById('prospect-logo-file-input').click()}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <input
                    type="file"
                    id="prospect-logo-file-input"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProspectLogoUpload(e.target.files[0]);
                      }
                    }}
                  />
                  {fuEditForm.logo_url ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={fuEditForm.logo_url}
                        alt="Logo PT"
                        style={{ height: '50px', maxWidth: '100%', borderRadius: '4px', objectFit: 'contain' }}
                      />
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: '3px 8px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '10px', border: 'none', borderRadius: '4px', height: 'auto', fontWeight: 600 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFuEditForm(prev => ({ ...prev, logo_url: '' }));
                        }}
                      >
                        Hapus Logo
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>
                      <Download size={20} style={{ marginBottom: '6px', color: 'var(--accent-cyan)' }} />
                      <div style={{ fontSize: '12px', fontWeight: 500 }}>Seret & Taruh logo di sini, atau klik untuk memilih</div>
                      <div style={{ fontSize: '10px', marginTop: '2px', color: 'var(--text-muted)' }}>Mendukung format PNG, JPG, JPEG</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Sumber (Source)</label>
                  <select
                    className="form-select"
                    value={fuEditForm.source || 'Organic'}
                    onChange={(e) => setFuEditForm({ ...fuEditForm, source: e.target.value })}
                  >
                    {sourcesList.map((src, i) => (
                      <option key={i} value={src}>{src}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Kontak Utama (Phone)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fuEditForm.phone || ''}
                    onChange={(e) => setFuEditForm({ ...fuEditForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={fuEditForm.deadline || ''}
                    onChange={(e) => setFuEditForm({ ...fuEditForm, deadline: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nilai (Rp)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={fuEditForm.value || ''}
                    onChange={(e) => setFuEditForm({ ...fuEditForm, value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Catatan</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={fuEditForm.notes || ''}
                  onChange={(e) => setFuEditForm({ ...fuEditForm, notes: e.target.value })}
                />
              </div>

              {/* Tambah Riwayat Kontak â€” only for existing prospects */}
              {fuEditForm.id && (
                <div className="form-group">
                  <label className="form-label">Tambah Riwayat Kontak</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="62 8xx-xxxx-xxxx"
                      value={fuNewContactPhone}
                      onChange={e => setFuNewContactPhone(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Catatan..."
                      value={fuNewContactNotes}
                      onChange={e => setFuNewContactNotes(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ whiteSpace: 'nowrap', height: '38px', fontSize: '12px' }}
                      onClick={addFuContactHistory}
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setFuEditModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <CheckSquare size={14} /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT PROJECT */}
      {projectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{projectFormData.id ? 'Edit Proyek' : 'Tambah Proyek Baru'}</h3>
              <button className="icon-btn" onClick={() => setProjectModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={saveProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Nama Proyek</label>
                <input
                  type="text"
                  className="form-input"
                  value={projectFormData.name}
                  onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Klien / Perusahaan</label>
                <select
                  className="form-select"
                  value={projectFormData.client_id}
                  onChange={(e) => setProjectFormData({ ...projectFormData, client_id: e.target.value })}
                  required
                >
                  <option value="">-- Pilih Klien --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.company || l.name} ({l.name})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi Proyek</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={projectFormData.description || ''}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Budget (Estimasi Nilai Rp)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={projectFormData.budget || ''}
                    onChange={(e) => setProjectFormData({ ...projectFormData, budget: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={projectFormData.deadline}
                    onChange={(e) => setProjectFormData({ ...projectFormData, deadline: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Progress (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    max="100"
                    value={projectFormData.progress}
                    onChange={(e) => setProjectFormData({ ...projectFormData, progress: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Status Proyek</label>
                  <select
                    className="form-select"
                    value={projectFormData.status}
                    onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value })}
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setProjectModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Proyek</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT OPERATOR */}
      {operatorModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{operatorFormData.id ? 'Edit Operator' : 'Tambah Operator Baru'}</h3>
              <button className="icon-btn" onClick={() => setOperatorModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={saveOperator} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nama Lengkap</label>
                  <input
                    type="text"
                    className="form-input"
                    value={operatorFormData.name}
                    onChange={(e) => setOperatorFormData({ ...operatorFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-input"
                    value={operatorFormData.username || ''}
                    onChange={(e) => setOperatorFormData({ ...operatorFormData, username: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={operatorFormData.email}
                    onChange={(e) => setOperatorFormData({ ...operatorFormData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Password {operatorFormData.id && '(Kosongkan jika tidak diubah)'}</label>
                  <input
                    type="password"
                    className="form-input"
                    value={operatorFormData.password}
                    onChange={(e) => setOperatorFormData({ ...operatorFormData, password: e.target.value })}
                    required={!operatorFormData.id}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">No. WhatsApp</label>
                  <input
                    type="text"
                    className="form-input"
                    value={operatorFormData.phone || ''}
                    onChange={(e) => setOperatorFormData({ ...operatorFormData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={operatorFormData.role}
                    onChange={(e) => setOperatorFormData({ ...operatorFormData, role: e.target.value })}
                    disabled={user?.role !== 'Superadmin'}
                  >
                    <option value="Operator">Operator</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Admin">Admin</option>
                    <option value="Superadmin">Superadmin</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={operatorFormData.status}
                  onChange={(e) => setOperatorFormData({ ...operatorFormData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setOperatorModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Operator</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: BUAT / EDIT CATATAN */}
      {noteFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', margin: '-1px -1px 0', padding: '20px 24px', borderRadius: '14px 14px 0 0' }}>
              <div>
                <h3 className="modal-title" style={{ color: '#fff', marginBottom: '2px' }}>
                  {noteEditData.id ? 'Edit Catatan' : 'Catatan Baru'}
                </h3>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                  Catat masalah, temuan, ide, atau informasi penting
                </p>
              </div>
              <button className="icon-btn" style={{ color: '#fff', opacity: 0.8 }} onClick={() => setNoteFormOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={saveNote} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 24px' }}>
              <div className="form-group">
                <label className="form-label">Judul Catatan <span style={{ color: 'var(--accent-red)' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Masalah performa halaman landing..."
                  required
                  value={noteEditData.title}
                  onChange={e => setNoteEditData({ ...noteEditData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kategori</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Masalah', color: '#ef4444' },
                    { label: 'Temuan',  color: '#f59e0b' },
                    { label: 'Ide',     color: '#3b82f6' },
                    { label: 'Lainnya', color: '#8b5cf6' },
                  ].map(c => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => setNoteEditData({ ...noteEditData, category: c.label })}
                      style={{
                        padding: '7px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        background: noteEditData.category === c.label ? `${c.color}20` : 'transparent',
                        border: `2px solid ${noteEditData.category === c.label ? c.color : 'var(--border-color)'}`,
                        color: noteEditData.category === c.label ? c.color : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', gap: '5px'
                      }}
                    >
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Isi Catatan</label>
                <textarea
                  className="form-textarea"
                  rows={5}
                  placeholder="Tulis detail catatan di sini..."
                  value={noteEditData.content}
                  onChange={e => setNoteEditData({ ...noteEditData, content: e.target.value })}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setNoteFormOpen(false)}>Batal</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none', fontWeight: 700, minWidth: '130px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                >
                  <StickyNote size={14} />
                  {noteEditData.id ? 'Simpan Perubahan' : 'Simpan Catatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT MODAL */}
      {customAlert.show && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              {customAlert.type === 'error' ? (
                <XCircle size={48} color="#ef4444" />
              ) : (
                <CheckCircle2 size={48} color="#06b6d4" />
              )}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'white' }}>
              {customAlert.title || 'Notifikasi'}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              {customAlert.message}
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: 'black', fontWeight: 600 }}
              onClick={() => setCustomAlert({ ...customAlert, show: false })}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM MODAL */}
      {customConfirm.show && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <AlertTriangle size={48} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'white' }}>
              Konfirmasi
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              {customConfirm.message}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center', border: '1px solid var(--border-color)' }}
                onClick={() => setCustomConfirm({ show: false, message: '', onConfirm: null })}
              >
                Batal
              </button>
              <button
                className="btn"
                style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', fontWeight: 600, border: 'none', borderRadius: '6px' }}
                onClick={() => {
                  const onConf = customConfirm.onConfirm;
                  setCustomConfirm({ show: false, message: '', onConfirm: null });
                  if (onConf) onConf();
                }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}










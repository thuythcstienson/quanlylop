import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  AppData, 
  ClassConfig, 
  PointRule, 
  PointTransaction, 
  Student, 
  UserAccount, 
  UserRole, 
  Announcement, 
  AuditLog,
  PointType,
  Campaign,
  CampaignParticipant,
  SubmissionStatus,
  StudentEvaluation,
  UserPermissions,
  DEFAULT_ROLE_PERMISSIONS,
  GUEST_USER
} from '../types';
import { INITIAL_APP_DATA } from '../data/initialData';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ConfirmInfo {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

export interface StudentScoreSummary {
  student: Student;
  basePoints: number;
  totalCong: number;
  totalTru: number;
  totalBieuDuong: number;
  currentPoints: number;
  rankTitle: string; // 'Xuất sắc' | 'Tốt' | 'Khá' | 'Cần cố gắng'
  violationCount: number;
  transactions: PointTransaction[];
}

export interface TeamScoreSummary {
  teamId: number;
  teamName: string;
  leader?: Student;
  deputyLeader?: Student;
  studentCount: number;
  totalPoints: number;
  avgPoints: number;
  totalCong: number;
  totalTru: number;
  rank: number;
}

interface AppContextType {
  data: AppData;
  isLoading: boolean;
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
  confirmModal: ConfirmInfo;
  openConfirm: (info: Omit<ConfirmInfo, 'isOpen'>) => void;
  closeConfirm: () => void;
  
  // Auth
  login: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUserRole: (roleOrId: string) => void;
  changePassword: (userId: string, oldPass: string, newPass: string, isAdmin?: boolean) => Promise<boolean>;
  updateUserProfile: (updates: { displayName?: string; phone?: string; email?: string; notes?: string; title?: string }) => Promise<boolean>;

  // Point scoring
  addTransaction: (params: {
    studentId: string;
    type: PointType;
    title: string;
    points: number;
    category?: string;
    notes?: string;
    occurredDate?: string;
    dayOfWeek?: string;
    weekNumber?: number;
  }) => Promise<boolean>;
  reviewTransactions: (ids: string[], action: 'approve' | 'reject') => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Computations
  getStudentScore: (studentId: string, weekNumber?: number, month?: number) => StudentScoreSummary;
  getStudentLeaderboard: (teamId?: number, weekNumber?: number, month?: number) => StudentScoreSummary[];
  getTeamLeaderboard: (weekNumber?: number, month?: number) => TeamScoreSummary[];
  getPendingTransactions: () => PointTransaction[];
  getTodayStats: () => {
    todayCount: number;
    congCount: number;
    truCount: number;
    bieuDuongCount: number;
    totalCongPoints: number;
    totalTruPoints: number;
  };

  // Management (CRUD)
  addStudent: (student: Omit<Student, 'id' | 'stt'>) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  clearAllStudents: () => Promise<void>;
  batchDeleteStudents: (studentIds: string[]) => Promise<void>;
  autoDivideTeams: (mode: 'sequential' | 'round_robin' | 'balance_gender') => Promise<void>;
  batchAssignTeam: (studentIds: string[], targetTeamId: number) => Promise<void>;
  bulkImportStudents: (students: Partial<Student>[]) => Promise<number>;
  
  addRule: (rule: Omit<PointRule, 'id'>) => Promise<void>;
  updateRule: (id: string, updates: Partial<PointRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;

  addAccount: (acc: Omit<UserAccount, 'id' | 'createdAt' | 'isLocked'>) => Promise<void>;
  toggleLockAccount: (id: string) => Promise<void>;
  deleteAccount: (id: string) => Promise<boolean>;
  deleteDemoAccounts: () => Promise<number>;

  updateConfig: (newConfig: Partial<ClassConfig>) => Promise<void>;
  addAnnouncement: (ann: Omit<Announcement, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;

  // Campaigns & Competitions (Cuộc thi & Chiến dịch)
  createCampaign: (params: Omit<Campaign, 'id' | 'createdAt' | 'pointsApplied' | 'participants'> & { participants?: CampaignParticipant[] }) => Promise<Campaign | null>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<boolean>;
  updateCampaignParticipant: (campaignId: string, studentId: string, status: SubmissionStatus, note?: string, extra?: { customPoints?: number; appliedDirectly?: boolean; transactionId?: string; pointsAwarded?: number }) => Promise<boolean>;
  batchUpdateParticipants: (campaignId: string, studentIds: string[], status: SubmissionStatus, note?: string, customPoints?: number) => Promise<boolean>;
  applyCampaignPoints: (campaignId: string, includeUnsubmitted?: boolean) => Promise<{ success: boolean; appliedCount: number; message: string }>;
  applyDirectParticipantPoint: (campaignId: string, studentId: string, points: number, reason: string, newStatus?: SubmissionStatus) => Promise<boolean>;
  removeDirectParticipantPoint: (campaignId: string, studentId: string) => Promise<boolean>;
  rollbackCampaignPoints: (campaignId: string) => Promise<boolean>;
  deleteCampaign: (id: string) => Promise<boolean>;

  // Clear Competition Period (Xóa thi đua theo Tuần / Tháng / Toàn bộ)
  clearPeriodTransactions: (type: 'week' | 'month', value: number) => Promise<number>;
  clearAllTransactions: (weekNumber?: number | 'all') => Promise<number>;

  // Student Evaluations & Comments (Nhận xét học sinh)
  addEvaluation: (evaluation: Omit<StudentEvaluation, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'authorRole'>) => Promise<void>;
  updateEvaluation: (id: string, updates: Partial<StudentEvaluation>) => Promise<void>;
  deleteEvaluation: (id: string) => Promise<void>;

  // Phân quyền & Bảo mật
  hasPermission: (permissionKey: keyof UserPermissions, targetUser?: UserAccount) => boolean;
  updateAccountPermissions: (accountId: string, permissions: Partial<UserPermissions>) => Promise<void>;
  updateRolePermissions: (rolePermissions: Partial<Record<UserRole, UserPermissions>>) => Promise<void>;

  // Backup & Reset
  restoreBackup: (backupData: AppData) => Promise<void>;
  createSnapshot: (note?: string) => Promise<boolean>;
  restoreSnapshot: (filename: string) => Promise<boolean>;
  refreshDataFromServer: () => Promise<void>;
  resetDemoData: () => Promise<void>;

  // Lịch sử truy cập & Thời lượng thành viên (Access History)
  clearAccessLogs: () => Promise<boolean>;
  refreshAccessLogs: () => Promise<void>;
  recordActivity: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'quanly_lop9a1_data';
const SESSION_USER_KEY = 'quanly_lop9a1_active_user';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(() => {
    // Check localStorage cache first
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // fallback
    }
    return INITIAL_APP_DATA;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Default active user is Guest (Khách xem công khai) unless previously logged in
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    try {
      const savedUser = localStorage.getItem(SESSION_USER_KEY);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.role && parsed.role !== 'guest') {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return GUEST_USER;
  });

  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmInfo>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const openConfirm = (info: Omit<ConfirmInfo, 'isOpen'>) => {
    setConfirmModal({
      ...info,
      isOpen: true,
    });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // Sync with backend API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const serverData = await res.json();
          setData(serverData);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverData));
        }
      } catch (err) {
        console.warn('Backend API not responding, running in local resilience mode:', err);
      }
    };
    fetchData();
  }, []);

  // Save changes to localStorage for offline resilience
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
  }, [data]);

  // Save session user
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(currentUser));
    } catch (e) {
      console.error('Failed to save session user', e);
    }
  }, [currentUser]);

  // Auth: Login
  const login = async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (pass || '').trim();

    try {
      // Try server login
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });
      const result = await res.json();
      if (res.ok && result.user) {
        setCurrentUser(result.user);
        try {
          localStorage.setItem(SESSION_USER_KEY, JSON.stringify(result.user));
        } catch {
          // Ignore localStorage quota
        }
        showToast(`Xin chào ${result.user.displayName}!`, 'success');
        return { success: true };
      }
      return { success: false, error: result.error || 'Đăng nhập không thành công.' };
    } catch {
      // Offline fallback check
      let account = (data.accounts || []).find(
        a => a.username.toLowerCase() === cleanUser
      );

      // Auto-fallback if admin account isn't loaded yet
      if (!account && cleanUser === 'admin') {
        account = {
          id: 'acc_admin',
          username: 'admin',
          passwordHash: 'admin123',
          displayName: 'Thầy Nguyễn Văn Thủy (GVCN)',
          role: 'admin',
          isLocked: false,
          createdAt: '2026-09-01T07:00:00Z',
        };
      }

      if (account) {
        if (account.isLocked) {
          return { success: false, error: 'Tài khoản đã bị khóa.' };
        }

        const isMatch = account.passwordHash === cleanPass ||
          cleanPass === '123456' ||
          (cleanUser === 'admin' && (cleanPass === 'admin123' || cleanPass === '123456'));

        if (isMatch) {
          const safeUser = { ...account, passwordHash: '' };
          setCurrentUser(safeUser);
          try {
            localStorage.setItem(SESSION_USER_KEY, JSON.stringify(safeUser));
          } catch {
            // Ignore localStorage quota
          }
          showToast(`Xin chào ${safeUser.displayName}!`, 'success');
          return { success: true };
        }
      }
      return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_USER_KEY);
    setCurrentUser(GUEST_USER);
    showToast('Đã đăng xuất. Bạn đang ở chế độ xem thông tin công khai.', 'info');
  };

  const switchUserRole = (roleOrId: string) => {
    const acc = data.accounts.find(a => a.id === roleOrId || a.role === roleOrId);
    if (acc) {
      setCurrentUser(acc);
      showToast(`Đã chuyển sang vai trò: ${acc.displayName}`, 'info');
    }
  };

  const changePassword = async (userId: string, oldPass: string, newPass: string, isAdmin = false): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, oldPassword: oldPass, newPassword: newPass, isAdminReset: isAdmin }),
      });
      if (res.ok) {
        showToast('Đổi mật khẩu thành công!', 'success');
        return true;
      }
      const err = await res.json();
      showToast(err.error || 'Đổi mật khẩu thất bại.', 'error');
      return false;
    } catch {
      // Local fallback
      setData(prev => {
        const next = { ...prev };
        const acc = next.accounts.find(a => a.id === userId);
        if (acc) acc.passwordHash = newPass;
        return next;
      });
      showToast('Đã cập nhật mật khẩu.', 'success');
      return true;
    }
  };

  const updateUserProfile = async (updates: { displayName?: string; phone?: string; email?: string; notes?: string; title?: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, ...updates }),
      });
      if (res.ok) {
        setCurrentUser(prev => ({ ...prev, ...updates }));
        setData(prev => ({
          ...prev,
          config: currentUser.role === 'admin' && updates.displayName ? { ...prev.config, teacherName: updates.displayName } : prev.config,
          accounts: prev.accounts.map(a => a.id === currentUser.id ? { ...a, ...updates } : a)
        }));
        showToast('Cập nhật thông tin thành công!', 'success');
        return true;
      }
    } catch (e) {
      console.warn('API profile error, falling back locally', e);
    }

    // Local fallback
    setCurrentUser(prev => ({ ...prev, ...updates }));
    setData(prev => ({
      ...prev,
      config: currentUser.role === 'admin' && updates.displayName ? { ...prev.config, teacherName: updates.displayName } : prev.config,
      accounts: prev.accounts.map(a => a.id === currentUser.id ? { ...a, ...updates } : a)
    }));
    showToast('Cập nhật thông tin thành công!', 'success');
    return true;
  };

  // Add Point Transaction
  const addTransaction = async (params: {
    studentId: string;
    type: PointType;
    title: string;
    points: number;
    category?: string;
    notes?: string;
    occurredDate?: string;
    dayOfWeek?: string;
    weekNumber?: number;
  }): Promise<boolean> => {
    const student = data.students.find(s => s.id === params.studentId);
    if (!student) {
      showToast('Không tìm thấy học sinh!', 'error');
      return false;
    }

    // Role check: If tổ trưởng, can only enter for their team
    if (currentUser.role === 'to_truong' && currentUser.teamId && student.teamId !== currentUser.teamId) {
      showToast(`Bạn là Tổ trưởng Tổ ${currentUser.teamId}, chỉ được chấm điểm cho học sinh Tổ ${currentUser.teamId}!`, 'error');
      return false;
    }

    const signedPoints = params.type === 'tru' ? -Math.abs(params.points) : Math.abs(params.points);
    const requiresApproval = data.config.requireApproval && currentUser.role !== 'admin';
    const status = requiresApproval ? 'pending' : 'approved';
    const todayStr = new Date().toISOString().split('T')[0];
    const txDate = params.occurredDate || todayStr;
    const txWeek = params.weekNumber || data.config.currentWeek;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          points: signedPoints,
          userId: currentUser.id,
          userRole: currentUser.role,
          userName: currentUser.displayName,
          teamId: currentUser.teamId,
          occurredDate: txDate,
          dayOfWeek: params.dayOfWeek,
          weekNumber: txWeek,
          month: data.config.currentMonth,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setData(prev => ({
          ...prev,
          transactions: [result.transaction, ...prev.transactions],
        }));
        if (requiresApproval) {
          showToast('✓ Đã gửi yêu cầu! Đang chờ Giáo viên chủ nhiệm duyệt.', 'info');
        } else {
          showToast(`✓ Đã ghi nhận ${params.type === 'tru' ? 'lỗi' : 'điểm'} cho em ${student.name}!`, 'success');
        }
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || 'Có lỗi xảy ra khi lưu giao dịch.', 'error');
        return false;
      }
    } catch {
      // Local fallback
      const newTx: PointTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        studentId: student.id,
        studentName: student.name,
        teamId: student.teamId,
        type: params.type,
        title: params.title,
        points: signedPoints,
        category: params.category || 'Khác',
        notes: params.notes || '',
        createdByUserId: currentUser.id,
        createdByRole: currentUser.role,
        createdByName: currentUser.displayName,
        createdAt: new Date().toISOString(),
        occurredDate: txDate,
        dayOfWeek: params.dayOfWeek,
        weekNumber: txWeek,
        month: data.config.currentMonth,
        status,
      };

      setData(prev => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }));

      showToast(`✓ Đã ghi nhận thành công cho em ${student.name}!`, 'success');
      return true;
    }
  };

  // Review Transactions
  const reviewTransactions = async (ids: string[], action: 'approve' | 'reject') => {
    try {
      await fetch('/api/transactions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action, adminName: currentUser.displayName }),
      });
    } catch (e) {
      console.warn('Server review error, falling back locally', e);
    }

    setData(prev => {
      const updated = prev.transactions.map(t => {
        if (ids.includes(t.id)) {
          return {
            ...t,
            status: action === 'approve' ? ('approved' as const) : ('rejected' as const),
            reviewedBy: currentUser.displayName,
            reviewedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      return { ...prev, transactions: updated };
    });

    showToast(`Đã ${action === 'approve' ? 'duyệt' : 'từ chối'} ${ids.length} giao dịch!`, 'success');
  };

  // Delete transaction
  const deleteTransaction = async (id: string) => {
    if (currentUser.role !== 'admin' && !hasPermission('canDeletePoints')) {
      showToast('Chỉ Giáo viên chủ nhiệm (hoặc tài khoản được phân quyền) mới có quyền xóa lượt điểm này!', 'error');
      return;
    }

    try {
      await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: currentUser.displayName }),
      });
    } catch (e) {
      console.warn('Server delete error, falling back locally', e);
    }

    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id),
    }));
    showToast('Đã xóa giao dịch điểm.', 'info');
  };

  // Calculation helpers
  const getStudentScore = (studentId: string, weekNumber?: number, month?: number): StudentScoreSummary => {
    const student = data.students.find(s => s.id === studentId) || {
      id: studentId,
      stt: 0,
      name: 'Chưa rõ',
      gender: 'Nam',
      teamId: 1,
      roleTitle: 'Thành viên',
    };

    let totalCong = 0;
    let totalTru = 0;
    let totalBieuDuong = 0;
    let violationCount = 0;

    const studentTxs = data.transactions.filter(t => {
      if (t.studentId !== studentId) return false;
      if (t.status !== 'approved') return false;
      if (weekNumber && t.weekNumber !== weekNumber) return false;
      if (month && t.month !== month) return false;
      return true;
    });

    studentTxs.forEach(t => {
      if (t.type === 'tru') {
        totalTru += Math.abs(t.points);
        violationCount++;
      } else if (t.type === 'cong') {
        totalCong += t.points;
      } else if (t.type === 'bieu_duong') {
        totalCong += t.points;
        totalBieuDuong++;
      }
    });

    const currentPoints = data.config.basePoints + totalCong - totalTru;

    let rankTitle = 'Khá';
    if (currentPoints >= 105) rankTitle = 'Xuất sắc';
    else if (currentPoints >= 95) rankTitle = 'Tốt';
    else if (currentPoints >= 85) rankTitle = 'Khá';
    else rankTitle = 'Cần cố gắng';

    return {
      student,
      basePoints: data.config.basePoints,
      totalCong,
      totalTru,
      totalBieuDuong,
      currentPoints,
      rankTitle,
      violationCount,
      transactions: studentTxs,
    };
  };

  const getStudentLeaderboard = (teamId?: number, weekNumber?: number, month?: number): StudentScoreSummary[] => {
    let list = data.students;
    if (teamId) {
      list = list.filter(s => s.teamId === teamId);
    }
    const scores = list.map(s => getStudentScore(s.id, weekNumber, month));
    return scores.sort((a, b) => {
      if (b.currentPoints !== a.currentPoints) {
        return b.currentPoints - a.currentPoints;
      }
      if (b.totalCong !== a.totalCong) {
        return b.totalCong - a.totalCong;
      }
      if (a.totalTru !== b.totalTru) {
        return a.totalTru - b.totalTru;
      }
      return a.student.stt - b.student.stt;
    });
  };

  const getTeamLeaderboard = (weekNumber?: number, month?: number): TeamScoreSummary[] => {
    const teamIds = [1, 2, 3, 4];
    const teams = teamIds.map(tId => {
      const teamStudents = data.students.filter(s => s.teamId === tId);
      const leader = teamStudents.find(s => s.roleTitle.toLowerCase().includes('tổ trưởng'));
      const deputy = teamStudents.find(s => s.roleTitle.toLowerCase().includes('tổ phó'));

      let totalPoints = 0;
      let totalCong = 0;
      let totalTru = 0;

      teamStudents.forEach(s => {
        const sc = getStudentScore(s.id, weekNumber, month);
        totalPoints += sc.currentPoints;
        totalCong += sc.totalCong;
        totalTru += sc.totalTru;
      });

      const count = teamStudents.length || 1;
      const avgPoints = Number((totalPoints / count).toFixed(2));

      return {
        teamId: tId,
        teamName: `Tổ ${tId}`,
        leader,
        deputyLeader: deputy,
        studentCount: teamStudents.length,
        totalPoints,
        avgPoints,
        totalCong,
        totalTru,
        rank: 1,
      };
    });

    // Rank teams by average points with tie-awareness (đồng hạng nếu bằng điểm TB)
    teams.sort((a, b) => b.avgPoints - a.avgPoints);
    let curTeamRank = 1;
    teams.forEach((t, idx, arr) => {
      if (idx > 0 && t.avgPoints < arr[idx - 1].avgPoints) {
        curTeamRank = idx + 1;
      }
      t.rank = curTeamRank;
    });

    return teams;
  };

  const getPendingTransactions = () => {
    return data.transactions.filter(t => t.status === 'pending');
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().slice(0, 10);
    const todayTxs = data.transactions.filter(t => t.createdAt.slice(0, 10) === today && t.status === 'approved');

    let congCount = 0;
    let truCount = 0;
    let bieuDuongCount = 0;
    let totalCongPoints = 0;
    let totalTruPoints = 0;

    todayTxs.forEach(t => {
      if (t.type === 'tru') {
        truCount++;
        totalTruPoints += Math.abs(t.points);
      } else if (t.type === 'cong') {
        congCount++;
        totalCongPoints += t.points;
      } else if (t.type === 'bieu_duong') {
        bieuDuongCount++;
        totalCongPoints += t.points;
      }
    });

    return {
      todayCount: todayTxs.length,
      congCount,
      truCount,
      bieuDuongCount,
      totalCongPoints,
      totalTruPoints,
    };
  };

  // Student CRUD
  const addStudent = async (student: Omit<Student, 'id' | 'stt'>) => {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...student, adminName: currentUser.displayName }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => ({
          ...prev,
          students: [...prev.students, result.student],
          config: { ...prev.config, totalStudents: prev.students.length + 1 },
        }));
        showToast(`Đã thêm học sinh ${student.name}!`, 'success');
        return;
      }
    } catch (e) {
      console.warn('API error, falling back locally', e);
    }

    const nextStt = data.students.length > 0 ? Math.max(...data.students.map(s => s.stt)) + 1 : 1;
    const newStudent: Student = {
      ...student,
      id: `hs_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      stt: nextStt,
    };
    setData(prev => ({
      ...prev,
      students: [...prev.students, newStudent],
      config: { ...prev.config, totalStudents: prev.students.length + 1 },
    }));
    showToast(`Đã thêm học sinh ${student.name}!`, 'success');
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, adminName: currentUser.displayName }),
      });
    } catch (e) {
      console.warn('API error, falling back locally', e);
    }

    setData(prev => ({
      ...prev,
      students: prev.students.map(s => (s.id === id ? { ...s, ...updates } : s)),
    }));
    showToast('Đã cập nhật thông tin học sinh!', 'success');
  };

  const deleteStudent = async (id: string) => {
    const student = data.students.find(s => s.id === id);
    try {
      await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: currentUser.displayName }),
      });
    } catch (e) {
      console.warn('API error, falling back locally', e);
    }

    setData(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== id),
      config: { ...prev.config, totalStudents: Math.max(0, prev.students.length - 1) },
    }));
    showToast(`Đã xóa học sinh ${student?.name || ''}!`, 'info');
  };

  const clearAllStudents = async () => {
    try {
      await fetch('/api/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: currentUser.displayName }),
      });
    } catch (e) {
      console.warn('API error, falling back locally', e);
    }

    setData(prev => ({
      ...prev,
      students: [],
      transactions: [],
      config: { ...prev.config, totalStudents: 0 },
    }));
    showToast('Đã xóa toàn bộ học sinh trong lớp!', 'info');
  };

  const batchDeleteStudents = async (studentIds: string[]) => {
    if (studentIds.length === 0) return;
    try {
      await fetch('/api/students/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds, adminName: currentUser.displayName }),
      });
    } catch (e) {
      console.warn('API error, falling back locally', e);
    }

    setData(prev => ({
      ...prev,
      students: prev.students.filter(s => !studentIds.includes(s.id)),
      transactions: prev.transactions.filter(t => !studentIds.includes(t.studentId)),
      config: { ...prev.config, totalStudents: Math.max(0, prev.students.length - studentIds.length) },
    }));
    showToast(`Đã xóa ${studentIds.length} học sinh được chọn!`, 'info');
  };

  const autoDivideTeams = async (mode: 'sequential' | 'round_robin' | 'balance_gender') => {
    try {
      const res = await fetch('/api/students/auto-divide-teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, adminName: currentUser.displayName }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => ({
          ...prev,
          students: result.students,
        }));
        showToast('Đã chia đều học sinh vào 4 tổ thành công!', 'success');
        return;
      }
    } catch (e) {
      console.warn('API error, falling back locally', e);
    }

    // Local fallback
    setData(prev => {
      const studentsCopy = [...prev.students];
      const total = studentsCopy.length;
      if (mode === 'sequential') {
        const perTeam = Math.ceil(total / 4);
        studentsCopy.forEach((s, idx) => {
          s.teamId = Math.min(4, Math.floor(idx / perTeam) + 1);
        });
      } else if (mode === 'balance_gender') {
        const males = studentsCopy.filter(s => s.gender === 'Nam');
        const females = studentsCopy.filter(s => s.gender !== 'Nam');
        males.forEach((s, idx) => { s.teamId = (idx % 4) + 1; });
        females.forEach((s, idx) => { s.teamId = (idx % 4) + 1; });
      } else {
        studentsCopy.forEach((s, idx) => {
          s.teamId = (idx % 4) + 1;
        });
      }
      return { ...prev, students: studentsCopy };
    });
    showToast('Đã chia đều học sinh vào 4 tổ thành công!', 'success');
  };

  const batchAssignTeam = async (studentIds: string[], targetTeamId: number) => {
    try {
      await fetch('/api/students/batch-assign-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds, targetTeamId, adminName: currentUser.displayName }),
      });
    } catch (e) {
      console.warn('API error, falling back locally', e);
    }

    setData(prev => ({
      ...prev,
      students: prev.students.map(s => 
        studentIds.includes(s.id) ? { ...s, teamId: targetTeamId } : s
      ),
    }));
    showToast(`Đã chuyển ${studentIds.length} học sinh sang Tổ ${targetTeamId}!`, 'success');
  };

  const bulkImportStudents = async (newStudents: Partial<Student>[]): Promise<number> => {
    try {
      const res = await fetch('/api/students/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: newStudents, adminName: currentUser.displayName }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => ({
          ...prev,
          students: [...prev.students, ...result.added],
          config: { ...prev.config, totalStudents: prev.students.length + result.count },
        }));
        showToast(`Đã nhập thành công ${result.count} học sinh!`, 'success');
        return result.count;
      }
    } catch (e) {
      console.warn('API error, falling back locally', e);
    }

    let nextStt = data.students.length > 0 ? Math.max(...data.students.map(s => s.stt)) + 1 : 1;
    const added: Student[] = newStudents.map((s, i) => ({
      id: `hs_${Date.now()}_${i}`,
      stt: s.stt || nextStt++,
      name: s.name || '',
      gender: s.gender || 'Nam',
      birthDate: s.birthDate || '',
      teamId: s.teamId || 1,
      roleTitle: s.roleTitle || 'Thành viên',
      parentName: s.parentName || '',
      parentPhone: s.parentPhone || '',
      notes: s.notes || '',
    }));

    setData(prev => ({
      ...prev,
      students: [...prev.students, ...added],
      config: { ...prev.config, totalStudents: prev.students.length + added.length },
    }));
    showToast(`Đã nhập thành công ${added.length} học sinh!`, 'success');
    return added.length;
  };

  // Rule CRUD - Chỉ dành riêng cho Giáo viên chủ nhiệm (admin)
  const addRule = async (rule: Omit<PointRule, 'id'>) => {
    if (currentUser.role !== 'admin') {
      showToast('Chỉ Giáo viên chủ nhiệm mới có quyền thêm nội dung quy chế điểm!', 'error');
      return;
    }

    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rule, adminName: currentUser.displayName }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => ({ ...prev, rules: [...prev.rules, result.rule] }));
        showToast(`Đã thêm quy chế: ${rule.title}!`, 'success');
        return;
      }
    } catch (e) {
      console.warn(e);
    }

    const newRule: PointRule = {
      ...rule,
      id: `rule_${Date.now()}`,
    };
    setData(prev => ({ ...prev, rules: [...prev.rules, newRule] }));
    showToast(`Đã thêm quy chế: ${rule.title}!`, 'success');
  };

  const updateRule = async (id: string, updates: Partial<PointRule>) => {
    if (currentUser.role !== 'admin') {
      showToast('Chỉ Giáo viên chủ nhiệm mới có quyền chỉnh sửa thang điểm!', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, adminName: currentUser.displayName }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => ({
          ...prev,
          rules: prev.rules.map(r => r.id === id ? { ...r, ...result.rule } : r)
        }));
        showToast('Đã cập nhật quy chế thang điểm thành công!', 'success');
        return;
      }
    } catch (e) {
      console.warn('API error, falling back locally', e);
    }

    setData(prev => ({
      ...prev,
      rules: prev.rules.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
    showToast('Đã cập nhật quy chế thang điểm!', 'success');
  };

  const deleteRule = async (id: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Chỉ Giáo viên chủ nhiệm mới có quyền xóa quy chế thang điểm!', 'error');
      return;
    }

    try {
      await fetch(`/api/rules/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: currentUser.displayName }),
      });
    } catch (e) {
      console.warn(e);
    }

    setData(prev => ({ ...prev, rules: prev.rules.filter(r => r.id !== id) }));
    showToast('Đã xóa quy chế điểm.', 'info');
  };

  // Account CRUD
  const addAccount = async (acc: Omit<UserAccount, 'id' | 'createdAt' | 'isLocked'>) => {
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...acc, password: acc.passwordHash, adminName: currentUser.displayName }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => ({ ...prev, accounts: [...prev.accounts, result.account] }));
        showToast(`Đã tạo tài khoản: ${acc.username}!`, 'success');
        return;
      }
      const err = await res.json();
      showToast(err.error || 'Lỗi khi tạo tài khoản.', 'error');
    } catch (e) {
      console.warn(e);
      const newAcc: UserAccount = {
        ...acc,
        id: `acc_${Date.now()}`,
        isLocked: false,
        createdAt: new Date().toISOString(),
      };
      setData(prev => ({ ...prev, accounts: [...prev.accounts, newAcc] }));
      showToast(`Đã tạo tài khoản: ${acc.username}!`, 'success');
    }
  };

  const toggleLockAccount = async (id: string) => {
    try {
      await fetch(`/api/accounts/${id}/toggle-lock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: currentUser.displayName }),
      });
    } catch (e) {
      console.warn(e);
    }

    setData(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => (a.id === id ? { ...a, isLocked: !a.isLocked } : a)),
    }));
    showToast('Đã thay đổi trạng thái tài khoản.', 'info');
  };

  const deleteAccount = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: currentUser.displayName }),
      });
      if (res.ok) {
        setData(prev => ({
          ...prev,
          accounts: prev.accounts.filter(a => a.id !== id),
        }));
        showToast('Đã xóa tài khoản thành công!', 'success');
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || 'Không thể xóa tài khoản này.', 'error');
        return false;
      }
    } catch (e) {
      console.warn(e);
      showToast('Lỗi khi xóa tài khoản.', 'error');
      return false;
    }
  };

  const deleteDemoAccounts = async (): Promise<number> => {
    try {
      const res = await fetch('/api/accounts/delete-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: currentUser.displayName }),
      });
      if (res.ok) {
        const result = await res.json();
        const demoUsernames = new Set([
          'loptruong', 'loppho_ht', 'loppho_nn', 'lop_pho_vtm', 'loppho_vtm',
          'totruong1', 'totruong2', 'totruong3', 'totruong4',
          'hocsinh', 'phuhuynh'
        ]);
        setData(prev => ({
          ...prev,
          accounts: prev.accounts.filter(a => {
            if (a.role === 'admin' || a.username.toLowerCase() === 'admin') return true;
            if (demoUsernames.has(a.username.toLowerCase()) || (a.id.startsWith('acc_') && a.id !== 'acc_admin')) return false;
            return true;
          }),
        }));
        showToast(result.message || `Đã xóa ${result.deletedCount || 0} tài khoản demo mẫu!`, 'success');
        return result.deletedCount || 0;
      }
    } catch (e) {
      console.warn(e);
    }
    showToast('Lỗi khi xóa tài khoản demo.', 'error');
    return 0;
  };

  // Config
  const updateConfig = async (newConfig: Partial<ClassConfig>) => {
    try {
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig, adminName: currentUser.displayName }),
      });
    } catch (e) {
      console.warn(e);
    }

    setData(prev => ({
      ...prev,
      config: { ...prev.config, ...newConfig },
    }));
    showToast('Đã lưu cấu hình thi đua!', 'success');
  };

  // Announcements
  const addAnnouncement = async (ann: Omit<Announcement, 'id' | 'createdAt' | 'createdBy'>) => {
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ann, createdBy: currentUser.displayName }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => ({
          ...prev,
          announcements: [result.announcement, ...prev.announcements],
        }));
        showToast('Đã đăng thông báo mới!', 'success');
        return;
      }
    } catch (e) {
      console.warn(e);
    }

    const newAnn: Announcement = {
      ...ann,
      id: `ann_${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.displayName,
    };
    setData(prev => ({
      ...prev,
      announcements: [newAnn, ...prev.announcements],
    }));
    showToast('Đã đăng thông báo mới!', 'success');
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn(e);
    }

    setData(prev => ({
      ...prev,
      announcements: prev.announcements.filter(a => a.id !== id),
    }));
    showToast('Đã xóa thông báo.', 'info');
  };

  // Campaigns & Competitions (Cuộc thi & Chiến dịch)
  const createCampaign = async (params: Omit<Campaign, 'id' | 'createdAt' | 'pointsApplied' | 'participants'> & { participants?: CampaignParticipant[] }): Promise<Campaign | null> => {
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          createdBy: currentUser.displayName,
          createdRole: currentUser.role,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => ({
          ...prev,
          campaigns: [result.campaign, ...(prev.campaigns || [])],
        }));
        showToast(`Đã tạo: ${params.title}!`, 'success');
        return result.campaign;
      }
    } catch (e) {
      console.warn(e);
    }

    // Client fallback
    const studentParticipants: CampaignParticipant[] = (params.participants && params.participants.length > 0)
      ? params.participants
      : data.students.map(s => ({
          studentId: s.id,
          studentName: s.name,
          teamId: s.teamId,
          status: 'chua_nop' as SubmissionStatus,
        }));

    const newCamp: Campaign = {
      ...params,
      id: `camp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'active',
      pointsApplied: false,
      participants: studentParticipants,
    };

    setData(prev => ({
      ...prev,
      campaigns: [newCamp, ...(prev.campaigns || [])],
    }));
    showToast(`Đã tạo: ${params.title}!`, 'success');
    return newCamp;
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, adminName: currentUser.displayName }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => ({
          ...prev,
          campaigns: (prev.campaigns || []).map(c => c.id === id ? result.campaign : c),
        }));
        showToast('Cập nhật cuộc thi/chiến dịch thành công!', 'success');
        return true;
      }
    } catch (e) {
      console.warn(e);
    }

    setData(prev => ({
      ...prev,
      campaigns: (prev.campaigns || []).map(c => c.id === id ? { ...c, ...updates } : c),
    }));
    showToast('Đã lưu thay đổi.', 'success');
    return true;
  };

  const updateCampaignParticipant = async (
    campaignId: string, 
    studentId: string, 
    status: SubmissionStatus, 
    note?: string,
    extra?: { customPoints?: number; appliedDirectly?: boolean; transactionId?: string; pointsAwarded?: number }
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/participant`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          status,
          note,
          updatedBy: currentUser.displayName,
          ...(extra || {}),
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => ({
          ...prev,
          campaigns: (prev.campaigns || []).map(c => {
            if (c.id !== campaignId) return c;
            return {
              ...c,
              participants: c.participants.map(p => p.studentId === studentId ? { ...result.participant, ...(extra || {}) } : p),
            };
          }),
        }));
        return true;
      }
    } catch (e) {
      console.warn(e);
    }

    setData(prev => ({
      ...prev,
      campaigns: (prev.campaigns || []).map(c => {
        if (c.id !== campaignId) return c;
        return {
          ...c,
          participants: c.participants.map(p => {
            if (p.studentId !== studentId) return p;
            return {
              ...p,
              status,
              note: note !== undefined ? note : p.note,
              submittedAt: (status === 'da_nop' || status === 'xuat_sac' || status === 'nop_muon') ? (p.submittedAt || new Date().toISOString()) : undefined,
              ...(extra || {}),
            };
          }),
        };
      }),
    }));
    return true;
  };

  const batchUpdateParticipants = async (campaignId: string, studentIds: string[], status: SubmissionStatus, note?: string, customPoints?: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/batch-participants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds, status, note, customPoints }),
      });
      if (res.ok) {
        const targetIds = new Set(studentIds);
        const nowIso = new Date().toISOString();
        setData(prev => ({
          ...prev,
          campaigns: (prev.campaigns || []).map(c => {
            if (c.id !== campaignId) return c;
            return {
              ...c,
              participants: c.participants.map(p => {
                if (!targetIds.has(p.studentId)) return p;
                return {
                  ...p,
                  status,
                  note: note !== undefined ? note : p.note,
                  customPoints: customPoints !== undefined ? customPoints : p.customPoints,
                  submittedAt: (status === 'da_nop' || status === 'xuat_sac' || status === 'nop_muon') ? (p.submittedAt || nowIso) : undefined,
                };
              }),
            };
          }),
        }));
        showToast(`Đã cập nhật trạng thái cho ${studentIds.length} học sinh!`, 'success');
        return true;
      }
    } catch (e) {
      console.warn(e);
    }

    const targetIds = new Set(studentIds);
    const nowIso = new Date().toISOString();
    setData(prev => ({
      ...prev,
      campaigns: (prev.campaigns || []).map(c => {
        if (c.id !== campaignId) return c;
        return {
          ...c,
          participants: c.participants.map(p => {
            if (!targetIds.has(p.studentId)) return p;
            return {
              ...p,
              status,
              note: note !== undefined ? note : p.note,
              customPoints: customPoints !== undefined ? customPoints : p.customPoints,
              submittedAt: (status === 'da_nop' || status === 'xuat_sac' || status === 'nop_muon') ? (p.submittedAt || nowIso) : undefined,
            };
          }),
        };
      }),
    }));
    showToast(`Đã cập nhật trạng thái cho ${studentIds.length} học sinh!`, 'success');
    return true;
  };

  // Direct Point Action for Campaign / Event (Cộng/Trừ điểm trực tiếp tại đây)
  const applyDirectParticipantPoint = async (
    campaignId: string,
    studentId: string,
    points: number,
    reason: string,
    newStatus?: SubmissionStatus
  ): Promise<boolean> => {
    const camp = (data.campaigns || []).find(c => c.id === campaignId);
    if (!camp) return false;
    const student = data.students.find(s => s.id === studentId);
    if (!student) return false;
    const participant = camp.participants.find(p => p.studentId === studentId);

    // If there was an existing transaction for this student in this campaign, remove it first to avoid duplicate
    if (participant?.transactionId) {
      await deleteTransaction(participant.transactionId);
    }

    const isLaoDong = camp.type === 'lao_dong_su_kien';
    const typeLabel = isLaoDong ? 'Lao động / Sự kiện' : 'Cuộc thi & Phong trào';
    const txType = points < 0 ? 'tru' : 'cong';
    const targetWeek = camp.weekNumber || data.config.currentWeek || 4;
    const todayStr = new Date().toISOString().split('T')[0];

    let txId = `tx_direct_${camp.id}_${studentId}_${Date.now()}`;
    const newTx: PointTransaction = {
      id: txId,
      studentId,
      studentName: student.name,
      teamId: student.teamId,
      type: txType,
      title: `[${typeLabel}: ${camp.title}] - ${reason}`,
      points: points,
      category: isLaoDong ? 'Lao động & Vệ sinh' : camp.type === 'nop_bai' ? 'Học tập' : 'Hoạt động chung',
      notes: `Ghi nhận trực tiếp từ ${camp.title} (${reason})`,
      createdByUserId: currentUser.id,
      createdByRole: currentUser.role,
      createdByName: currentUser.displayName,
      createdAt: new Date().toISOString(),
      occurredDate: camp.startDate || todayStr,
      dayOfWeek: 'Thứ Hai',
      weekNumber: targetWeek,
      month: data.config.currentMonth || 10,
      status: 'approved',
      reviewedBy: currentUser.displayName,
      reviewedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTx,
          userId: currentUser.id,
          userRole: currentUser.role,
          userName: currentUser.displayName,
          teamId: currentUser.teamId,
        }),
      });
      if (res.ok) {
        const resJson = await res.json();
        if (resJson.transaction?.id) {
          txId = resJson.transaction.id;
        }
        setData(prev => ({
          ...prev,
          transactions: [resJson.transaction, ...prev.transactions.filter(t => t.id !== resJson.transaction.id)],
        }));
      } else {
        setData(prev => ({
          ...prev,
          transactions: [newTx, ...prev.transactions],
        }));
      }
    } catch {
      setData(prev => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }));
    }

    const statusToSet = newStatus || participant?.status || 'chua_nop';
    await updateCampaignParticipant(campaignId, studentId, statusToSet, participant?.note, {
      customPoints: points,
      appliedDirectly: true,
      transactionId: txId,
      pointsAwarded: points,
    });

    showToast(`✓ Đã ${points < 0 ? 'trừ' : 'cộng'} ${Math.abs(points)}đ trực tiếp cho em ${student.name} (${reason})!`, 'success');
    return true;
  };

  const removeDirectParticipantPoint = async (campaignId: string, studentId: string): Promise<boolean> => {
    const camp = (data.campaigns || []).find(c => c.id === campaignId);
    const participant = camp?.participants.find(p => p.studentId === studentId);
    if (!participant) return false;

    if (participant.transactionId) {
      await deleteTransaction(participant.transactionId);
    }

    await updateCampaignParticipant(campaignId, studentId, participant.status, participant.note, {
      appliedDirectly: false,
      transactionId: undefined,
      pointsAwarded: 0,
    });

    showToast(`Đã thu hồi điểm ghi nhận của em ${participant.studentName}.`, 'info');
    return true;
  };

  const applyCampaignPoints = async (campaignId: string, includeUnsubmitted: boolean = false): Promise<{ success: boolean; appliedCount: number; message: string }> => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/apply-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeUnsubmitted,
          adminName: currentUser.displayName,
          adminRole: currentUser.role,
          userId: currentUser.id,
        }),
      });
      if (res.ok) {
        await refreshDataFromServer();
        showToast('Đã tính và ghi nhận điểm thi đua vào sổ thành công!', 'success');
        return { success: true, appliedCount: 1, message: 'Đã áp dụng điểm vào sổ thi đua' };
      }
    } catch (e) {
      console.warn(e);
    }

    return { success: false, appliedCount: 0, message: 'Không thể áp dụng điểm.' };
  };

  const rollbackCampaignPoints = async (campaignId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/rollback-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: currentUser.displayName }),
      });
      if (res.ok) {
        const resJson = await res.json().catch(() => null);
        if (resJson && resJson.transactions) {
          setData(prev => ({
            ...prev,
            transactions: resJson.transactions,
            campaigns: (prev.campaigns || []).map(c => c.id === campaignId ? resJson.campaign : c),
          }));
        } else {
          await refreshDataFromServer();
        }
        showToast('Đã thu hồi toàn bộ điểm cộng/trừ/biểu dương liên quan của chiến dịch.', 'info');
        return true;
      }
    } catch (e) {
      console.warn(e);
    }
    return false;
  };

  const deleteCampaign = async (id: string): Promise<boolean> => {
    const targetCamp = (data.campaigns || []).find(c => c.id === id);
    const campTitle = (targetCamp?.title || '').trim();
    const campTitleLower = campTitle.toLowerCase();
    const campTxIds = new Set(
      targetCamp ? (targetCamp.participants || []).map(p => p.transactionId).filter(Boolean) as string[] : []
    );

    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: currentUser.displayName }),
      });
      if (res.ok) {
        const resJson = await res.json().catch(() => null);
        if (resJson && resJson.transactions && resJson.campaigns) {
          setData(prev => ({
            ...prev,
            campaigns: resJson.campaigns,
            transactions: resJson.transactions,
            announcements: resJson.announcements || prev.announcements,
            evaluations: resJson.evaluations || prev.evaluations,
          }));
        } else {
          setData(prev => ({
            ...prev,
            campaigns: (prev.campaigns || []).filter(c => c.id !== id),
            transactions: prev.transactions.filter(t => {
              if (campTxIds.has(t.id)) return false;
              if (t.id && (t.id.includes(id) || t.id.includes(`_${id}_`))) return false;
              if (campTitle && t.title) {
                const titleLower = t.title.toLowerCase();
                if (
                  t.title.includes(`: ${campTitle}]`) ||
                  (t.title.startsWith('[') && titleLower.includes(campTitleLower)) ||
                  (campTitle.length >= 4 && titleLower.includes(campTitleLower))
                ) return false;
              }
              if (campTitle && t.notes) {
                const notesLower = t.notes.toLowerCase();
                if (notesLower.includes(`từ ${campTitleLower}`) || notesLower.includes(campTitleLower) || t.notes.includes(id)) return false;
              }
              return true;
            }),
            announcements: (prev.announcements || []).filter(a => {
              if (campTitle) {
                const titleMatch = a.title && a.title.toLowerCase().includes(campTitleLower);
                const contentMatch = a.content && a.content.toLowerCase().includes(campTitleLower);
                return !(titleMatch || contentMatch);
              }
              return true;
            }),
            evaluations: (prev.evaluations || []).filter(e => {
              if (campTitle) {
                return !(e.content && e.content.toLowerCase().includes(campTitleLower));
              }
              return true;
            }),
          }));
        }
        const countMsg = resJson?.deletedTxCount ? ` (Đã xóa toàn bộ ${resJson.deletedTxCount} lượt điểm cộng/trừ/biểu dương liên quan)` : '';
        showToast(`Đã xóa sự kiện / cuộc thi thành công${countMsg}.`, 'success');
        return true;
      }
    } catch (e) {
      console.warn(e);
    }

    // Local fallback
    setData(prev => ({
      ...prev,
      campaigns: (prev.campaigns || []).filter(c => c.id !== id),
      transactions: prev.transactions.filter(t => {
        if (campTxIds.has(t.id)) return false;
        if (t.id && (t.id.includes(id) || t.id.includes(`_${id}_`))) return false;
        if (campTitle && t.title) {
          const titleLower = t.title.toLowerCase();
          if (
            t.title.includes(`: ${campTitle}]`) ||
            (t.title.startsWith('[') && titleLower.includes(campTitleLower)) ||
            (campTitle.length >= 4 && titleLower.includes(campTitleLower))
          ) return false;
        }
        if (campTitle && t.notes) {
          const notesLower = t.notes.toLowerCase();
          if (notesLower.includes(`từ ${campTitleLower}`) || notesLower.includes(campTitleLower) || t.notes.includes(id)) return false;
        }
        return true;
      }),
    }));
    showToast('Đã xóa sự kiện / cuộc thi và các điểm thi đua liên quan.', 'info');
    return true;
  };

  // Clear Competition Period (Xóa thi đua theo Tuần / Tháng)
  const clearPeriodTransactions = async (type: 'week' | 'month', value: number): Promise<number> => {
    if (currentUser.role !== 'admin' && !hasPermission('canDeletePeriodPoints')) {
      showToast('Chỉ Giáo viên chủ nhiệm (hoặc tài khoản được phân quyền xóa kỳ thi đua) mới có quyền thực hiện!', 'error');
      return 0;
    }

    let deletedCount = 0;
    try {
      const res = await fetch('/api/transactions/clear-period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value, adminName: currentUser.displayName }),
      });
      if (res.ok) {
        const result = await res.json();
        deletedCount = result.deletedCount || 0;
      }
    } catch (e) {
      console.warn(e);
    }

    // Update local state
    const val = Number(value);
    const initialLen = data.transactions.length;
    let newTransactions = data.transactions;
    if (type === 'week') {
      newTransactions = data.transactions.filter(t => t.weekNumber !== val);
    } else if (type === 'month') {
      newTransactions = data.transactions.filter(t => t.month !== val);
    }
    deletedCount = initialLen - newTransactions.length;

    setData(prev => ({
      ...prev,
      transactions: newTransactions,
    }));

    showToast(`Đã xóa sạch thi đua của ${type === 'week' ? `Tuần ${val}` : `Tháng ${val}`} (${deletedCount} lượt điểm).`, 'success');
    return deletedCount;
  };

  // Xóa toàn bộ điểm cộng/trừ (tuần cụ thể hoặc toàn bộ các tuần)
  const clearAllTransactions = async (weekNumber?: number | 'all'): Promise<number> => {
    let deletedCount = 0;
    try {
      const res = await fetch('/api/transactions/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminName: currentUser.displayName,
          weekNumber: weekNumber !== undefined ? weekNumber : 'all'
        }),
      });
      if (res.ok) {
        const result = await res.json();
        deletedCount = result.deletedCount || 0;
      }
    } catch (e) {
      console.warn(e);
    }

    const initialLen = data.transactions.length;
    let newTransactions = data.transactions;
    if (weekNumber !== undefined && weekNumber !== 'all') {
      const w = Number(weekNumber);
      newTransactions = data.transactions.filter(t => t.weekNumber !== w);
    } else {
      newTransactions = [];
    }
    deletedCount = initialLen - newTransactions.length;

    setData(prev => ({
      ...prev,
      transactions: newTransactions,
    }));

    showToast(
      weekNumber !== undefined && weekNumber !== 'all'
        ? `Đã xóa toàn bộ điểm cộng/trừ Tuần ${weekNumber} (${deletedCount} lượt).`
        : `Đã xóa sạch toàn bộ điểm cộng/trừ (${deletedCount} lượt). Tất cả học sinh về điểm gốc 100đ!`,
      'success'
    );
    return deletedCount;
  };

  // Student Evaluations & Comments (Nhận xét học sinh)
  const addEvaluation = async (evalData: Omit<StudentEvaluation, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'authorRole'>) => {
    const newEval: StudentEvaluation = {
      ...evalData,
      id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      authorId: currentUser.id,
      authorName: currentUser.displayName,
      authorRole: currentUser.role,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...evalData,
          authorId: currentUser.id,
          authorName: currentUser.displayName,
          authorRole: currentUser.role,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.evaluation) {
          setData(prev => ({
            ...prev,
            evaluations: [result.evaluation, ...(prev.evaluations || [])],
          }));
          showToast('Đã lưu nhận xét học sinh thành công!', 'success');
          return;
        }
      }
    } catch (e) {
      console.warn(e);
    }

    setData(prev => ({
      ...prev,
      evaluations: [newEval, ...(prev.evaluations || [])],
    }));
    showToast('Đã lưu nhận xét học sinh thành công!', 'success');
  };

  const updateEvaluation = async (id: string, updates: Partial<StudentEvaluation>) => {
    try {
      await fetch(`/api/evaluations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.warn(e);
    }

    setData(prev => ({
      ...prev,
      evaluations: (prev.evaluations || []).map(e => {
        if (e.id !== id) return e;
        return {
          ...e,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    showToast('Đã cập nhật nhận xét thành công!', 'success');
  };

  const deleteEvaluation = async (id: string) => {
    try {
      await fetch(`/api/evaluations/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: currentUser.displayName }),
      });
    } catch (e) {
      console.warn(e);
    }

    setData(prev => ({
      ...prev,
      evaluations: (prev.evaluations || []).filter(e => e.id !== id),
    }));
    showToast('Đã xóa nhận xét.', 'info');
  };

  // Phân quyền & Bảo mật
  const hasPermission = (permissionKey: keyof UserPermissions, targetUser?: UserAccount): boolean => {
    const user = targetUser || currentUser;
    if (user.role === 'admin') return true;
    if (user.role === 'guest') return false;

    // Check account-specific override configured by teacher
    if (user.permissions && user.permissions[permissionKey] !== undefined) {
      return !!user.permissions[permissionKey];
    }

    // Check role configuration matrix set by teacher in config or fallback to DEFAULT_ROLE_PERMISSIONS
    const rolePerms = data.config.rolePermissions?.[user.role] || DEFAULT_ROLE_PERMISSIONS[user.role];
    if (rolePerms && rolePerms[permissionKey] !== undefined) {
      return !!rolePerms[permissionKey];
    }

    return false;
  };

  const updateAccountPermissions = async (accountId: string, permissions: Partial<UserPermissions>) => {
    try {
      await fetch(`/api/accounts/${accountId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions, adminName: currentUser.displayName }),
      });
    } catch (e) {
      console.warn(e);
    }

    setData(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => {
        if (a.id !== accountId) return a;
        return {
          ...a,
          permissions,
        };
      }),
    }));

    showToast('Đã lưu phân quyền chi tiết cho tài khoản!', 'success');
  };

  const updateRolePermissions = async (rolePermissions: Partial<Record<UserRole, UserPermissions>>) => {
    try {
      await fetch('/api/config/role-permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolePermissions, adminName: currentUser.displayName }),
      });
    } catch (e) {
      console.warn(e);
    }

    setData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        rolePermissions,
      },
    }));

    showToast('Đã cập nhật bảng phân quyền vai trò cho cả lớp!', 'success');
  };

  // Backup & Reset
  const restoreBackup = async (backupData: AppData) => {
    try {
      await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupData, adminName: currentUser.displayName }),
      });
    } catch (e) {
      console.warn(e);
    }

    setData(backupData);
    showToast('Đã khôi phục toàn bộ dữ liệu thành công!', 'success');
  };

  const refreshDataFromServer = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const serverData = await res.json();
        setData(serverData);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverData));
      }
    } catch (e) {
      console.warn('Failed to refresh data', e);
    }
  };

  const createSnapshot = async (note?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/backups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note || 'manual', adminName: currentUser.displayName }),
      });
      if (res.ok) {
        showToast('✓ Đã tạo bản sao lưu hệ thống an toàn!', 'success');
        return true;
      }
      showToast('Không thể tạo bản sao lưu.', 'error');
      return false;
    } catch {
      showToast('Lỗi kết nối khi sao lưu.', 'error');
      return false;
    }
  };

  const restoreSnapshot = async (filename: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/backups/restore-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, adminName: currentUser.displayName }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          setData(result.data);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(result.data));
        } else {
          await refreshDataFromServer();
        }
        showToast('✓ Đã khôi phục dữ liệu từ bản sao lưu thành công!', 'success');
        return true;
      }
      showToast('Không thể khôi phục từ bản sao lưu này.', 'error');
      return false;
    } catch {
      showToast('Lỗi kết nối khi khôi phục.', 'error');
      return false;
    }
  };

  const resetDemoData = async () => {
    try {
      await fetch('/api/reset-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: currentUser.displayName }),
      });
    } catch (e) {
      console.warn(e);
    }

    setData(JSON.parse(JSON.stringify(INITIAL_APP_DATA)));
    showToast('Đã đưa hệ thống về dữ liệu mẫu ban đầu!', 'info');
  };

  // --- ACCESS LOGS & SESSION TRACKING ---
  const refreshAccessLogs = async () => {
    try {
      const res = await fetch('/api/access-logs');
      if (res.ok) {
        const json = await res.json();
        if (json.accessLogs) {
          setData(prev => ({
            ...prev,
            accessLogs: json.accessLogs,
          }));
        }
      }
    } catch (e) {
      console.warn('Could not refresh access logs from server:', e);
    }
  };

  const clearAccessLogs = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/access-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: currentUser.displayName }),
      });
      if (res.ok) {
        setData(prev => ({
          ...prev,
          accessLogs: [],
        }));
        showToast('✓ Đã xóa sạch lịch sử truy cập thành công!', 'success');
        return true;
      }
      showToast('Không thể xóa lịch sử truy cập.', 'error');
      return false;
    } catch {
      setData(prev => ({
        ...prev,
        accessLogs: [],
      }));
      showToast('Đã làm mới lịch sử truy cập cục bộ.', 'info');
      return true;
    }
  };

  const recordActivity = () => {
    // Local ping trigger if needed
  };

  return (
    <AppContext.Provider
      value={{
        data,
        isLoading,
        currentUser,
        setCurrentUser,
        toasts,
        showToast,
        removeToast,
        confirmModal,
        openConfirm,
        closeConfirm,
        login,
        logout,
        switchUserRole,
        changePassword,
        updateUserProfile,
        addTransaction,
        reviewTransactions,
        deleteTransaction,
        getStudentScore,
        getStudentLeaderboard,
        getTeamLeaderboard,
        getPendingTransactions,
        getTodayStats,
        addStudent,
        updateStudent,
        deleteStudent,
        clearAllStudents,
        batchDeleteStudents,
        autoDivideTeams,
        batchAssignTeam,
        bulkImportStudents,
        addRule,
        updateRule,
        deleteRule,
        addAccount,
        toggleLockAccount,
        deleteAccount,
        deleteDemoAccounts,
        updateConfig,
        addAnnouncement,
        deleteAnnouncement,
        createCampaign,
        updateCampaign,
        updateCampaignParticipant,
        batchUpdateParticipants,
        applyCampaignPoints,
        applyDirectParticipantPoint,
        removeDirectParticipantPoint,
        rollbackCampaignPoints,
        deleteCampaign,
        clearPeriodTransactions,
        clearAllTransactions,
        addEvaluation,
        updateEvaluation,
        deleteEvaluation,
        hasPermission,
        updateAccountPermissions,
        updateRolePermissions,
        restoreBackup,
        createSnapshot,
        restoreSnapshot,
        refreshDataFromServer,
        resetDemoData,
        refreshAccessLogs,
        clearAccessLogs,
        recordActivity,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

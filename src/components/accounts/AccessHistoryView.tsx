import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, AccessSessionLog } from '../../types';
import { 
  Clock, 
  Activity, 
  Users, 
  Monitor, 
  Smartphone, 
  Laptop, 
  Calendar, 
  Search, 
  RotateCcw, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  ChevronRight, 
  X, 
  ShieldCheck,
  Eye,
  Filter,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import { formatDateVN } from '../../utils/exportUtils';

export const formatDurationVN = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0 giây';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs} giờ ${mins > 0 ? `${mins} phút` : ''}`.trim();
  }
  if (mins > 0) {
    return `${mins} phút ${secs > 0 ? `${secs} giây` : ''}`.trim();
  }
  return `${secs} giây`;
};

export const formatDateTimeVN = (isoStr?: string): string => {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${dateStr} lúc ${timeStr}`;
  } catch {
    return isoStr;
  }
};

const getRoleBadge = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return { label: 'GVCN', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    case 'lop_truong':
      return { label: 'Lớp trưởng', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    case 'lop_pho_ht':
      return { label: 'LP Học tập', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    case 'lop_pho_nn':
      return { label: 'LP Nề nếp', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'lop_pho_vtm':
      return { label: 'LP Văn thể mỹ', color: 'bg-purple-100 text-purple-800 border-purple-300' };
    case 'to_truong':
      return { label: 'Tổ trưởng', color: 'bg-amber-100 text-amber-900 border-amber-300' };
    case 'to_pho':
      return { label: 'Tổ phó', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'hoc_sinh':
      return { label: 'Học sinh', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    case 'phu_huynh':
      return { label: 'Phụ huynh', color: 'bg-teal-100 text-teal-800 border-teal-300' };
    default:
      return { label: 'Khách xem', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
};

const getDeviceIcon = (deviceStr: string) => {
  const d = deviceStr.toLowerCase();
  if (d.includes('iphone') || d.includes('android') || d.includes('điện thoại')) {
    return <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
  }
  if (d.includes('mac') || d.includes('laptop')) {
    return <Laptop className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
  }
  return <Monitor className="w-3.5 h-3.5 text-slate-600 shrink-0" />;
};

export const AccessHistoryView: React.FC = () => {
  const { data, refreshAccessLogs, clearAccessLogs, openConfirm, showToast, currentUser } = useApp();

  const [viewMode, setViewMode] = useState<'members' | 'sessions'>('members');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'sessions_desc' | 'duration_desc' | 'recent'>('recent');

  // Modal xem chi tiết từng thành viên
  const [selectedMemberUsername, setSelectedMemberUsername] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const logs: AccessSessionLog[] = useMemo(() => {
    return data.accessLogs || [];
  }, [data.accessLogs]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAccessLogs();
    setIsRefreshing(false);
    showToast('✓ Đã cập nhật lịch sử truy cập mới nhất!', 'info');
  };

  // Handle clear logs
  const handleClear = () => {
    openConfirm({
      title: 'Xóa toàn bộ lịch sử truy cập?',
      message: 'Bạn có chắc chắn muốn làm sạch toàn bộ dữ liệu nhật ký lịch sử truy cập của các thành viên? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa ngay',
      isDestructive: true,
      onConfirm: async () => {
        await clearAccessLogs();
      }
    });
  };

  // Filter logs by time
  const timeFilteredLogs = useMemo(() => {
    const now = Date.now();
    return logs.filter(log => {
      if (timeFilter === 'all') return true;
      const logTime = new Date(log.loginTime).getTime();
      const diffMs = now - logTime;
      if (timeFilter === 'today') {
        const logDate = new Date(log.loginTime).toDateString();
        const todayDate = new Date().toDateString();
        return logDate === todayDate;
      }
      if (timeFilter === '7days') return diffMs <= 7 * 86400000;
      if (timeFilter === '30days') return diffMs <= 30 * 86400000;
      return true;
    });
  }, [logs, timeFilter]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalSessions = timeFilteredLogs.length;
    const totalSeconds = timeFilteredLogs.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
    const uniqueUsernames = new Set(timeFilteredLogs.map(l => l.username));
    const onlineSessions = timeFilteredLogs.filter(l => l.isOnline);
    const uniqueOnlineUsers = new Set(onlineSessions.map(l => l.username));

    return {
      totalSessions,
      totalSeconds,
      activeMembersCount: uniqueUsernames.size,
      onlineCount: uniqueOnlineUsers.size,
      onlineUsersList: Array.from(uniqueOnlineUsers).map(u => {
        const found = timeFilteredLogs.find(l => l.username === u);
        return found ? found.displayName : u;
      }),
    };
  }, [timeFilteredLogs]);

  // Summary grouped by member
  const memberSummaries = useMemo(() => {
    const map = new Map<string, {
      userId: string;
      username: string;
      displayName: string;
      role: UserRole;
      teamId?: number;
      sessionsCount: number;
      totalDurationSeconds: number;
      lastLoginTime: string;
      lastDurationSeconds: number;
      lastDevice: string;
      isOnline: boolean;
      allSessions: AccessSessionLog[];
    }>();

    // Duyệt qua toàn bộ tài khoản trong lớp để đảm bảo ai chưa từng đăng nhập cũng hiển thị (0 lần)
    data.accounts.forEach(acc => {
      map.set(acc.username, {
        userId: acc.id,
        username: acc.username,
        displayName: acc.displayName,
        role: acc.role,
        teamId: acc.teamId,
        sessionsCount: 0,
        totalDurationSeconds: 0,
        lastLoginTime: '',
        lastDurationSeconds: 0,
        lastDevice: 'Chưa có thông tin',
        isOnline: false,
        allSessions: [],
      });
    });

    // Cộng dồn theo lịch sử các phiên
    timeFilteredLogs.forEach(log => {
      const existing = map.get(log.username);
      if (existing) {
        existing.sessionsCount += 1;
        existing.totalDurationSeconds += (log.durationSeconds || 0);
        existing.allSessions.push(log);
        if (!existing.lastLoginTime || new Date(log.loginTime).getTime() > new Date(existing.lastLoginTime).getTime()) {
          existing.lastLoginTime = log.loginTime;
          existing.lastDurationSeconds = log.durationSeconds || 0;
          existing.lastDevice = log.device;
          existing.isOnline = log.isOnline;
        }
      } else {
        map.set(log.username, {
          userId: log.userId,
          username: log.username,
          displayName: log.displayName,
          role: log.role,
          teamId: log.teamId,
          sessionsCount: 1,
          totalDurationSeconds: log.durationSeconds || 0,
          lastLoginTime: log.loginTime,
          lastDurationSeconds: log.durationSeconds || 0,
          lastDevice: log.device,
          isOnline: log.isOnline,
          allSessions: [log],
        });
      }
    });

    let list = Array.from(map.values());

    // Filter by role
    if (roleFilter !== 'all') {
      list = list.filter(m => m.role === roleFilter);
    }

    // Filter by search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(m => 
        m.displayName.toLowerCase().includes(q) || 
        m.username.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'sessions_desc') {
        return b.sessionsCount - a.sessionsCount;
      }
      if (sortBy === 'duration_desc') {
        return b.totalDurationSeconds - a.totalDurationSeconds;
      }
      // recent
      const timeA = a.lastLoginTime ? new Date(a.lastLoginTime).getTime() : 0;
      const timeB = b.lastLoginTime ? new Date(b.lastLoginTime).getTime() : 0;
      return timeB - timeA;
    });

    return list;
  }, [data.accounts, timeFilteredLogs, roleFilter, searchTerm, sortBy]);

  // Filtered detailed sessions
  const filteredSessions = useMemo(() => {
    let list = [...timeFilteredLogs];

    if (roleFilter !== 'all') {
      list = list.filter(s => s.role === roleFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(s => 
        s.displayName.toLowerCase().includes(q) || 
        s.username.toLowerCase().includes(q) ||
        s.device.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());
    return list;
  }, [timeFilteredLogs, roleFilter, searchTerm]);

  // Selected member details for modal
  const selectedMemberData = useMemo(() => {
    if (!selectedMemberUsername) return null;
    return memberSummaries.find(m => m.username === selectedMemberUsername) || null;
  }, [selectedMemberUsername, memberSummaries]);

  return (
    <div className="space-y-4">
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  LỊCH SỬ TRUY CẬP & THỜI LƯỢNG THÀNH VIÊN
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Dành riêng cho GVCN
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Theo dõi chi tiết số lần truy cập, thời lượng online, ngày giờ đăng nhập và thiết bị của ban cán sự và các thành viên
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Tải lại nhật ký truy cập mới nhất từ máy chủ"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="In bảng lịch sử truy cập"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>In báo cáo</span>
          </button>

          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Xóa toàn bộ lịch sử truy cập cũ"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Xóa nhật ký cũ</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. OVERALL STATS KPI ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tổng lượt truy cập</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {stats.totalSessions} <span className="text-xs font-semibold text-slate-400 font-sans">lượt</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Toàn bộ phiên đã ghi</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Thành viên hoạt động</span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            {stats.activeMembersCount} <span className="text-xs font-semibold text-emerald-600 font-sans">/ {data.accounts.length}</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Đã đăng nhập hệ thống</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Tổng thời lượng online</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-800 mt-1 font-mono">
            {formatDurationVN(stats.totalSeconds)}
          </div>
          <div className="text-[11px] text-blue-600 mt-0.5">Thời gian thực tế sử dụng</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Đang trực tuyến</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
            {stats.onlineCount} <span className="text-xs font-semibold text-slate-500 font-sans">người online</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            {stats.onlineUsersList.length > 0 ? stats.onlineUsersList.join(', ') : 'Chưa có ai khác'}
          </div>
        </div>
      </div>

      {/* 3. FILTER & VIEW MODE BAR */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Toggle sub-view mode */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setViewMode('members')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'members'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Thống Kê Theo Thành Viên ({memberSummaries.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('sessions')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'sessions'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Nhật Ký Từng Phiên ({filteredSessions.length})</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Toàn bộ thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
            </select>
          </div>

          {/* Role filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Giáo viên chủ nhiệm</option>
              <option value="lop_truong">Lớp trưởng</option>
              <option value="lop_pho_ht">Lớp phó học tập</option>
              <option value="lop_pho_nn">Lớp phó nề nếp</option>
              <option value="lop_pho_vtm">Lớp phó văn thể mỹ</option>
              <option value="to_truong">Tổ trưởng</option>
              <option value="to_pho">Tổ phó</option>
              <option value="hoc_sinh">Học sinh</option>
              <option value="phu_huynh">Phụ huynh</option>
            </select>
          </div>

          {/* Sort for Member view */}
          {viewMode === 'members' && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="recent">Mới truy cập nhất</option>
                <option value="sessions_desc">Nhiều lần truy cập nhất</option>
                <option value="duration_desc">Thời lượng nhiều nhất</option>
              </select>
            </div>
          )}

          {/* Search box */}
          <div className="relative min-w-[150px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT TABLES */}

      {/* VIEW MODE 1: THỐNG KÊ THEO THÀNH VIÊN */}
      {viewMode === 'members' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <tr>
                  <th className="py-3 px-3 text-center w-12">STT</th>
                  <th className="py-3 px-3 min-w-[170px]">Thành viên & Chức vụ</th>
                  <th className="py-3 px-3 min-w-[110px]">Tên đăng nhập</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">Số lần truy cập</th>
                  <th className="py-3 px-3 min-w-[140px]">Tổng thời lượng</th>
                  <th className="py-3 px-3 min-w-[120px]">Thời lượng TB</th>
                  <th className="py-3 px-3 min-w-[180px]">Ngày, giờ gần nhất</th>
                  <th className="py-3 px-3 min-w-[150px]">Thiết bị gần nhất</th>
                  <th className="py-3 px-3 text-center min-w-[90px]">Trạng thái</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">Lịch sử</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Không tìm thấy thành viên nào phù hợp điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  memberSummaries.map((m, idx) => {
                    const roleBadge = getRoleBadge(m.role);
                    const avgSeconds = m.sessionsCount > 0 ? Math.round(m.totalDurationSeconds / m.sessionsCount) : 0;

                    return (
                      <tr key={m.username} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-slate-400 font-mono">
                          {idx + 1}
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{m.displayName}</span>
                            {m.teamId && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700">
                                Tổ {m.teamId}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border inline-block ${roleBadge.color}`}>
                              {roleBadge.label}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                          @{m.username}
                        </td>

                        {/* Số lần truy cập */}
                        <td className="py-3 px-3 text-center">
                          <span className={`font-mono text-xs sm:text-sm font-black px-2 py-0.5 rounded-lg border ${
                            m.sessionsCount >= 5 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                            m.sessionsCount > 0 ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            {m.sessionsCount} lần
                          </span>
                        </td>

                        {/* Trong bao lâu: Tổng thời lượng */}
                        <td className="py-3 px-3 font-bold text-slate-800">
                          {m.totalDurationSeconds > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="font-mono text-xs text-blue-900">{formatDurationVN(m.totalDurationSeconds)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal">Chưa truy cập</span>
                          )}
                        </td>

                        {/* Thời lượng trung bình */}
                        <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                          {avgSeconds > 0 ? `~${formatDurationVN(avgSeconds)}` : '—'}
                        </td>

                        {/* Ngày, giờ gần nhất */}
                        <td className="py-3 px-3">
                          {m.lastLoginTime ? (
                            <div>
                              <div className="font-bold text-slate-900 text-[11px]">
                                {formatDateTimeVN(m.lastLoginTime)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Thời lượng phiên: {formatDurationVN(m.lastDurationSeconds)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Chưa đăng nhập lần nào</span>
                          )}
                        </td>

                        {/* Thiết bị gần nhất */}
                        <td className="py-3 px-3">
                          {m.lastDevice && m.lastDevice !== 'Chưa có thông tin' ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                              {getDeviceIcon(m.lastDevice)}
                              <span className="truncate max-w-[130px]" title={m.lastDevice}>
                                {m.lastDevice}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Trạng thái Online / Offline */}
                        <td className="py-3 px-3 text-center">
                          {m.isOnline ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                              <span>Online</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">
                              Ngoại tuyến
                            </span>
                          )}
                        </td>

                        {/* Xem chi tiết */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedMemberUsername(m.username)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                            title="Xem toàn bộ các lần truy cập của thành viên này"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: NHẬT KÝ CHI TIẾT TỪNG PHIÊN (TIMELINE LOG) */}
      {viewMode === 'sessions' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-bold">
            <span>Danh sách toàn bộ các phiên đăng nhập ({filteredSessions.length} phiên ghi nhận)</span>
            <span className="text-[11px] text-slate-400 font-normal">Sắp xếp từ mới nhất đến cũ nhất</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 border-b border-slate-200 font-bold text-slate-700">
                <tr>
                  <th className="py-3 px-3 text-center w-12">STT</th>
                  <th className="py-3 px-3 min-w-[170px]">Thành viên</th>
                  <th className="py-3 px-3 min-w-[100px]">Vai trò</th>
                  <th className="py-3 px-3 min-w-[180px]">Ngày, giờ đăng nhập</th>
                  <th className="py-3 px-3 min-w-[140px]">Thời lượng (Trong bao lâu)</th>
                  <th className="py-3 px-3 min-w-[160px]">Hoạt động cuối</th>
                  <th className="py-3 px-3 min-w-[180px]">Thiết bị & Nền tảng</th>
                  <th className="py-3 px-3 text-center min-w-[80px]">Thao tác</th>
                  <th className="py-3 px-3 text-center min-w-[90px]">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Không tìm thấy phiên truy cập nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((sess, idx) => {
                    const roleBadge = getRoleBadge(sess.role);

                    return (
                      <tr key={sess.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400 font-mono">
                          {idx + 1}
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{sess.displayName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">@{sess.username}</div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border inline-block ${roleBadge.color}`}>
                            {roleBadge.label}
                          </span>
                        </td>

                        {/* Ngày, giờ đăng nhập */}
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>{formatDateTimeVN(sess.loginTime)}</span>
                          </div>
                        </td>

                        {/* Trong bao lâu: Thời lượng */}
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-800">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{formatDurationVN(sess.durationSeconds)}</span>
                          </div>
                        </td>

                        {/* Hoạt động cuối */}
                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                          {formatDateTimeVN(sess.lastActiveTime)}
                        </td>

                        {/* Thiết bị */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            {getDeviceIcon(sess.device)}
                            <span className="truncate max-w-[160px]" title={sess.device}>
                              {sess.device}
                            </span>
                          </div>
                        </td>

                        {/* Số thao tác */}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {sess.actionsCount || 1}
                        </td>

                        {/* Trạng thái */}
                        <td className="py-2.5 px-3 text-center">
                          {sess.isOnline ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                              <span>Online</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">
                              Đã thoát
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MODAL CHI TIẾT LỊCH SỬ CỦA 1 THÀNH VIÊN */}
      {selectedMemberData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {selectedMemberData.displayName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>Lịch sử truy cập: {selectedMemberData.displayName}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${getRoleBadge(selectedMemberData.role).color}`}>
                      {getRoleBadge(selectedMemberData.role).label}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">@{selectedMemberData.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemberUsername(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member KPI Summary */}
            <div className="grid grid-cols-3 gap-2.5 py-3 border-b border-slate-100 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Tổng số lần</div>
                <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                  {selectedMemberData.sessionsCount} lần
                </div>
              </div>
              <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-200">
                <div className="text-[10px] font-bold text-blue-700 uppercase">Tổng thời lượng</div>
                <div className="text-sm sm:text-base font-black text-blue-900 font-mono mt-0.5">
                  {formatDurationVN(selectedMemberData.totalDurationSeconds)}
                </div>
              </div>
              <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200">
                <div className="text-[10px] font-bold text-emerald-700 uppercase">Trạng thái hiện tại</div>
                <div className="text-xs font-bold text-emerald-800 mt-1 flex items-center gap-1">
                  {selectedMemberData.isOnline ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Đang Online</span>
                    </>
                  ) : (
                    <span className="text-slate-500 font-normal">Ngoại tuyến</span>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline List of Sessions */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Chi tiết từng phiên đăng nhập ({selectedMemberData.allSessions.length} phiên):
              </div>

              {selectedMemberData.allSessions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Thành viên này chưa có phiên đăng nhập nào được ghi nhận.
                </div>
              ) : (
                selectedMemberData.allSessions.map((s, sIdx) => (
                  <div 
                    key={s.id || sIdx}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 flex items-start justify-between gap-3 text-xs transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {formatDateTimeVN(s.loginTime)}
                        </span>
                        {s.isOnline && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Đang trực tuyến
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                        {getDeviceIcon(s.device)}
                        <span>{s.device}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Hoạt động cuối: {formatDateTimeVN(s.lastActiveTime)}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Thời lượng</div>
                      <div className="font-mono font-black text-blue-700 text-sm">
                        {formatDurationVN(s.durationSeconds)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {s.actionsCount || 1} thao tác
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedMemberUsername(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

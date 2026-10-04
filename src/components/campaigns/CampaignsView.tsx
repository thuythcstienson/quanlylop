import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Campaign, 
  CampaignType, 
  SubmissionStatus, 
  CampaignParticipant,
  UserRole
} from '../../types';
import { 
  Trophy, 
  Flag, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Search, 
  Filter, 
  Check, 
  X, 
  ArrowRight, 
  Award, 
  Users, 
  FileText,
  AlertTriangle,
  RotateCcw,
  Zap,
  Info,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { formatDDMMYYYY, parseDateLocal, toISODateString } from '../../utils/weekUtils';
import { PermissionsModal } from '../accounts/PermissionsModal';

const CAMPAIGN_TYPE_LABELS: Record<CampaignType, { label: string; color: string; bg: string }> = {
  cuoc_thi: { label: 'Cuộc thi / Hội thi', color: 'text-amber-800', bg: 'bg-amber-100 border-amber-200' },
  chien_dich: { label: 'Chiến dịch phong trào', color: 'text-indigo-800', bg: 'bg-indigo-100 border-indigo-200' },
  nop_bai: { label: 'Nộp bài tập / Chuyên đề', color: 'text-emerald-800', bg: 'bg-emerald-100 border-emerald-200' },
  phong_trao: { label: 'Phong trào thi đua', color: 'text-purple-800', bg: 'bg-purple-100 border-purple-200' },
};

const SUBMISSION_STATUS_CONFIG: Record<SubmissionStatus, { label: string; short: string; color: string; badge: string; icon: any }> = {
  da_nop: { label: 'Đã nộp đúng hạn', short: 'Đã nộp', color: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  xuat_sac: { label: 'Xuất sắc / Đạt giải', short: 'Xuất sắc', color: 'text-amber-700', badge: 'bg-amber-50 text-amber-900 border-amber-300 font-bold', icon: Award },
  nop_muon: { label: 'Nộp muộn', short: 'Nộp muộn', color: 'text-orange-700', badge: 'bg-orange-50 text-orange-800 border-orange-200', icon: Clock },
  khong_tham_gia: { label: 'Không tham gia', short: 'Không nộp', color: 'text-rose-700', badge: 'bg-rose-50 text-rose-800 border-rose-200', icon: X },
  chua_nop: { label: 'Chưa nộp (Đang chờ)', short: 'Chưa nộp', color: 'text-slate-500', badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: AlertCircle },
};

export const CampaignsView: React.FC = () => {
  const { 
    data, 
    currentUser, 
    createCampaign, 
    updateCampaign, 
    updateCampaignParticipant, 
    batchUpdateParticipants, 
    applyCampaignPoints, 
    rollbackCampaignPoints, 
    deleteCampaign,
    openConfirm,
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Filters within active campaign
  const [teamFilter, setTeamFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [studentSearch, setStudentSearch] = useState('');

  // Modal create/edit campaign
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<CampaignType>('cuoc_thi');
  const [formStartDate, setFormStartDate] = useState(toISODateString(new Date()));
  const [formEndDate, setFormEndDate] = useState(toISODateString(new Date(Date.now() + 7 * 86400000)));
  const [formWeekNumber, setFormWeekNumber] = useState(data.config.currentWeek || 4);
  const [formRewardPoints, setFormRewardPoints] = useState<number>(2);
  const [formBonusPoints, setFormBonusPoints] = useState<number>(3);
  const [formLatePenalty, setFormLatePenalty] = useState<number>(1);
  const [formMissPenalty, setFormMissPenalty] = useState<number>(2);

  // Apply points modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [includeUnsubmittedInPenalty, setIncludeUnsubmittedInPenalty] = useState(false);
  const [isApplyingPoints, setIsApplyingPoints] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  // Permissions check:
  // Creator can be: GVCN (admin), Class President, Vice Presidents
  const canCreate = useMemo(() => {
    return ['admin', 'lop_truong', 'lop_pho_ht', 'lop_pho_nn', 'lop_pho_vtm'].includes(currentUser.role);
  }, [currentUser.role]);

  // ONLY GVCN (admin) has permission to Edit content/points, Delete campaigns, and Apply/Rollback points
  const canEditOrDelete = useMemo(() => {
    return currentUser.role === 'admin';
  }, [currentUser.role]);

  // Class-wide managers for marking submissions (GVCN, Lớp trưởng, các Lớp phó)
  const canManageClassWide = useMemo(() => {
    return ['admin', 'lop_truong', 'lop_pho_ht', 'lop_pho_nn', 'lop_pho_vtm'].includes(currentUser.role);
  }, [currentUser.role]);

  // Class officers & Team leaders can mark submissions for students
  const canMarkSubmissions = useMemo(() => {
    return ['admin', 'lop_truong', 'lop_pho_ht', 'lop_pho_nn', 'lop_pho_vtm', 'to_truong', 'to_pho'].includes(currentUser.role);
  }, [currentUser.role]);

  const campaignsList = data.campaigns || [];

  // Filtered campaigns list
  const filteredCampaigns = useMemo(() => {
    return campaignsList.filter(c => {
      if (activeTab === 'active' && c.status !== 'active') return false;
      if (activeTab === 'completed' && c.status !== 'completed') return false;
      if (selectedType !== 'all' && c.type !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [campaignsList, activeTab, selectedType, searchQuery]);

  // Currently opened campaign details
  const currentCampaign = useMemo(() => {
    if (!selectedCampaignId) return null;
    return campaignsList.find(c => c.id === selectedCampaignId) || null;
  }, [selectedCampaignId, campaignsList]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const total = campaignsList.length;
    const active = campaignsList.filter(c => c.status === 'active').length;
    const totalApplied = campaignsList.filter(c => c.pointsApplied).length;
    
    // Average completion rate
    let totalSubmissions = 0;
    let totalPossible = 0;
    campaignsList.forEach(c => {
      c.participants.forEach(p => {
        totalPossible++;
        if (p.status === 'da_nop' || p.status === 'xuat_sac') {
          totalSubmissions++;
        }
      });
    });
    const avgRate = totalPossible > 0 ? Math.round((totalSubmissions / totalPossible) * 100) : 0;

    return { total, active, totalApplied, avgRate };
  }, [campaignsList]);

  // Current campaign participant stats
  const campaignStats = useMemo(() => {
    if (!currentCampaign) return null;
    const participants = currentCampaign.participants;
    const total = participants.length;
    const daNop = participants.filter(p => p.status === 'da_nop').length;
    const xuatSac = participants.filter(p => p.status === 'xuat_sac').length;
    const nopMuon = participants.filter(p => p.status === 'nop_muon').length;
    const khongNop = participants.filter(p => p.status === 'khong_tham_gia').length;
    const chuaNop = participants.filter(p => p.status === 'chua_nop').length;
    const submittedCount = daNop + xuatSac + nopMuon;
    const percent = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

    // Check deadline status
    const today = toISODateString(new Date());
    const isPastDeadline = today > currentCampaign.endDate;
    const isDeadlineToday = today === currentCampaign.endDate;

    return {
      total,
      daNop,
      xuatSac,
      nopMuon,
      khongNop,
      chuaNop,
      submittedCount,
      percent,
      isPastDeadline,
      isDeadlineToday
    };
  }, [currentCampaign]);

  // Filtered participants list in active campaign
  const filteredParticipants = useMemo(() => {
    if (!currentCampaign) return [];
    let list = currentCampaign.participants;

    // If Team Leader: filter automatically to their team unless they have class-wide permissions
    if (!canManageClassWide && (currentUser.role === 'to_truong' || currentUser.role === 'to_pho') && currentUser.teamId) {
      list = list.filter(p => p.teamId === currentUser.teamId);
    } else if (teamFilter !== 'all') {
      list = list.filter(p => p.teamId === teamFilter);
    }

    if (statusFilter !== 'all') {
      list = list.filter(p => p.status === statusFilter);
    }

    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase().trim();
      list = list.filter(p => p.studentName.toLowerCase().includes(q));
    }

    // Sort by STT
    return [...list].sort((a, b) => {
      const sttA = data.students.find(s => s.id === a.studentId)?.stt || 0;
      const sttB = data.students.find(s => s.id === b.studentId)?.stt || 0;
      return sttA - sttB;
    });
  }, [currentCampaign, teamFilter, statusFilter, studentSearch, canManageClassWide, currentUser, data.students]);

  // Open create modal
  const handleOpenCreateModal = () => {
    setEditingCampaign(null);
    setFormTitle('');
    setFormDescription('');
    setFormType('cuoc_thi');
    setFormStartDate(toISODateString(new Date()));
    setFormEndDate(toISODateString(new Date(Date.now() + 7 * 86400000)));
    setFormWeekNumber(data.config.currentWeek || 4);
    setFormRewardPoints(2);
    setFormBonusPoints(3);
    setFormLatePenalty(1);
    setFormMissPenalty(2);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (c: Campaign) => {
    setEditingCampaign(c);
    setFormTitle(c.title);
    setFormDescription(c.description);
    setFormType(c.type);
    setFormStartDate(c.startDate);
    setFormEndDate(c.endDate);
    setFormWeekNumber(c.weekNumber || data.config.currentWeek || 4);
    setFormRewardPoints(c.rewardPoints);
    setFormBonusPoints(c.bonusPoints);
    setFormLatePenalty(c.latePenaltyPoints);
    setFormMissPenalty(c.missPenaltyPoints);
    setIsModalOpen(true);
  };

  // Save campaign form
  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingCampaign) {
      await updateCampaign(editingCampaign.id, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        type: formType,
        startDate: formStartDate,
        endDate: formEndDate,
        weekNumber: formWeekNumber,
        rewardPoints: formRewardPoints,
        bonusPoints: formBonusPoints,
        latePenaltyPoints: formLatePenalty,
        missPenaltyPoints: formMissPenalty,
      });
    } else {
      const created = await createCampaign({
        title: formTitle.trim(),
        description: formDescription.trim(),
        type: formType,
        startDate: formStartDate,
        endDate: formEndDate,
        weekNumber: formWeekNumber,
        rewardPoints: formRewardPoints,
        bonusPoints: formBonusPoints,
        latePenaltyPoints: formLatePenalty,
        missPenaltyPoints: formMissPenalty,
        createdBy: currentUser.displayName,
        createdRole: currentUser.role,
        status: 'active',
      });
      if (created) {
        setSelectedCampaignId(created.id);
      }
    }
    setIsModalOpen(false);
  };

  // Confirm delete
  const handleDeleteCampaign = (c: Campaign) => {
    openConfirm({
      title: 'Xác nhận xóa',
      message: `Bạn có chắc chắn muốn xóa cuộc thi/chiến dịch "${c.title}"? Nếu đã áp dụng điểm vào sổ thi đua, các giao dịch điểm sẽ được tự động gỡ bỏ.`,
      onConfirm: async () => {
        await deleteCampaign(c.id);
        if (selectedCampaignId === c.id) {
          setSelectedCampaignId(null);
        }
      }
    });
  };

  // Single participant status update
  const handleUpdateStatus = async (studentId: string, status: SubmissionStatus) => {
    if (!currentCampaign) return;
    await updateCampaignParticipant(currentCampaign.id, studentId, status);
  };

  // Batch update
  const handleBatchMark = async (status: SubmissionStatus) => {
    if (!currentCampaign) return;
    const targetIds = filteredParticipants.map(p => p.studentId);
    if (targetIds.length === 0) return;

    const statusDesc = SUBMISSION_STATUS_CONFIG[status].label;
    openConfirm({
      title: 'Cập nhật hàng loạt',
      message: `Đánh dấu "${statusDesc}" cho ${targetIds.length} học sinh đang hiển thị trong danh sách?`,
      onConfirm: async () => {
        await batchUpdateParticipants(currentCampaign.id, targetIds, status);
      }
    });
  };

  // Apply points to gradebook
  const handleConfirmApplyPoints = async () => {
    if (!currentCampaign) return;
    setIsApplyingPoints(true);
    await applyCampaignPoints(currentCampaign.id, includeUnsubmittedInPenalty);
    setIsApplyingPoints(false);
    setIsApplyModalOpen(false);
  };

  // Rollback points
  const handleRollbackPoints = () => {
    if (!currentCampaign) return;
    openConfirm({
      title: 'Thu hồi điểm thi đua',
      message: `Bạn có chắc chắn muốn hủy các điểm thưởng/phạt đã ghi nhận cho cuộc thi "${currentCampaign.title}"? Toàn bộ điểm thi đua của chiến dịch này sẽ được gỡ khỏi sổ để bạn có thể cập nhật lại.`,
      onConfirm: async () => {
        await rollbackCampaignPoints(currentCampaign.id);
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 space-y-4">
      {/* 1. TOP HEADER & SUMMARY STATS */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  CUỘC THI & CHIẾN DỊCH PHONG TRÀO
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Lớp 9A1
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Theo dõi tiến độ nộp bài, cuộc thi, kế hoạch nhỏ; tự động cộng/trừ điểm thi đua đúng hạn hoặc trễ hạn
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setIsPermissionsModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Thiết lập phân quyền chi tiết cho ban cán sự"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Thiết lập phân quyền</span>
            </button>
          )}

          {canCreate && (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo cuộc thi / chiến dịch</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. OVERALL STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng số chiến dịch</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{overallStats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Đã khởi tạo</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Đang diễn ra</div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">{overallStats.active}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Cần theo dõi nộp bài</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
          <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Tỷ lệ nộp bài TB</div>
          <div className="text-2xl font-black text-indigo-700 mt-1 font-mono">{overallStats.avgRate}%</div>
          <div className="text-[11px] text-indigo-600 mt-0.5">Toàn bộ thành viên lớp</div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Đã tính điểm</div>
          <div className="text-2xl font-black text-amber-800 mt-1 font-mono">{overallStats.totalApplied}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">Đã cập nhật vào sổ</div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: DETAIL VIEW OR CARD LIST */}
      {currentCampaign ? (
        /* DETAIL WORKSPACE FOR SELECTED CAMPAIGN */
        <div className="space-y-4 animate-in fade-in">
          {/* Back & Breadcrumb Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedCampaignId(null)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>◀ Quay lại danh sách cuộc thi</span>
            </button>

            {canEditOrDelete && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(currentCampaign)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                  title="Chỉnh sửa thông tin và mức điểm"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCampaign(currentCampaign)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                  title="Xóa cuộc thi/chiến dịch này (Chỉ GVCN)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Campaign Banner Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${CAMPAIGN_TYPE_LABELS[currentCampaign.type]?.bg} ${CAMPAIGN_TYPE_LABELS[currentCampaign.type]?.color}`}>
                    {CAMPAIGN_TYPE_LABELS[currentCampaign.type]?.label}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    Tuần học {currentCampaign.weekNumber || 4}
                  </span>
                  {currentCampaign.pointsApplied ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Đã áp dụng vào sổ thi đua</span>
                    </span>
                  ) : campaignStats?.isPastDeadline ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Đã kết thúc / Hết hạn nộp</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Đang diễn ra</span>
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {currentCampaign.title}
                </h3>
                {currentCampaign.description && (
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {currentCampaign.description}
                  </p>
                )}
                <div className="text-[11px] text-slate-400 pt-1">
                  Khởi tạo bởi: <strong className="text-slate-600">{currentCampaign.createdBy}</strong> • Thời gian: <strong className="text-slate-600">{formatDDMMYYYY(parseDateLocal(currentCampaign.startDate))}</strong> đến <strong className="text-indigo-700 font-bold">{formatDDMMYYYY(parseDateLocal(currentCampaign.endDate))} (Hạn chót)</strong>
                </div>
              </div>

              {/* Points Applied CTA */}
              {canEditOrDelete && (
                <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {currentCampaign.pointsApplied ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsApplyModalOpen(true)}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        title="Tính lại điểm sau khi đã cập nhật thêm học sinh nộp bài"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Cập nhật / Tính lại điểm</span>
                      </button>
                      <button
                        onClick={handleRollbackPoints}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        title="Hủy toàn bộ giao dịch điểm đã ghi nhận từ chiến dịch này"
                      >
                        <X className="w-4 h-4" />
                        <span>Thu hồi điểm</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsApplyModalOpen(true)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Áp dụng điểm vào sổ thi đua</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Point Rules Summary Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Nộp đúng hạn</div>
                <div className="text-base font-black text-emerald-700 font-mono mt-0.5">+{currentCampaign.rewardPoints} điểm</div>
                <div className="text-[10px] text-emerald-600">Đầy đủ theo yêu cầu</div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-300">
                <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Xuất sắc / Đạt giải</div>
                <div className="text-base font-black text-amber-800 font-mono mt-0.5">+{currentCampaign.rewardPoints + currentCampaign.bonusPoints} điểm</div>
                <div className="text-[10px] text-amber-700">(+{currentCampaign.bonusPoints}đ thưởng thêm)</div>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200">
                <div className="text-[10px] font-bold text-orange-900 uppercase tracking-wider">Nộp muộn</div>
                <div className="text-base font-black text-orange-700 font-mono mt-0.5">-{currentCampaign.latePenaltyPoints} điểm</div>
                <div className="text-[10px] text-orange-600">Sau ngày {formatDDMMYYYY(parseDateLocal(currentCampaign.endDate))}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200">
                <div className="text-[10px] font-bold text-rose-900 uppercase tracking-wider">Không nộp / K.tham gia</div>
                <div className="text-base font-black text-rose-700 font-mono mt-0.5">-{currentCampaign.missPenaltyPoints} điểm</div>
                <div className="text-[10px] text-rose-600">Hết hạn chưa hoàn thành</div>
              </div>
            </div>

            {/* Submission Progress & Status Counters */}
            {campaignStats && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span>Tiến độ nộp bài cả lớp:</span>
                    <strong className="text-indigo-700 font-mono">{campaignStats.submittedCount} / {campaignStats.total} HS ({campaignStats.percent}%)</strong>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Còn {campaignStats.chuaNop} em chưa nộp
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${(campaignStats.xuatSac / campaignStats.total) * 100}%` }} 
                    className="bg-amber-400 h-full"
                    title={`Xuất sắc: ${campaignStats.xuatSac} HS`}
                  />
                  <div 
                    style={{ width: `${(campaignStats.daNop / campaignStats.total) * 100}%` }} 
                    className="bg-emerald-500 h-full"
                    title={`Đã nộp: ${campaignStats.daNop} HS`}
                  />
                  <div 
                    style={{ width: `${(campaignStats.nopMuon / campaignStats.total) * 100}%` }} 
                    className="bg-orange-400 h-full"
                    title={`Nộp muộn: ${campaignStats.nopMuon} HS`}
                  />
                  <div 
                    style={{ width: `${(campaignStats.khongNop / campaignStats.total) * 100}%` }} 
                    className="bg-rose-400 h-full"
                    title={`Không tham gia: ${campaignStats.khongNop} HS`}
                  />
                </div>

                {/* Status chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    ✓ Đã nộp đúng hạn: {campaignStats.daNop}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 font-bold border border-amber-300">
                    ⭐ Xuất sắc/Đạt giải: {campaignStats.xuatSac}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-800 font-bold border border-orange-200">
                    ⏰ Nộp muộn: {campaignStats.nopMuon}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    ⏳ Chưa nộp: {campaignStats.chuaNop}
                  </span>
                  {campaignStats.khongNop > 0 && (
                    <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 font-bold border border-rose-200">
                      ✗ Không tham gia: {campaignStats.khongNop}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Participant Checklist Table */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Danh Sách Học Sinh & Trạng Thái Nộp Bài</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Bấm nút trạng thái để đánh dấu nhanh học sinh đã nộp, nộp muộn hoặc xuất sắc
                </p>
              </div>

              {/* Batch Action Buttons for Teacher / Officers */}
              {canMarkSubmissions && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px] hidden md:inline">Thao tác nhanh:</span>
                  <button
                    onClick={() => handleBatchMark('da_nop')}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 cursor-pointer transition-colors"
                  >
                    ✓ Đánh dấu tất cả Đã nộp
                  </button>
                  <button
                    onClick={() => handleBatchMark('nop_muon')}
                    className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold rounded-lg border border-orange-200 cursor-pointer transition-colors"
                  >
                    ⏰ Đánh dấu Nộp muộn
                  </button>
                </div>
              )}
            </div>

            {/* Filter and Search within participants */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
              {/* Team Filter */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 px-1.5">Tổ:</span>
                {(['all', 1, 2, 3, 4] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTeamFilter(t)}
                    className={`px-2 py-0.8 rounded-lg font-bold transition-all cursor-pointer ${
                      teamFilter === t 
                        ? 'bg-indigo-600 text-white shadow-2xs' 
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t === 'all' ? 'Tất cả' : `Tổ ${t}`}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="chua_nop">Chưa nộp</option>
                <option value="da_nop">Đã nộp đúng hạn</option>
                <option value="xuat_sac">Xuất sắc / Đạt giải</option>
                <option value="nop_muon">Nộp muộn</option>
                <option value="khong_tham_gia">Không tham gia</option>
              </select>

              {/* Search input */}
              <div className="relative flex-1 min-w-[160px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm học sinh theo tên..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Participants Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">STT</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Học sinh</th>
                      <th className="py-2.5 px-3 min-w-[280px]">Đánh dấu trạng thái nộp</th>
                      <th className="py-2.5 px-3 text-center min-w-[90px]">Điểm quy định</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Ghi chú / Nhận xét</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Không tìm thấy học sinh nào phù hợp bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map((p) => {
                        const student = data.students.find(s => s.id === p.studentId);
                        const isStudentTeamLeader = (currentUser.role === 'to_truong' || currentUser.role === 'to_pho') && currentUser.teamId === p.teamId;
                        const canEditThisRow = canManageClassWide || isStudentTeamLeader;

                        // Expected point for this row
                        let expectedPt = 0;
                        if (p.status === 'da_nop') expectedPt = currentCampaign.rewardPoints;
                        else if (p.status === 'xuat_sac') expectedPt = currentCampaign.rewardPoints + currentCampaign.bonusPoints;
                        else if (p.status === 'nop_muon') expectedPt = -currentCampaign.latePenaltyPoints;
                        else if (p.status === 'khong_tham_gia') expectedPt = -currentCampaign.missPenaltyPoints;

                        return (
                          <tr key={p.studentId} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-400 font-mono">
                              #{student?.stt || '-'}
                            </td>

                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{p.studentName}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                  p.teamId === 1 ? 'bg-blue-100 text-blue-800' :
                                  p.teamId === 2 ? 'bg-emerald-100 text-emerald-800' :
                                  p.teamId === 3 ? 'bg-amber-100 text-amber-800' :
                                  'bg-purple-100 text-purple-800'
                                }`}>
                                  Tổ {p.teamId}
                                </span>
                              </div>
                              {student?.roleTitle && student.roleTitle !== 'Thành viên' && (
                                <div className="text-[10px] text-slate-500">{student.roleTitle}</div>
                              )}
                            </td>

                            {/* Status Buttons */}
                            <td className="py-2.5 px-3">
                              {canEditThisRow ? (
                                <div className="flex flex-wrap items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(p.studentId, 'da_nop')}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                      p.status === 'da_nop'
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                                    }`}
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Đã nộp</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(p.studentId, 'xuat_sac')}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                      p.status === 'xuat_sac'
                                        ? 'bg-amber-500 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-900'
                                    }`}
                                  >
                                    <Award className="w-3 h-3" />
                                    <span>Xuất sắc</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(p.studentId, 'nop_muon')}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                      p.status === 'nop_muon'
                                        ? 'bg-orange-500 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-900'
                                    }`}
                                  >
                                    <Clock className="w-3 h-3" />
                                    <span>Nộp muộn</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(p.studentId, 'chua_nop')}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                      p.status === 'chua_nop'
                                        ? 'bg-slate-700 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    <span>Chưa nộp</span>
                                  </button>
                                </div>
                              ) : (
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-block ${SUBMISSION_STATUS_CONFIG[p.status]?.badge}`}>
                                  {SUBMISSION_STATUS_CONFIG[p.status]?.label}
                                </span>
                              )}
                            </td>

                            {/* Point Awarded */}
                            <td className="py-2.5 px-3 text-center">
                              {expectedPt > 0 ? (
                                <span className="font-black text-emerald-700 font-mono text-sm">+{expectedPt}đ</span>
                              ) : expectedPt < 0 ? (
                                <span className="font-black text-rose-700 font-mono text-sm">{expectedPt}đ</span>
                              ) : (
                                <span className="text-slate-400 text-xs">0đ</span>
                              )}
                            </td>

                            {/* Note input / display */}
                            <td className="py-2.5 px-3">
                              {canEditThisRow ? (
                                <input
                                  type="text"
                                  placeholder="Ghi chú (VD: nộp trễ 1 ngày, bài rất đẹp...)"
                                  defaultValue={p.note || ''}
                                  onBlur={(e) => {
                                    if (e.target.value !== (p.note || '')) {
                                      updateCampaignParticipant(currentCampaign.id, p.studentId, p.status, e.target.value);
                                    }
                                  }}
                                  className="w-full px-2 py-1 bg-slate-50 hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded-lg text-[11px] transition-all"
                                />
                              ) : (
                                <span className="text-slate-500 text-[11px]">{p.note || '—'}</span>
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
          </div>
        </div>
      ) : (
        /* CAMPAIGNS CARD LIST */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'all' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({campaignsList.length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'active' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Đang diễn ra ({campaignsList.filter(c => c.status === 'active').length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'completed' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Đã hoàn thành ({campaignsList.filter(c => c.status === 'completed').length})
              </button>
            </div>

            {/* Type selector */}
            <div className="flex items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">Tất cả thể loại</option>
                <option value="cuoc_thi">Cuộc thi / Hội thi</option>
                <option value="chien_dich">Chiến dịch phong trào</option>
                <option value="nop_bai">Nộp bài tập / Chuyên đề</option>
                <option value="phong_trao">Phong trào thi đua</option>
              </select>

              {/* Search */}
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm chiến dịch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredCampaigns.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Chưa có cuộc thi / chiến dịch nào</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Giáo viên chủ nhiệm, Lớp trưởng hoặc các Lớp phó có thể tạo cuộc thi, kế hoạch nhỏ hoặc đợt nộp bài để theo dõi sĩ số tham gia.
              </p>
              {canCreate && (
                <button
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-indigo-700 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo cuộc thi đầu tiên ngay</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCampaigns.map(camp => {
                const total = camp.participants.length;
                const submitted = camp.participants.filter(p => p.status === 'da_nop' || p.status === 'xuat_sac' || p.status === 'nop_muon').length;
                const percent = total > 0 ? Math.round((submitted / total) * 100) : 0;
                const isPast = toISODateString(new Date()) > camp.endDate;

                return (
                  <div
                    key={camp.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${CAMPAIGN_TYPE_LABELS[camp.type]?.bg} ${CAMPAIGN_TYPE_LABELS[camp.type]?.color}`}>
                          {CAMPAIGN_TYPE_LABELS[camp.type]?.label}
                        </span>

                        {camp.pointsApplied ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Đã tính điểm</span>
                          </span>
                        ) : isPast ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                            Đã hết hạn
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Đang diễn ra</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Desc */}
                      <div>
                        <h4 className="font-black text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          {camp.title}
                        </h4>
                        {camp.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {camp.description}
                          </p>
                        )}
                      </div>

                      {/* Deadline & Dates */}
                      <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span>Hạn chót (Deadline):</span>
                          <strong className="text-indigo-700 font-bold">{formatDDMMYYYY(parseDateLocal(camp.endDate))}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Người tạo: {camp.createdBy}</span>
                          <span>Tuần {camp.weekNumber || 4}</span>
                        </div>
                      </div>

                      {/* Rule preview pills */}
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                          Đúng hạn: <strong>+{camp.rewardPoints}đ</strong>
                        </div>
                        <div className="px-2 py-1 rounded-lg bg-orange-50 text-orange-800 font-semibold border border-orange-200">
                          Nộp muộn: <strong>-{camp.latePenaltyPoints}đ</strong>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                          <span>Tiến độ nộp:</span>
                          <span className="font-bold text-slate-900 font-mono">{submitted}/{total} HS ({percent}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${percent}%` }} 
                            className={`h-full ${percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom CTA Button */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedCampaignId(camp.id)}
                        className="w-full py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <span>Theo dõi nộp bài & Điểm danh</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. MODAL: TẠO / SỬA CUỘC THI / CHIẾN DỊCH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto transform animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingCampaign ? 'Chỉnh Sửa Cuộc Thi / Chiến Dịch' : 'Tạo Cuộc Thi / Chiến Dịch Mới'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Dành cho Giáo viên chủ nhiệm, Lớp trưởng và các Lớp phó
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="space-y-3.5 text-xs">
              {!canEditOrDelete && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Quyền hạn cán sự:</strong> Ban cán sự (Lớp trưởng/Lớp phó) có quyền khởi tạo cuộc thi và điểm danh bài nộp. Mức điểm thưởng/phạt và duyệt áp dụng vào sổ thi đua sẽ do Giáo viên chủ nhiệm kiểm duyệt & điều chỉnh khi tính điểm.
                  </div>
                </div>
              )}

              {/* Tên cuộc thi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên cuộc thi / Chiến dịch phong trào *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hội thi Báo tường 20/11, Nuôi heo đất, Nộp bài tập Toán..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Loại & Tuần */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thể loại</label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white"
                  >
                    <option value="cuoc_thi">Cuộc thi / Hội thi</option>
                    <option value="chien_dich">Chiến dịch phong trào</option>
                    <option value="nop_bai">Nộp bài tập / Chuyên đề</option>
                    <option value="phong_trao">Phong trào thi đua</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ghi nhận vào Tuần học</label>
                  <input
                    type="number"
                    min="1"
                    max="35"
                    value={formWeekNumber}
                    onChange={(e) => setFormWeekNumber(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono focus:bg-white"
                  />
                </div>
              </div>

              {/* Thời gian bắt đầu & Hạn chót */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Thời gian bắt đầu *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-rose-700">Hạn chót kết thúc (Deadline) *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-700 focus:bg-white"
                  />
                </div>
              </div>

              {/* Mô tả / Hướng dẫn */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mô tả / Thể lệ / Yêu cầu sản phẩm (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Chỉ tiêu mỗi em nộp 1 bài viết hoặc tranh vẽ; tối thiểu 3kg giấy vụn..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Quy định điểm thưởng / phạt */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Quy Định Điểm Thưởng & Điểm Trừ</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-800 uppercase">Cộng đúng hạn</label>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-700 font-bold">+</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={formRewardPoints}
                        onChange={(e) => setFormRewardPoints(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-emerald-700 font-mono text-center"
                      />
                      <span className="text-[10px] text-slate-400">đ</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-amber-900 uppercase">Thưởng xuất sắc</label>
                    <div className="flex items-center gap-1">
                      <span className="text-amber-700 font-bold">+</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={formBonusPoints}
                        onChange={(e) => setFormBonusPoints(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-amber-800 font-mono text-center"
                      />
                      <span className="text-[10px] text-slate-400">đ</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-orange-900 uppercase">Trừ nộp muộn</label>
                    <div className="flex items-center gap-1">
                      <span className="text-orange-700 font-bold">-</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={formLatePenalty}
                        onChange={(e) => setFormLatePenalty(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-orange-700 font-mono text-center"
                      />
                      <span className="text-[10px] text-slate-400">đ</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-rose-900 uppercase">Trừ không nộp</label>
                    <div className="flex items-center gap-1">
                      <span className="text-rose-700 font-bold">-</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={formMissPenalty}
                        onChange={(e) => setFormMissPenalty(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-rose-700 font-mono text-center"
                      />
                      <span className="text-[10px] text-slate-400">đ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingCampaign ? 'Lưu thay đổi' : 'Tạo cuộc thi / chiến dịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: XÁC NHẬN ÁP DỤNG ĐIỂM VÀO SỔ THI ĐUA */}
      {isApplyModalOpen && currentCampaign && campaignStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 transform animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Áp Dụng Điểm Vào Sổ Thi Đua</h3>
                  <p className="text-[11px] text-slate-500">Xem trước kết quả trước khi ghi nhận điểm</p>
                </div>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1">
                <div className="font-bold text-indigo-950 text-sm">{currentCampaign.title}</div>
                <div className="text-indigo-700 text-[11px]">
                  Điểm sẽ được ghi nhận vào: <strong>Tuần {currentCampaign.weekNumber || 4}</strong> (Ngày: {currentCampaign.endDate})
                </div>
              </div>

              {/* Point Preview Summary */}
              <div className="space-y-1.5 font-medium">
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200">
                  <span>✓ Nộp đúng hạn (+{currentCampaign.rewardPoints}đ):</span>
                  <strong className="font-mono">{campaignStats.daNop} học sinh</strong>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300">
                  <span>⭐ Xuất sắc (+{currentCampaign.rewardPoints + currentCampaign.bonusPoints}đ):</span>
                  <strong className="font-mono">{campaignStats.xuatSac} học sinh</strong>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-orange-50 text-orange-900 border border-orange-200">
                  <span>⏰ Nộp muộn (-{currentCampaign.latePenaltyPoints}đ):</span>
                  <strong className="font-mono">{campaignStats.nopMuon} học sinh</strong>
                </div>

                {campaignStats.khongNop > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 text-rose-900 border border-rose-200">
                    <span>✗ Không tham gia (-{currentCampaign.missPenaltyPoints}đ):</span>
                    <strong className="font-mono">{campaignStats.khongNop} học sinh</strong>
                  </div>
                )}
              </div>

              {/* Option to penalize unsubmitted students if past deadline */}
              {campaignStats.chuaNop > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeUnsubmittedInPenalty}
                      onChange={(e) => setIncludeUnsubmittedInPenalty(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="text-[11px] text-slate-700 leading-snug">
                      <strong>Tính điểm trừ cho {campaignStats.chuaNop} học sinh chưa nộp</strong> (-{currentCampaign.missPenaltyPoints}đ / em).
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Chỉ nên chọn khi chiến dịch đã hết hạn nộp và các em không hoàn thành.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <p className="text-[11px] text-slate-500 italic">
                * Sau khi áp dụng, điểm số sẽ tự động xuất hiện trong bảng xếp hạng cá nhân, xếp hạng tổ và báo cáo tuần của lớp. Bạn có thể cập nhật lại điểm bất cứ lúc nào nếu có học sinh nộp bù.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isApplyingPoints}
                onClick={handleConfirmApplyPoints}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>{isApplyingPoints ? 'Đang ghi điểm...' : 'Xác nhận áp dụng điểm'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Configuration Modal */}
      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
      />
    </div>
  );
};

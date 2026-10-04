import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PointType } from '../../types';
import { 
  MinusCircle, 
  PlusCircle, 
  Award, 
  Search, 
  Check, 
  Sparkles, 
  History, 
  User, 
  AlertCircle,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  BookmarkPlus,
  Filter,
  X,
  Tag
} from 'lucide-react';
import { 
  getAcademicWeek, 
  getWeekDateRange, 
  getDayOfWeekName, 
  getAcademicWeeksList, 
  getDaysOfWeekForAcademicWeek,
  DAYS_OF_WEEK_VN, 
  toISODateString, 
  parseDateLocal,
  formatDDMMYYYY 
} from '../../utils/weekUtils';

export const QuickEntryView: React.FC = () => {
  const { data, currentUser, addTransaction, addRule, getPendingTransactions } = useApp();

  const [activeTab, setActiveTab] = useState<PointType>('tru'); // 'tru' | 'cong' | 'bieu_duong'
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');
  const [points, setPoints] = useState<number>(2);
  const [category, setCategory] = useState<string>('Nề nếp');
  const [notes, setNotes] = useState('');

  // Enhanced custom reason states
  const [saveAsNewRule, setSaveAsNewRule] = useState<boolean>(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [showAddRuleForm, setShowAddRuleForm] = useState<boolean>(false);
  const [newQuickRuleTitle, setNewQuickRuleTitle] = useState('');
  const [newQuickRulePoints, setNewQuickRulePoints] = useState<number>(2);
  const [newQuickRuleCategory, setNewQuickRuleCategory] = useState<string>('Nề nếp');

  // Date and Week states
  const [entryDate, setEntryDate] = useState<string>(() => toISODateString(new Date()));
  const [selectedWeek, setSelectedWeek] = useState<number>(() => getAcademicWeek(new Date()));
  const [dayOfWeek, setDayOfWeek] = useState<string>(() => getDayOfWeekName(new Date()));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSavedMessage, setJustSavedMessage] = useState<string | null>(null);
  const [recentEntries, setRecentEntries] = useState<Array<{ name: string; title: string; points: number; time: string; day?: string }>>([]);

  const weeksList = useMemo(() => getAcademicWeeksList(35), []);
  const currentWeekNum = data.config.currentWeek || 4;
  const currentWeekRange = useMemo(() => getWeekDateRange(selectedWeek), [selectedWeek]);
  const weekDayOptions = useMemo(() => getDaysOfWeekForAcademicWeek(selectedWeek), [selectedWeek]);

  // Handle Date input change
  const handleDateChange = (newDateStr: string) => {
    if (!newDateStr) return;
    setEntryDate(newDateStr);
    const d = parseDateLocal(newDateStr);
    setDayOfWeek(getDayOfWeekName(d));
    setSelectedWeek(getAcademicWeek(d));
  };

  // Handle Day button click (1 = Thứ Hai, 2 = Thứ Ba, 3 = Thứ Tư, 4 = Thứ Năm, 5 = Thứ Sáu, 6 = Thứ Bảy, 0 = Chủ Nhật)
  const handleDaySelect = (dayIndex: number) => {
    const range = getWeekDateRange(selectedWeek);
    const target = new Date(range.startDate);
    const offset = dayIndex === 0 ? 6 : (dayIndex - 1);
    target.setDate(range.startDate.getDate() + offset);
    const iso = toISODateString(target);
    setEntryDate(iso);
    setDayOfWeek(DAYS_OF_WEEK_VN[dayIndex]);
  };

  // Handle Week change
  const handleWeekChange = (newWeekNum: number) => {
    setSelectedWeek(newWeekNum);
    const range = getWeekDateRange(newWeekNum);
    const currD = parseDateLocal(entryDate);
    const dayIdx = currD.getDay();
    const offset = dayIdx === 0 ? 6 : (dayIdx - 1);
    const target = new Date(range.startDate);
    target.setDate(range.startDate.getDate() + offset);
    const iso = toISODateString(target);
    setEntryDate(iso);
    setDayOfWeek(getDayOfWeekName(target));
  };

  // Filter students based on role
  // If Tổ trưởng: ONLY show students from their assigned team!
  const availableStudents = useMemo(() => {
    let list = data.students;
    if (currentUser.role === 'to_truong' && currentUser.teamId) {
      list = list.filter(s => s.teamId === currentUser.teamId);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(s => 
      s.name.toLowerCase().includes(q) || 
      String(s.stt).includes(q) || 
      `tổ ${s.teamId}`.includes(q)
    );
  }, [data.students, currentUser, searchQuery]);

  // Filter rules by active type and category filter
  const availableRules = useMemo(() => {
    let list = data.rules.filter(r => r.type === activeTab);
    if (selectedCategoryFilter !== 'all') {
      list = list.filter(r => r.category === selectedCategoryFilter);
    }
    return list;
  }, [data.rules, activeTab, selectedCategoryFilter]);

  // Handle switching tabs
  const handleTabChange = (type: PointType) => {
    setActiveTab(type);
    setSelectedRuleId('');
    setCustomTitle('');
    setSaveAsNewRule(false);
    if (type === 'tru') {
      setPoints(2);
      setCategory('Nề nếp');
      setNewQuickRuleCategory('Nề nếp');
    } else if (type === 'cong') {
      setPoints(1);
      setCategory('Học tập');
      setNewQuickRuleCategory('Học tập');
    } else {
      setPoints(3);
      setCategory('Học tập');
      setNewQuickRuleCategory('Học tập');
    }
  };

  // When a preset rule is selected
  const handleSelectRule = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    const rule = data.rules.find(r => r.id === ruleId);
    if (rule) {
      setCustomTitle(rule.title);
      setPoints(rule.points);
      setCategory(rule.category);
      setSaveAsNewRule(false);
    }
  };

  // Quick add a new rule permanently to data.rules
  const handleQuickAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuickRuleTitle.trim()) return;

    await addRule({
      type: activeTab,
      title: newQuickRuleTitle.trim(),
      points: Math.max(1, newQuickRulePoints),
      category: (newQuickRuleCategory as any) || 'Học tập',
    });

    setCustomTitle(newQuickRuleTitle.trim());
    setPoints(Math.max(1, newQuickRulePoints));
    setCategory(newQuickRuleCategory);
    setNewQuickRuleTitle('');
    setShowAddRuleForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    const titleToUse = customTitle.trim() || (selectedRuleId ? data.rules.find(r => r.id === selectedRuleId)?.title : '') || 'Ghi nhận điểm';
    if (!titleToUse) return;

    setIsSubmitting(true);

    const student = data.students.find(s => s.id === selectedStudentId);

    // If user checked "Save this custom reason into class rules list"
    if (saveAsNewRule && customTitle.trim()) {
      try {
        await addRule({
          type: activeTab,
          title: customTitle.trim(),
          points: Math.max(1, points),
          category: (category as any) || 'Khác',
        });
      } catch (err) {
        console.warn(err);
      }
    }

    const ok = await addTransaction({
      studentId: selectedStudentId,
      type: activeTab,
      title: titleToUse,
      points,
      category,
      notes: notes.trim(),
      occurredDate: entryDate,
      dayOfWeek: dayOfWeek,
      weekNumber: selectedWeek,
    });

    setIsSubmitting(false);

    if (ok && student) {
      const entryDesc = activeTab === 'tru' ? `-${points}đ (${titleToUse})` : `+${points}đ (${titleToUse})`;
      setJustSavedMessage(`✓ Đã ghi nhận (${dayOfWeek} • Tuần ${selectedWeek}): ${student.name} ${entryDesc}`);
      
      setRecentEntries(prev => [
        {
          name: student.name,
          title: titleToUse,
          points: activeTab === 'tru' ? -points : points,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          day: `${dayOfWeek}, ${formatDDMMYYYY(parseDateLocal(entryDate))}`,
        },
        ...prev.slice(0, 4)
      ]);

      // Fast auto-reset within 1.6s so user can enter the next student immediately!
      setTimeout(() => {
        setJustSavedMessage(null);
        setSelectedRuleId('');
        setCustomTitle('');
        setNotes('');
        setSaveAsNewRule(false);
        // Keep student search focus or clear student selection for next entry
        setSelectedStudentId('');
      }, 1600);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 pt-2 px-3 sm:px-4">
      {/* Top Title & Role Notice */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600 shrink-0" />
              <span>Nhập Điểm Nhanh</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Dành cho cán sự & giáo viên • Lưu tức thì trong 3 giây
            </p>
          </div>

          {currentUser.role === 'to_truong' && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 shadow-2xs">
              <span>Đang quản lý Tổ {currentUser.teamId}</span>
            </div>
          )}
        </div>

        {data.config.requireApproval && currentUser.role !== 'admin' && (
          <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Chế độ kiểm duyệt đang BẬT. Dữ liệu sẽ lưu ở trạng thái <strong>Chờ GVCN duyệt</strong> trước khi cộng/trừ chính thức.</span>
          </div>
        )}
      </div>

      {/* Success Notification Banner */}
      {justSavedMessage && (
        <div className="mb-4 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between animate-in zoom-in-95">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Check className="w-5 h-5 bg-white/20 rounded-full p-0.5" />
            <span>{justSavedMessage}</span>
          </div>
          <span className="text-xs text-emerald-100 bg-emerald-700/50 px-2 py-1 rounded-md">
            Sẵn sàng nhập tiếp...
          </span>
        </div>
      )}

      {/* 3 Main Action Big Tabs */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <button
          type="button"
          onClick={() => handleTabChange('tru')}
          className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center font-bold text-xs sm:text-sm border-2 transition-all cursor-pointer ${
            activeTab === 'tru'
              ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm scale-102'
              : 'bg-white border-slate-200 text-slate-600 hover:border-rose-200 hover:bg-rose-50/50'
          }`}
        >
          <MinusCircle className={`w-6 h-6 mb-1 ${activeTab === 'tru' ? 'text-rose-600' : 'text-slate-400'}`} />
          <span>NHẬP LỖI (TRỪ)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('cong')}
          className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center font-bold text-xs sm:text-sm border-2 transition-all cursor-pointer ${
            activeTab === 'cong'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm scale-102'
              : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50'
          }`}
        >
          <PlusCircle className={`w-6 h-6 mb-1 ${activeTab === 'cong' ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>CỘNG ĐIỂM</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('bieu_duong')}
          className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center font-bold text-xs sm:text-sm border-2 transition-all cursor-pointer ${
            activeTab === 'bieu_duong'
              ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm scale-102'
              : 'bg-white border-slate-200 text-slate-600 hover:border-amber-200 hover:bg-amber-50/50'
          }`}
        >
          <Award className={`w-6 h-6 mb-1 ${activeTab === 'bieu_duong' ? 'text-amber-500' : 'text-slate-400'}`} />
          <span>BIỂU DƯƠNG</span>
        </button>
      </div>

      {/* Main Entry Card */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        {/* TIME SELECTION: CHỌN TUẦN & THỨ / NGÀY TRONG TUẦN */}
        <div className="bg-slate-50/80 rounded-2xl p-3 sm:p-4 border border-slate-200/80 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Thời điểm ghi nhận
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                Tuần {selectedWeek} ({currentWeekRange.rangeLabel})
              </span>
            </div>

            {/* Quick date picker */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <label className="text-xs font-semibold text-slate-500">Ngày:</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Day of Week Pills (Thứ 2 -> Chủ Nhật - 7 ngày) */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
              <span>Bấm chọn nhanh thứ trong <strong>Tuần {selectedWeek}</strong>:</span>
              <span className="font-bold text-indigo-700 font-sans">
                Đang chọn: {dayOfWeek} ({formatDDMMYYYY(parseDateLocal(entryDate))})
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {weekDayOptions.map((opt) => {
                const isSelected = entryDate === opt.dateStr;

                return (
                  <button
                    key={opt.dateStr}
                    type="button"
                    onClick={() => handleDaySelect(opt.dayIndex)}
                    className={`py-1.5 sm:py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer text-center flex flex-col items-center justify-center relative ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs scale-102 ring-2 ring-indigo-400'
                        : opt.dayIndex === 0
                        ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700'
                    }`}
                  >
                    <span>{opt.shortDay}</span>
                    <span className={`text-[10px] font-normal ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {opt.displayDate}
                    </span>
                    {opt.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-1" title="Hôm nay" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Week switcher row */}
          <div className="pt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-200/60">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500">Đổi tuần học:</span>
              {selectedWeek !== currentWeekNum && (
                <button
                  type="button"
                  onClick={() => handleWeekChange(currentWeekNum)}
                  className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 hover:bg-indigo-200 font-bold text-[11px] cursor-pointer"
                >
                  Về Tuần {currentWeekNum}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={selectedWeek <= 1}
                onClick={() => handleWeekChange(selectedWeek - 1)}
                className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Tuần trước"
              >
                ◀ Tuần {selectedWeek - 1}
              </button>
              <select
                value={selectedWeek}
                onChange={(e) => handleWeekChange(Number(e.target.value))}
                className="font-bold text-indigo-700 bg-white border border-slate-200 rounded px-2 py-0.5 cursor-pointer text-xs"
              >
                {weeksList.map(w => (
                  <option key={w.weekNumber} value={w.weekNumber}>
                    Tuần {w.weekNumber} ({w.rangeLabel}){w.weekNumber === currentWeekNum ? ' • Hiện tại' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={selectedWeek >= 35}
                onClick={() => handleWeekChange(selectedWeek + 1)}
                className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Tuần sau"
              >
                Tuần {selectedWeek + 1} ▶
              </button>
            </div>
          </div>
        </div>

        {/* STEP 1: CHỌN HỌC SINH */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>1. Chọn học sinh</span>
            <span className="text-[11px] text-slate-500 lowercase font-normal">
              ({availableStudents.length} học sinh)
            </span>
          </label>

          {/* Quick search input */}
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm nhanh theo tên hoặc STT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Student Select Dropdown / Quick list */}
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            required
            className="w-full py-2.5 px-3 text-sm font-semibold bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 cursor-pointer shadow-2xs"
          >
            <option value="">-- Bấm để chọn học sinh --</option>
            {availableStudents.map(s => (
              <option key={s.id} value={s.id}>
                #{s.stt} - {s.name} (Tổ {s.teamId} • {s.roleTitle})
              </option>
            ))}
          </select>

          {/* Quick chips of 4 recent/selected students for 1-tap choice */}
          <div className="flex flex-wrap gap-1.5 mt-2 max-h-18 overflow-y-auto">
            {availableStudents.slice(0, 6).map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStudentId(s.id)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                  selectedStudentId === s.id
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                #{s.stt} {s.name.split(' ').pop()} (T{s.teamId})
              </button>
            ))}
          </div>
        </div>

        {/* STEP 2: CHỌN NỘI DUNG / LỖI / ĐIỂM CỘNG */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Nội dung / Lý do {activeTab === 'tru' ? 'vi phạm' : activeTab === 'cong' ? 'cộng điểm' : 'biểu dương'}
            </label>
            {['admin', 'lop_truong', 'lop_pho_ht', 'lop_pho_nn', 'lop_pho_vtm'].includes(currentUser.role) && (
              <button
                type="button"
                onClick={() => setShowAddRuleForm(prev => !prev)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-0.8 rounded-lg transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{showAddRuleForm ? 'Đóng tạo quy chế' : '+ Thêm quy chế mới'}</span>
              </button>
            )}
          </div>

          {/* Quick Add New Rule Inline Form (If opened) */}
          {showAddRuleForm && (
            <div className="mb-3 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in">
              <div className="text-xs font-bold text-indigo-900 flex items-center justify-between">
                <span>➕ Tạo quy chế chuẩn mới (Lưu vào sổ quy chế lớp)</span>
                <button 
                  type="button" 
                  onClick={() => setShowAddRuleForm(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Tên hành vi / lý do mới..."
                  value={newQuickRuleTitle}
                  onChange={(e) => setNewQuickRuleTitle(e.target.value)}
                  className="sm:col-span-6 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
                <select
                  value={newQuickRuleCategory}
                  onChange={(e) => setNewQuickRuleCategory(e.target.value)}
                  className="sm:col-span-3 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
                >
                  <option value="Học tập">Học tập</option>
                  <option value="Nề nếp">Nề nếp</option>
                  <option value="Văn thể mỹ">Văn thể mỹ</option>
                  <option value="Vệ sinh - Trực nhật">Vệ sinh</option>
                  <option value="Hoạt động chung">Chung</option>
                  <option value="Khác">Khác</option>
                </select>
                <div className="sm:col-span-3 flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newQuickRulePoints}
                    onChange={(e) => setNewQuickRulePoints(Number(e.target.value))}
                    className="w-12 px-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                    title="Số điểm"
                  />
                  <span className="text-[10px] text-slate-500">điểm</span>
                  <button
                    type="button"
                    onClick={handleQuickAddRule}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shrink-0 cursor-pointer shadow-2xs"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Category Filter Chips for Rules */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none text-[11px]">
            <span className="text-slate-400 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" />
              <span>Lọc:</span>
            </span>
            {['all', 'Học tập', 'Nề nếp', 'Văn thể mỹ', 'Vệ sinh - Trực nhật', 'Hoạt động chung'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-2 py-0.8 rounded-lg shrink-0 transition-colors cursor-pointer font-medium ${
                  selectedCategoryFilter === cat
                    ? 'bg-slate-800 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'Tất cả' : cat === 'Vệ sinh - Trực nhật' ? 'Vệ sinh' : cat}
              </button>
            ))}
          </div>

          {/* Quick preset chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {availableRules.map(rule => (
              <button
                key={rule.id}
                type="button"
                onClick={() => handleSelectRule(rule.id)}
                className={`text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                  selectedRuleId === rule.id
                    ? activeTab === 'tru'
                      ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold shadow-2xs'
                      : activeTab === 'cong'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-2xs'
                      : 'bg-amber-50 border-amber-500 text-amber-950 font-bold shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="pr-2">
                  <div className="text-xs font-semibold leading-snug">{rule.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{rule.category}</div>
                </div>
                <div
                  className={`text-xs font-black px-2 py-0.5 rounded-md shrink-0 ${
                    activeTab === 'tru'
                      ? 'bg-rose-100 text-rose-700'
                      : activeTab === 'cong'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {activeTab === 'tru' ? `-${rule.points}đ` : `+${rule.points}đ`}
                </div>
              </button>
            ))}
          </div>

          {/* Custom title / Custom Reason ngoài danh sách có sẵn */}
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>Hoặc nhập lý do riêng / lý do khác ngoài danh sách:</span>
              </span>
              {customTitle.trim() && (
                <span className="text-[10px] text-emerald-600 font-semibold">Đang nhập lý do riêng</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-8">
                <input
                  type="text"
                  placeholder="Nhập lý do / nội dung tùy chỉnh..."
                  value={customTitle}
                  onChange={(e) => {
                    setCustomTitle(e.target.value);
                    setSelectedRuleId('');
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div className="sm:col-span-4">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-semibold"
                >
                  <option value="Học tập">Lĩnh vực: Học tập</option>
                  <option value="Nề nếp">Lĩnh vực: Nề nếp</option>
                  <option value="Văn thể mỹ">Lĩnh vực: Văn thể mỹ</option>
                  <option value="Vệ sinh - Trực nhật">Lĩnh vực: Vệ sinh</option>
                  <option value="Hoạt động chung">Lĩnh vực: Hoạt động chung</option>
                  <option value="Khác">Lĩnh vực: Khác</option>
                </select>
              </div>
            </div>

            {/* Option to permanently save this custom reason to class rules */}
            {customTitle.trim() && (
              <label className="flex items-center gap-2 pt-1 text-xs text-indigo-900 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsNewRule}
                  onChange={(e) => setSaveAsNewRule(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <BookmarkPlus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Lưu lý do này thành quy chế dùng chung của lớp (lần sau chỉ cần bấm chọn)</span>
                </span>
              </label>
            )}
          </div>
        </div>

        {/* STEP 3: ĐIỂM & GHI CHÚ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Số điểm {activeTab === 'tru' ? 'trừ' : 'cộng'}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPoints(p => Math.max(1, p - 1))}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-base flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="20"
                value={points}
                onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 py-1.5 text-center font-black text-lg border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setPoints(p => Math.min(20, p + 1))}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-base flex items-center justify-center cursor-pointer"
              >
                +
              </button>
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                activeTab === 'tru' ? 'text-rose-700 bg-rose-50' : 'text-emerald-700 bg-emerald-50'
              }`}>
                {activeTab === 'tru' ? `-${points} điểm` : `+${points} điểm`}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ghi chú thêm (tùy chọn)
            </label>
            <input
              type="text"
              placeholder="VD: Tiết 2 môn Hóa, cô nhắc 2 lần..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* STEP 4: BIG ACTION BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!selectedStudentId || isSubmitting}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
              !selectedStudentId
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : activeTab === 'tru'
                ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:from-rose-700 hover:to-rose-800 active:scale-98'
                : activeTab === 'cong'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800 active:scale-98'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 active:scale-98'
            }`}
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>
              {isSubmitting
                ? 'Đang lưu...'
                : !selectedStudentId
                ? 'Vui lòng chọn học sinh ở trên'
                : `XÁC NHẬN ${activeTab === 'tru' ? 'TRỪ' : 'CỘNG'} ${points} ĐIỂM`}
            </span>
          </button>
        </div>
      </form>

      {/* Recent Entries by Current User (Session audit) */}
      {recentEntries.length > 0 && (
        <div className="mt-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
            <History className="w-4 h-4 text-slate-400" />
            <span>Vừa ghi nhận trong phiên này</span>
          </div>
          <div className="divide-y divide-slate-100">
            {recentEntries.map((item, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="font-bold text-slate-800 truncate">{item.name}</span>
                  <span className="text-slate-500 truncate">• {item.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-black px-1.5 py-0.5 rounded text-[11px] ${
                      item.points > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {item.points > 0 ? `+${item.points}` : item.points}đ
                  </span>
                  <span className="text-[10px] text-slate-400">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

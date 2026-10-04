import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bell, 
  Send, 
  Copy, 
  Check, 
  Trash2, 
  AlertCircle, 
  MessageSquare, 
  UserCheck, 
  PlusCircle, 
  X 
} from 'lucide-react';
import { formatDateVN } from '../../utils/exportUtils';

export const AnnouncementsView: React.FC = () => {
  const { data, currentUser, addAnnouncement, deleteAnnouncement, getStudentScore, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'notices' | 'parent_sms'>('notices');

  // Announcement creator modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTarget, setAnnTarget] = useState<'all' | 'to_1' | 'to_2' | 'to_3' | 'to_4' | 'parents' | 'cadres'>('all');
  const [annPriority, setAnnPriority] = useState<'normal' | 'important' | 'urgent'>('normal');

  // Parent Message Generator state
  const [selectedStudentId, setSelectedStudentId] = useState<string>(data.students[0]?.id || '');
  const [customParentNote, setCustomParentNote] = useState<string>('Em ngoan, lễ phép, tích cực trong các giờ học.');
  const [copied, setCopied] = useState(false);

  // Selected student score for parent message
  const studentScore = useMemo(() => {
    if (!selectedStudentId) return null;
    return getStudentScore(selectedStudentId);
  }, [selectedStudentId, getStudentScore]);

  // Generate parent SMS/Zalo message
  const generatedParentMessage = useMemo(() => {
    if (!studentScore) return '';
    const s = studentScore.student;
    const week = data.config.currentWeek;

    const praises = studentScore.transactions
      .filter(t => t.type === 'cong' || t.type === 'bieu_duong')
      .map(t => t.title)
      .slice(0, 3)
      .join(', ');

    const warnings = studentScore.transactions
      .filter(t => t.type === 'tru')
      .map(t => t.title)
      .slice(0, 3)
      .join(', ');

    return `[THCS VÂN HÀ 2 - LỚP 9A1]
Kính gửi Phụ huynh em: ${s.name} (Tổ ${s.teamId})
GVCN: Cô ${data.config.teacherName} xin gửi kết quả rèn luyện Tuần ${week}:
• Điểm thi đua: ${studentScore.currentPoints} điểm (Xếp loại: ${studentScore.rankTitle})
• Điểm cộng/Biểu dương: ${praises ? praises : 'Duy trì tốt'}
• Lỗi cần đôn đốc: ${warnings ? warnings : 'Không vi phạm, chấp hành rất tốt'}
• Nhận xét của GVCN: ${customParentNote}
Kính mong Quý Phụ huynh phối hợp cùng nhà trường đôn đốc các con! Trân trọng.`;
  }, [studentScore, data.config, customParentNote]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generatedParentMessage);
    setCopied(true);
    showToast('Đã sao chép nội dung tin nhắn gửi Phụ huynh!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    await addAnnouncement({
      title: annTitle.trim(),
      content: annContent.trim(),
      target: annTarget,
      priority: annPriority,
    });

    setAnnTitle('');
    setAnnContent('');
    setIsCreateOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 pb-24 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-bold mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>Kênh Thông Tin & Phụ Huynh</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            THÔNG BÁO & TIN NHẮN PHỤ HUYNH
          </h2>
          <p className="text-xs sm:text-sm text-orange-100 mt-1">
            Gửi thông báo lớp và tự động tạo tin nhắn Zalo/SMS báo cáo thi đua tuần tới từng phụ huynh.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 bg-white text-orange-900 hover:bg-orange-50 rounded-2xl font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-98"
            >
              <PlusCircle className="w-4 h-4 text-orange-600" />
              <span>Đăng thông báo mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('notices')}
          className={`pb-2.5 px-4 font-bold text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'notices'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Bảng Thông Báo Lớp ({data.announcements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('parent_sms')}
          className={`pb-2.5 px-4 font-bold text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'parent_sms'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Tạo Tin Nhắn Zalo/SMS Cho Phụ Huynh</span>
        </button>
      </div>

      {/* TAB 1: BẢNG THÔNG BÁO */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          {data.announcements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base">Chưa có thông báo nào</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Giáo viên chủ nhiệm có thể đăng thông báo chung cho lớp, các tổ hoặc phụ huynh tại đây.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.announcements.map(ann => {
                let badgeColor = 'bg-slate-100 text-slate-700';
                let priorityLabel = 'Thông thường';
                if (ann.priority === 'urgent') {
                  badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
                  priorityLabel = 'Khẩn cấp';
                } else if (ann.priority === 'important') {
                  badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                  priorityLabel = 'Quan trọng';
                }

                let targetLabel = 'Toàn bộ lớp 9A1';
                if (ann.target === 'cadres') targetLabel = 'Ban cán sự & Tổ trưởng';
                else if (ann.target === 'parents') targetLabel = 'Quý Phụ huynh';
                else if (ann.target.startsWith('to_')) targetLabel = `Tổ ${ann.target.split('_')[1]}`;

                return (
                  <div
                    key={ann.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {priorityLabel}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatDateVN(ann.createdAt)}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {ann.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                        {ann.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                      <div>
                        Gửi tới: <strong className="text-slate-700">{targetLabel}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{ann.createdBy}</span>
                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => deleteAnnouncement(ann.id)}
                            className="p-1 hover:text-rose-600 cursor-pointer"
                            title="Xóa thông báo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TẠO TIN NHẮN PHỤ HUYNH */}
      {activeTab === 'parent_sms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-orange-600" />
              <span>1. Chọn Học Sinh Để Soạn Tin</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Danh sách học sinh lớp 9A1:
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                {data.students.map(s => (
                  <option key={s.id} value={s.id}>
                    #{s.stt} - {s.name} (Tổ {s.teamId} • PH: {s.parentName || 'Chưa cập nhật'})
                  </option>
                ))}
              </select>
            </div>

            {studentScore && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900 text-sm">{studentScore.student.name}</div>
                <div className="text-slate-500">Phụ huynh: {studentScore.student.parentName || 'Chưa cập nhật'}</div>
                <div className="text-slate-500">Số điện thoại: <strong>{studentScore.student.parentPhone || 'Chưa có SĐT'}</strong></div>
                <div className="text-slate-700 font-bold pt-1">
                  Điểm tuần: <span className="text-emerald-700 font-black">{studentScore.currentPoints}đ</span> ({studentScore.rankTitle})
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nhận xét bổ sung của GVCN:
              </label>
              <textarea
                rows={3}
                value={customParentNote}
                onChange={(e) => setCustomParentNote(e.target.value)}
                placeholder="Nhập thêm lời dặn hoặc ghi chú cho phụ huynh..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Generated Message Preview Column */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>2. Tin Nhắn Tự Động Định Dạng (Zalo / SMS)</span>
                </h3>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md">
                  Sẵn sàng gửi
                </span>
              </div>

              {/* Message bubble */}
              <div className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-2xl font-mono text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap select-all">
                {generatedParentMessage}
              </div>

              <p className="text-[11px] text-slate-400 mt-2">
                Bấm nút dưới để sao chép toàn bộ tin nhắn đã định dạng sẵn, sau đó dán vào nhóm Zalo hoặc tin nhắn SMS gửi phụ huynh.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={handleCopyMessage}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Đã sao chép vào bộ nhớ đệm!' : 'Sao chép tin nhắn gửi Phụ huynh'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-base sm:text-lg">Tạo Thông Báo Mới</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tiêu đề thông báo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nhắc nhở nề nếp xếp hàng và giờ giấc thi đua tuần..."
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Đối tượng nhận
                  </label>
                  <select
                    value={annTarget}
                    onChange={(e: any) => setAnnTarget(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="all">Toàn bộ lớp 9A1</option>
                    <option value="cadres">Ban cán sự & Tổ trưởng</option>
                    <option value="parents">Quý Phụ huynh</option>
                    <option value="to_1">Riêng Tổ 1</option>
                    <option value="to_2">Riêng Tổ 2</option>
                    <option value="to_3">Riêng Tổ 3</option>
                    <option value="to_4">Riêng Tổ 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mức độ ưu tiên
                  </label>
                  <select
                    value={annPriority}
                    onChange={(e: any) => setAnnPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="normal">Thông thường</option>
                    <option value="important">Quan trọng</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nội dung chi tiết *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nhập nội dung thông báo cụ thể..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Đăng thông báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

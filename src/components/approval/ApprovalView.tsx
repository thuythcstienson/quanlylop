import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MinusCircle, 
  PlusCircle, 
  Award, 
  CheckCheck, 
  AlertCircle 
} from 'lucide-react';
import { formatDateVN } from '../../utils/exportUtils';

export const ApprovalView: React.FC = () => {
  const { data, currentUser, getPendingTransactions, reviewTransactions, openConfirm } = useApp();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const pendingList = getPendingTransactions();

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === pendingList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingList.map(t => t.id));
    }
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    openConfirm({
      title: `Duyệt ${selectedIds.length} giao dịch điểm?`,
      message: 'Các điểm này sẽ được cộng/trừ chính thức vào hồ sơ thi đua của học sinh.',
      confirmText: 'Duyệt ngay',
      onConfirm: async () => {
        await reviewTransactions(selectedIds, 'approve');
        setSelectedIds([]);
      }
    });
  };

  const handleBatchReject = () => {
    if (selectedIds.length === 0) return;
    openConfirm({
      title: `Từ chối ${selectedIds.length} đề xuất điểm?`,
      message: 'Các đề xuất này sẽ bị hủy bỏ và không tính điểm.',
      confirmText: 'Từ chối',
      isDestructive: true,
      onConfirm: async () => {
        await reviewTransactions(selectedIds, 'reject');
        setSelectedIds([]);
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 pb-24 space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-500 shrink-0" />
            <span>Kiểm Duyệt Điểm Thi Đua Cán Sự</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Giáo viên chủ nhiệm kiểm tra và phê duyệt các lượt chấm điểm do Lớp trưởng, Lớp phó và Tổ trưởng nhập.
          </p>
        </div>

        {pendingList.length > 0 && currentUser.role === 'admin' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchApprove}
              disabled={selectedIds.length === 0}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                selectedIds.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Duyệt đã chọn ({selectedIds.length})</span>
            </button>

            <button
              onClick={handleBatchReject}
              disabled={selectedIds.length === 0}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedIds.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Từ chối</span>
            </button>
          </div>
        )}
      </div>

      {/* Mode notice */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs text-indigo-900 flex items-start gap-3 shadow-2xs">
        <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Chế độ hiện tại:</strong>{' '}
          {data.config.requireApproval ? (
            <span className="text-emerald-700 font-bold">Chế độ kiểm duyệt ĐANG BẬT (Mọi điểm do cán sự nhập phải chờ GVCN duyệt).</span>
          ) : (
            <span className="text-slate-600">Chế độ kiểm duyệt ĐANG TẮT (Điểm cán sự nhập được lưu tự động ngay). Bạn có thể bật lại chế độ này trong mục <strong>Cài đặt</strong>.</span>
          )}
        </div>
      </div>

      {/* Pending Items List */}
      {pendingList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <CheckCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 text-base">Hàng chờ duyệt đang trống!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Không có giao dịch nào đang chờ duyệt. Mọi điểm thi đua đã được đồng bộ chính xác.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header row with Select All */}
          <div className="p-3 sm:px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.length === pendingList.length && pendingList.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
              <span>Chọn tất cả ({pendingList.length} giao dịch chờ duyệt)</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingList.map(t => {
              const isSelected = selectedIds.includes(t.id);

              return (
                <div
                  key={t.id}
                  className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(t.id)}
                      className="w-4 h-4 text-indigo-600 rounded mt-1 cursor-pointer shrink-0"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{t.studentName}</span>
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[11px]">
                          Tổ {t.teamId}
                        </span>
                        <span className="text-[11px] text-slate-400">Tuần {t.weekNumber}</span>
                      </div>

                      <div className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                        {t.type === 'tru' ? (
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <MinusCircle className="w-3.5 h-3.5" /> Lỗi:
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <PlusCircle className="w-3.5 h-3.5" /> Điểm cộng:
                          </span>
                        )}
                        <span>{t.title}</span>
                      </div>

                      {t.notes && (
                        <div className="text-xs text-slate-500 italic">
                          "{t.notes}"
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400">
                        Đề xuất bởi: <strong>{t.createdByName}</strong> ({t.createdByRole}) • {formatDateVN(t.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this item */}
                  <div className="flex items-center justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span
                      className={`font-black text-base px-2.5 py-1 rounded-lg ${
                        t.points > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {t.points > 0 ? `+${t.points}` : t.points} điểm
                    </span>

                    {currentUser.role === 'admin' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => reviewTransactions([t.id], 'approve')}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Duyệt giao dịch này"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Duyệt</span>
                        </button>

                        <button
                          onClick={() => reviewTransactions([t.id], 'reject')}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Từ chối"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Bỏ qua</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

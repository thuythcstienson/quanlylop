import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  Clock, 
  Check, 
  AlertCircle, 
  X, 
  Plus, 
  Save, 
  ShieldCheck, 
  FileJson,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { formatDateVN } from '../../utils/exportUtils';

interface BackupItem {
  filename: string;
  size: number;
  createdAt: string;
  studentCount: number;
  transactionCount: number;
  className: string;
  teacherName: string;
  note: string;
}

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ isOpen, onClose }) => {
  const { 
    data, 
    currentUser, 
    createSnapshot, 
    restoreSnapshot, 
    restoreBackup, 
    openConfirm, 
    showToast 
  } = useApp();

  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [snapshotNote, setSnapshotNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBackups = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch('/api/backups');
      if (res.ok) {
        const json = await res.json();
        setBackups(json.backups || []);
      }
    } catch {
      console.warn('Cannot fetch backups list');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBackups();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    const note = snapshotNote.trim() || `Tuần_${data.config.currentWeek || 4}_${data.students.length}HS`;
    const ok = await createSnapshot(note);
    setIsCreating(false);
    if (ok) {
      setSnapshotNote('');
      fetchBackups();
    }
  };

  const handleDownloadFile = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `SaoLuu_Lop9A1_THCSVanHa2_${dateStr}_Tuan${data.config.currentWeek || 4}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file sao lưu hệ thống!', 'success');
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.config || !parsed.students) {
          showToast('File sao lưu không đúng cấu trúc hệ thống!', 'error');
          return;
        }

        const studentCount = parsed.students?.length || 0;
        const txCount = parsed.transactions?.length || 0;

        openConfirm({
          title: 'Khôi phục dữ liệu từ file trên máy?',
          message: `File này chứa ${studentCount} học sinh, ${txCount} lượt ghi nhận điểm lớp ${parsed.config?.className || '9A1'}. Khi khôi phục, toàn bộ dữ liệu hiện tại sẽ được cập nhật đồng bộ. Bạn có chắc chắn muốn khôi phục?`,
          confirmText: 'Khôi phục ngay',
          isDestructive: true,
          onConfirm: async () => {
            await restoreBackup(parsed);
            fetchBackups();
            onClose();
          },
        });
      } catch {
        showToast('Không thể đọc file JSON này!', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRestoreSnapshotItem = (item: BackupItem) => {
    openConfirm({
      title: 'Khôi phục từ điểm sao lưu này?',
      message: `Khôi phục về trạng thái ngày ${formatDateVN(item.createdAt)} (${item.studentCount} học sinh, ${item.transactionCount} lượt thi đua)? Hệ thống sẽ tự động lưu dự phòng trước khi khôi phục.`,
      confirmText: 'Khôi phục',
      isDestructive: true,
      onConfirm: async () => {
        await restoreSnapshot(item.filename);
        fetchBackups();
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-800 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center font-bold">
              <Database className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg tracking-tight flex items-center gap-2">
                <span>Sao Lưu & Khôi Phục Dữ Liệu</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
                  Bảo Toàn 100%
                </span>
              </h3>
              <p className="text-xs text-indigo-100 font-medium">
                Lớp {data.config.className} • THCS Vân Hà 2 • {data.students.length} học sinh hiện tại
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* Quick Notice */}
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-3 sm:p-4 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>An toàn tuyệt đối:</strong> Dữ liệu danh sách học sinh và điểm số được lưu tự động liên tục trên máy chủ. Mỗi khi cập nhật tính năng hay bổ sung dữ liệu mới, hệ thống tự động giữ nguyên dữ liệu cũ và bạn có thể tạo bản sao lưu dự phòng bên dưới bất cứ lúc nào.
            </div>
          </div>

          {/* Action 1: Create snapshot */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Save className="w-4 h-4 text-indigo-600" />
                <span>1. Tạo Điểm Sao Lưu Mới Ngay Lập Tức</span>
              </span>
              <span className="text-[11px] text-slate-500">Lưu trực tiếp trên máy chủ</span>
            </div>

            <form onSubmit={handleCreateSnapshot} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Ghi chú (VD: Chốt điểm Tuần 4, Trước khi chia lại tổ...)"
                value={snapshotNote}
                onChange={(e) => setSnapshotNote(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreating ? 'Đang lưu...' : 'Lưu bản sao ngay'}</span>
              </button>
            </form>
          </div>

          {/* Action 2 & 3: Download & Upload JSON file */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Download JSON */}
            <button
              type="button"
              onClick={handleDownloadFile}
              className="p-3.5 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span>Tải File Sao Lưu Về Máy</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Xuất toàn bộ học sinh, điểm số ra file .json
                </div>
              </div>
              <span className="text-xs font-black text-indigo-600">.JSON</span>
            </button>

            {/* Upload JSON */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleUploadFile}
                className="hidden"
              />
              <div className="space-y-0.5">
                <div className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>Nạp File Từ Máy Để Khôi Phục</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Phục hồi nguyên vẹn dữ liệu từ file sao lưu
                </div>
              </div>
              <span className="text-xs font-black text-emerald-600">Nạp</span>
            </div>
          </div>

          {/* Action 4: List of server snapshots */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-600" />
                <span>Các Bản Sao Lưu Sẵn Có ({backups.length})</span>
              </span>
              <button
                type="button"
                onClick={fetchBackups}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer font-semibold"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingList ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            {isLoadingList ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Đang nạp danh sách bản sao lưu...
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                Chưa có bản sao lưu nào. Hãy bấm &quot;Lưu bản sao ngay&quot; ở trên.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {backups.map((item) => {
                  const dateFormatted = new Date(item.createdAt).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={item.filename}
                      className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-0.5 truncate">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
                          <HardDrive className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{item.note || item.filename}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{dateFormatted}</span>
                          <span>• {item.studentCount} học sinh</span>
                          <span>• {item.transactionCount} lượt điểm</span>
                          <span>• {(item.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestoreSnapshotItem(item)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-2xs"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Khôi phục</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Tự động đồng bộ máy chủ & bộ nhớ trình duyệt
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

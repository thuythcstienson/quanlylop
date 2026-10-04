import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { parseExcelStudents, downloadSampleExcelTemplate } from '../../utils/exportUtils';
import { Student } from '../../types';
import { UploadCloud, FileSpreadsheet, Check, AlertCircle, X, Loader2, Download, Sparkles } from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
  const { bulkImportStudents, autoDivideTeams, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsedList, setParsedList] = useState<Partial<Student>[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [autoDivideAfterImport, setAutoDivideAfterImport] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setErrorMsg(null);
    setIsParsing(true);

    try {
      const results = await parseExcelStudents(selected);
      if (results.length === 0) {
        setErrorMsg('Không tìm thấy danh sách học sinh hợp lệ trong file. Vui lòng kiểm tra tiêu đề cột (Họ và tên, Tổ, STT...).');
      } else {
        setParsedList(results);
      }
    } catch (err: any) {
      setErrorMsg('Không thể đọc file: ' + (err.message || 'Định dạng file không được hỗ trợ.'));
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (parsedList.length === 0) return;
    setIsImporting(true);
    try {
      await bulkImportStudents(parsedList);
      if (autoDivideAfterImport) {
        await autoDivideTeams('round_robin');
      }
      onClose();
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadSampleExcelTemplate();
    showToast('Đã tải xuống file Excel mẫu (Mau_Danh_Sach_Hoc_Sinh_Lop9A1.xlsx)!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
            <div>
              <h3 className="font-bold text-base sm:text-lg">Nhập Danh Sách Học Sinh Từ File Excel</h3>
              <p className="text-xs text-emerald-100">
                Tự động nhận diện cột: STT, Họ và tên, Giới tính, Ngày sinh, Tổ, SĐT Phụ huynh, Ghi chú
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

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Download Template Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-xs sm:text-sm text-emerald-950 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Chưa có file mẫu chuẩn?</span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Tải file mẫu có sẵn tiêu đề chuẩn và 5 dòng học sinh mẫu để điền nhanh danh sách lớp.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file Excel mẫu (.xlsx)</span>
            </button>
          </div>

          {/* File Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-emerald-50/20 transition-all cursor-pointer"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <UploadCloud className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <div className="font-bold text-slate-800 text-sm">
              {file ? file.name : 'Bấm vào đây để chọn file Excel (.xlsx, .xls) hoặc kéo thả file'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Nhận diện tự động danh sách cả lớp (không bắt buộc phải có sẵn cột Tổ)
            </p>
          </div>

          {/* Loading or Error states */}
          {isParsing && (
            <div className="py-6 flex items-center justify-center gap-2 text-sm text-slate-600 font-medium">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              <span>Đang phân tích dữ liệu file Excel...</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedList.length > 0 && !isParsing && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Xem trước dữ liệu ({parsedList.length} học sinh)
                </span>
                
                {/* Option to auto-divide into 4 teams right after import */}
                <label className="flex items-center gap-2 bg-indigo-50 text-indigo-900 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDivideAfterImport}
                    onChange={(e) => setAutoDivideAfterImport(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Tự động chia đều vào 4 tổ ngay sau khi nhập</span>
                </label>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3 text-center w-12">STT</th>
                      <th className="py-2 px-3">Họ và tên</th>
                      <th className="py-2 px-3 text-center">Tổ</th>
                      <th className="py-2 px-3 text-center">Giới tính</th>
                      <th className="py-2 px-3">Chức vụ</th>
                      <th className="py-2 px-3">SĐT Phụ huynh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedList.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 text-center font-bold text-slate-500">{s.stt || idx + 1}</td>
                        <td className="py-1.5 px-3 font-bold text-slate-900">{s.name}</td>
                        <td className="py-1.5 px-3 text-center">
                          {s.teamId && s.teamId > 0 ? (
                            <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                              Tổ {s.teamId}
                            </span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 font-medium px-2 py-0.5 rounded">
                              Chưa chia tổ
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-3 text-center">{s.gender}</td>
                        <td className="py-1.5 px-3 text-slate-600">{s.roleTitle || 'Thành viên'}</td>
                        <td className="py-1.5 px-3 text-slate-500">{s.parentPhone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            disabled={parsedList.length === 0 || isImporting}
            onClick={handleConfirmImport}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              parsedList.length === 0 || isImporting
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
            }`}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Lưu {parsedList.length} học sinh vào lớp</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

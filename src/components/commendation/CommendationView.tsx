import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Award, 
  Sparkles, 
  PlusCircle, 
  Search, 
  Calendar, 
  Heart, 
  Star, 
  User, 
  CheckCircle2, 
  Trash2 
} from 'lucide-react';
import { formatDateVN } from '../../utils/exportUtils';

interface CommendationViewProps {
  onNavigateToQuickEntry: () => void;
}

export const CommendationView: React.FC<CommendationViewProps> = ({ onNavigateToQuickEntry }) => {
  const { data, currentUser, deleteTransaction, openConfirm } = useApp();

  const [selectedWeek, setSelectedWeek] = useState<number>(data.config.currentWeek);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Commendation transactions (type === 'bieu_duong' or type === 'cong')
  const commendations = useMemo(() => {
    return data.transactions.filter(t => {
      if (t.status !== 'approved') return false;
      if (t.type !== 'bieu_duong' && !(t.type === 'cong' && t.points >= 2)) return false;
      if (selectedWeek && t.weekNumber !== selectedWeek) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      return true;
    });
  }, [data.transactions, selectedWeek, filterCategory]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Gương Sáng & Việc Tốt Lớp 9A1</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            GƯƠNG ĐIỂN HÌNH TRONG TUẦN
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 mt-1 max-w-xl">
            Tuyên dương các em học sinh có thành tích học tập xuất sắc, ý thức nề nếp gương mẫu, giúp đỡ bạn bè và có hành động đẹp.
          </p>
        </div>

        <button
          onClick={onNavigateToQuickEntry}
          className="px-4 py-3 bg-white text-amber-900 hover:bg-amber-50 rounded-2xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98 shrink-0"
        >
          <Award className="w-5 h-5 text-amber-600" />
          <span>Ghi nhận biểu dương</span>
        </button>
      </div>

      {/* Week Selector and Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-slate-700">Tuần thi đua:</span>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="text-xs font-bold text-amber-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
          >
            {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
              <option key={w} value={w}>
                Tuần {w} {w === data.config.currentWeek ? '(Hiện tại)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'Học tập', 'Nề nếp', 'Văn thể mỹ', 'Hoạt động chung'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                filterCategory === cat
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'Tất cả lĩnh vực' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Commendation Cards */}
      {commendations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Chưa có biểu dương trong tuần {selectedWeek}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Hãy ghi nhận các bạn có việc tốt, phát biểu xây dựng bài sôi nổi hoặc có tiến bộ vượt bậc!
          </p>
          <button
            onClick={onNavigateToQuickEntry}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-amber-600 transition-colors cursor-pointer"
          >
            Ghi nhận biểu dương ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {commendations.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
            >
              {/* Golden accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-2xs">
                      <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{item.studentName}</h4>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Tổ {item.teamId} • Tuần {item.weekNumber}
                      </span>
                    </div>
                  </div>

                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-xs px-2.5 py-1 rounded-lg">
                    +{item.points} điểm
                  </span>
                </div>

                <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100 mb-3">
                  <div className="font-bold text-amber-950 text-xs sm:text-sm leading-snug">
                    {item.title}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-slate-600 italic mt-1.5 leading-relaxed">
                      "{item.notes}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <span>Ghi nhận bởi: <strong>{item.createdByName}</strong></span>
                <div className="flex items-center gap-2">
                  <span>{formatDateVN(item.createdAt)}</span>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        openConfirm({
                          title: 'Xóa biểu dương?',
                          message: `Bạn có chắc muốn xóa biểu dương của em ${item.studentName}?`,
                          confirmText: 'Xóa',
                          isDestructive: true,
                          onConfirm: () => deleteTransaction(item.id),
                        });
                      }}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, UserPermissions, DEFAULT_ROLE_PERMISSIONS, UserAccount } from '../../types';
import { 
  Shield, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Check, 
  X, 
  AlertTriangle, 
  Users, 
  Trophy, 
  Award, 
  FileText, 
  Settings, 
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_INFO: Record<UserRole, { label: string; short: string; color: string }> = {
  admin: { label: 'Giáo viên CN (GVCN)', short: 'GVCN', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  lop_truong: { label: 'Lớp trưởng', short: 'Lớp trưởng', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  lop_pho_ht: { label: 'Lớp phó Học tập', short: 'LP Học tập', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
  lop_pho_nn: { label: 'Lớp phó Nề nếp', short: 'LP Nề nếp', color: 'bg-sky-100 text-sky-900 border-sky-300' },
  lop_pho_vtm: { label: 'Lớp phó Văn thể mỹ', short: 'LP Văn thể mỹ', color: 'bg-pink-100 text-pink-900 border-pink-300' },
  to_truong: { label: 'Tổ trưởng (4 Tổ)', short: 'Tổ trưởng', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  to_pho: { label: 'Tổ phó (4 Tổ)', short: 'Tổ phó', color: 'bg-teal-100 text-teal-900 border-teal-300' },
  hoc_sinh: { label: 'Học sinh', short: 'Học sinh', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  phu_huynh: { label: 'Phụ huynh', short: 'Phụ huynh', color: 'bg-amber-50 text-amber-900 border-amber-200' },
  guest: { label: 'Khách xem (Công khai)', short: 'Khách', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const PERMISSION_GROUPS: {
  groupTitle: string;
  icon: any;
  items: { key: keyof UserPermissions; label: string; desc: string; isAdminOnly?: boolean }[];
}[] = [
  {
    groupTitle: '1. Quản lý Thi đua & Chấm điểm',
    icon: Trophy,
    items: [
      { key: 'canCreatePoints', label: 'Ghi điểm cộng / trừ nhanh', desc: 'Nhập lỗi vi phạm hoặc điểm cộng cho bạn trong lớp' },
      { key: 'canReviewPoints', label: 'Duyệt điểm thi đua', desc: 'Duyệt các lượt điểm nộp từ cán sự khi bật chế độ kiểm duyệt', isAdminOnly: true },
      { key: 'canDeletePoints', label: 'Xóa 1 lượt điểm', desc: 'Xóa giao dịch điểm đã ghi nhận', isAdminOnly: true },
      { key: 'canDeletePeriodPoints', label: 'Xóa thi đua cả tuần / tháng', desc: 'Xóa sạch toàn bộ điểm của một tuần hoặc một tháng', isAdminOnly: true },
    ]
  },
  {
    groupTitle: '2. Học sinh & Phân chia Tổ',
    icon: Users,
    items: [
      { key: 'canManageStudents', label: 'Thêm / sửa học sinh', desc: 'Cập nhật danh sách học sinh, ngày sinh, địa chỉ thường trú' },
      { key: 'canDivideTeams', label: 'Chia tổ / chuyển tổ', desc: 'Chia 4 tổ tự động hoặc chuyển học sinh sang tổ khác' },
      { key: 'canAppointOfficers', label: 'Bổ nhiệm / Bãi nhiệm cán sự', desc: 'Thay đổi chức vụ Lớp trưởng, Lớp phó, Tổ trưởng', isAdminOnly: true },
      { key: 'canDeleteStudents', label: 'Xóa học sinh / Xóa toàn bộ', desc: 'Xóa vĩnh viễn học sinh khỏi hệ thống', isAdminOnly: true },
    ]
  },
  {
    groupTitle: '3. Cuộc thi & Chiến dịch phong trào',
    icon: Award,
    items: [
      { key: 'canCreateCampaign', label: 'Tạo cuộc thi / phong trào mới', desc: 'Khởi tạo đợt nộp bài, kế hoạch nhỏ, thi đua phong trào (GVCN, Lớp trưởng, các Lớp phó)' },
      { key: 'canMarkSubmissions', label: 'Điểm danh / Đánh dấu bài nộp', desc: 'Cập nhật trạng thái đã nộp, nộp muộn, xuất sắc của học sinh' },
      { key: 'canEditCampaign', label: 'Sửa nội dung & mức điểm cuộc thi', desc: 'Thay đổi điểm thưởng/phạt, thời gian, tên cuộc thi', isAdminOnly: true },
      { key: 'canApplyCampaignPoints', label: 'Áp dụng điểm thi đua từ cuộc thi', desc: 'Cộng/trừ điểm chính thức vào sổ thi đua của lớp', isAdminOnly: true },
      { key: 'canDeleteCampaign', label: 'Xóa cuộc thi / chiến dịch', desc: 'Xóa vĩnh viễn cuộc thi khỏi hệ thống', isAdminOnly: true },
    ]
  },
  {
    groupTitle: '4. Sổ Nhận xét & Đánh giá học sinh',
    icon: FileText,
    items: [
      { key: 'canEvaluateStudents', label: 'Nhận xét học sinh tuần / tháng / kỳ', desc: 'Ghi lời nhận xét, đánh giá tinh thần học tập và nề nếp' },
      { key: 'canDeleteEvaluation', label: 'Xóa nhận xét đã lưu', desc: 'Xóa nhận xét khỏi hồ sơ học sinh', isAdminOnly: true },
    ]
  },
  {
    groupTitle: '5. Quản trị & An toàn dữ liệu',
    icon: Settings,
    items: [
      { key: 'canManageRules', label: 'Cài đặt quy chế điểm lớp', desc: 'Thêm/sửa danh mục lỗi vi phạm và điểm thưởng', isAdminOnly: true },
      { key: 'canManageAccounts', label: 'Quản lý tài khoản & phân quyền', desc: 'Tạo tài khoản, đổi mật khẩu và phân quyền chi tiết', isAdminOnly: true },
      { key: 'canBackupRestore', label: 'Sao lưu & Khôi phục dữ liệu', desc: 'Tạo bản sao lưu và nạp lại dữ liệu lớp', isAdminOnly: true },
    ]
  }
];

export const PermissionsModal: React.FC<PermissionsModalProps> = ({ isOpen, onClose }) => {
  const { data, updateRolePermissions, updateAccountPermissions, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'roles' | 'accounts'>('roles');
  
  // Local role permissions matrix
  const [rolePerms, setRolePerms] = useState<Record<UserRole, UserPermissions>>(() => {
    return JSON.parse(JSON.stringify(data.config.rolePermissions || DEFAULT_ROLE_PERMISSIONS));
  });

  // Selected account for individual customization
  const [selectedAccountId, setSelectedAccountId] = useState<string>(data.accounts[0]?.id || '');
  const [customAccountPerms, setCustomAccountPerms] = useState<Partial<UserPermissions>>({});

  if (!isOpen) return null;

  const selectedAccount = data.accounts.find(a => a.id === selectedAccountId);

  // Toggle role permission
  const handleToggleRolePerm = (role: UserRole, key: keyof UserPermissions) => {
    // Admin always has all permissions
    if (role === 'admin') return;

    setRolePerms(prev => {
      const currentRoleObj = prev[role] || DEFAULT_ROLE_PERMISSIONS[role];
      const nextVal = !currentRoleObj[key];
      return {
        ...prev,
        [role]: {
          ...currentRoleObj,
          [key]: nextVal,
        }
      };
    });
  };

  // Reset to pedagogic default
  const handleResetDefaults = () => {
    setRolePerms(JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS)));
    showToast('Đã nạp lại thiết lập phân quyền chuẩn sư phạm (Chỉ GVCN xóa & sửa thang điểm)!', 'info');
  };

  // Apply Full Access Preset for Class Cadres
  const handleApplyCadreHelperPreset = () => {
    setRolePerms(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const cadreRoles: UserRole[] = ['lop_truong', 'lop_pho_ht', 'lop_pho_nn', 'lop_pho_vtm'];
      cadreRoles.forEach(r => {
        next[r] = {
          ...next[r],
          canCreatePoints: true,
          canReviewPoints: true,
          canManageStudents: true,
          canDivideTeams: true,
          canCreateCampaign: true,
          canMarkSubmissions: true,
          canEvaluateStudents: true,
          canEditCampaign: false,
          canManageRules: false,
          canManageAccounts: false,
        };
      });
      return next;
    });
    showToast('Đã áp dụng mẫu phân quyền Hỗ Trợ Đắc Lực cho Ban cán sự lớp!', 'success');
  };

  // Grant ALL permissions to Class Cadres
  const handleApplyCadreAllPermissions = () => {
    setRolePerms(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const cadreRoles: UserRole[] = ['lop_truong', 'lop_pho_ht', 'lop_pho_nn', 'lop_pho_vtm', 'to_truong', 'to_pho'];
      const allKeys: (keyof UserPermissions)[] = [
        'canCreatePoints',
        'canReviewPoints',
        'canDeletePoints',
        'canDeletePeriodPoints',
        'canManageStudents',
        'canDivideTeams',
        'canAppointOfficers',
        'canDeleteStudents',
        'canCreateCampaign',
        'canMarkSubmissions',
        'canEditCampaign',
        'canApplyCampaignPoints',
        'canDeleteCampaign',
        'canEvaluateStudents',
        'canDeleteEvaluation',
        'canManageRules',
        'canManageAccounts',
        'canBackupRestore'
      ];
      cadreRoles.forEach(r => {
        allKeys.forEach(k => {
          next[r][k] = true;
        });
      });
      return next;
    });
    showToast('Đã cấp TẤT CẢ các quyền cho Ban cán sự lớp!', 'success');
  };

  // Revoke all permissions from Cadres
  const handleRevokeAllCadrePermissions = () => {
    setRolePerms(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const cadreRoles: UserRole[] = ['lop_truong', 'lop_pho_ht', 'lop_pho_nn', 'lop_pho_vtm', 'to_truong', 'to_pho', 'hoc_sinh'];
      cadreRoles.forEach(r => {
        Object.keys(next[r]).forEach(k => {
          (next[r] as any)[k] = false;
        });
      });
      return next;
    });
    showToast('Đã thu hồi toàn bộ quyền của Ban cán sự lớp!', 'info');
  };

  // Save role permissions
  const handleSaveRolePermissions = async () => {
    await updateRolePermissions(rolePerms);
    onClose();
  };

  // Handle select account for custom perms
  const handleSelectAccount = (acc: UserAccount) => {
    setSelectedAccountId(acc.id);
    setCustomAccountPerms(acc.permissions || {});
  };

  // Toggle single account custom permission
  const handleToggleAccountPerm = (key: keyof UserPermissions) => {
    if (!selectedAccount) return;
    if (selectedAccount.role === 'admin') return;

    const currentEffective = customAccountPerms[key] !== undefined 
      ? customAccountPerms[key] 
      : (rolePerms[selectedAccount.role]?.[key] ?? DEFAULT_ROLE_PERMISSIONS[selectedAccount.role]?.[key] ?? false);

    setCustomAccountPerms(prev => ({
      ...prev,
      [key]: !currentEffective,
    }));
  };

  const handleSaveAccountCustomPerms = async () => {
    if (!selectedAccountId) return;
    await updateAccountPermissions(selectedAccountId, customAccountPerms);
  };

  const rolesToDisplay: UserRole[] = [
    'admin',
    'lop_truong',
    'lop_pho_ht',
    'lop_pho_nn',
    'lop_pho_vtm',
    'to_truong',
    'to_pho',
    'hoc_sinh'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight">
                  THIẾT LẬP PHÂN QUYỀN CHI TIẾT & BẢO MẬT
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Lớp 9A1
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Quy định quyền tạo cuộc thi, chấm điểm, nhận xét cho từng vai trò và cá nhân; bảo vệ 100% quyền xóa dữ liệu cho GVCN
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Callout Banner & Presets */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Tùy chọn phân quyền linh hoạt:</strong> Giáo viên chủ nhiệm có toàn quyền bật/tắt bất kỳ quyền hạn nào cho từng vai trò hoặc từng cán sự lớp.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleApplyCadreHelperPreset}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Cấp các quyền hỗ trợ phong trào, nề nếp, điểm danh cho Lớp trưởng & Lớp phó"
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Cán sự Hỗ trợ</span>
            </button>
            <button
              type="button"
              onClick={handleApplyCadreAllPermissions}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Bật tất cả các quyền cho Ban cán sự lớp"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Cán sự Toàn quyền (Tất cả quyền)</span>
            </button>
            <button
              type="button"
              onClick={handleRevokeAllCadrePermissions}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Thu hồi toàn bộ quyền của Ban cán sự lớp"
            >
              <X className="w-3 h-3 text-rose-600" />
              <span>Thu hồi tất cả</span>
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Khôi phục phân quyền chuẩn sư phạm"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Chuẩn Sư phạm</span>
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center px-5 pt-3 border-b border-slate-200 bg-slate-50/50 gap-2">
          <button
            onClick={() => setActiveTab('roles')}
            className={`pb-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'roles'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>1. Ma trận phân quyền theo Vai trò ({rolesToDisplay.length} vai trò)</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`pb-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'accounts'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Tùy biến phân quyền riêng từng tài khoản</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {activeTab === 'roles' ? (
            /* TAB 1: ROLE MATRIX TABLE */
            <div className="space-y-6">
              {PERMISSION_GROUPS.map((group, gIdx) => {
                const IconComponent = group.icon;
                return (
                  <div key={gIdx} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">{group.groupTitle}</h4>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">Bấm vào ô để bật/tắt quyền</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-bold">
                            <th className="py-2.5 px-3 min-w-[240px]">Chức năng & Hành động</th>
                            {rolesToDisplay.map(r => (
                              <th key={r} className="py-2.5 px-2 text-center whitespace-nowrap min-w-[85px]">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ROLE_INFO[r].color}`}>
                                  {ROLE_INFO[r].short}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.items.map((item) => (
                            <tr key={item.key} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{item.label}</span>
                                  {item.isAdminOnly && (
                                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200" title="Chỉ GVCN mới có quyền">
                                      🔒 Chỉ GVCN
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                              </td>

                              {rolesToDisplay.map(r => {
                                const isAllowed = r === 'admin' ? true : (rolePerms[r]?.[item.key] ?? false);

                                return (
                                  <td key={r} className="py-2.5 px-2 text-center">
                                    <button
                                      type="button"
                                      disabled={r === 'admin'}
                                      onClick={() => handleToggleRolePerm(r, item.key)}
                                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                        r === 'admin'
                                          ? 'bg-purple-600 text-white cursor-default shadow-2xs'
                                          : isAllowed
                                          ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                      }`}
                                      title={
                                        r === 'admin'
                                          ? 'GVCN luôn có toàn quyền'
                                          : isAllowed
                                          ? `Bấm để thu hồi quyền ${item.label} của ${ROLE_INFO[r].short}`
                                          : `Bấm để cấp quyền ${item.label} cho ${ROLE_INFO[r].short}`
                                      }
                                    >
                                      {r === 'admin' || isAllowed ? (
                                        <Check className="w-4 h-4 font-black" />
                                      ) : (
                                        <X className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TAB 2: INDIVIDUAL ACCOUNT CUSTOM OVERRIDES */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Account List */}
              <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs space-y-2">
                <div className="font-bold text-xs text-slate-700 uppercase tracking-wider px-2 py-1">
                  Chọn tài khoản cần phân quyền riêng ({data.accounts.length})
                </div>
                <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {data.accounts.map(acc => {
                    const isSelected = acc.id === selectedAccountId;
                    const hasCustom = acc.permissions && Object.keys(acc.permissions).length > 0;
                    return (
                      <button
                        key={acc.id}
                        onClick={() => handleSelectAccount(acc)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold shadow-2xs'
                            : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-bold truncate max-w-[160px]">{acc.displayName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">@{acc.username} • {ROLE_INFO[acc.role]?.short}</div>
                        </div>
                        {hasCustom && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600" title="Đã có cấu hình riêng" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Permissions Toggles */}
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
                {selectedAccount ? (
                  <>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <div className="text-xs text-slate-400 font-medium">Đang cấu hình quyền cho:</div>
                        <h4 className="font-black text-slate-900 text-base">{selectedAccount.displayName}</h4>
                        <div className="text-xs text-indigo-700 font-semibold mt-0.5">
                          Vai trò gốc: {ROLE_INFO[selectedAccount.role]?.label}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveAccountCustomPerms}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Lưu riêng tài khoản này</span>
                      </button>
                    </div>

                    {selectedAccount.role === 'admin' ? (
                      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-900 flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-purple-600 shrink-0" />
                        <div>
                          <strong>Tài khoản Giáo viên chủ nhiệm:</strong> Luôn có toàn quyền quản trị cao nhất đối với toàn bộ các tính năng của lớp học.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                        {PERMISSION_GROUPS.map((group, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                              {group.groupTitle}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {group.items.map((item) => {
                                const isAllowed = customAccountPerms[item.key] !== undefined
                                  ? customAccountPerms[item.key]
                                  : (rolePerms[selectedAccount.role]?.[item.key] ?? DEFAULT_ROLE_PERMISSIONS[selectedAccount.role]?.[item.key] ?? false);

                                return (
                                  <label
                                    key={item.key}
                                    className={`p-3 rounded-xl border flex items-start justify-between gap-2 transition-all cursor-pointer ${
                                      isAllowed
                                        ? 'bg-emerald-50/70 border-emerald-300 font-semibold'
                                        : 'bg-white border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    <div>
                                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                        <span>{item.label}</span>
                                        {item.isAdminOnly && <span className="text-[10px] text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">Đặc quyền</span>}
                                      </div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                                    </div>

                                    <input
                                      type="checkbox"
                                      checked={!!isAllowed}
                                      onChange={() => handleToggleAccountPerm(item.key)}
                                      className="w-4 h-4 text-indigo-600 rounded mt-0.5 cursor-pointer"
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">Vui lòng chọn tài khoản bên trái</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {activeTab === 'roles' ? (
              <span>Thay đổi trong bảng ma trận sẽ áp dụng đồng bộ cho tất cả người dùng thuộc vai trò đó.</span>
            ) : (
              <span>Cấu hình riêng sẽ ưu tiên áp dụng hơn cấu hình vai trò chung.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>

            {activeTab === 'roles' && (
              <button
                type="button"
                onClick={handleSaveRolePermissions}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Lưu toàn bộ phân quyền</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

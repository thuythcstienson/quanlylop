export type UserRole = 
  | 'admin'          // Giáo viên chủ nhiệm
  | 'lop_truong'     // Lớp trưởng
  | 'lop_pho_ht'     // Lớp phó học tập
  | 'lop_pho_nn'     // Lớp phó nề nếp
  | 'lop_pho_vtm'    // Lớp phó văn thể mỹ
  | 'to_truong'      // Tổ trưởng
  | 'to_pho'         // Tổ phó
  | 'hoc_sinh'       // Học sinh
  | 'phu_huynh';     // Phụ huynh

export interface UserPermissions {
  // Thi đua & Điểm số
  canCreatePoints: boolean;        // Ghi nhận điểm cộng / trừ nhanh
  canReviewPoints: boolean;        // Duyệt điểm (chờ duyệt -> đã duyệt)
  canDeletePoints: boolean;        // Xóa 1 lượt ghi nhận điểm
  canDeletePeriodPoints: boolean;  // Xóa thi đua theo tuần / tháng (chỉ GVCN)
  
  // Học sinh & Tổ
  canManageStudents: boolean;      // Thêm / sửa thông tin học sinh
  canDeleteStudents: boolean;      // Xóa học sinh / Xóa toàn bộ (chỉ GVCN)
  canAppointOfficers: boolean;     // Bổ nhiệm / bãi nhiệm cán sự (chỉ GVCN)
  canDivideTeams: boolean;         // Chia tổ tự động / đổi tổ
  
  // Cuộc thi & Phong trào
  canCreateCampaign: boolean;      // Tạo cuộc thi / chiến dịch mới
  canEditCampaign: boolean;        // Sửa nội dung & điểm cuộc thi (chỉ GVCN)
  canDeleteCampaign: boolean;      // Xóa cuộc thi / chiến dịch (chỉ GVCN)
  canMarkSubmissions: boolean;     // Điểm danh / Cập nhật bài nộp học sinh
  canApplyCampaignPoints: boolean; // Áp dụng điểm thi đua từ cuộc thi vào sổ (chỉ GVCN)
  
  // Nhận xét & Đánh giá
  canEvaluateStudents: boolean;    // Nhận xét học sinh
  canDeleteEvaluation: boolean;    // Xóa nhận xét (chỉ GVCN)
  
  // Hệ thống & Cấu hình
  canManageRules: boolean;         // Cài đặt quy chế điểm (chỉ GVCN)
  canManageAccounts: boolean;      // Quản lý tài khoản & phân quyền (chỉ GVCN)
  canBackupRestore: boolean;       // Sao lưu & Khôi phục dữ liệu (chỉ GVCN)
}

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string; // Base64 or hash for safe local comparison
  displayName: string;
  role: UserRole;
  teamId?: number; // 1, 2, 3, 4 nếu là tổ trưởng/tổ phó/học sinh
  studentId?: string; // Liên kết tới hồ sơ học sinh nếu có
  phone?: string;
  email?: string;
  notes?: string;
  title?: string;
  isLocked: boolean;
  permissions?: Partial<UserPermissions>; // Phân quyền tùy biến riêng cho tài khoản
  createdAt: string;
  lastLogin?: string;
}

export type Gender = 'Nam' | 'Nữ';

export interface Student {
  id: string;
  stt: number;
  name: string;
  gender: Gender;
  birthDate?: string;
  birthPlace?: string; // Nơi sinh (Tỉnh/Thành phố/Quận/Huyện)
  permanentAddress?: string; // Nơi thường trú (Thôn/Xóm/Xã/Phường/Quận/Huyện/Tỉnh)
  teamId: number; // 1, 2, 3, 4
  roleTitle: string; // Cán sự: Lớp trưởng, Lớp phó, Tổ trưởng, Thành viên...
  parentName?: string;
  parentPhone?: string;
  notes?: string;
  avatarUrl?: string;
}

export type PointType = 'cong' | 'tru' | 'bieu_duong';

export interface PointRule {
  id: string;
  type: PointType;
  title: string;
  points: number; // positive number (for 'tru', subtract this amount)
  category: 'Học tập' | 'Nề nếp' | 'Văn thể mỹ' | 'Vệ sinh - Trực nhật' | 'Hoạt động chung' | 'Khác';
}

export type TransactionStatus = 'approved' | 'pending' | 'rejected';

export interface PointTransaction {
  id: string;
  studentId: string;
  studentName: string;
  teamId: number;
  type: PointType;
  title: string;
  points: number; // Signed points e.g. +2 or -3
  category: string;
  notes?: string;
  createdByUserId: string;
  createdByRole: UserRole;
  createdByName: string;
  createdAt: string; // ISO date-time
  occurredDate?: string; // YYYY-MM-DD
  dayOfWeek?: string; // Thứ Hai, Thứ Ba...
  weekNumber: number; // e.g. 1..35
  month: number; // 1..12
  status: TransactionStatus;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ClassConfig {
  schoolName: string;
  className: string;
  schoolYear: string;
  teacherName: string;
  totalStudents: number;
  startDate?: string; // Ngày bắt đầu năm học (VD: 2026-09-07)
  basePoints: number; // Mặc định: 100 điểm
  maxPoints?: number;
  minPoints?: number;
  requireApproval: boolean; // Chế độ duyệt: false = Lưu ngay, true = Chờ giáo viên duyệt
  allowStudentViewRank: boolean;
  allowParentViewRank: boolean;
  currentWeek: number;
  currentMonth: number;
  rolePermissions?: Partial<Record<UserRole, UserPermissions>>; // Ma trận phân quyền theo vai trò
}

// Mặc định quyền chuẩn sư phạm - Bảo vệ 100% dữ liệu không bị xóa ngoài ý muốn
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canCreatePoints: true,
    canReviewPoints: true,
    canDeletePoints: true,
    canDeletePeriodPoints: true,
    canManageStudents: true,
    canDeleteStudents: true,
    canAppointOfficers: true,
    canDivideTeams: true,
    canCreateCampaign: true,
    canEditCampaign: true,
    canDeleteCampaign: true,
    canMarkSubmissions: true,
    canApplyCampaignPoints: true,
    canEvaluateStudents: true,
    canDeleteEvaluation: true,
    canManageRules: true,
    canManageAccounts: true,
    canBackupRestore: true,
  },
  lop_truong: {
    canCreatePoints: true,
    canReviewPoints: false,
    canDeletePoints: false,        // Tuyệt đối không có quyền xóa
    canDeletePeriodPoints: false,  // Tuyệt đối không có quyền xóa
    canManageStudents: false,
    canDeleteStudents: false,      // Tuyệt đối không có quyền xóa
    canAppointOfficers: false,
    canDivideTeams: false,
    canCreateCampaign: true,       // Được tạo cuộc thi / phong trào
    canEditCampaign: false,        // Chỉ GVCN mới được sửa điểm / nội dung
    canDeleteCampaign: false,      // Tuyệt đối không có quyền xóa
    canMarkSubmissions: true,      // Được điểm danh / cập nhật bài nộp
    canApplyCampaignPoints: false, // Chỉ GVCN mới được áp dụng điểm vào sổ
    canEvaluateStudents: true,     // Được nhận xét học sinh
    canDeleteEvaluation: false,
    canManageRules: false,
    canManageAccounts: false,
    canBackupRestore: false,
  },
  lop_pho_ht: {
    canCreatePoints: true,
    canReviewPoints: false,
    canDeletePoints: false,
    canDeletePeriodPoints: false,
    canManageStudents: false,
    canDeleteStudents: false,
    canAppointOfficers: false,
    canDivideTeams: false,
    canCreateCampaign: true,       // Được tạo cuộc thi / đợt nộp bài
    canEditCampaign: false,
    canDeleteCampaign: false,
    canMarkSubmissions: true,
    canApplyCampaignPoints: false,
    canEvaluateStudents: true,
    canDeleteEvaluation: false,
    canManageRules: false,
    canManageAccounts: false,
    canBackupRestore: false,
  },
  lop_pho_nn: {
    canCreatePoints: true,
    canReviewPoints: false,
    canDeletePoints: false,
    canDeletePeriodPoints: false,
    canManageStudents: false,
    canDeleteStudents: false,
    canAppointOfficers: false,
    canDivideTeams: false,
    canCreateCampaign: true,
    canEditCampaign: false,
    canDeleteCampaign: false,
    canMarkSubmissions: true,
    canApplyCampaignPoints: false,
    canEvaluateStudents: true,
    canDeleteEvaluation: false,
    canManageRules: false,
    canManageAccounts: false,
    canBackupRestore: false,
  },
  lop_pho_vtm: {
    canCreatePoints: true,
    canReviewPoints: false,
    canDeletePoints: false,
    canDeletePeriodPoints: false,
    canManageStudents: false,
    canDeleteStudents: false,
    canAppointOfficers: false,
    canDivideTeams: false,
    canCreateCampaign: true,
    canEditCampaign: false,
    canDeleteCampaign: false,
    canMarkSubmissions: true,
    canApplyCampaignPoints: false,
    canEvaluateStudents: true,
    canDeleteEvaluation: false,
    canManageRules: false,
    canManageAccounts: false,
    canBackupRestore: false,
  },
  to_truong: {
    canCreatePoints: true,
    canReviewPoints: false,
    canDeletePoints: false,
    canDeletePeriodPoints: false,
    canManageStudents: false,
    canDeleteStudents: false,
    canAppointOfficers: false,
    canDivideTeams: false,
    canCreateCampaign: false,
    canEditCampaign: false,
    canDeleteCampaign: false,
    canMarkSubmissions: true,      // Được điểm danh tổ mình
    canApplyCampaignPoints: false,
    canEvaluateStudents: true,     // Được nhận xét tổ mình
    canDeleteEvaluation: false,
    canManageRules: false,
    canManageAccounts: false,
    canBackupRestore: false,
  },
  to_pho: {
    canCreatePoints: true,
    canReviewPoints: false,
    canDeletePoints: false,
    canDeletePeriodPoints: false,
    canManageStudents: false,
    canDeleteStudents: false,
    canAppointOfficers: false,
    canDivideTeams: false,
    canCreateCampaign: false,
    canEditCampaign: false,
    canDeleteCampaign: false,
    canMarkSubmissions: true,
    canApplyCampaignPoints: false,
    canEvaluateStudents: true,
    canDeleteEvaluation: false,
    canManageRules: false,
    canManageAccounts: false,
    canBackupRestore: false,
  },
  hoc_sinh: {
    canCreatePoints: false,
    canReviewPoints: false,
    canDeletePoints: false,
    canDeletePeriodPoints: false,
    canManageStudents: false,
    canDeleteStudents: false,
    canAppointOfficers: false,
    canDivideTeams: false,
    canCreateCampaign: false,
    canEditCampaign: false,
    canDeleteCampaign: false,
    canMarkSubmissions: false,
    canApplyCampaignPoints: false,
    canEvaluateStudents: false,
    canDeleteEvaluation: false,
    canManageRules: false,
    canManageAccounts: false,
    canBackupRestore: false,
  },
  phu_huynh: {
    canCreatePoints: false,
    canReviewPoints: false,
    canDeletePoints: false,
    canDeletePeriodPoints: false,
    canManageStudents: false,
    canDeleteStudents: false,
    canAppointOfficers: false,
    canDivideTeams: false,
    canCreateCampaign: false,
    canEditCampaign: false,
    canDeleteCampaign: false,
    canMarkSubmissions: false,
    canApplyCampaignPoints: false,
    canEvaluateStudents: false,
    canDeleteEvaluation: false,
    canManageRules: false,
    canManageAccounts: false,
    canBackupRestore: false,
  },
};

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target: 'all' | 'to_1' | 'to_2' | 'to_3' | 'to_4' | 'parents' | 'cadres';
  priority: 'normal' | 'important' | 'urgent';
  createdAt: string;
  createdBy: string;
  readCount?: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

export type CampaignType = 'cuoc_thi' | 'chien_dich' | 'nop_bai' | 'phong_trao';
export type SubmissionStatus = 'chua_nop' | 'da_nop' | 'nop_muon' | 'xuat_sac' | 'khong_tham_gia';

export interface CampaignParticipant {
  studentId: string;
  studentName: string;
  teamId: number;
  status: SubmissionStatus;
  submittedAt?: string;
  note?: string;
  pointsAwarded?: number;
  transactionId?: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  type: CampaignType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (Hạn chót / deadline)
  weekNumber?: number;

  // Point rules
  rewardPoints: number; // Điểm cộng khi nộp đúng hạn (VD: 2 -> +2đ)
  bonusPoints: number; // Điểm thưởng nộp sớm / xuất sắc / đạt giải (VD: 5 -> +5đ)
  latePenaltyPoints: number; // Điểm trừ nếu nộp muộn (VD: 1 -> -1đ)
  missPenaltyPoints: number; // Điểm trừ nếu không nộp / không tham gia (VD: 2 -> -2đ)

  createdBy: string;
  createdRole: UserRole;
  createdAt: string;
  status: 'active' | 'completed' | 'cancelled';
  pointsApplied: boolean; // Đã áp dụng cộng/trừ điểm vào sổ thi đua chưa
  pointsAppliedAt?: string;

  participants: CampaignParticipant[];
}

export type EvaluationPeriodType = 'tuan' | 'thang' | 'hoc_ky';

export interface StudentEvaluation {
  id: string;
  studentId: string;
  studentName: string;
  teamId: number;
  periodType: EvaluationPeriodType; // 'tuan' | 'thang' | 'hoc_ky'
  periodValue: number | string; // 1..35 (week), 1..12 (month), or 'HK1' | 'HK2' | 'CaNam'
  periodLabel: string; // VD: "Tuần 4", "Tháng 10", "Học kỳ 1"
  content: string; // Lời nhận xét, đánh giá chi tiết
  category?: 'Học tập' | 'Nề nếp & Kỷ luật' | 'Đạo đức & Ý thức' | 'Văn thể mỹ' | 'Chung';
  rating?: 'Xuất sắc' | 'Tốt' | 'Khá' | 'Cần cố gắng' | 'Nhắc nhở';
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
  updatedAt?: string;
}

export interface AppData {
  config: ClassConfig;
  students: Student[];
  rules: PointRule[];
  transactions: PointTransaction[];
  accounts: UserAccount[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  campaigns: Campaign[];
  evaluations: StudentEvaluation[];
}

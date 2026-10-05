import { AppData, PointRule, Student, UserAccount, PointTransaction, Announcement, AuditLog, Campaign, StudentEvaluation, AccessSessionLog } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  // TỔ 1 (10 HS)
  { id: 'hs_01', stt: 1, name: 'Tạ Thục Quyên', gender: 'Nữ', birthDate: '2011-04-12', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Vân Cốc 1, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 1, roleTitle: 'Lớp trưởng', parentName: 'Tạ Văn Quyết', parentPhone: '0912345601', notes: 'Gương mẫu, học giỏi toàn diện, được GVCN bổ nhiệm Lớp trưởng' },
  { id: 'hs_02', stt: 2, name: 'Vũ Quốc Bảo', gender: 'Nam', birthDate: '2011-08-20', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Yên Viên, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 1, roleTitle: 'Tổ trưởng', parentName: 'Vũ Văn Kiên', parentPhone: '0912345602', notes: 'Năng nổ, trách nhiệm cao' },
  { id: 'hs_03', stt: 3, name: 'Hoàng Lan Anh', gender: 'Nữ', birthDate: '2011-02-15', birthPlace: 'Bắc Giang', permanentAddress: 'Thôn Thổ Hà, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 1, roleTitle: 'Tổ phó', parentName: 'Hoàng Văn Thắng', parentPhone: '0912345603' },
  { id: 'hs_04', stt: 4, name: 'Nguyễn Văn An', gender: 'Nam', birthDate: '2011-05-18', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Vân Cốc 2, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 1, roleTitle: 'Thành viên', parentName: 'Nguyễn Văn Bình', parentPhone: '0912345604' },
  { id: 'hs_05', stt: 5, name: 'Trần Quỳnh Chi', gender: 'Nữ', birthDate: '2011-10-09', birthPlace: 'Hà Nội', permanentAddress: 'Thôn Nguyệt Đức, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 1, roleTitle: 'Thành viên', parentName: 'Trần Văn Hải', parentPhone: '0912345605' },
  { id: 'hs_06', stt: 6, name: 'Đặng Tuấn Dũng', gender: 'Nam', birthDate: '2011-11-23', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Vân Cốc 1, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 1, roleTitle: 'Thành viên', parentName: 'Đặng Văn Lâm', parentPhone: '0912345606' },
  { id: 'hs_07', stt: 7, name: 'Lê Thùy Dung', gender: 'Nữ', birthDate: '2011-03-30', birthPlace: 'Bắc Giang', permanentAddress: 'Thôn Thổ Hà, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 1, roleTitle: 'Thành viên', parentName: 'Lê Văn Cường', parentPhone: '0912345607' },
  { id: 'hs_08', stt: 8, name: 'Phạm Tiến Đạt', gender: 'Nam', birthDate: '2011-07-14', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Yên Viên, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 1, roleTitle: 'Thành viên', parentName: 'Phạm Văn Hưng', parentPhone: '0912345608' },
  { id: 'hs_09', stt: 9, name: 'Vũ Thị Diễm Hương', gender: 'Nữ', birthDate: '2011-09-05', birthPlace: 'Bắc Giang', permanentAddress: 'Thôn Thổ Hà, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 1, roleTitle: 'Thành viên', parentName: 'Vũ Đình Trọng', parentPhone: '0912345609' },
  { id: 'hs_10', stt: 10, name: 'Bùi Đức Khang', gender: 'Nam', birthDate: '2011-12-01', birthPlace: 'Bắc Ninh', permanentAddress: 'Thôn Vân Cốc 3, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 1, roleTitle: 'Thành viên', parentName: 'Bùi Văn Tuấn', parentPhone: '0912345610' },

  // TỔ 2 (10 HS)
  { id: 'hs_11', stt: 11, name: 'Trần Thị Mai Phương', gender: 'Nữ', birthDate: '2011-01-25', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Yên Viên, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 2, roleTitle: 'Lớp phó học tập', parentName: 'Trần Văn Nam', parentPhone: '0912345611', notes: 'Phụ trách đôn đốc bài tập' },
  { id: 'hs_12', stt: 12, name: 'Đặng Minh Quân', gender: 'Nam', birthDate: '2011-06-19', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Vân Cốc 1, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 2, roleTitle: 'Tổ trưởng', parentName: 'Đặng Văn Lộc', parentPhone: '0912345612' },
  { id: 'hs_13', stt: 13, name: 'Ngô Thùy Linh', gender: 'Nữ', birthDate: '2011-04-03', birthPlace: 'Bắc Giang', permanentAddress: 'Thôn Thổ Hà, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 2, roleTitle: 'Tổ phó', parentName: 'Ngô Văn Thành', parentPhone: '0912345613' },
  { id: 'hs_14', stt: 14, name: 'Phan Hoàng Long', gender: 'Nam', birthDate: '2011-08-11', birthPlace: 'Bắc Giang', permanentAddress: 'Thôn Vân Cốc 2, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 2, roleTitle: 'Thành viên', parentName: 'Phan Văn Phú', parentPhone: '0912345614' },
  { id: 'hs_15', stt: 15, name: 'Đinh Khánh Ly', gender: 'Nữ', birthDate: '2011-02-28', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Yên Viên, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 2, roleTitle: 'Thành viên', parentName: 'Đinh Văn Đức', parentPhone: '0912345615' },
  { id: 'hs_16', stt: 16, name: 'Hoàng Nhật Minh', gender: 'Nam', birthDate: '2011-10-17', birthPlace: 'Hà Nội', permanentAddress: 'Thôn Nguyệt Đức, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 2, roleTitle: 'Thành viên', parentName: 'Hoàng Văn Sơn', parentPhone: '0912345616' },
  { id: 'hs_17', stt: 17, name: 'Nguyễn Trà My', gender: 'Nữ', birthDate: '2011-12-12', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Thổ Hà, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 2, roleTitle: 'Thành viên', parentName: 'Nguyễn Văn Đạt', parentPhone: '0912345617' },
  { id: 'hs_18', stt: 18, name: 'Lê Duy Nam', gender: 'Nam', birthDate: '2011-05-07', birthPlace: 'Bắc Giang', permanentAddress: 'Thôn Vân Cốc 1, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 2, roleTitle: 'Thành viên', parentName: 'Lê Văn Khoa', parentPhone: '0912345618' },
  { id: 'hs_19', stt: 19, name: 'Tạ Bảo Ngọc', gender: 'Nữ', birthDate: '2011-09-22', birthPlace: 'Bắc Giang', permanentAddress: 'Thôn Vân Cốc 3, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 2, roleTitle: 'Thành viên', parentName: 'Tạ Văn Quyết', parentPhone: '0912345619' },
  { id: 'hs_20', stt: 20, name: 'Vũ Hữu Nghĩa', gender: 'Nam', birthDate: '2011-03-16', birthPlace: 'Bắc Ninh', permanentAddress: 'Thôn Yên Viên, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 2, roleTitle: 'Thành viên', parentName: 'Vũ Văn Hưng', parentPhone: '0912345620' },

  // TỔ 3 (10 HS)
  { id: 'hs_21', stt: 21, name: 'Lê Hoàng Nam', gender: 'Nam', birthDate: '2011-07-08', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Thổ Hà, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 3, roleTitle: 'Lớp phó nề nếp', parentName: 'Lê Văn Tiến', parentPhone: '0912345621', notes: 'Kiểm tra sĩ số, đồng phục, vệ sinh' },
  { id: 'hs_22', stt: 22, name: 'Bùi Hải Đăng', gender: 'Nam', birthDate: '2011-11-04', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Vân Cốc 1, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 3, roleTitle: 'Tổ trưởng', parentName: 'Bùi Văn Sang', parentPhone: '0912345622' },
  { id: 'hs_23', stt: 23, name: 'Đỗ Ngọc Ánh', gender: 'Nữ', birthDate: '2011-01-19', birthPlace: 'Bắc Giang', permanentAddress: 'Thôn Yên Viên, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 3, roleTitle: 'Tổ phó', parentName: 'Đỗ Văn Cương', parentPhone: '0912345623' },
  { id: 'hs_24', stt: 24, name: 'Nguyễn Thành Phát', gender: 'Nam', birthDate: '2011-06-27', birthPlace: 'Bắc Giang', permanentAddress: 'Thôn Vân Cốc 2, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 3, roleTitle: 'Thành viên', parentName: 'Nguyễn Văn Phúc', parentPhone: '0912345624' },
  { id: 'hs_25', stt: 25, name: 'Lương Thu Phương', gender: 'Nữ', birthDate: '2011-08-30', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Thổ Hà, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 3, roleTitle: 'Thành viên', parentName: 'Lương Văn Thái', parentPhone: '0912345625' },
  { id: 'hs_26', stt: 26, name: 'Trịnh Minh Quân', gender: 'Nam', birthDate: '2011-04-14', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Nguyệt Đức, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 3, roleTitle: 'Thành viên', parentName: 'Trịnh Văn Long', parentPhone: '0912345626' },
  { id: 'hs_27', stt: 27, name: 'Cao Như Quỳnh', gender: 'Nữ', birthDate: '2011-10-02', birthPlace: 'Bắc Giang', permanentAddress: 'Thôn Vân Cốc 1, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 3, roleTitle: 'Thành viên', parentName: 'Cao Văn Khiêm', parentPhone: '0912345627' },
  { id: 'hs_28', stt: 28, name: 'Vũ Đức Sơn', gender: 'Nam', birthDate: '2011-03-21', birthPlace: 'Bắc Ninh', permanentAddress: 'Thôn Yên Viên, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 3, roleTitle: 'Thành viên', parentName: 'Vũ Văn Hậu', parentPhone: '0912345628' },
  { id: 'hs_29', stt: 29, name: 'Đào Thanh Tâm', gender: 'Nữ', birthDate: '2011-05-13', birthPlace: 'Bắc Giang', permanentAddress: 'Thôn Thổ Hà, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 3, roleTitle: 'Thành viên', parentName: 'Đào Văn Vinh', parentPhone: '0912345629' },
  { id: 'hs_30', stt: 30, name: 'Hà Quang Thắng', gender: 'Nam', birthDate: '2011-09-18', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Vân Cốc 3, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 3, roleTitle: 'Thành viên', parentName: 'Hà Văn Quý', parentPhone: '0912345630' },

  // TỔ 4 (11 HS)
  { id: 'hs_31', stt: 31, name: 'Phạm Thu Hà', gender: 'Nữ', birthDate: '2011-02-10', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Yên Viên, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 4, roleTitle: 'Lớp phó văn thể mỹ', parentName: 'Phạm Văn Hòa', parentPhone: '0912345631', notes: 'Phụ trách phong trào văn nghệ thể thao' },
  { id: 'hs_32', stt: 32, name: 'Dương Gia Huy', gender: 'Nam', birthDate: '2011-08-05', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Vân Cốc 1, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 4, roleTitle: 'Tổ trưởng', parentName: 'Dương Văn Tạo', parentPhone: '0912345632' },
  { id: 'hs_33', stt: 33, name: 'Lý Thảo My', gender: 'Nữ', birthDate: '2011-12-29', birthPlace: 'Bắc Giang', permanentAddress: 'Thôn Thổ Hà, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 4, roleTitle: 'Tổ phó', parentName: 'Lý Văn Cảnh', parentPhone: '0912345633' },
  { id: 'hs_34', stt: 34, name: 'Tạ Minh Tuấn', gender: 'Nam', birthDate: '2011-07-26', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Vân Cốc 2, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 4, roleTitle: 'Thành viên', parentName: 'Tạ Văn Quyết', parentPhone: '0912345634' },
  { id: 'hs_35', stt: 35, name: 'Mai Phương Uyên', gender: 'Nữ', birthDate: '2011-04-18', birthPlace: 'Bắc Giang', permanentAddress: 'Thôn Nguyệt Đức, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 4, roleTitle: 'Thành viên', parentName: 'Mai Văn Tuyên', parentPhone: '0912345635' },
  { id: 'hs_36', stt: 36, name: 'Đoàn Quang Vinh', gender: 'Nam', birthDate: '2011-06-03', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Thổ Hà, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 4, roleTitle: 'Thành viên', parentName: 'Đoàn Văn Chiến', parentPhone: '0912345636' },
  { id: 'hs_37', stt: 37, name: 'Phùng Hải Yến', gender: 'Nữ', birthDate: '2011-11-15', birthPlace: 'Bắc Giang', permanentAddress: 'Thôn Yên Viên, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 4, roleTitle: 'Thành viên', parentName: 'Phùng Văn Thuận', parentPhone: '0912345637' },
  { id: 'hs_38', stt: 38, name: 'Nguyễn Tấn Dũng', gender: 'Nam', birthDate: '2011-01-08', birthPlace: 'Bắc Giang', permanentAddress: 'Thôn Vân Cốc 1, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 4, roleTitle: 'Thành viên', parentName: 'Nguyễn Văn Kiên', parentPhone: '0912345638' },
  { id: 'hs_39', stt: 39, name: 'Hoàng Diệu Linh', gender: 'Nữ', birthDate: '2011-03-24', birthPlace: 'Hà Nội', permanentAddress: 'Thôn Vân Cốc 3, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 4, roleTitle: 'Thành viên', parentName: 'Hoàng Văn Thìn', parentPhone: '0912345639' },
  { id: 'hs_40', stt: 40, name: 'Lê Anh Khoa', gender: 'Nam', birthDate: '2011-09-12', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Thổ Hà, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 4, roleTitle: 'Thành viên', parentName: 'Lê Văn Hiếu', parentPhone: '0912345640' },
  { id: 'hs_41', stt: 41, name: 'Trịnh Tuyết Mai', gender: 'Nữ', birthDate: '2011-10-31', birthPlace: 'Việt Yên, Bắc Giang', permanentAddress: 'Thôn Nguyệt Đức, Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Giang', teamId: 4, roleTitle: 'Thành viên', parentName: 'Trịnh Văn Long', parentPhone: '0912345641' },
];

export const INITIAL_RULES: PointRule[] = [
  // LỖI VI PHẠM (TRỪ)
  { id: 'rule_t1', type: 'tru', title: 'Đi học muộn', points: 2, category: 'Nề nếp' },
  { id: 'rule_t2', type: 'tru', title: 'Không mặc đúng đồng phục / thiếu khăn quàng', points: 2, category: 'Nề nếp' },
  { id: 'rule_t3', type: 'tru', title: 'Không làm bài tập về nhà', points: 3, category: 'Học tập' },
  { id: 'rule_t4', type: 'tru', title: 'Nói chuyện riêng / làm việc riêng trong giờ', points: 1, category: 'Học tập' },
  { id: 'rule_t5', type: 'tru', title: 'Không trực nhật / trực nhật bẩn', points: 3, category: 'Vệ sinh - Trực nhật' },
  { id: 'rule_t6', type: 'tru', title: 'Mất trật tự khi xếp hàng / chào cờ', points: 2, category: 'Nề nếp' },
  { id: 'rule_t7', type: 'tru', title: 'Quên sách giáo khoa / đồ dùng học tập', points: 1, category: 'Học tập' },
  { id: 'rule_t8', type: 'tru', title: 'Vi phạm nội quy nghiêm trọng / gây gổ', points: 5, category: 'Nề nếp' },
  { id: 'rule_t9', type: 'tru', title: 'Sử dụng điện thoại trái quy định', points: 4, category: 'Nề nếp' },
  { id: 'rule_t10', type: 'tru', title: 'Vứt rác bừa bãi trong lớp/sân trường', points: 2, category: 'Vệ sinh - Trực nhật' },

  // ĐIỂM CỘNG
  { id: 'rule_c1', type: 'cong', title: 'Phát biểu xây dựng bài sôi nổi', points: 1, category: 'Học tập' },
  { id: 'rule_c2', type: 'cong', title: 'Đạt điểm kiểm tra miệng/15p từ 9-10', points: 3, category: 'Học tập' },
  { id: 'rule_c3', type: 'cong', title: 'Giúp đỡ bạn tiến bộ trong học tập', points: 2, category: 'Học tập' },
  { id: 'rule_c4', type: 'cong', title: 'Tham gia tích cực phong trào / văn nghệ', points: 2, category: 'Văn thể mỹ' },
  { id: 'rule_c5', type: 'cong', title: 'Đạt giải văn nghệ, thể dục thể thao trường', points: 5, category: 'Văn thể mỹ' },
  { id: 'rule_c6', type: 'cong', title: 'Tích cực trực nhật, giữ gìn vệ sinh chung', points: 2, category: 'Vệ sinh - Trực nhật' },
  { id: 'rule_c7', type: 'cong', title: 'Nhặt được của rơi trả lại người mất', points: 5, category: 'Hoạt động chung' },

  // BIỂU DƯƠNG
  { id: 'rule_b1', type: 'bieu_duong', title: 'Gương sáng học tập xuất sắc trong tuần', points: 3, category: 'Học tập' },
  { id: 'rule_b2', type: 'bieu_duong', title: 'Có tiến bộ vượt bậc về ý thức và bài tập', points: 3, category: 'Học tập' },
  { id: 'rule_b3', type: 'bieu_duong', title: 'Hành động đẹp - Giúp đỡ người khác', points: 4, category: 'Hoạt động chung' },
  { id: 'rule_b4', type: 'bieu_duong', title: 'Hoàn thành xuất sắc nhiệm vụ cán sự lớp', points: 3, category: 'Nề nếp' },
];

export const INITIAL_ACCOUNTS: UserAccount[] = [
  { id: 'acc_admin', username: 'admin', passwordHash: 'admin123', displayName: 'Thầy Nguyễn Văn Thủy (GVCN)', role: 'admin', isLocked: false, createdAt: '2026-09-01T07:00:00Z' },
  { id: 'acc_loptruong', username: 'loptruong', passwordHash: '123456', displayName: 'Tạ Thục Quyên (Lớp trưởng)', role: 'lop_truong', isLocked: false, createdAt: '2026-09-01T07:00:00Z', studentId: 'hs_01', teamId: 1 },
  { id: 'acc_loppho_ht', username: 'loppho_ht', passwordHash: '123456', displayName: 'Trần Thị Mai Phương (LP Học tập)', role: 'lop_pho_ht', isLocked: false, createdAt: '2026-09-01T07:00:00Z', studentId: 'hs_11', teamId: 2 },
  { id: 'acc_loppho_nn', username: 'loppho_nn', passwordHash: '123456', displayName: 'Lê Hoàng Nam (LP Nề nếp)', role: 'lop_pho_nn', isLocked: false, createdAt: '2026-09-01T07:00:00Z', studentId: 'hs_21', teamId: 3 },
  { id: 'acc_totruong1', username: 'totruong1', passwordHash: '123456', displayName: 'Vũ Quốc Bảo (Tổ trưởng 1)', role: 'to_truong', teamId: 1, isLocked: false, createdAt: '2026-09-01T07:00:00Z', studentId: 'hs_02' },
  { id: 'acc_totruong2', username: 'totruong2', passwordHash: '123456', displayName: 'Đặng Minh Quân (Tổ trưởng 2)', role: 'to_truong', teamId: 2, isLocked: false, createdAt: '2026-09-01T07:00:00Z', studentId: 'hs_12' },
  { id: 'acc_totruong3', username: 'totruong3', passwordHash: '123456', displayName: 'Bùi Hải Đăng (Tổ trưởng 3)', role: 'to_truong', teamId: 3, isLocked: false, createdAt: '2026-09-01T07:00:00Z', studentId: 'hs_22' },
  { id: 'acc_totruong4', username: 'totruong4', passwordHash: '123456', displayName: 'Dương Gia Huy (Tổ trưởng 4)', role: 'to_truong', teamId: 4, isLocked: false, createdAt: '2026-09-01T07:00:00Z', studentId: 'hs_32' },
  { id: 'acc_hocsinh', username: 'hocsinh', passwordHash: '123456', displayName: 'Học sinh Nguyễn Văn An', role: 'hoc_sinh', isLocked: false, createdAt: '2026-09-01T07:00:00Z', studentId: 'hs_04', teamId: 1 },
  { id: 'acc_phuhuynh', username: 'phuhuynh', passwordHash: '123456', displayName: 'Phụ huynh HS Nguyễn Văn An', role: 'phu_huynh', isLocked: false, createdAt: '2026-09-01T07:00:00Z', studentId: 'hs_04', teamId: 1 },
];

export const INITIAL_TRANSACTIONS: PointTransaction[] = [];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_01',
    title: 'Kế hoạch thi đua đợt 1 chào mừng ngày 20/10',
    content: 'Các tổ trưởng đôn đốc thành viên giữ vững nề nếp xếp hàng, 100% đeo khăn quàng đỏ, không vi phạm đi muộn. Lớp phó nề nếp và văn thể mỹ chuẩn bị tiết mục văn nghệ.',
    target: 'all',
    priority: 'urgent',
    createdAt: '2026-10-01T07:00:00Z',
    createdBy: 'Thầy Nguyễn Văn Thủy (GVCN)'
  },
  {
    id: 'ann_02',
    title: 'Nhắc nhở kiểm tra vở ghi và bài tập về nhà môn Toán, Anh',
    content: 'Lớp phó học tập Trần Thị Mai Phương tiến hành kiểm tra đột xuất 15 phút đầu giờ sáng thứ Năm.',
    target: 'cadres',
    priority: 'important',
    createdAt: '2026-10-02T11:00:00Z',
    createdBy: 'Thầy Nguyễn Văn Thủy (GVCN)'
  },
  {
    id: 'ann_03',
    title: 'Gửi kết quả rèn luyện tuần 4 tới Quý Phụ huynh',
    content: 'Tuần qua lớp 9A1 đạt vị trí số 1 toàn khối về thi đua nề nếp. Kính mong phụ huynh tiếp tục động viên các con duy trì.',
    target: 'parents',
    priority: 'normal',
    createdAt: '2026-09-29T17:00:00Z',
    createdBy: 'Thầy Nguyễn Văn Thủy (GVCN)'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_01',
    userId: 'acc_admin',
    userName: 'Thầy Nguyễn Văn Thủy (GVCN)',
    role: 'admin',
    action: 'Khởi tạo hệ thống',
    details: 'Thiết lập danh sách 41 học sinh Lớp 9A1 và quy chế điểm năm học 2026–2027',
    timestamp: '2026-09-01T07:00:00Z'
  },
  {
    id: 'log_02',
    userId: 'acc_totruong1',
    userName: 'Vũ Quốc Bảo',
    role: 'to_truong',
    action: 'Trừ điểm',
    details: 'Trừ 1 điểm HS Phạm Tiến Đạt do nói chuyện riêng',
    timestamp: '2026-10-03T08:00:00Z'
  },
  {
    id: 'log_03',
    userId: 'acc_loptruong',
    userName: 'Tạ Thục Quyên',
    role: 'lop_truong',
    action: 'Cộng điểm',
    details: 'Cộng 2 điểm HS Nguyễn Trà My do tích cực trực nhật',
    timestamp: '2026-10-03T08:10:00Z'
  }
];

export const INITIAL_CAMPAIGNS: Campaign[] = [];

export const INITIAL_EVALUATIONS: StudentEvaluation[] = [];

export const INITIAL_ACCESS_LOGS: AccessSessionLog[] = [
  {
    id: 'sess_01',
    userId: 'acc_admin',
    username: 'admin',
    displayName: 'Thầy Nguyễn Văn Thủy (GVCN)',
    role: 'admin',
    loginTime: '2026-10-04T07:15:20Z',
    lastActiveTime: '2026-10-04T08:25:10Z',
    durationSeconds: 4190, // 1 giờ 9 phút 50 giây
    device: 'Máy tính (Windows 11 - Chrome)',
    isOnline: true,
    actionsCount: 14,
  },
  {
    id: 'sess_02',
    userId: 'acc_loptruong',
    username: 'loptruong',
    displayName: 'Nguyễn Đức Minh (Lớp trưởng)',
    role: 'lop_truong',
    teamId: 1,
    loginTime: '2026-10-04T06:45:00Z',
    lastActiveTime: '2026-10-04T07:30:15Z',
    durationSeconds: 2715, // 45 phút 15 giây
    device: 'Điện thoại (iPhone - Safari)',
    isOnline: false,
    actionsCount: 8,
  },
  {
    id: 'sess_03',
    userId: 'acc_loppho_ht',
    username: 'loppho_ht',
    displayName: 'Trần Thị Mai Phương (LP Học tập)',
    role: 'lop_pho_ht',
    teamId: 2,
    loginTime: '2026-10-04T07:05:10Z',
    lastActiveTime: '2026-10-04T07:35:40Z',
    durationSeconds: 1830, // 30 phút 30 giây
    device: 'Máy tính (macOS - Safari)',
    isOnline: false,
    actionsCount: 5,
  },
  {
    id: 'sess_04',
    userId: 'acc_loppho_nn',
    username: 'loppho_nn',
    displayName: 'Lê Hoàng Nam (LP Nề nếp)',
    role: 'lop_pho_nn',
    teamId: 3,
    loginTime: '2026-10-04T07:20:00Z',
    lastActiveTime: '2026-10-04T07:55:00Z',
    durationSeconds: 2100, // 35 phút
    device: 'Điện thoại (Android - Chrome)',
    isOnline: false,
    actionsCount: 6,
  },
  {
    id: 'sess_05',
    userId: 'acc_totruong1',
    username: 'totruong1',
    displayName: 'Vũ Quốc Bảo (Tổ trưởng 1)',
    role: 'to_truong',
    teamId: 1,
    loginTime: '2026-10-04T07:30:00Z',
    lastActiveTime: '2026-10-04T07:48:20Z',
    durationSeconds: 1100, // 18 phút 20 giây
    device: 'Điện thoại (Android - Chrome)',
    isOnline: false,
    actionsCount: 3,
  },
  {
    id: 'sess_06',
    userId: 'acc_totruong2',
    username: 'totruong2',
    displayName: 'Đặng Minh Quân (Tổ trưởng 2)',
    role: 'to_truong',
    teamId: 2,
    loginTime: '2026-10-03T19:10:00Z',
    lastActiveTime: '2026-10-03T19:35:00Z',
    durationSeconds: 1500, // 25 phút
    device: 'Máy tính (Windows 10 - Edge)',
    isOnline: false,
    actionsCount: 4,
  },
  {
    id: 'sess_07',
    userId: 'acc_totruong3',
    username: 'totruong3',
    displayName: 'Bùi Hải Đăng (Tổ trưởng 3)',
    role: 'to_truong',
    teamId: 3,
    loginTime: '2026-10-03T18:45:00Z',
    lastActiveTime: '2026-10-03T19:05:00Z',
    durationSeconds: 1200, // 20 phút
    device: 'Điện thoại (iPhone - Safari)',
    isOnline: false,
    actionsCount: 2,
  },
  {
    id: 'sess_08',
    userId: 'acc_totruong4',
    username: 'totruong4',
    displayName: 'Dương Gia Huy (Tổ trưởng 4)',
    role: 'to_truong',
    teamId: 4,
    loginTime: '2026-10-03T20:00:00Z',
    lastActiveTime: '2026-10-03T20:22:30Z',
    durationSeconds: 1350, // 22 phút 30 giây
    device: 'Điện thoại (Android - Chrome)',
    isOnline: false,
    actionsCount: 3,
  },
  {
    id: 'sess_09',
    userId: 'acc_phuhuynh',
    username: 'phuhuynh',
    displayName: 'Phụ huynh HS Nguyễn Văn An',
    role: 'phu_huynh',
    teamId: 1,
    loginTime: '2026-10-03T21:15:00Z',
    lastActiveTime: '2026-10-03T21:27:00Z',
    durationSeconds: 720, // 12 phút
    device: 'Điện thoại (iPhone - Safari)',
    isOnline: false,
    actionsCount: 1,
  },
  {
    id: 'sess_10',
    userId: 'acc_hocsinh',
    username: 'hocsinh',
    displayName: 'Học sinh Nguyễn Văn An',
    role: 'hoc_sinh',
    teamId: 1,
    loginTime: '2026-10-03T16:30:00Z',
    lastActiveTime: '2026-10-03T16:45:00Z',
    durationSeconds: 900, // 15 phút
    device: 'Máy tính (Windows 11 - Chrome)',
    isOnline: false,
    actionsCount: 2,
  },
  {
    id: 'sess_11',
    userId: 'acc_loptruong',
    username: 'loptruong',
    displayName: 'Nguyễn Đức Minh (Lớp trưởng)',
    role: 'lop_truong',
    teamId: 1,
    loginTime: '2026-10-03T07:00:00Z',
    lastActiveTime: '2026-10-03T07:42:00Z',
    durationSeconds: 2520, // 42 phút
    device: 'Điện thoại (iPhone - Safari)',
    isOnline: false,
    actionsCount: 7,
  },
  {
    id: 'sess_12',
    userId: 'acc_admin',
    username: 'admin',
    displayName: 'Thầy Nguyễn Văn Thủy (GVCN)',
    role: 'admin',
    loginTime: '2026-10-03T06:30:00Z',
    lastActiveTime: '2026-10-03T07:45:00Z',
    durationSeconds: 4500, // 1 giờ 15 phút
    device: 'Máy tính (Windows 11 - Chrome)',
    isOnline: false,
    actionsCount: 19,
  }
];

export const INITIAL_APP_DATA: AppData = {
  config: {
    schoolName: 'THCS Vân Hà 2',
    className: '9A1',
    schoolYear: '2026–2027',
    teacherName: 'Thầy Nguyễn Văn Thủy',
    totalStudents: 41,
    startDate: '2026-09-07',
    basePoints: 100,
    maxPoints: 150,
    minPoints: 0,
    requireApproval: false, // Mặc định lưu ngay, có thể chuyển sang kiểm duyệt
    allowStudentViewRank: true,
    allowParentViewRank: true,
    currentWeek: 5,
    currentMonth: 10,
    schoolRank: 1, // Thứ tự của lớp trong toàn trường
    schoolTotalClasses: 24, // Tổng số lớp toàn trường
  },
  students: INITIAL_STUDENTS,
  rules: INITIAL_RULES,
  transactions: INITIAL_TRANSACTIONS,
  accounts: INITIAL_ACCOUNTS,
  announcements: INITIAL_ANNOUNCEMENTS,
  auditLogs: INITIAL_AUDIT_LOGS,
  campaigns: INITIAL_CAMPAIGNS,
  evaluations: INITIAL_EVALUATIONS,
  accessLogs: INITIAL_ACCESS_LOGS,
};

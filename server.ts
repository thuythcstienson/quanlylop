import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { INITIAL_APP_DATA } from './src/data/initialData';
import { AppData, PointTransaction, Student, UserAccount, AuditLog, PointRule, Announcement, Campaign, CampaignParticipant, SubmissionStatus, StudentEvaluation, DEFAULT_ROLE_PERMISSIONS, UserPermissions } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thư mục lưu file tạm thời (Tránh lỗi crash khi đưa lên Cloud)
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/tmp/data' : path.join(__dirname, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// 1. Cấu hình Schema cho MongoDB
const AppDataSchema = new mongoose.Schema({
  config: Object,
  students: Array,
  rules: Array,
  transactions: Array,
  accounts: Array,
  announcements: Array,
  auditLogs: Array,
  campaigns: Array,
  evaluations: Array,
}, { strict: false });

const AppDataModel = mongoose.model('AppData', AppDataSchema);
let dbData: AppData;

// 2. Hàm Load dữ liệu từ MongoDB
async function loadDatabaseAsync(): Promise<AppData> {
  try {
    let doc = await AppDataModel.findOne();
    if (!doc) {
      doc = new AppDataModel(INITIAL_APP_DATA);
      await doc.save();
    }
    return doc.toObject() as AppData;
  } catch (err) {
    console.error('Lỗi đọc MongoDB:', err);
    return JSON.parse(JSON.stringify(INITIAL_APP_DATA));
  }
}

// 3. Hàm Save dữ liệu chạy ngầm
function saveDatabase(data: AppData) {
  AppDataModel.updateOne({}, data, { upsert: true })
    .catch(err => console.error('Lỗi lưu MongoDB:', err));
}

async function startServer() {
  // === THẦY ĐIỀN MẬT KHẨU CỦA THẦY VÀO DÒNG DƯỚI ĐÂY THAY CHO CHỮ MAT_KHAU_CUA_THAY ===
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://thuythcslongson_db_user:cxPhA1te9yJccHyj@quanlylop.6v49w0s.mongodb.net/?appName=quanlylop';
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB Atlas thành công!');
  } catch (err) {
    console.error('❌ Lỗi kết nối MongoDB:', err);
  }

  dbData = await loadDatabaseAsync();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  app.use(express.json({ limit: '10mb' }));

  const addAuditLog = (userId: string, userName: string, role: any, action: string, details: string) => {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName,
      role,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    dbData.auditLogs.unshift(log);
    if (dbData.auditLogs.length > 1000) {
      dbData.auditLogs = dbData.auditLogs.slice(0, 1000);
    }
  };

  // --- API ROUTES ---
  app.get('/api/data', (_req: Request, res: Response) => {
    const safeData: AppData = {
      ...dbData,
      accounts: dbData.accounts.map(acc => ({
        ...acc,
        passwordHash: '***',
      })),
    };
    res.json(safeData);
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
    
    const cleanUser = username.trim().toLowerCase();
    const account = dbData.accounts.find(
      a => a.username.toLowerCase() === cleanUser && a.passwordHash === password
    );
    if (!account) return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    if (account.isLocked) return res.status(403).json({ error: 'Tài khoản đã bị khóa. Vui lòng liên hệ Giáo viên chủ nhiệm.' });
    
    account.lastLogin = new Date().toISOString();
    saveDatabase(dbData);
    addAuditLog(account.id, account.displayName, account.role, 'Đăng nhập', `Đăng nhập thành công vào hệ thống`);
    
    const safeUser = { ...account, passwordHash: undefined };
    res.json({ user: safeUser, token: `token_${account.id}_${Date.now()}` });
  });

  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    const { userId, oldPassword, newPassword, isAdminReset } = req.body;
    const account = dbData.accounts.find(a => a.id === userId);
    if (!account) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    
    if (!isAdminReset && account.passwordHash !== oldPassword) {
      return res.status(400).json({ error: 'Mật khẩu cũ không đúng.' });
    }
    if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 4 ký tự.' });
    
    account.passwordHash = newPassword;
    saveDatabase(dbData);
    addAuditLog(userId, account.displayName, account.role, 'Đổi mật khẩu', 'Đã thay đổi mật khẩu thành công');
    res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
  });

  app.put('/api/auth/profile', (req: Request, res: Response) => {
    const { userId, displayName, phone, email, notes, title } = req.body;
    const account = dbData.accounts.find(a => a.id === userId);
    if (!account) return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng.' });
    
    if (displayName && displayName.trim()) {
      account.displayName = displayName.trim();
      if (account.role === 'admin') dbData.config.teacherName = displayName.trim();
    }
    if (phone !== undefined) account.phone = phone.trim();
    if (email !== undefined) account.email = email.trim();
    if (notes !== undefined) account.notes = notes.trim();
    if (title !== undefined) account.title = title.trim();
    
    saveDatabase(dbData);
    addAuditLog(userId, account.displayName, account.role, 'Cập nhật thông tin', 'Cập nhật thông tin cá nhân');
    res.json({ success: true, user: { ...account, passwordHash: '***' } });
  });

  app.post('/api/transactions', (req: Request, res: Response) => {
    const { studentId, type, title, points, category, notes, userId, userRole, userName, teamId, weekNumber, month, occurredDate, dayOfWeek } = req.body;
    if (!studentId || !title || points === undefined || !type) return res.status(400).json({ error: 'Thiếu thông tin giao dịch điểm.' });
    
    const student = dbData.students.find(s => s.id === studentId);
    if (!student) return res.status(404).json({ error: 'Không tìm thấy học sinh.' });
    
    if (userRole === 'to_truong' && teamId && student.teamId !== teamId) {
      return res.status(403).json({ error: 'Tổ trưởng chỉ có chức năng cộng/trừ điểm cho học sinh thuộc tổ mình.' });
    }
    
    const status = (dbData.config.requireApproval && userRole !== 'admin') ? 'pending' : 'approved';
    const todayStr = new Date().toISOString().split('T')[0];
    
    const newTx: PointTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      studentName: student.name,
      teamId: student.teamId,
      type,
      title,
      points: Number(points),
      category: category || 'Khác',
      notes: notes || '',
      createdByUserId: userId || 'unknown',
      createdByRole: userRole || 'cadre',
      createdByName: userName || 'Cán sự',
      createdAt: new Date().toISOString(),
      occurredDate: occurredDate || todayStr,
      dayOfWeek: dayOfWeek || 'Thứ',
      weekNumber: weekNumber || dbData.config.currentWeek,
      month: month || dbData.config.currentMonth,
      status,
      reviewedBy: status === 'approved' && userRole === 'admin' ? userName : undefined,
      reviewedAt: status === 'approved' && userRole === 'admin' ? new Date().toISOString() : undefined
    };
    
    dbData.transactions.unshift(newTx);
    saveDatabase(dbData);
    
    const actionName = type === 'tru' ? 'Trừ điểm' : type === 'cong' ? 'Cộng điểm' : 'Biểu dương';
    addAuditLog(userId, userName, userRole, actionName, `${actionName} (${points > 0 ? '+' : ''}${points} điểm) cho học sinh ${student.name} - ${title}`);
    res.json({ success: true, transaction: newTx });
  });

  app.post('/api/transactions/review', (req: Request, res: Response) => {
    const { ids, action, adminName } = req.body;
    if (!ids || !Array.isArray(ids) || !action) return res.status(400).json({ error: 'Dữ liệu xét duyệt không hợp lệ.' });
    
    const now = new Date().toISOString();
    let count = 0;
    dbData.transactions.forEach(tx => {
      if (ids.includes(tx.id)) {
        tx.status = action === 'approve' ? 'approved' : 'rejected';
        tx.reviewedBy = adminName || 'Giáo viên';
        tx.reviewedAt = now;
        count++;
      }
    });
    
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Duyệt điểm', `${action === 'approve' ? 'Duyệt' : 'Từ chối'} ${count} giao dịch điểm`);
    res.json({ success: true, count });
  });

  app.delete('/api/transactions/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName } = req.body;
    const index = dbData.transactions.findIndex(t => t.id === id);
    if (index === -1) return res.status(404).json({ error: 'Giao dịch không tồn tại.' });
    
    const deleted = dbData.transactions.splice(index, 1)[0];
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa điểm', `Xóa giao dịch: ${deleted.title} của HS ${deleted.studentName}`);
    res.json({ success: true });
  });

  app.post('/api/transactions/clear-period', (req: Request, res: Response) => {
    const { type, value, adminName } = req.body;
    if (!type || value === undefined) return res.status(400).json({ error: 'Thiếu thông tin kỳ xóa thi đua (tuần hoặc tháng).' });
    
    const val = Number(value);
    const initialCount = dbData.transactions.length;
    
    if (type === 'week') {
      dbData.transactions = dbData.transactions.filter(t => t.weekNumber !== val);
      const deletedCount = initialCount - dbData.transactions.length;
      saveDatabase(dbData);
      addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa thi đua tuần', `Xóa toàn bộ ${deletedCount} điểm thi đua của Tuần ${val}`);
      return res.json({ success: true, deletedCount, message: `Đã xóa ${deletedCount} lượt điểm của Tuần ${val}.` });
    } else if (type === 'month') {
      dbData.transactions = dbData.transactions.filter(t => t.month !== val);
      const deletedCount = initialCount - dbData.transactions.length;
      saveDatabase(dbData);
      addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa thi đua tháng', `Xóa toàn bộ ${deletedCount} điểm thi đua của Tháng ${val}`);
      return res.json({ success: true, deletedCount, message: `Đã xóa ${deletedCount} lượt điểm của Tháng ${val}.` });
    }
    res.status(400).json({ error: 'Loại kỳ không hợp lệ (chỉ hỗ trợ week hoặc month).' });
  });

  app.post('/api/students', (req: Request, res: Response) => {
    const { name, gender, birthDate, birthPlace, permanentAddress, teamId, roleTitle, parentName, parentPhone, notes, adminName } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Tên học sinh là bắt buộc.' });
    
    const nextStt = dbData.students.length > 0 ? Math.max(...dbData.students.map(s => s.stt)) + 1 : 1;
    const assignedTeam = teamId !== undefined && teamId !== null && teamId !== '' ? Number(teamId) : 0;
    
    const newStudent: Student = {
      id: `hs_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      stt: nextStt,
      name: name.trim(),
      gender: gender || 'Nam',
      birthDate: birthDate || '',
      birthPlace: birthPlace ? birthPlace.trim() : '',
      permanentAddress: permanentAddress ? permanentAddress.trim() : '',
      teamId: assignedTeam,
      roleTitle: roleTitle || 'Thành viên',
      parentName: parentName || '',
      parentPhone: parentPhone || '',
      notes: notes || '',
    };
    
    dbData.students.push(newStudent);
    dbData.config.totalStudents = dbData.students.length;
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Thêm học sinh', `Thêm học sinh mới: ${newStudent.name} (${newStudent.teamId > 0 ? 'Tổ ' + newStudent.teamId : 'Chưa phân tổ'})`);
    res.json({ success: true, student: newStudent });
  });

  app.put('/api/students/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const student = dbData.students.find(s => s.id === id);
    if (!student) return res.status(404).json({ error: 'Không tìm thấy học sinh.' });
    
    const { name, gender, birthDate, birthPlace, permanentAddress, teamId, roleTitle, parentName, parentPhone, notes, adminName } = req.body;
    if (name) student.name = name.trim();
    if (gender) student.gender = gender;
    if (birthDate !== undefined) student.birthDate = birthDate;
    if (birthPlace !== undefined) student.birthPlace = birthPlace ? birthPlace.trim() : '';
    if (permanentAddress !== undefined) student.permanentAddress = permanentAddress ? permanentAddress.trim() : '';
    if (teamId !== undefined) student.teamId = Number(teamId);
    if (roleTitle !== undefined) student.roleTitle = roleTitle;
    if (parentName !== undefined) student.parentName = parentName;
    if (parentPhone !== undefined) student.parentPhone = parentPhone;
    if (notes !== undefined) student.notes = notes;
    
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Cập nhật học sinh', `Cập nhật thông tin học sinh: ${student.name}`);
    res.json({ success: true, student });
  });

  app.delete('/api/students/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName } = req.body;
    const index = dbData.students.findIndex(s => s.id === id);
    if (index === -1) return res.status(404).json({ error: 'Không tìm thấy học sinh.' });
    
    const deleted = dbData.students.splice(index, 1)[0];
    dbData.config.totalStudents = dbData.students.length;
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa học sinh', `Xóa học sinh: ${deleted.name}`);
    res.json({ success: true });
  });

  app.delete('/api/students', (req: Request, res: Response) => {
    const { adminName } = req.body;
    const count = dbData.students.length;
    dbData.students = [];
    dbData.config.totalStudents = 0;
    dbData.transactions = [];
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa toàn bộ học sinh', `Đã xóa toàn bộ ${count} học sinh và làm rỗng danh sách lớp`);
    res.json({ success: true, count: 0 });
  });

  app.post('/api/students/auto-divide-teams', (req: Request, res: Response) => {
    const { mode, adminName } = req.body;
    const total = dbData.students.length;
    if (total === 0) return res.status(400).json({ error: 'Lớp chưa có học sinh nào để chia tổ.' });
    
    if (mode === 'sequential') {
      const perTeam = Math.ceil(total / 4);
      dbData.students.forEach((s, index) => {
        s.teamId = Math.min(4, Math.floor(index / perTeam) + 1);
      });
    } else if (mode === 'balance_gender') {
      const males = dbData.students.filter(s => s.gender === 'Nam');
      const females = dbData.students.filter(s => s.gender !== 'Nam');
      males.forEach((s, idx) => { s.teamId = (idx % 4) + 1; });
      females.forEach((s, idx) => { s.teamId = (idx % 4) + 1; });
    } else {
      dbData.students.forEach((s, index) => { s.teamId = (index % 4) + 1; });
    }
    
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Chia tổ tự động', `Tự động chia ${total} học sinh vào 4 tổ (Cách chia: ${mode || 'vòng tròn'})`);
    res.json({ success: true, students: dbData.students });
  });

  app.post('/api/students/batch-assign-team', (req: Request, res: Response) => {
    const { studentIds, targetTeamId, adminName } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || !targetTeamId) return res.status(400).json({ error: 'Dữ liệu đầu vào không hợp lệ.' });
    
    let updatedCount = 0;
    dbData.students.forEach(s => {
      if (studentIds.includes(s.id)) {
        s.teamId = Number(targetTeamId);
        updatedCount++;
      }
    });
    
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Gán tổ hàng loạt', `Đã chuyển ${updatedCount} học sinh về Tổ ${targetTeamId}`);
    res.json({ success: true, updatedCount, students: dbData.students });
  });

  app.post('/api/students/batch-delete', (req: Request, res: Response) => {
    const { studentIds, adminName } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) return res.status(400).json({ error: 'Danh sách học sinh cần xóa không hợp lệ.' });
    
    const beforeCount = dbData.students.length;
    dbData.students = dbData.students.filter(s => !studentIds.includes(s.id));
    dbData.transactions = dbData.transactions.filter(t => !studentIds.includes(t.studentId));
    dbData.config.totalStudents = dbData.students.length;
    const deletedCount = beforeCount - dbData.students.length;
    
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa học sinh hàng loạt', `Đã xóa ${deletedCount} học sinh khỏi danh sách lớp`);
    res.json({ success: true, deletedCount });
  });

  app.post('/api/students/bulk-import', (req: Request, res: Response) => {
    const { students: newStudentsList, adminName } = req.body;
    if (!newStudentsList || !Array.isArray(newStudentsList)) return res.status(400).json({ error: 'Dữ liệu danh sách không hợp lệ.' });
    
    let nextStt = dbData.students.length > 0 ? Math.max(...dbData.students.map(s => s.stt)) + 1 : 1;
    const addedStudents: Student[] = [];
    
    newStudentsList.forEach((s: any) => {
      if (s.name && s.name.trim()) {
        const assignedTeam = (s.teamId !== undefined && s.teamId !== null && s.teamId !== '') ? Number(s.teamId) : 0;
        const student: Student = {
          id: `hs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          stt: s.stt ? Number(s.stt) : nextStt++,
          name: s.name.trim(),
          gender: s.gender === 'Nữ' || s.gender === 'nu' ? 'Nữ' : 'Nam',
          birthDate: s.birthDate || '',
          birthPlace: s.birthPlace || s.placeOfBirth || s.noiSinh || '',
          permanentAddress: s.permanentAddress || s.thuongTru || s.address || s.noiThuongTru || '',
          teamId: assignedTeam,
          roleTitle: s.roleTitle || 'Thành viên',
          parentName: s.parentName || '',
          parentPhone: s.parentPhone || '',
          notes: s.notes || '',
        };
        dbData.students.push(student);
        addedStudents.push(student);
      }
    });
    
    dbData.config.totalStudents = dbData.students.length;
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Nhập danh sách Excel', `Đã nhập thêm ${addedStudents.length} học sinh từ file Excel`);
    res.json({ success: true, count: addedStudents.length, added: addedStudents });
  });

  app.post('/api/rules', (req: Request, res: Response) => {
    const { type, title, points, category, adminName } = req.body;
    if (!type || !title || points === undefined) return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin quy chế.' });
    
    const newRule: PointRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type,
      title: title.trim(),
      points: Math.abs(Number(points)),
      category: category || 'Khác'
    };
    dbData.rules.push(newRule);
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Thêm quy chế điểm', `Thêm quy chế: ${newRule.title} (${newRule.points} điểm)`);
    res.json({ success: true, rule: newRule });
  });

  app.put('/api/rules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { type, title, points, category, adminName } = req.body;
    const rule = dbData.rules.find(r => r.id === id);
    if (!rule) return res.status(404).json({ error: 'Không tìm thấy quy chế.' });
    
    if (type) rule.type = type;
    if (title && title.trim()) rule.title = title.trim();
    if (points !== undefined) rule.points = Math.abs(Number(points));
    if (category) rule.category = category;
    
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Cập nhật thang điểm', `Chỉnh sửa quy chế: ${rule.title} (${rule.points} điểm)`);
    res.json({ success: true, rule });
  });

  app.delete('/api/rules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName } = req.body;
    const index = dbData.rules.findIndex(r => r.id === id);
    if (index === -1) return res.status(404).json({ error: 'Không tìm thấy quy chế.' });
    
    const deleted = dbData.rules.splice(index, 1)[0];
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa quy chế', `Xóa quy chế: ${deleted.title}`);
    res.json({ success: true });
  });

  app.post('/api/accounts', (req: Request, res: Response) => {
    const { username, password, displayName, role, teamId, studentId, adminName } = req.body;
    if (!username || !password || !displayName || !role) return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin tài khoản.' });
    
    const cleanUser = username.trim().toLowerCase();
    if (dbData.accounts.some(a => a.username.toLowerCase() === cleanUser)) {
      return res.status(400).json({ error: 'Tên đăng nhập này đã được sử dụng.' });
    }
    
    const newAcc: UserAccount = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      username: cleanUser,
      passwordHash: password,
      displayName: displayName.trim(),
      role,
      teamId: teamId ? Number(teamId) : undefined,
      studentId: studentId || undefined,
      isLocked: false,
      createdAt: new Date().toISOString(),
    };
    dbData.accounts.push(newAcc);
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Tạo tài khoản', `Tạo tài khoản mới: ${newAcc.username} (${newAcc.displayName})`);
    res.json({ success: true, account: { ...newAcc, passwordHash: '***' } });
  });

  app.put('/api/accounts/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { username, displayName, role, teamId, studentId, phone, email, notes, title, password, isLocked, adminName } = req.body;
    const acc = dbData.accounts.find(a => a.id === id);
    if (!acc) return res.status(404).json({ error: 'Không tìm thấy tài khoản để chỉnh sửa.' });
    
    if (username && username.trim()) {
      const cleanUser = username.trim().toLowerCase();
      const existing = dbData.accounts.find(a => a.id !== id && a.username.toLowerCase() === cleanUser);
      if (existing) return res.status(400).json({ error: `Tên đăng nhập "@${cleanUser}" đã có tài khoản khác sử dụng.` });
      acc.username = cleanUser;
    }
    if (displayName && displayName.trim()) {
      acc.displayName = displayName.trim();
      if (acc.role === 'admin') dbData.config.teacherName = displayName.trim();
    }
    if (role) {
      if (acc.username === 'admin' && role !== 'admin') return res.status(400).json({ error: 'Không thể đổi quyền tài khoản quản trị viên chính.' });
      acc.role = role;
    }
    if (teamId !== undefined) acc.teamId = teamId ? Number(teamId) : undefined;
    if (studentId !== undefined) acc.studentId = studentId || undefined;
    if (phone !== undefined) acc.phone = phone.trim();
    if (email !== undefined) acc.email = email.trim();
    if (notes !== undefined) acc.notes = notes.trim();
    if (title !== undefined) acc.title = title.trim();
    if (isLocked !== undefined && acc.username !== 'admin') acc.isLocked = Boolean(isLocked);
    if (password && password.trim()) acc.passwordHash = password.trim();
    
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Sửa tài khoản', `Cập nhật tài khoản: @${acc.username} (${acc.displayName} - ${acc.role})`);
    res.json({ success: true, account: { ...acc, passwordHash: '***' } });
  });

  app.delete('/api/accounts/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName } = req.body || {};
    const index = dbData.accounts.findIndex(a => a.id === id);
    if (index === -1) return res.status(404).json({ error: 'Không tìm thấy tài khoản để xóa.' });
    
    const targetAcc = dbData.accounts[index];
    if (targetAcc.username === 'admin') return res.status(400).json({ error: 'Không thể xóa tài khoản quản trị gốc (admin).' });
    if (targetAcc.role === 'admin' && dbData.accounts.filter(a => a.role === 'admin').length <= 1) return res.status(400).json({ error: 'Không thể xóa tài khoản quản trị viên duy nhất còn lại.' });
    
    const deleted = dbData.accounts.splice(index, 1)[0];
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa tài khoản', `Đã xóa vĩnh viễn tài khoản: @${deleted.username} (${deleted.displayName})`);
    res.json({ success: true, deletedId: id });
  });

  app.put('/api/accounts/:id/toggle-lock', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName } = req.body;
    const acc = dbData.accounts.find(a => a.id === id);
    if (!acc) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    
    acc.isLocked = !acc.isLocked;
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', acc.isLocked ? 'Khóa tài khoản' : 'Mở khóa tài khoản', `Đã ${acc.isLocked ? 'khóa' : 'mở khóa'} tài khoản: ${acc.username}`);
    res.json({ success: true, isLocked: acc.isLocked });
  });

  app.put('/api/accounts/:id/permissions', (req: Request, res: Response) => {
    const { id } = req.params;
    const { permissions, adminName } = req.body;
    const acc = dbData.accounts.find(a => a.id === id);
    if (!acc) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    
    if (acc.role !== 'admin' && permissions) {
      permissions.canDeletePoints = false;
      permissions.canDeletePeriodPoints = false;
      permissions.canDeleteStudents = false;
      permissions.canDeleteCampaign = false;
      permissions.canBackupRestore = false;
    }
    acc.permissions = permissions;
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Cập nhật phân quyền tài khoản', `Cập nhật phân quyền chi tiết cho tài khoản: ${acc.username} (${acc.displayName})`);
    res.json({ success: true, account: acc });
  });

  app.put('/api/config/role-permissions', (req: Request, res: Response) => {
    const { rolePermissions, adminName } = req.body;
    if (!rolePermissions || typeof rolePermissions !== 'object') return res.status(400).json({ error: 'Dữ liệu ma trận phân quyền không hợp lệ.' });
    
    Object.keys(rolePermissions).forEach(r => {
      if (r !== 'admin') {
        const rp = rolePermissions[r as keyof typeof rolePermissions];
        if (rp) {
          rp.canDeletePoints = false;
          rp.canDeletePeriodPoints = false;
          rp.canDeleteStudents = false;
          rp.canDeleteCampaign = false;
          rp.canBackupRestore = false;
        }
      }
    });
    dbData.config.rolePermissions = rolePermissions;
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Cập nhật ma trận phân quyền', 'Cập nhật cấu hình thiết lập phân quyền vai trò chung cho toàn lớp');
    res.json({ success: true, rolePermissions: dbData.config.rolePermissions });
  });

  app.put('/api/config', (req: Request, res: Response) => {
    const { config, adminName } = req.body;
    if (!config) return res.status(400).json({ error: 'Dữ liệu cấu hình không hợp lệ.' });
    
    dbData.config = { ...dbData.config, ...config };
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Cập nhật cấu hình', 'Thay đổi các cấu hình thiết lập thi đua cấp lớp');
    res.json({ success: true, config: dbData.config });
  });

  app.post('/api/announcements', (req: Request, res: Response) => {
    const { title, content, target, priority, createdBy } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Tiêu đề và nội dung thông báo là bắt buộc.' });
    
    const ann: Announcement = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      title: title.trim(),
      content: content.trim(),
      target: target || 'all',
      priority: priority || 'normal',
      createdAt: new Date().toISOString(),
      createdBy: createdBy || 'Cô Thu Thủy (GVCN)',
    };
    dbData.announcements.unshift(ann);
    saveDatabase(dbData);
    addAuditLog('admin', createdBy || 'GVCN', 'admin', 'Tạo thông báo', `Đã đăng thông báo mới: ${ann.title}`);
    res.json({ success: true, announcement: ann });
  });

  app.delete('/api/announcements/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = dbData.announcements.findIndex(a => a.id === id);
    if (index !== -1) {
      dbData.announcements.splice(index, 1);
      saveDatabase(dbData);
    }
    res.json({ success: true });
  });

  app.get('/api/backup', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=SaoLuu_Lop9A1_${new Date().toISOString().slice(0, 10)}.json`);
    res.send(JSON.stringify(dbData, null, 2));
  });

  app.get('/api/backups', (_req: Request, res: Response) => {
    res.json({ backups: [] }); // Disable local backups when using MongoDB
  });

  app.post('/api/backups/create', (req: Request, res: Response) => {
    res.status(400).json({ error: 'Tính năng sao lưu file bị vô hiệu hóa khi dùng MongoDB đám mây.' });
  });

  app.post('/api/backups/restore-snapshot', (req: Request, res: Response) => {
    res.status(400).json({ error: 'Tính năng khôi phục file cục bộ bị vô hiệu hóa.' });
  });

  app.post('/api/backup/restore', (req: Request, res: Response) => {
    const { backupData, adminName } = req.body;
    if (!backupData || !backupData.config || !backupData.students) return res.status(400).json({ error: 'File sao lưu không đúng định dạng của ứng dụng.' });
    
    dbData = backupData;
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Khôi phục dữ liệu', 'Đã khôi phục thành công toàn bộ dữ liệu từ file sao lưu tải lên');
    res.json({ success: true, message: 'Khôi phục dữ liệu thành công.' });
  });

  app.post('/api/campaigns', (req: Request, res: Response) => {
    const { title, description, type, startDate, endDate, weekNumber, rewardPoints, bonusPoints, latePenaltyPoints, missPenaltyPoints, createdBy, createdRole, participants } = req.body;
    if (!title || !startDate || !endDate) return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tên cuôc thi/chiến dịch và thời gian bắt đầu, kết thúc.' });
    
    const studentParticipants: CampaignParticipant[] = (participants && participants.length > 0)
      ? participants
      : dbData.students.map(s => ({
          studentId: s.id,
          studentName: s.name,
          teamId: s.teamId,
          status: 'chua_nop' as SubmissionStatus,
        }));
        
    const newCamp: Campaign = {
      id: `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: (description || '').trim(),
      type: type || 'cuoc_thi',
      startDate,
      endDate,
      weekNumber: weekNumber ? Number(weekNumber) : (dbData.config.currentWeek || 4),
      rewardPoints: rewardPoints !== undefined ? Math.abs(Number(rewardPoints)) : 2,
      bonusPoints: bonusPoints !== undefined ? Math.abs(Number(bonusPoints)) : 3,
      latePenaltyPoints: latePenaltyPoints !== undefined ? Math.abs(Number(latePenaltyPoints)) : 1,
      missPenaltyPoints: missPenaltyPoints !== undefined ? Math.abs(Number(missPenaltyPoints)) : 2,
      createdBy: createdBy || 'Giáo viên / Cán sự',
      createdRole: createdRole || 'admin',
      createdAt: new Date().toISOString(),
      status: 'active',
      pointsApplied: false,
      participants: studentParticipants,
    };
    
    if (!dbData.campaigns) dbData.campaigns = [];
    dbData.campaigns.unshift(newCamp);
    saveDatabase(dbData);
    addAuditLog(newCamp.createdRole, newCamp.createdBy, newCamp.createdRole, 'Tạo cuộc thi/chiến dịch', `Tạo ${newCamp.type === 'cuoc_thi' ? 'cuộc thi' : newCamp.type === 'chien_dich' ? 'chiến dịch' : 'phong trào mới'}: ${newCamp.title} (Hạn chót: ${newCamp.endDate})`);
    res.json({ success: true, campaign: newCamp });
  });

  app.put('/api/campaigns/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (!dbData.campaigns) dbData.campaigns = [];
    const camp = dbData.campaigns.find(c => c.id === id);
    if (!camp) return res.status(404).json({ error: 'Không tìm thấy cuộc thi / chiến dịch.' });
    
    const { title, description, type, startDate, endDate, weekNumber, rewardPoints, bonusPoints, latePenaltyPoints, missPenaltyPoints, status, adminName } = req.body;
    
    if (title) camp.title = title.trim();
    if (description !== undefined) camp.description = description.trim();
    if (type) camp.type = type;
    if (startDate) camp.startDate = startDate;
    if (endDate) camp.endDate = endDate;
    if (weekNumber !== undefined) camp.weekNumber = Number(weekNumber);
    if (rewardPoints !== undefined) camp.rewardPoints = Math.abs(Number(rewardPoints));
    if (bonusPoints !== undefined) camp.bonusPoints = Math.abs(Number(bonusPoints));
    if (latePenaltyPoints !== undefined) camp.latePenaltyPoints = Math.abs(Number(latePenaltyPoints));
    if (missPenaltyPoints !== undefined) camp.missPenaltyPoints = Math.abs(Number(missPenaltyPoints));
    if (status) camp.status = status;
    
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'Cán bộ lớp', 'admin', 'Cập nhật chiến dịch', `Cập nhật thông tin chiến dịch: ${camp.title}`);
    res.json({ success: true, campaign: camp });
  });

  app.put('/api/campaigns/:id/participant', (req: Request, res: Response) => {
    const { id } = req.params;
    const { studentId, status, note, submittedAt, updatedBy } = req.body;
    if (!dbData.campaigns) dbData.campaigns = [];
    
    const camp = dbData.campaigns.find(c => c.id === id);
    if (!camp) return res.status(404).json({ error: 'Không tìm thấy cuộc thi / chiến dịch.' });
    
    let p = camp.participants.find(part => part.studentId === studentId);
    if (!p) {
      const student = dbData.students.find(s => s.id === studentId);
      if (!student) return res.status(404).json({ error: 'Không tìm thấy học sinh.' });
      p = {
        studentId: student.id,
        studentName: student.name,
        teamId: student.teamId,
        status: status || 'chua_nop',
      };
      camp.participants.push(p);
    }
    
    if (status) p.status = status;
    if (note !== undefined) p.note = note;
    if (submittedAt !== undefined) {
      p.submittedAt = submittedAt;
    } else if (status === 'da_nop' || status === 'xuat_sac' || status === 'nop_muon') {
      p.submittedAt = p.submittedAt || new Date().toISOString();
    } else if (status === 'chua_nop') {
      p.submittedAt = undefined;
    }
    
    saveDatabase(dbData);
    res.json({ success: true, participant: p });
  });

  app.put('/api/campaigns/:id/batch-participants', (req: Request, res: Response) => {
    const { id } = req.params;
    const { studentIds, status, note } = req.body;
    if (!dbData.campaigns) dbData.campaigns = [];
    
    const camp = dbData.campaigns.find(c => c.id === id);
    if (!camp) return res.status(404).json({ error: 'Không tìm thấy cuộc thi / chiến dịch.' });
    if (!Array.isArray(studentIds) || studentIds.length === 0) return res.status(400).json({ error: 'Vui lòng chọn ít nhất 1 học sinh.' });
    
    let updatedCount = 0;
    const nowIso = new Date().toISOString();
    
    studentIds.forEach(stId => {
      let p = camp.participants.find(part => part.studentId === stId);
      if (!p) {
        const student = dbData.students.find(s => s.id === stId);
        if (student) {
          p = { studentId: student.id, studentName: student.name, teamId: student.teamId, status: status || 'chua_nop' };
          camp.participants.push(p);
        }
      }
      if (p) {
        p.status = status;
        if (note !== undefined) p.note = note;
        if (status === 'da_nop' || status === 'xuat_sac' || status === 'nop_muon') {
          p.submittedAt = p.submittedAt || nowIso;
        } else if (status === 'chua_nop') {
          p.submittedAt = undefined;
        }
        updatedCount++;
      }
    });
    
    saveDatabase(dbData);
    res.json({ success: true, updatedCount });
  });

  app.post('/api/campaigns/:id/apply-points', (req: Request, res: Response) => {
    const { id } = req.params;
    const { includeUnsubmitted, adminName, adminRole, userId } = req.body;
    if (!dbData.campaigns) dbData.campaigns = [];
    
    const camp = dbData.campaigns.find(c => c.id === id);
    if (!camp) return res.status(404).json({ error: 'Không tìm thấy cuộc thi / chiến dịch.' });
    
    if (camp.pointsApplied) {
      const prevTxIds = new Set(camp.participants.map(p => p.transactionId).filter(Boolean));
      dbData.transactions = dbData.transactions.filter(t => !prevTxIds.has(t.id));
    }
    
    const typeLabelMap: Record<string, string> = { cuoc_thi: 'Cuộc thi', chien_dich: 'Chiến dịch', nop_bai: 'Nộp bài', phong_trao: 'Phong trào' };
    const typeLabel = typeLabelMap[camp.type] || 'Cuộc thi';
    
    let appliedCount = 0;
    const nowIso = new Date().toISOString();
    const targetWeek = camp.weekNumber || dbData.config.currentWeek || 4;
    
    camp.participants.forEach(p => {
      let signedPoints = 0;
      let statusDesc = '';
      let txType: 'cong' | 'tru' | 'bieu_duong' = 'cong';
      
      if (p.status === 'da_nop') {
        signedPoints = camp.rewardPoints;
        statusDesc = 'Đúng hạn / Đạt yêu cầu';
        txType = 'cong';
      } else if (p.status === 'xuat_sac') {
        signedPoints = camp.rewardPoints + camp.bonusPoints;
        statusDesc = 'Hoàn thành xuất sắc / Đạt giải cao';
        txType = 'bieu_duong';
      } else if (p.status === 'nop_muon') {
        signedPoints = -camp.latePenaltyPoints;
        statusDesc = 'Nộp muộn so với quy định';
        txType = 'tru';
      } else if (p.status === 'khong_tham_gia') {
        signedPoints = -camp.missPenaltyPoints;
        statusDesc = 'Không tham gia / Không nộp bài';
        txType = 'tru';
      } else if (p.status === 'chua_nop' && includeUnsubmitted) {
        signedPoints = -camp.missPenaltyPoints;
        statusDesc = 'Quá hạn chưa hoàn thành';
        txType = 'tru';
      }
      
      if (signedPoints !== 0) {
        const student = dbData.students.find(s => s.id === p.studentId);
        if (student) {
          const tx: PointTransaction = {
            id: `tx_camp_${camp.id}_${p.studentId}_${Date.now()}`,
            studentId: p.studentId,
            studentName: student.name,
            teamId: student.teamId,
            type: txType,
            title: `[${typeLabel}: ${camp.title}] - ${statusDesc}`,
            points: signedPoints,
            category: camp.type === 'nop_bai' ? 'Học tập' : camp.type === 'cuoc_thi' ? 'Văn thể mỹ' : 'Hoạt động chung',
            notes: p.note ? `${p.note} (Hạn chót: ${camp.endDate})` : `Ghi nhận tự động từ ${camp.title}`,
            createdByUserId: userId || 'acc_admin',
            createdByRole: adminRole || 'admin',
            createdByName: adminName || 'GVCN & Cán sự',
            createdAt: nowIso,
            occurredDate: camp.endDate,
            dayOfWeek: 'Thứ Hai',
            weekNumber: targetWeek,
            month: dbData.config.currentMonth || 10,
            status: 'approved',
            reviewedBy: adminName || 'GVCN',
            reviewedAt: nowIso
          };
          dbData.transactions.unshift(tx);
          p.transactionId = tx.id;
          p.pointsAwarded = signedPoints;
          appliedCount++;
        }
      } else {
        p.transactionId = undefined;
        p.pointsAwarded = 0;
      }
    });
    
    camp.pointsApplied = true;
    camp.pointsAppliedAt = nowIso;
    saveDatabase(dbData);
    addAuditLog(adminRole || 'admin', adminName || 'GVCN', adminRole || 'admin', 'Tính điểm chiến dịch', `Áp dụng cộng/trừ tự động điểm thi đua cho ${appliedCount} học sinh tham gia: ${camp.title} (Tuần ${targetWeek})`);
    res.json({ success: true, appliedCount, campaign: camp });
  });

  app.post('/api/campaigns/:id/rollback-points', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName } = req.body;
    if (!dbData.campaigns) dbData.campaigns = [];
    const camp = dbData.campaigns.find(c => c.id === id);
    if (!camp) return res.status(404).json({ error: 'Không tìm thấy cuộc thi / chiến dịch.' });
    
    const txIds = new Set(camp.participants.map(p => p.transactionId).filter(Boolean));
    dbData.transactions = dbData.transactions.filter(t => !txIds.has(t.id));
    
    camp.participants.forEach(p => {
      p.transactionId = undefined;
      p.pointsAwarded = undefined;
    });
    camp.pointsApplied = false;
    camp.pointsAppliedAt = undefined;
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Hủy điểm chiến dịch', `Hủy toàn bộ điểm cộng/trừ tự động của chiến dịch: ${camp.title}`);
    res.json({ success: true, campaign: camp });
  });

  app.delete('/api/campaigns/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName } = req.body;
    if (!dbData.campaigns) dbData.campaigns = [];
    const index = dbData.campaigns.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Không tìm thấy cuộc thi / chiến dịch.' });
    
    const camp = dbData.campaigns[index];
    if (camp.pointsApplied) {
      const txIds = new Set(camp.participants.map(p => p.transactionId).filter(Boolean));
      dbData.transactions = dbData.transactions.filter(t => !txIds.has(t.id));
    }
    dbData.campaigns.splice(index, 1);
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa cuộc thi/chiến dịch', `Đã xóa vĩnh viễn chiến dịch: ${camp.title}`);
    res.json({ success: true });
  });

  app.post('/api/evaluations', (req: Request, res: Response) => {
    const { studentId, periodType, periodValue, periodLabel, content, category, rating, authorId, authorName, authorRole } = req.body;
    if (!studentId || !content || !content.trim()) return res.status(400).json({ error: 'Vui lòng chọn học sinh và nhập nội dung nhận xét.' });
    
    const student = dbData.students.find(s => s.id === studentId);
    if (!student) return res.status(404).json({ error: 'Học sinh không tồn tại.' });
    
    const newEval: StudentEvaluation = {
      id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      studentName: student.name,
      teamId: student.teamId,
      periodType: periodType || 'tuan',
      periodValue: periodValue !== undefined ? periodValue : (dbData.config.currentWeek || 4),
      periodLabel: periodLabel || `Tuần ${dbData.config.currentWeek || 4}`,
      content: content.trim(),
      category: category || 'Chung',
      rating: rating || 'Tốt',
      authorId: authorId || 'acc_admin',
      authorName: authorName || 'Cô Thu Thủy (GVCN)',
      authorRole: authorRole || 'admin',
      createdAt: new Date().toISOString(),
    };
    
    if (!dbData.evaluations) dbData.evaluations = [];
    dbData.evaluations.unshift(newEval);
    saveDatabase(dbData);
    addAuditLog(authorId || 'acc_admin', authorName || 'Cô giáo', authorRole || 'admin', 'Nhận xét học sinh', `Đã thêm nhận xét cho HS ${student.name} (${newEval.periodLabel})`);
    res.json({ success: true, evaluation: newEval });
  });

  app.put('/api/evaluations/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (!dbData.evaluations) dbData.evaluations = [];
    const evalItem = dbData.evaluations.find(e => e.id === id);
    if (!evalItem) return res.status(404).json({ error: 'Không tìm thấy nhận xét.' });
    
    const { content, category, rating, periodType, periodValue, periodLabel } = req.body;
    if (content) evalItem.content = content.trim();
    if (category) evalItem.category = category;
    if (rating) evalItem.rating = rating;
    if (periodType) evalItem.periodType = periodType;
    if (periodValue !== undefined) evalItem.periodValue = periodValue;
    if (periodLabel) evalItem.periodLabel = periodLabel;
    
    evalItem.updatedAt = new Date().toISOString();
    saveDatabase(dbData);
    res.json({ success: true, evaluation: evalItem });
  });

  app.delete('/api/evaluations/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName } = req.body;
    if (!dbData.evaluations) dbData.evaluations = [];
    const idx = dbData.evaluations.findIndex(e => e.id === id);
    
    if (idx !== -1) {
      const deleted = dbData.evaluations.splice(idx, 1)[0];
      saveDatabase(dbData);
      addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa nhận xét', `Đã xóa nhận xét của HS ${deleted.studentName}`);
    }
    res.json({ success: true });
  });

  app.post('/api/reset-demo', (req: Request, res: Response) => {
    const { adminName } = req.body;
    dbData = JSON.parse(JSON.stringify(INITIAL_APP_DATA));
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Khôi phục dữ liệu gốc', 'Đã khởi tạo lại toàn bộ dữ liệu mẫu lớp 9A1 - THCS Vân Hà 2');
    res.json({ success: true, message: 'Đã khôi phục dữ liệu mẫu ban đầu thành công.' });
  });

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
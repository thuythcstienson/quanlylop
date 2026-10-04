import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { INITIAL_APP_DATA } from './src/data/initialData';
import { AppData, PointTransaction, Student, UserAccount, AuditLog, PointRule, Announcement, Campaign, CampaignParticipant, SubmissionStatus, StudentEvaluation, DEFAULT_ROLE_PERMISSIONS, UserPermissions } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// Ensure data and backup folders exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// In-memory + persistent JSON database
let dbData: AppData;

function loadDatabase(): AppData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(content) as AppData;
      // Preserve existing data while safely updating calendar config
      if (!loaded.config.startDate) {
        loaded.config.startDate = '2026-09-07';
      }
      if (!loaded.config.currentWeek || loaded.config.currentWeek === 5) {
        loaded.config.currentWeek = 4;
      }
      // Ensure rolePermissions exist
      if (!loaded.config.rolePermissions) {
        loaded.config.rolePermissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
      }
      // Ensure campaigns array exists
      if (!loaded.campaigns || !Array.isArray(loaded.campaigns)) {
        loaded.campaigns = [];
      }
      // Ensure evaluations array exists
      if (!loaded.evaluations || !Array.isArray(loaded.evaluations)) {
        loaded.evaluations = [];
      }

      // Automatically keep a startup safety copy in backups folder
      try {
        const autoFile = path.join(BACKUP_DIR, 'auto_startup_backup.json');
        fs.writeFileSync(autoFile, JSON.stringify(loaded, null, 2), 'utf-8');
      } catch (e) {
        // silent
      }

      return loaded;
    }
  } catch (err) {
    console.error('Error reading database.json, attempting fallback', err);
    const fallbackFile = path.join(DATA_DIR, 'database.backup.json');
    if (fs.existsSync(fallbackFile)) {
      try {
        const fallbackContent = fs.readFileSync(fallbackFile, 'utf-8');
        const fallbackLoaded = JSON.parse(fallbackContent) as AppData;
        if (!fallbackLoaded.campaigns) {
          fallbackLoaded.campaigns = JSON.parse(JSON.stringify(INITIAL_APP_DATA.campaigns || []));
        }
        return fallbackLoaded;
      } catch (e) {
        console.error('Fallback read failed', e);
      }
    }
  }
  // Initialize with initial data
  saveDatabase(INITIAL_APP_DATA);
  return JSON.parse(JSON.stringify(INITIAL_APP_DATA));
}

function saveDatabase(data: AppData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    // Mirror to backup file for maximum resilience
    const fallbackFile = path.join(DATA_DIR, 'database.backup.json');
    fs.writeFileSync(fallbackFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database.json', err);
  }
}

dbData = loadDatabase();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  app.use(express.json({ limit: '10mb' }));

  // Helper for Audit Log
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
    // Keep last 1000 logs
    if (dbData.auditLogs.length > 1000) {
      dbData.auditLogs = dbData.auditLogs.slice(0, 1000);
    }
  };

  // --- API ROUTES ---

  // 1. Get entire app data
  app.get('/api/data', (_req: Request, res: Response) => {
    // Return data without user password hashes for safety
    const safeData: AppData = {
      ...dbData,
      accounts: dbData.accounts.map(acc => ({
        ...acc,
        passwordHash: '***',
      })),
    };
    res.json(safeData);
  });

  // 2. Auth: Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
    }

    const cleanUser = username.trim().toLowerCase();
    const account = dbData.accounts.find(
      a => a.username.toLowerCase() === cleanUser && a.passwordHash === password
    );

    if (!account) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    if (account.isLocked) {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Giáo viên chủ nhiệm.' });
    }

    // Update last login
    account.lastLogin = new Date().toISOString();
    saveDatabase(dbData);

    addAuditLog(account.id, account.displayName, account.role, 'Đăng nhập', `Đăng nhập thành công vào hệ thống`);

    // Return session data
    const safeUser = { ...account, passwordHash: undefined };
    res.json({ user: safeUser, token: `token_${account.id}_${Date.now()}` });
  });

  // 3. Auth: Change password
  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    const { userId, oldPassword, newPassword, isAdminReset } = req.body;
    const account = dbData.accounts.find(a => a.id === userId);
    if (!account) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    }

    if (!isAdminReset) {
      if (account.passwordHash !== oldPassword) {
        return res.status(400).json({ error: 'Mật khẩu cũ không đúng.' });
      }
    }

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 4 ký tự.' });
    }

    account.passwordHash = newPassword;
    saveDatabase(dbData);
    addAuditLog(userId, account.displayName, account.role, 'Đổi mật khẩu', 'Đã thay đổi mật khẩu thành công');

    res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
  });

  // 3b. Auth: Update profile info (For Teacher or Cadres)
  app.put('/api/auth/profile', (req: Request, res: Response) => {
    const { userId, displayName, phone, email, notes, title } = req.body;
    const account = dbData.accounts.find(a => a.id === userId);
    if (!account) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng.' });
    }

    if (displayName && displayName.trim()) {
      account.displayName = displayName.trim();
      if (account.role === 'admin') {
        dbData.config.teacherName = displayName.trim();
      }
    }
    if (phone !== undefined) account.phone = phone.trim();
    if (email !== undefined) account.email = email.trim();
    if (notes !== undefined) account.notes = notes.trim();
    if (title !== undefined) account.title = title.trim();

    saveDatabase(dbData);
    addAuditLog(userId, account.displayName, account.role, 'Cập nhật thông tin', 'Đã cập nhật thông tin cá nhân');

    res.json({ success: true, user: { ...account, passwordHash: '***' } });
  });

  // 4. Create Point Transaction (Cộng / Trừ / Biểu dương)
  app.post('/api/transactions', (req: Request, res: Response) => {
    const {
      studentId,
      type,
      title,
      points,
      category,
      notes,
      userId,
      userRole,
      userName,
      teamId,
      weekNumber,
      month,
      occurredDate,
      dayOfWeek
    } = req.body;

    if (!studentId || !title || points === undefined || !type) {
      return res.status(400).json({ error: 'Thiếu thông tin giao dịch điểm.' });
    }

    const student = dbData.students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy học sinh.' });
    }

    // SERVER-SIDE RBAC VALIDATION:
    // If role is to_truong, verify student belongs to the same team!
    if (userRole === 'to_truong' && teamId && student.teamId !== teamId) {
      return res.status(403).json({ error: 'Tổ trưởng chỉ được nhập dữ liệu cho học sinh thuộc tổ của mình.' });
    }

    // Status: if approval required and user is not admin, set to 'pending'
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
      dayOfWeek: dayOfWeek || 'Thứ Bảy',
      weekNumber: weekNumber || dbData.config.currentWeek,
      month: month || dbData.config.currentMonth,
      status,
      reviewedBy: status === 'approved' && userRole === 'admin' ? userName : undefined,
      reviewedAt: status === 'approved' && userRole === 'admin' ? new Date().toISOString() : undefined
    };

    dbData.transactions.unshift(newTx);
    saveDatabase(dbData);

    const actionName = type === 'tru' ? 'Trừ điểm' : type === 'cong' ? 'Cộng điểm' : 'Biểu dương';
    addAuditLog(userId, userName, userRole, actionName, `${actionName} (${points > 0 ? '+' : ''}${points}đ) cho học sinh ${student.name} - ${title}`);

    res.json({ success: true, transaction: newTx });
  });

  // 5. Approve / Reject Transactions (Admin only)
  app.post('/api/transactions/review', (req: Request, res: Response) => {
    const { ids, action, adminName } = req.body; // action: 'approve' | 'reject'
    if (!ids || !Array.isArray(ids) || !action) {
      return res.status(400).json({ error: 'Dữ liệu duyệt không hợp lệ.' });
    }

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

  // 6. Delete Transaction (Admin only)
  app.delete('/api/transactions/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName } = req.body;
    const index = dbData.transactions.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Giao dịch không tồn tại.' });
    }

    const deleted = dbData.transactions.splice(index, 1)[0];
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa điểm', `Đã xóa giao dịch: ${deleted.title} của HS ${deleted.studentName}`);
    res.json({ success: true });
  });

  // 6b. Clear / Delete Competition Transactions by Period (Tuần hoặc Tháng)
  app.post('/api/transactions/clear-period', (req: Request, res: Response) => {
    const { type, value, adminName } = req.body;
    if (!type || value === undefined) {
      return res.status(400).json({ error: 'Thiếu thông tin kỳ cần xóa thi đua (tuần hoặc tháng).' });
    }

    const val = Number(value);
    const initialCount = dbData.transactions.length;

    if (type === 'week') {
      dbData.transactions = dbData.transactions.filter(t => t.weekNumber !== val);
      const deletedCount = initialCount - dbData.transactions.length;
      saveDatabase(dbData);
      addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa thi đua tuần', `Đã xóa toàn bộ ${deletedCount} lượt điểm thi đua của Tuần ${val}`);
      return res.json({ success: true, deletedCount, message: `Đã xóa ${deletedCount} lượt điểm của Tuần ${val}.` });
    } else if (type === 'month') {
      dbData.transactions = dbData.transactions.filter(t => t.month !== val);
      const deletedCount = initialCount - dbData.transactions.length;
      saveDatabase(dbData);
      addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa thi đua tháng', `Đã xóa toàn bộ ${deletedCount} lượt điểm thi đua của Tháng ${val}`);
      return res.json({ success: true, deletedCount, message: `Đã xóa ${deletedCount} lượt điểm của Tháng ${val}.` });
    }

    res.status(400).json({ error: 'Loại kỳ không hợp lệ (chỉ hỗ trợ week hoặc month).' });
  });

  // 7. Manage Students (CRUD)
  app.post('/api/students', (req: Request, res: Response) => {
    const { name, gender, birthDate, birthPlace, permanentAddress, teamId, roleTitle, parentName, parentPhone, notes, adminName } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên học sinh là bắt buộc.' });
    }

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
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Thêm học sinh', `Đã thêm học sinh mới: ${newStudent.name} (${newStudent.teamId > 0 ? 'Tổ ' + newStudent.teamId : 'Chưa phân tổ'})`);
    res.json({ success: true, student: newStudent });
  });

  app.put('/api/students/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const student = dbData.students.find(s => s.id === id);
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy học sinh.' });
    }

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
    if (index === -1) {
      return res.status(404).json({ error: 'Không tìm thấy học sinh.' });
    }

    const deleted = dbData.students.splice(index, 1)[0];
    dbData.config.totalStudents = dbData.students.length;
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa học sinh', `Đã xóa học sinh: ${deleted.name}`);
    res.json({ success: true });
  });

  // Clear all students (Xóa trắng toàn bộ học sinh để nạp lớp mới)
  app.delete('/api/students', (req: Request, res: Response) => {
    const { adminName } = req.body;
    const count = dbData.students.length;
    dbData.students = [];
    dbData.config.totalStudents = 0;
    dbData.transactions = [];
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa toàn bộ học sinh', `Đã xóa toàn bộ ${count} học sinh và làm mới danh sách lớp`);
    res.json({ success: true, count: 0 });
  });

  // Auto divide students into 4 teams
  app.post('/api/students/auto-divide-teams', (req: Request, res: Response) => {
    const { mode, adminName } = req.body; // 'sequential' | 'round_robin' | 'balance_gender'
    const total = dbData.students.length;
    if (total === 0) {
      return res.status(400).json({ error: 'Lớp chưa có học sinh nào để chia tổ.' });
    }

    if (mode === 'sequential') {
      const perTeam = Math.ceil(total / 4);
      dbData.students.forEach((s, index) => {
        s.teamId = Math.min(4, Math.floor(index / perTeam) + 1);
      });
    } else if (mode === 'balance_gender') {
      const males = dbData.students.filter(s => s.gender === 'Nam');
      const females = dbData.students.filter(s => s.gender !== 'Nam');
      males.forEach((s, idx) => {
        s.teamId = (idx % 4) + 1;
      });
      females.forEach((s, idx) => {
        s.teamId = (idx % 4) + 1;
      });
    } else {
      // Round robin (1, 2, 3, 4, 1, 2, 3, 4...)
      dbData.students.forEach((s, index) => {
        s.teamId = (index % 4) + 1;
      });
    }

    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Chia tổ tự động', `Đã tự động chia ${total} học sinh vào 4 tổ (chế độ: ${mode || 'vòng tròn'})`);
    res.json({ success: true, students: dbData.students });
  });

  // Batch assign students to a team
  app.post('/api/students/batch-assign-team', (req: Request, res: Response) => {
    const { studentIds, targetTeamId, adminName } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || !targetTeamId) {
      return res.status(400).json({ error: 'Dữ liệu phân tổ không hợp lệ.' });
    }

    let updatedCount = 0;
    dbData.students.forEach(s => {
      if (studentIds.includes(s.id)) {
        s.teamId = Number(targetTeamId);
        updatedCount++;
      }
    });

    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Gán tổ hàng loạt', `Đã chuyển ${updatedCount} học sinh vào Tổ ${targetTeamId}`);
    res.json({ success: true, updatedCount, students: dbData.students });
  });

  // Batch delete selected students
  app.post('/api/students/batch-delete', (req: Request, res: Response) => {
    const { studentIds, adminName } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'Danh sách học sinh cần xóa không hợp lệ.' });
    }

    const beforeCount = dbData.students.length;
    dbData.students = dbData.students.filter(s => !studentIds.includes(s.id));
    dbData.transactions = dbData.transactions.filter(t => !studentIds.includes(t.studentId));
    dbData.config.totalStudents = dbData.students.length;

    const deletedCount = beforeCount - dbData.students.length;
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa học sinh đã chọn', `Đã xóa ${deletedCount} học sinh khỏi danh sách lớp`);
    res.json({ success: true, deletedCount });
  });

  // Bulk import students from Excel
  app.post('/api/students/bulk-import', (req: Request, res: Response) => {
    const { students: newStudentsList, adminName } = req.body;
    if (!newStudentsList || !Array.isArray(newStudentsList)) {
      return res.status(400).json({ error: 'Dữ liệu danh sách không hợp lệ.' });
    }

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

  // 8. Manage Rules
  app.post('/api/rules', (req: Request, res: Response) => {
    const { type, title, points, category, adminName } = req.body;
    if (!type || !title || points === undefined) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin quy chế.' });
    }

    const newRule: PointRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type,
      title: title.trim(),
      points: Math.abs(Number(points)),
      category: category || 'Khác',
    };

    dbData.rules.push(newRule);
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Thêm quy chế điểm', `Thêm quy chế: ${newRule.title} (${newRule.points} điểm)`);
    res.json({ success: true, rule: newRule });
  });

  app.delete('/api/rules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName } = req.body;
    const index = dbData.rules.findIndex(r => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Không tìm thấy quy chế.' });
    }

    const deleted = dbData.rules.splice(index, 1)[0];
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa quy chế', `Xóa quy chế: ${deleted.title}`);
    res.json({ success: true });
  });

  // 9. Manage Accounts
  app.post('/api/accounts', (req: Request, res: Response) => {
    const { username, password, displayName, role, teamId, studentId, adminName } = req.body;
    if (!username || !password || !displayName || !role) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin tài khoản.' });
    }

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

  // Edit / Update existing account
  app.put('/api/accounts/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { 
      username, 
      displayName, 
      role, 
      teamId, 
      studentId, 
      phone, 
      email, 
      notes, 
      title, 
      password, 
      isLocked, 
      adminName 
    } = req.body;

    const acc = dbData.accounts.find(a => a.id === id);
    if (!acc) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản để chỉnh sửa.' });
    }

    // Check duplicate username if username is changing
    if (username && username.trim()) {
      const cleanUser = username.trim().toLowerCase();
      const existing = dbData.accounts.find(a => a.id !== id && a.username.toLowerCase() === cleanUser);
      if (existing) {
        return res.status(400).json({ error: `Tên đăng nhập "@${cleanUser}" đã có tài khoản khác sử dụng.` });
      }
      acc.username = cleanUser;
    }

    if (displayName && displayName.trim()) {
      acc.displayName = displayName.trim();
      if (acc.role === 'admin') {
        dbData.config.teacherName = displayName.trim();
      }
    }

    // Guard primary admin role
    if (role) {
      if (acc.username === 'admin' && role !== 'admin') {
        return res.status(400).json({ error: 'Không thể hạ quyền của tài khoản quản trị viên chính.' });
      }
      acc.role = role;
    }

    if (teamId !== undefined) {
      acc.teamId = teamId ? Number(teamId) : undefined;
    }
    if (studentId !== undefined) {
      acc.studentId = studentId || undefined;
    }
    if (phone !== undefined) acc.phone = phone.trim();
    if (email !== undefined) acc.email = email.trim();
    if (notes !== undefined) acc.notes = notes.trim();
    if (title !== undefined) acc.title = title.trim();
    if (isLocked !== undefined && acc.username !== 'admin') {
      acc.isLocked = Boolean(isLocked);
    }

    if (password && password.trim()) {
      acc.passwordHash = password.trim();
    }

    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Sửa tài khoản', `Cập nhật tài khoản: @${acc.username} (${acc.displayName} - ${acc.role})`);
    res.json({ success: true, account: { ...acc, passwordHash: '***' } });
  });

  // Delete existing account
  app.delete('/api/accounts/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName } = req.body || {};
    const index = dbData.accounts.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản cần xóa.' });
    }

    const targetAcc = dbData.accounts[index];
    // Safeguard: Do not delete primary admin account
    if (targetAcc.username === 'admin') {
      return res.status(400).json({ error: 'Không thể xóa tài khoản quản trị viên gốc (admin).' });
    }
    if (targetAcc.role === 'admin' && dbData.accounts.filter(a => a.role === 'admin').length <= 1) {
      return res.status(400).json({ error: 'Không thể xóa tài khoản quản trị viên duy nhất của hệ thống.' });
    }

    const deleted = dbData.accounts.splice(index, 1)[0];
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa tài khoản', `Đã xóa vĩnh viễn tài khoản: @${deleted.username} (${deleted.displayName})`);
    res.json({ success: true, deletedId: id });
  });

  app.put('/api/accounts/:id/toggle-lock', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName } = req.body;
    const acc = dbData.accounts.find(a => a.id === id);
    if (!acc) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    }

    acc.isLocked = !acc.isLocked;
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', acc.isLocked ? 'Khóa tài khoản' : 'Mở khóa tài khoản', `${acc.isLocked ? 'Đã khóa' : 'Đã mở khóa'} tài khoản: ${acc.username}`);
    res.json({ success: true, isLocked: acc.isLocked });
  });

  // Update Individual Account Permissions
  app.put('/api/accounts/:id/permissions', (req: Request, res: Response) => {
    const { id } = req.params;
    const { permissions, adminName } = req.body;
    const acc = dbData.accounts.find(a => a.id === id);
    if (!acc) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    }

    // Never allow assigning deletion permissions to non-admin roles
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

  // Update Global Role Permissions Matrix
  app.put('/api/config/role-permissions', (req: Request, res: Response) => {
    const { rolePermissions, adminName } = req.body;
    if (!rolePermissions || typeof rolePermissions !== 'object') {
      return res.status(400).json({ error: 'Dữ liệu ma trận phân quyền không hợp lệ.' });
    }

    // Enforce deletion protection: only admin can delete
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
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Cập nhật ma trận phân quyền', 'Cập nhật bảng thiết lập phân quyền vai trò cho lớp học');
    res.json({ success: true, rolePermissions: dbData.config.rolePermissions });
  });

  // 10. Update Config (Cài đặt)
  app.put('/api/config', (req: Request, res: Response) => {
    const { config, adminName } = req.body;
    if (!config) {
      return res.status(400).json({ error: 'Dữ liệu cấu hình không hợp lệ.' });
    }

    dbData.config = {
      ...dbData.config,
      ...config,
    };
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Cập nhật cấu hình', 'Thay đổi cấu hình thi đua của lớp');
    res.json({ success: true, config: dbData.config });
  });

  // 11. Announcements
  app.post('/api/announcements', (req: Request, res: Response) => {
    const { title, content, target, priority, createdBy } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Tiêu đề và nội dung thông báo là bắt buộc.' });
    }

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
    addAuditLog('admin', createdBy || 'GVCN', 'admin', 'Tạo thông báo', `Đăng thông báo mới: ${ann.title}`);
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

  // 12. Backup & Restore
  app.get('/api/backup', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=SaoLuu_Lop9A1_${new Date().toISOString().slice(0, 10)}.json`);
    res.send(JSON.stringify(dbData, null, 2));
  });

  // Get list of server snapshots
  app.get('/api/backups', (_req: Request, res: Response) => {
    try {
      if (!fs.existsSync(BACKUP_DIR)) {
        return res.json({ backups: [] });
      }
      const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
      const list = files.map(filename => {
        try {
          const filePath = path.join(BACKUP_DIR, filename);
          const stat = fs.statSync(filePath);
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw);
          return {
            filename,
            size: stat.size,
            createdAt: stat.mtime.toISOString(),
            studentCount: parsed?.students?.length || 0,
            transactionCount: parsed?.transactions?.length || 0,
            className: parsed?.config?.className || '9A1',
            teacherName: parsed?.config?.teacherName || 'GVCN',
            note: filename.startsWith('auto_') ? 'Sao lưu tự động' : 'Bản sao lưu người dùng',
          };
        } catch {
          return null;
        }
      }).filter(Boolean);

      // Sort by latest mtime descending
      list.sort((a, b) => new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime());
      res.json({ backups: list });
    } catch (err) {
      console.error('Error listing backups', err);
      res.status(500).json({ error: 'Không thể đọc danh sách bản sao lưu.' });
    }
  });

  // Create manual snapshot
  app.post('/api/backups/create', (req: Request, res: Response) => {
    const { note, adminName } = req.body;
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const timeStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const safeNote = (note || 'manual').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');
      const filename = `saoluu_${timeStr}_${safeNote}.json`;
      const targetPath = path.join(BACKUP_DIR, filename);

      fs.writeFileSync(targetPath, JSON.stringify(dbData, null, 2), 'utf-8');
      addAuditLog('admin', adminName || 'GVCN', 'admin', 'Tạo bản sao lưu', `Đã tạo bản sao lưu: ${filename}`);

      res.json({
        success: true,
        message: 'Tạo bản sao lưu thành công.',
        backup: {
          filename,
          createdAt: now.toISOString(),
          studentCount: dbData.students.length,
          transactionCount: dbData.transactions.length,
        }
      });
    } catch (err) {
      console.error('Error creating backup snapshot', err);
      res.status(500).json({ error: 'Không thể tạo bản sao lưu.' });
    }
  });

  // Restore from server snapshot file
  app.post('/api/backups/restore-snapshot', (req: Request, res: Response) => {
    const { filename, adminName } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'Thiếu tên file sao lưu.' });
    }
    const safeFilename = path.basename(filename);
    const targetPath = path.join(BACKUP_DIR, safeFilename);

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'Không tìm thấy file sao lưu trên hệ thống.' });
    }

    try {
      // Save current as safety before overwriting
      const safetyFile = path.join(BACKUP_DIR, `safety_before_restore_${Date.now()}.json`);
      fs.writeFileSync(safetyFile, JSON.stringify(dbData, null, 2), 'utf-8');

      const raw = fs.readFileSync(targetPath, 'utf-8');
      const parsed = JSON.parse(raw) as AppData;
      if (!parsed.config || !parsed.students) {
        return res.status(400).json({ error: 'Dữ liệu file sao lưu không hợp lệ.' });
      }

      dbData = parsed;
      saveDatabase(dbData);
      addAuditLog('admin', adminName || 'GVCN', 'admin', 'Khôi phục dữ liệu', `Đã khôi phục dữ liệu từ bản sao lưu: ${safeFilename}`);

      const safeData: AppData = {
        ...dbData,
        accounts: dbData.accounts.map(acc => ({ ...acc, passwordHash: '***' })),
      };
      res.json({ success: true, message: 'Khôi phục dữ liệu thành công.', data: safeData });
    } catch (err) {
      console.error('Error restoring snapshot', err);
      res.status(500).json({ error: 'Lỗi trong quá trình khôi phục bản sao lưu.' });
    }
  });

  app.post('/api/backup/restore', (req: Request, res: Response) => {
    const { backupData, adminName } = req.body;
    if (!backupData || !backupData.config || !backupData.students) {
      return res.status(400).json({ error: 'File sao lưu không đúng định dạng của hệ thống.' });
    }

    // Save safety before restore
    try {
      const safetyFile = path.join(BACKUP_DIR, `safety_before_upload_${Date.now()}.json`);
      fs.writeFileSync(safetyFile, JSON.stringify(dbData, null, 2), 'utf-8');
    } catch (e) {
      // ignore
    }

    dbData = backupData;
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Khôi phục dữ liệu', 'Đã khôi phục toàn bộ dữ liệu lớp học từ file sao lưu tải lên');
    res.json({ success: true, message: 'Khôi phục dữ liệu thành công.' });
  });

  // 13. Competitions & Campaigns (Cuộc thi, Chiến dịch phong trào & Nộp bài tập)
  app.post('/api/campaigns', (req: Request, res: Response) => {
    const { 
      title, 
      description, 
      type, 
      startDate, 
      endDate, 
      weekNumber, 
      rewardPoints, 
      bonusPoints, 
      latePenaltyPoints, 
      missPenaltyPoints, 
      createdBy, 
      createdRole, 
      participants 
    } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ error: 'Vui lòng điền tên cuộc thi/chiến dịch và thời gian bắt đầu, kết thúc.' });
    }

    // Auto-populate participants for all students if not explicitly provided
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
      createdBy: createdBy || 'Giáo viên / Cán sự lớp',
      createdRole: createdRole || 'admin',
      createdAt: new Date().toISOString(),
      status: 'active',
      pointsApplied: false,
      participants: studentParticipants,
    };

    if (!dbData.campaigns) dbData.campaigns = [];
    dbData.campaigns.unshift(newCamp);
    saveDatabase(dbData);
    addAuditLog(
      newCamp.createdRole, 
      newCamp.createdBy, 
      newCamp.createdRole, 
      'Tạo cuộc thi/chiến dịch', 
      `Tạo ${newCamp.type === 'cuoc_thi' ? 'cuộc thi' : newCamp.type === 'chien_dich' ? 'chiến dịch' : 'đợt nộp bài'}: ${newCamp.title} (Hạn chót: ${newCamp.endDate})`
    );

    res.json({ success: true, campaign: newCamp });
  });

  app.put('/api/campaigns/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (!dbData.campaigns) dbData.campaigns = [];
    const camp = dbData.campaigns.find(c => c.id === id);
    if (!camp) {
      return res.status(404).json({ error: 'Không tìm thấy cuộc thi / chiến dịch.' });
    }

    const { 
      title, 
      description, 
      type, 
      startDate, 
      endDate, 
      weekNumber, 
      rewardPoints, 
      bonusPoints, 
      latePenaltyPoints, 
      missPenaltyPoints, 
      status,
      adminName
    } = req.body;

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
    addAuditLog('admin', adminName || 'Cán sự lớp', 'admin', 'Cập nhật chiến dịch', `Cập nhật thông tin chiến dịch: ${camp.title}`);
    res.json({ success: true, campaign: camp });
  });

  // Update single student submission status in campaign
  app.put('/api/campaigns/:id/participant', (req: Request, res: Response) => {
    const { id } = req.params;
    const { studentId, status, note, submittedAt, updatedBy } = req.body;

    if (!dbData.campaigns) dbData.campaigns = [];
    const camp = dbData.campaigns.find(c => c.id === id);
    if (!camp) {
      return res.status(404).json({ error: 'Không tìm thấy cuộc thi / chiến dịch.' });
    }

    let p = camp.participants.find(part => part.studentId === studentId);
    if (!p) {
      const student = dbData.students.find(s => s.id === studentId);
      if (!student) {
        return res.status(404).json({ error: 'Không tìm thấy học sinh.' });
      }
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

  // Batch update student statuses in campaign
  app.put('/api/campaigns/:id/batch-participants', (req: Request, res: Response) => {
    const { id } = req.params;
    const { studentIds, status, note } = req.body;

    if (!dbData.campaigns) dbData.campaigns = [];
    const camp = dbData.campaigns.find(c => c.id === id);
    if (!camp) {
      return res.status(404).json({ error: 'Không tìm thấy cuộc thi / chiến dịch.' });
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'Vui lòng chọn ít nhất một học sinh.' });
    }

    let updatedCount = 0;
    const nowIso = new Date().toISOString();

    studentIds.forEach(stId => {
      let p = camp.participants.find(part => part.studentId === stId);
      if (!p) {
        const student = dbData.students.find(s => s.id === stId);
        if (student) {
          p = {
            studentId: student.id,
            studentName: student.name,
            teamId: student.teamId,
            status: status || 'chua_nop',
          };
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

  // Apply points to gradebook / transactions
  app.post('/api/campaigns/:id/apply-points', (req: Request, res: Response) => {
    const { id } = req.params;
    const { includeUnsubmitted, adminName, adminRole, userId } = req.body;

    if (!dbData.campaigns) dbData.campaigns = [];
    const camp = dbData.campaigns.find(c => c.id === id);
    if (!camp) {
      return res.status(404).json({ error: 'Không tìm thấy cuộc thi / chiến dịch.' });
    }

    // Rollback previous transactions for this campaign if previously applied to avoid duplication
    if (camp.pointsApplied) {
      const prevTxIds = new Set(camp.participants.map(p => p.transactionId).filter(Boolean));
      dbData.transactions = dbData.transactions.filter(t => !prevTxIds.has(t.id));
    }

    const typeLabelMap: Record<string, string> = {
      cuoc_thi: 'Cuộc thi',
      chien_dich: 'Chiến dịch',
      nop_bai: 'Nộp bài tập',
      phong_trao: 'Phong trào'
    };
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
        statusDesc = 'Đã nộp đúng hạn';
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
        statusDesc = 'Không tham gia / Không nộp';
        txType = 'tru';
      } else if (p.status === 'chua_nop' && includeUnsubmitted) {
        signedPoints = -camp.missPenaltyPoints;
        statusDesc = 'Quá hạn chưa nộp';
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
            createdByName: adminName || 'GVCN & Cán sự lớp',
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
    addAuditLog(
      adminRole || 'admin', 
      adminName || 'GVCN', 
      adminRole || 'admin', 
      'Áp dụng điểm chiến dịch', 
      `Đã áp dụng cộng/trừ điểm thi đua cho ${appliedCount} học sinh tham gia: ${camp.title} (Tuần ${targetWeek})`
    );

    res.json({ success: true, appliedCount, campaign: camp });
  });

  // Rollback applied points from gradebook
  app.post('/api/campaigns/:id/rollback-points', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName } = req.body;

    if (!dbData.campaigns) dbData.campaigns = [];
    const camp = dbData.campaigns.find(c => c.id === id);
    if (!camp) {
      return res.status(404).json({ error: 'Không tìm thấy cuộc thi / chiến dịch.' });
    }

    const txIds = new Set(camp.participants.map(p => p.transactionId).filter(Boolean));
    dbData.transactions = dbData.transactions.filter(t => !txIds.has(t.id));

    camp.participants.forEach(p => {
      p.transactionId = undefined;
      p.pointsAwarded = undefined;
    });

    camp.pointsApplied = false;
    camp.pointsAppliedAt = undefined;

    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Hủy áp dụng điểm chiến dịch', `Đã hủy cộng/trừ điểm thi đua của chiến dịch: ${camp.title}`);
    res.json({ success: true, campaign: camp });
  });

  // Delete campaign
  app.delete('/api/campaigns/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminName } = req.body;

    if (!dbData.campaigns) dbData.campaigns = [];
    const index = dbData.campaigns.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Không tìm thấy cuộc thi / chiến dịch.' });
    }

    const camp = dbData.campaigns[index];
    // Also remove any generated transactions if points were applied
    if (camp.pointsApplied) {
      const txIds = new Set(camp.participants.map(p => p.transactionId).filter(Boolean));
      dbData.transactions = dbData.transactions.filter(t => !txIds.has(t.id));
    }

    dbData.campaigns.splice(index, 1);
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Xóa cuộc thi/chiến dịch', `Đã xóa chiến dịch: ${camp.title}`);
    res.json({ success: true });
  });

  // 14. Student Evaluations & Comments (Nhận xét học sinh theo Tuần / Tháng / Học kỳ)
  app.post('/api/evaluations', (req: Request, res: Response) => {
    const { studentId, periodType, periodValue, periodLabel, content, category, rating, authorId, authorName, authorRole } = req.body;
    if (!studentId || !content || !content.trim()) {
      return res.status(400).json({ error: 'Vui lòng chọn học sinh và nhập nội dung nhận xét.' });
    }
    const student = dbData.students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: 'Học sinh không tồn tại.' });
    }

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
    addAuditLog(authorId || 'acc_admin', authorName || 'Cán sự', authorRole || 'admin', 'Nhận xét học sinh', `Đã thêm nhận xét cho HS ${student.name} (${newEval.periodLabel})`);
    res.json({ success: true, evaluation: newEval });
  });

  app.put('/api/evaluations/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (!dbData.evaluations) dbData.evaluations = [];
    const evalItem = dbData.evaluations.find(e => e.id === id);
    if (!evalItem) {
      return res.status(404).json({ error: 'Không tìm thấy nhận xét.' });
    }
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

  // 15. Reset to Initial Demo Data
  app.post('/api/reset-demo', (req: Request, res: Response) => {
    const { adminName } = req.body;
    dbData = JSON.parse(JSON.stringify(INITIAL_APP_DATA));
    saveDatabase(dbData);
    addAuditLog('admin', adminName || 'GVCN', 'admin', 'Đặt lại dữ liệu', 'Đã đặt lại dữ liệu mẫu Lớp 9A1 – THCS Vân Hà 2');
    res.json({ success: true, message: 'Đã thiết lập lại dữ liệu mẫu thành công.' });
  });

  // --- VITE MIDDLEWARE / STATIC ASSETS ---
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

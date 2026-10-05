import * as XLSX from 'xlsx';
import { AppData, Student, PointTransaction } from '../types';

// Helper to format date in Vietnamese format
export function formatDateVN(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// 1. Multi-sheet Excel Export
export function exportMultiSheetExcel(appData: AppData, weekNumber?: number) {
  const { config, students, transactions } = appData;
  const currentWeek = weekNumber || config.currentWeek;

  const wb = XLSX.utils.book_new();

  // Helper to calculate student score
  const getStudentScore = (studentId: string) => {
    let cong = 0;
    let tru = 0;
    transactions.forEach(t => {
      if (t.studentId === studentId && t.status === 'approved') {
        if (!currentWeek || t.weekNumber === currentWeek) {
          if (t.points > 0) cong += t.points;
          else tru += Math.abs(t.points);
        }
      }
    });
    const total = config.basePoints + cong - tru;
    let rankTitle = 'Khá';
    if (total >= 105) rankTitle = 'Xuất sắc';
    else if (total >= 95) rankTitle = 'Tốt';
    else if (total >= 85) rankTitle = 'Khá';
    else rankTitle = 'Cần cố gắng';

    return { cong, tru, total, rankTitle };
  };

  // Sheet 1: Tổng Hợp Lớp
  const teamScores: Record<number, { total: number; count: number }> = { 1: { total: 0, count: 0 }, 2: { total: 0, count: 0 }, 3: { total: 0, count: 0 }, 4: { total: 0, count: 0 } };
  students.forEach(s => {
    const { total } = getStudentScore(s.id);
    if (!teamScores[s.teamId]) teamScores[s.teamId] = { total: 0, count: 0 };
    teamScores[s.teamId].total += total;
    teamScores[s.teamId].count += 1;
  });

  const tongHopData = [
    ['TRƯỜNG THCS VÂN HÀ 2', '', '', 'NĂM HỌC: ' + config.schoolYear],
    ['LỚP: ' + config.className, '', '', 'GIÁO VIÊN CHỦ NHIỆM: ' + config.teacherName],
    ['BẢNG TỔNG HỢP THI ĐUA NỀ NẾP TUẦN ' + currentWeek],
    [],
    ['Sĩ số:', config.totalStudents, 'Điểm gốc đầu kỳ:', config.basePoints],
    ['Tổng số giao dịch đã ghi nhận:', transactions.length],
    [],
    ['TỔ', 'SĨ SỐ', 'TỔNG ĐIỂM', 'ĐIỂM TRUNG BÌNH', 'XẾP HẠNG'],
    ...[1, 2, 3, 4].map((tId) => {
      const stats = teamScores[tId] || { total: 0, count: 0 };
      const avg = stats.count > 0 ? (stats.total / stats.count).toFixed(2) : '0';
      return [`Tổ ${tId}`, stats.count, stats.total, avg, ''];
    }),
  ];
  const wsTongHop = XLSX.utils.aoa_to_sheet(tongHopData);
  XLSX.utils.book_append_sheet(wb, wsTongHop, 'Tổng hợp');

  // Sheet 2: Danh sách học sinh & Điểm thi đua
  const hsRows = students.map((s, idx) => {
    const score = getStudentScore(s.id);
    return {
      'STT': s.stt || idx + 1,
      'Họ và tên': s.name,
      'Tổ': `Tổ ${s.teamId}`,
      'Giới tính': s.gender,
      'Chức vụ': s.roleTitle,
      'Ngày sinh': s.birthDate || '',
      'Nơi sinh': s.birthPlace || '',
      'Nơi thường trú': s.permanentAddress || '',
      'Điểm cộng': score.cong,
      'Điểm trừ': score.tru,
      'Điểm hiện tại': score.total,
      'Xếp loại': score.rankTitle,
      'SĐT Phụ huynh': s.parentPhone || '',
      'Ghi chú': s.notes || '',
    };
  });
  const wsHocSinh = XLSX.utils.json_to_sheet(hsRows);
  XLSX.utils.book_append_sheet(wb, wsHocSinh, 'Danh sách học sinh');

  // Sheet 3: Danh sách các Tổ
  const toRows: any[] = [];
  [1, 2, 3, 4].forEach(tId => {
    const toMembers = students.filter(s => s.teamId === tId);
    toMembers.forEach(s => {
      const score = getStudentScore(s.id);
      toRows.push({
        'Tổ': `Tổ ${tId}`,
        'STT': s.stt,
        'Họ và tên': s.name,
        'Chức vụ': s.roleTitle,
        'Giới tính': s.gender,
        'Ngày sinh': s.birthDate || '',
        'Nơi sinh': s.birthPlace || '',
        'Nơi thường trú': s.permanentAddress || '',
        'Điểm tuần': score.total,
        'Xếp loại': score.rankTitle,
        'Phụ huynh': s.parentName || '',
        'SĐT liên hệ': s.parentPhone || '',
      });
    });
  });
  const wsTo = XLSX.utils.json_to_sheet(toRows);
  XLSX.utils.book_append_sheet(wb, wsTo, 'Các tổ');

  // Sheet 4: Điểm cộng
  const congRows = transactions
    .filter(t => t.type === 'cong')
    .map((t, idx) => ({
      'STT': idx + 1,
      'Tuần': t.weekNumber,
      'Học sinh': t.studentName,
      'Tổ': `Tổ ${t.teamId}`,
      'Nội dung': t.title,
      'Điểm': `+${t.points}`,
      'Danh mục': t.category,
      'Người nhập': t.createdByName,
      'Ghi chú': t.notes || '',
      'Thời gian': formatDateVN(t.createdAt),
      'Trạng thái': t.status === 'approved' ? 'Đã duyệt' : t.status === 'pending' ? 'Chờ duyệt' : 'Từ chối',
    }));
  const wsCong = XLSX.utils.json_to_sheet(congRows);
  XLSX.utils.book_append_sheet(wb, wsCong, 'Điểm cộng');

  // Sheet 5: Điểm trừ (Vi phạm)
  const truRows = transactions
    .filter(t => t.type === 'tru')
    .map((t, idx) => ({
      'STT': idx + 1,
      'Tuần': t.weekNumber,
      'Học sinh': t.studentName,
      'Tổ': `Tổ ${t.teamId}`,
      'Lỗi vi phạm': t.title,
      'Điểm trừ': t.points,
      'Danh mục': t.category,
      'Người nhập': t.createdByName,
      'Ghi chú': t.notes || '',
      'Thời gian': formatDateVN(t.createdAt),
      'Trạng thái': t.status === 'approved' ? 'Đã duyệt' : t.status === 'pending' ? 'Chờ duyệt' : 'Từ chối',
    }));
  const wsTru = XLSX.utils.json_to_sheet(truRows);
  XLSX.utils.book_append_sheet(wb, wsTru, 'Điểm trừ - Vi phạm');

  // Sheet 6: Biểu dương
  const bieuDuongRows = transactions
    .filter(t => t.type === 'bieu_duong')
    .map((t, idx) => ({
      'STT': idx + 1,
      'Tuần': t.weekNumber,
      'Học sinh biểu dương': t.studentName,
      'Tổ': `Tổ ${t.teamId}`,
      'Hành động biểu dương': t.title,
      'Điểm thưởng': `+${t.points}`,
      'Người ghi nhận': t.createdByName,
      'Chi tiết / Ghi chú': t.notes || '',
      'Thời gian': formatDateVN(t.createdAt),
    }));
  const wsBieuDuong = XLSX.utils.json_to_sheet(bieuDuongRows);
  XLSX.utils.book_append_sheet(wb, wsBieuDuong, 'Biểu dương');

  // Save workbook
  const filename = `ThiDua_Lop${config.className}_Tuan${currentWeek}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// 2. Parse Excel file for bulk student import
export async function parseExcelStudents(file: File): Promise<Partial<Student>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const parsed: Partial<Student>[] = [];

        rawJson.forEach((row, i) => {
          // Find fields with flexible case-insensitive matching
          const keys = Object.keys(row);
          const findVal = (terms: string[]) => {
            for (const key of keys) {
              const cleanKey = key.trim().toLowerCase();
              if (terms.some(t => cleanKey.includes(t))) {
                return row[key];
              }
            }
            return '';
          };

          const name = findVal(['họ và tên', 'họ tên', 'tên', 'fullname', 'name']);
          if (!name || String(name).trim() === '') return;

          const sttRaw = findVal(['stt', 'số thứ tự', 'no']);
          const teamRaw = findVal(['tổ', 'to', 'team', 'nhóm']);
          const genderRaw = findVal(['giới tính', 'gioi tinh', 'gender', 'phái']);
          const birthRaw = findVal(['ngày sinh', 'ngaysinh', 'birth', 'dob']);
          const birthPlaceRaw = findVal(['nơi sinh', 'noi sinh', 'quê quán', 'que quan', 'birthplace', 'pob', 'tỉnh']);
          const addressRaw = findVal(['nơi thường trú', 'thuong tru', 'thường trú', 'hộ khẩu', 'địa chỉ', 'dia chi', 'address']);
          const roleRaw = findVal(['chức vụ', 'chuc vu', 'role', 'vị trí']);
          const parentNameRaw = findVal(['phụ huynh', 'cha mẹ', 'họ tên bố mẹ', 'parent']);
          const phoneRaw = findVal(['sđt', 'sdt', 'điện thoại', 'phone', 'số điện thoại']);
          const notesRaw = findVal(['ghi chú', 'ghi chu', 'note', 'nhận xét']);

          // Parse team (0 = Chưa chia tổ nếu không có trong file)
          let teamId = 0;
          const teamMatch = String(teamRaw).match(/\d+/);
          if (teamMatch) {
            teamId = Math.min(4, Math.max(1, parseInt(teamMatch[0])));
          }

          // Parse gender
          let gender: 'Nam' | 'Nữ' = 'Nam';
          const gStr = String(genderRaw).toLowerCase();
          if (gStr.includes('nữ') || gStr.includes('nu') || gStr.includes('female') || gStr === 'f') {
            gender = 'Nữ';
          }

          parsed.push({
            stt: sttRaw ? Number(sttRaw) : i + 1,
            name: String(name).trim(),
            teamId,
            gender,
            birthDate: String(birthRaw).trim(),
            birthPlace: String(birthPlaceRaw).trim(),
            permanentAddress: String(addressRaw).trim(),
            roleTitle: String(roleRaw).trim() || 'Thành viên',
            parentName: String(parentNameRaw).trim(),
            parentPhone: String(phoneRaw).trim(),
            notes: String(notesRaw).trim(),
          });
        });

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// 3. Download Sample Excel Template
export function downloadSampleExcelTemplate() {
  const wb = XLSX.utils.book_new();

  const sampleRows = [
    {
      'STT': 1,
      'Họ và tên': 'Nguyễn Văn An',
      'Giới tính': 'Nam',
      'Ngày sinh': '2011-05-18',
      'Nơi sinh': 'Việt Yên, Bắc Giang',
      'Nơi thường trú': 'Thôn Vân Cốc 1, Xã Vân Hà',
      'Tổ': 1,
      'Chức vụ': 'Lớp trưởng',
      'Họ tên phụ huynh': 'Nguyễn Văn Bình',
      'SĐT phụ huynh': '0912345678',
      'Ghi chú': 'Gương mẫu, học giỏi toàn diện'
    },
    {
      'STT': 2,
      'Họ và tên': 'Trần Thị Mai Phương',
      'Giới tính': 'Nữ',
      'Ngày sinh': '2011-01-25',
      'Nơi sinh': 'Bắc Giang',
      'Nơi thường trú': 'Thôn Yên Viên, Xã Vân Hà',
      'Tổ': 1,
      'Chức vụ': 'Lớp phó học tập',
      'Họ tên phụ huynh': 'Trần Văn Nam',
      'SĐT phụ huynh': '0987654321',
      'Ghi chú': 'Phụ trách đôn đốc bài tập'
    },
    {
      'STT': 3,
      'Họ và tên': 'Lê Hoàng Nam',
      'Giới tính': 'Nam',
      'Ngày sinh': '2011-07-08',
      'Nơi sinh': 'Việt Yên, Bắc Giang',
      'Nơi thường trú': 'Thôn Thổ Hà, Xã Vân Hà',
      'Tổ': 2,
      'Chức vụ': 'Lớp phó nề nếp',
      'Họ tên phụ huynh': 'Lê Văn Tiến',
      'SĐT phụ huynh': '0901234567',
      'Ghi chú': 'Kiểm tra sĩ số, đồng phục'
    },
    {
      'STT': 4,
      'Họ và tên': 'Vũ Quốc Bảo',
      'Giới tính': 'Nam',
      'Ngày sinh': '2011-08-20',
      'Nơi sinh': 'Bắc Ninh',
      'Nơi thường trú': 'Thôn Yên Viên, Xã Vân Hà',
      'Tổ': 2,
      'Chức vụ': 'Tổ trưởng',
      'Họ tên phụ huynh': 'Vũ Văn Kiên',
      'SĐT phụ huynh': '0911223344',
      'Ghi chú': ''
    },
    {
      'STT': 5,
      'Họ và tên': 'Hoàng Lan Anh',
      'Giới tính': 'Nữ',
      'Ngày sinh': '2011-02-15',
      'Nơi sinh': 'Hà Nội',
      'Nơi thường trú': 'Thôn Vân Cốc 3, Xã Vân Hà',
      'Tổ': 3,
      'Chức vụ': 'Thành viên',
      'Họ tên phụ huynh': 'Hoàng Văn Thắng',
      'SĐT phụ huynh': '0933445566',
      'Ghi chú': ''
    },
    {
      'STT': 6,
      'Họ và tên': 'Phạm Thu Hà',
      'Giới tính': 'Nữ',
      'Ngày sinh': '2011-02-10',
      'Nơi sinh': 'Việt Yên, Bắc Giang',
      'Nơi thường trú': 'Thôn Nguyệt Đức, Xã Vân Hà',
      'Tổ': 4,
      'Chức vụ': 'Lớp phó văn thể mỹ',
      'Họ tên phụ huynh': 'Phạm Văn Hòa',
      'SĐT phụ huynh': '0912345631',
      'Ghi chú': 'Phụ trách phong trào'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleRows);
  
  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 25 }, // Họ và tên
    { wch: 10 }, // Giới tính
    { wch: 14 }, // Ngày sinh
    { wch: 22 }, // Nơi sinh
    { wch: 28 }, // Nơi thường trú
    { wch: 8 },  // Tổ
    { wch: 20 }, // Chức vụ
    { wch: 24 }, // Họ tên phụ huynh
    { wch: 16 }, // SĐT phụ huynh
    { wch: 30 }, // Ghi chú
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'DanhSachHocSinh');
  XLSX.writeFile(wb, 'Mau_Danh_Sach_Hoc_Sinh_Lop9A1.xlsx');
}

// 3. Word Document Export (.doc formatted HTML)
export function exportToWordDoc(
  appData: AppData,
  options: {
    weekNumber?: number;
    month?: number;
    teacherNotes?: string;
    classMonitor?: string;
  }
) {
  const { config, students, transactions } = appData;
  const weekNumber = options.weekNumber || config.currentWeek;
  const teacherNotes = options.teacherNotes || 'Đa số các em chấp hành tốt nội quy nề nếp, chuẩn bị bài đầy đủ. Các tổ trưởng đã phát huy tốt tinh thần trách nhiệm. Cần tăng cường đôn đốc các bạn hay đi muộn và quên sách vở.';
  const classMonitorName = options.classMonitor || (students?.find(s => s.roleTitle?.toLowerCase().includes('lớp trưởng'))?.name) || 'Tạ Thục Quyên';

  // Calculate scores
  const studentScores = students.map((s, idx) => {
    let cong = 0;
    let tru = 0;
    transactions.forEach(t => {
      if (t.studentId === s.id && t.status === 'approved' && t.weekNumber === weekNumber) {
        if (t.points > 0) cong += t.points;
        else tru += Math.abs(t.points);
      }
    });
    const total = config.basePoints + cong - tru;
    let rankTitle = 'Khá';
    if (total >= 105) rankTitle = 'Xuất sắc';
    else if (total >= 95) rankTitle = 'Tốt';
    else if (total >= 85) rankTitle = 'Khá';
    else rankTitle = 'Cần cố gắng';

    return { student: s, stt: s.stt || idx + 1, cong, tru, total, rankTitle };
  }).sort((a, b) => b.total - a.total);

  // Teams breakdown
  const teamStats = [1, 2, 3, 4].map(tId => {
    const list = studentScores.filter(item => item.student.teamId === tId);
    const sum = list.reduce((acc, curr) => acc + curr.total, 0);
    const avg = list.length > 0 ? (sum / list.length).toFixed(2) : '0';
    return { teamId: tId, count: list.length, sum, avg: Number(avg) };
  }).sort((a, b) => b.avg - a.avg);

  // Commended students
  const commended = transactions
    .filter(t => t.weekNumber === weekNumber && (t.type === 'bieu_duong' || t.points >= 3))
    .slice(0, 10);

  // Reminded students (violations)
  const warned = transactions
    .filter(t => t.weekNumber === weekNumber && t.type === 'tru')
    .slice(0, 10);

  const htmlContent = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Báo cáo thi đua tuần ${weekNumber}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.4; color: #000; margin: 20px; }
        .header-table { width: 100%; border: none; margin-bottom: 20px; }
        .header-table td { border: none; vertical-align: top; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .title { font-size: 16pt; font-weight: bold; text-align: center; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase; }
        .subtitle { font-size: 13pt; font-style: italic; text-align: center; margin-bottom: 20px; }
        table.data-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11pt; }
        table.data-table th, table.data-table td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
        table.data-table th { background-color: #f2f2f2; text-align: center; font-weight: bold; }
        .section-title { font-size: 13pt; font-weight: bold; margin-top: 18px; margin-bottom: 6px; }
        .signature-table { width: 100%; border: none; margin-top: 30px; }
        .signature-table td { border: none; text-align: center; width: 50%; vertical-align: top; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10pt; }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td class="center" style="width: 45%;">
            <div>UBND PHƯỜNG VÂN HÀ</div>
            <div class="bold">TRƯỜNG THCS VÂN HÀ 2</div>
            <div style="width: 120px; border-bottom: 1px solid #000; margin: 4px auto;"></div>
          </td>
          <td class="center" style="width: 55%;">
            <div class="bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div class="bold">Độc lập – Tự do – Hạnh phúc</div>
            <div style="width: 160px; border-bottom: 1px solid #000; margin: 4px auto;"></div>
          </td>
        </tr>
      </table>

      <div class="title">BÁO CÁO THI ĐUA NỀ NẾP & HỌC TẬP</div>
      <div class="subtitle">LỚP 9A1 – TUẦN ${weekNumber} (NĂM HỌC ${config.schoolYear})</div>

      <div><strong>Giáo viên chủ nhiệm:</strong> ${config.teacherName}</div>
      <div><strong>Sĩ số:</strong> ${config.totalStudents} học sinh</div>
      <div><strong>Thời gian báo cáo:</strong> ${new Date().toLocaleDateString('vi-VN')}</div>

      <div class="section-title">I. BẢNG XẾP HẠNG THI ĐUA CÁC TỔ</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 15%;">Hạng</th>
            <th style="width: 25%;">Tên Tổ</th>
            <th style="width: 20%;">Sĩ số</th>
            <th style="width: 20%;">Tổng điểm</th>
            <th style="width: 20%;">Điểm Trung bình</th>
          </tr>
        </thead>
        <tbody>
          ${teamStats.map((t, idx) => `
            <tr>
              <td class="center bold">${idx + 1}</td>
              <td class="bold">Tổ ${t.teamId}</td>
              <td class="center">${t.count}</td>
              <td class="center">${t.sum}</td>
              <td class="center bold">${t.avg}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-title">II. GƯƠNG SÁNG BIỂU DƯƠNG TRONG TUẦN</div>
      ${commended.length > 0 ? `
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 8%;">STT</th>
              <th style="width: 25%;">Họ và tên</th>
              <th style="width: 15%;">Tổ</th>
              <th style="width: 35%;">Nội dung biểu dương</th>
              <th style="width: 17%;">Điểm cộng</th>
            </tr>
          </thead>
          <tbody>
            ${commended.map((c, i) => `
              <tr>
                <td class="center">${i + 1}</td>
                <td class="bold">${c.studentName}</td>
                <td class="center">Tổ ${c.teamId}</td>
                <td>${c.title} ${c.notes ? `(${c.notes})` : ''}</td>
                <td class="center bold" style="color: #0d8050;">+${c.points}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="font-style: italic;">Chưa có ghi nhận biểu dương trong tuần.</p>'}

      <div class="section-title">III. HỌC SINH CẦN LƯU Ý ĐÔN ĐỐC, NHẮC NHỞ</div>
      ${warned.length > 0 ? `
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 8%;">STT</th>
              <th style="width: 25%;">Họ và tên</th>
              <th style="width: 15%;">Tổ</th>
              <th style="width: 35%;">Lỗi vi phạm</th>
              <th style="width: 17%;">Điểm trừ</th>
            </tr>
          </thead>
          <tbody>
            ${warned.map((w, i) => `
              <tr>
                <td class="center">${i + 1}</td>
                <td class="bold">${w.studentName}</td>
                <td class="center">Tổ ${w.teamId}</td>
                <td>${w.title} ${w.notes ? `(${w.notes})` : ''}</td>
                <td class="center bold" style="color: #c92a2a;">${w.points}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="font-style: italic;">Tuần qua cả lớp chấp hành tốt, không có trường hợp vi phạm nặng.</p>'}

      <div class="section-title">IV. NHẬN XÉT CỦA GIÁO VIÊN CHỦ NHIỆM</div>
      <div style="border: 1px dashed #666; padding: 10px 14px; background-color: #fafafa; border-radius: 4px; margin-bottom: 20px;">
        ${teacherNotes}
      </div>

      <table class="signature-table">
        <tr>
          <td>
            <div class="bold">LỚP TRƯỞNG</div>
            <div style="margin-top: 60px; font-weight: bold;">${classMonitorName}</div>
          </td>
          <td>
            <div><em>Vân Hà, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em></div>
            <div class="bold">GIÁO VIÊN CHỦ NHIỆM</div>
            <div style="margin-top: 50px; font-weight: bold;">${config.teacherName}</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BaoCao_ThiDua_Lop9A1_Tuan${weekNumber}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 5. Download Backup JSON
export function downloadBackupJSON(data: AppData) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;
  a.href = url;
  a.download = `SaoLuu_Lop9A1_THCS_VanHa2_${timeStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 6. Read and parse uploaded Backup JSON file
export function readBackupJSONFile(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed.config || !parsed.students || !Array.isArray(parsed.students)) {
          throw new Error('File không đúng cấu trúc sao lưu của phần mềm Quản lý lớp 9A1.');
        }
        resolve(parsed);
      } catch (err: any) {
        reject(new Error(err.message || 'Không thể giải mã file JSON sao lưu.'));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file sao lưu.'));
    reader.readAsText(file);
  });
}


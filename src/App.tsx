/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { ToastContainer, ConfirmModal } from './components/common/Toast';
import { DashboardView } from './components/dashboard/DashboardView';
import { QuickEntryView } from './components/quickEntry/QuickEntryView';
import { CompetitionView } from './components/competition/CompetitionView';
import { StudentsView } from './components/students/StudentsView';
import { CommendationView } from './components/commendation/CommendationView';
import { ApprovalView } from './components/approval/ApprovalView';
import { ReportsView } from './components/reports/ReportsView';
import { CampaignsView } from './components/campaigns/CampaignsView';
import { EvaluationsView } from './components/evaluations/EvaluationsView';
import { AnnouncementsView } from './components/announcements/AnnouncementsView';
import { AccountsView } from './components/accounts/AccountsView';
import { SettingsView } from './components/settings/SettingsView';
import { ExcelImportModal } from './components/students/ExcelImportModal';
import { LoginModal, PasswordChangeModal } from './components/auth/LoginModal';
import { ProfileEditModal } from './components/auth/ProfileEditModal';
import { BackupRestoreModal } from './components/common/BackupRestoreModal';
import { 
  CheckCircle2, 
  FileText, 
  Bell, 
  Settings, 
  UserCheck, 
  X, 
  Sparkles, 
  Trophy, 
  Users, 
  Award,
  Clock,
  RotateCcw,
  Database,
  MessageSquare
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { data, currentUser, getPendingTransactions, resetDemoData, openConfirm } = useApp();

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pendingCount = getPendingTransactions().length;

  const navigateTo = (view: string) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Toast & Confirmation Alerts */}
      <ToastContainer />
      <ConfirmModal />

      {/* Main Header */}
      <Header
        currentView={currentView}
        onNavigate={navigateTo}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentView === 'dashboard' && (
          <DashboardView
            onNavigate={navigateTo}
            onOpenExcelImport={() => setIsExcelImportOpen(true)}
          />
        )}

        {currentView === 'quick-entry' && <QuickEntryView />}

        {currentView === 'competition' && <CompetitionView />}

        {currentView === 'students' && (
          <StudentsView onOpenExcelImport={() => setIsExcelImportOpen(true)} />
        )}

        {currentView === 'commendation' && (
          <CommendationView onNavigateToQuickEntry={() => navigateTo('quick-entry')} />
        )}

        {currentView === 'approval' && <ApprovalView />}

        {currentView === 'campaigns' && <CampaignsView />}

        {currentView === 'evaluations' && <EvaluationsView />}

        {currentView === 'reports' && <ReportsView />}

        {currentView === 'announcements' && <AnnouncementsView />}

        {currentView === 'accounts' && <AccountsView />}

        {currentView === 'settings' && <SettingsView />}
      </main>

      {/* Mobile Sticky Bottom Navigation */}
      <BottomNav
        currentView={currentView}
        onNavigate={navigateTo}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Mobile "More" Drawer / Menu Modal */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-base">Menu Chức Năng Mở Rộng</h3>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => navigateTo('campaigns')}
                className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-xl font-bold flex items-center justify-between cursor-pointer border border-amber-300 col-span-2 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-600" />
                  <span>Cuộc thi & Chiến dịch phong trào</span>
                </div>
                {(data.campaigns || []).filter(c => c.status === 'active').length > 0 && (
                  <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                    {(data.campaigns || []).filter(c => c.status === 'active').length} đang mở
                  </span>
                )}
              </button>

              <button
                onClick={() => navigateTo('evaluations')}
                className="p-3 bg-teal-50 hover:bg-teal-100 text-teal-950 rounded-xl font-bold flex items-center gap-2 cursor-pointer border border-teal-300 col-span-2 shadow-2xs"
              >
                <MessageSquare className="w-4 h-4 text-teal-700" />
                <span>Sổ Nhận xét & Đánh giá học sinh</span>
              </button>

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => navigateTo('approval')}
                  className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl font-bold flex items-center justify-between cursor-pointer border border-amber-200"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Duyệt điểm</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => navigateTo('reports')}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl font-bold flex items-center gap-2 cursor-pointer border border-slate-200"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Báo cáo & Xuất file</span>
              </button>

              <button
                onClick={() => navigateTo('commendation')}
                className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl font-bold flex items-center gap-2 cursor-pointer border border-amber-200"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span>Biểu dương</span>
              </button>

              <button
                onClick={() => navigateTo('announcements')}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl font-bold flex items-center gap-2 cursor-pointer border border-slate-200"
              >
                <Bell className="w-4 h-4 text-orange-600" />
                <span>Thông báo & Zalo</span>
              </button>

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => navigateTo('accounts')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl font-bold flex items-center gap-2 cursor-pointer border border-slate-200"
                >
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Quản lý tài khoản</span>
                </button>
              )}

              <button
                onClick={() => navigateTo('settings')}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl font-bold flex items-center gap-2 cursor-pointer border border-slate-200"
              >
                <Settings className="w-4 h-4 text-slate-600" />
                <span>Cài đặt quy chế</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsBackupModalOpen(true);
                }}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold flex items-center gap-2 cursor-pointer border border-emerald-200 col-span-2"
              >
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Sao lưu & Khôi phục dữ liệu</span>
              </button>
            </div>

            {currentUser.role === 'admin' && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openConfirm({
                      title: 'Đặt lại dữ liệu mẫu Demo?',
                      message: 'Hệ thống sẽ nạp lại 41 học sinh mẫu Lớp 9A1 và dữ liệu thi đua ban đầu.',
                      confirmText: 'Đặt lại',
                      onConfirm: resetDemoData,
                    });
                  }}
                  className="w-full py-2 px-3 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-rose-100"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại dữ liệu Demo ban đầu</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Modals */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenChangePassword={() => setIsPasswordModalOpen(true)}
      />

      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

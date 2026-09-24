import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from './config/axios';
import { useAuthStore } from './store/authStore';
import MainLayout from './components/layout/MainLayout';

// Shared
import ProfilePage from './pages/shared/ProfilePage';

// Public
import LandingPage from './pages/public/LandingPage';
import PublicLayout from './pages/public/PublicLayout';
import ServicesPage from './pages/public/ServicesPage';
import DocumentsPage from './pages/public/DocumentsPage';
import ContactPage, { ContactSuccessPage } from './pages/public/ContactPage';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentLessons from './pages/student/StudentLessons';
import LessonDetail from './pages/student/LessonDetail';

// Leads CRM + Finance (manager / admin / reception)
import ManagerLeads from './pages/manager/ManagerLeads';
import CrmDashboard from './pages/crm/CrmDashboard';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import FinanceExpenses from './pages/finance/FinanceExpenses';
import FinancePayroll from './pages/finance/FinancePayroll';
import StudentHomework from './pages/student/StudentHomework';
import HomeworkSubmit from './pages/student/HomeworkSubmit';
import StudentTests from './pages/student/StudentTests';
import TestRunner from './pages/student/TestRunner';
import StudentResults from './pages/student/StudentResults';
import StudentResources from './pages/student/StudentResources';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentAchievements from './pages/student/StudentAchievements';
import StudentLeaderboard from './pages/student/StudentLeaderboard';
import StudentAnalytics from './pages/student/StudentAnalytics';
import StudentProgress from './pages/student/StudentProgress';
import CertificatePage from './pages/student/CertificatePage';
import StudentShopPage from './pages/student/StudentShopPage';

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ManageGroups from './pages/teacher/ManageGroups';
import GroupDetail from './pages/teacher/GroupDetail';
import ManageStudents from './pages/teacher/ManageStudents';
import ManageLessons from './pages/teacher/ManageLessons';
import CreateLesson from './pages/teacher/CreateLesson';
import ManageHomework from './pages/teacher/ManageHomework';
import CreateHomework from './pages/teacher/CreateHomework';
import GradeSubmissions from './pages/teacher/GradeSubmissions';
import ManageTests from './pages/teacher/ManageTests';
import CreateTest from './pages/teacher/CreateTest';
import TestResultsPage from './pages/teacher/TestResultsPage';
import AttendancePage from './pages/teacher/AttendancePage';
import TeacherResources from './pages/teacher/TeacherResources';
import TeacherAnalytics from './pages/teacher/TeacherAnalytics';
import TeacherVoice from './pages/teacher/TeacherVoice';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAIAgents from './pages/admin/AdminAIAgents';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminReception from './pages/admin/AdminReception';
import AdminApplications from './pages/admin/AdminApplications';
import AdminStudents from './pages/admin/AdminStudents';
import AdminGroups from './pages/admin/AdminGroups';
import AdminSettings from './pages/admin/AdminSettings';
import AdminManagers from './pages/admin/AdminManagers';
import AdminManagerDetail from './pages/admin/AdminManagerDetail';
import AdminBranches from './pages/admin/AdminBranches';
import AdminBranchDetail from './pages/admin/AdminBranchDetail';
import AdminCenters from './pages/admin/AdminCenters';
import AdminCenterDetail from './pages/admin/AdminCenterDetail';
import UserDetail from './pages/shared/UserDetail';

// Manager pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerBranches from './pages/manager/ManagerBranches';
import ManagerBranchDetail from './pages/manager/ManagerBranchDetail';
import ManagerPayments from './pages/manager/ManagerPayments';
import ManagerSettings from './pages/manager/ManagerSettings';

// ERP pages
import RoomsPage from './pages/erp/RoomsPage';
import TimetablePage from './pages/erp/TimetablePage';
import CashboxPage from './pages/erp/CashboxPage';
import PaymentReceiptPage from './pages/erp/PaymentReceiptPage';

// LMS extra
import GradebookPage from './pages/teacher/GradebookPage';

// Reception pages
import ReceptionGroups from './pages/reception/ReceptionGroups';
import ReceptionGroupDetail from './pages/reception/ReceptionGroupDetail';
import ReceptionTeacherDetail from './pages/reception/ReceptionTeacherDetail';
import ReceptionStudents from './pages/reception/ReceptionStudents';
import ReceptionPayments from './pages/reception/ReceptionPayments';
import ReceptionSettings from './pages/reception/ReceptionSettings';
import ReceptionStaffDetail from './pages/admin/ReceptionStaffDetail';

const ProtectedRoute = ({ children, role, permission }) => {
  const { isAuthenticated, user } = useAuthStore();

  const { data: serverSettings } = useQuery({
    queryKey: ['center-settings', user?.centerId || user?.id],
    queryFn: () => api.get('/admin/settings').then(r => r.data?.data || {}),
    enabled: !!user && user.role === 'reception' && !!permission,
    staleTime: 30 * 1000,
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const allowedRoles = Array.isArray(role) ? role : role ? [role] : null;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (user?.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user?.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (user?.role === 'reception') return <Navigate to="/reception/dashboard" replace />;
    if (user?.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  }

  if (user?.role === 'reception' && permission && serverSettings) {
    const perms = serverSettings.receptionPermissions || {};
    if (permission === 'canViewFinance' && perms.canViewFinance !== true) {
      return <Navigate to="/reception/dashboard" replace />;
    }
    if (permission === 'canViewCashbox' && perms.canViewCashbox !== true) {
      return <Navigate to="/reception/dashboard" replace />;
    }
    if (perms[permission] === false) {
      return <Navigate to="/reception/dashboard" replace />;
    }
  }

  return children;
};

export default function App() {
  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<PublicLayout />}>
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/contact/success" element={<ContactSuccessPage />} />
        </Route>

        <Route path="/" element={
          user?.role === 'student' ? <Navigate to="/student/dashboard" replace /> :
          user?.role === 'teacher' ? <Navigate to="/teacher/dashboard" replace /> :
          user?.role === 'reception' ? <Navigate to="/reception/dashboard" replace /> :
          user?.role === 'manager' ? <Navigate to="/manager/dashboard" replace /> :
          user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
          <PublicLayout><LandingPage /></PublicLayout>
        } />

        {/* Student Routes */}
        <Route path="/student" element={<ProtectedRoute role="student"><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="lessons" element={<StudentLessons />} />
          <Route path="lessons/:id" element={<LessonDetail />} />
          <Route path="homework" element={<StudentHomework />} />
          <Route path="homework/:id/submit" element={<HomeworkSubmit />} />
          <Route path="tests" element={<StudentTests />} />
          <Route path="tests/:id/run" element={<TestRunner />} />
          <Route path="results" element={<StudentResults />} />
          <Route path="resources" element={<StudentResources />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="achievements" element={<StudentAchievements />} />
          <Route path="leaderboard" element={<StudentLeaderboard />} />
          <Route path="analytics" element={<StudentAnalytics />} />
          <Route path="progress" element={<StudentProgress />} />
          <Route path="certificates" element={<CertificatePage />} />
          <Route path="shop" element={<StudentShopPage />} />
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher" element={<ProtectedRoute role="teacher"><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="groups" element={<ManageGroups />} />
          <Route path="groups/:id" element={<GroupDetail />} />
          <Route path="students" element={<ManageStudents />} />
          <Route path="lessons" element={<ManageLessons />} />
          <Route path="lessons/create" element={<CreateLesson />} />
          <Route path="lessons/:id/edit" element={<CreateLesson />} />
          {/* Teachers open the same lesson view their students see. */}
          <Route path="lessons/:id" element={<LessonDetail />} />
          <Route path="homework" element={<ManageHomework />} />
          <Route path="homework/create" element={<CreateHomework />} />
          <Route path="homework/:id/submissions" element={<GradeSubmissions />} />
          <Route path="tests" element={<ManageTests />} />
          <Route path="tests/create" element={<CreateTest />} />
          <Route path="tests/:id/results" element={<TestResultsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="gradebook" element={<GradebookPage />} />
          <Route path="resources" element={<TeacherResources />} />
          <Route path="analytics" element={<TeacherAnalytics />} />
          <Route path="voice" element={<TeacherVoice />} />
          <Route path="students/:id" element={<UserDetail />} />
        </Route>

        {/* Shared - any authenticated role */}
        <Route path="/profile" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<ProfilePage />} />
        </Route>
        <Route path="/users" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path=":id" element={<UserDetail />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="ai-agents" element={<AdminAIAgents />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="centers" element={<AdminCenters />} />
          <Route path="centers/:id" element={<AdminCenterDetail />} />
          <Route path="teachers" element={<AdminTeachers />} />
          <Route path="teachers/:id" element={<ReceptionTeacherDetail />} />
          <Route path="reception" element={<AdminReception />} />
          <Route path="reception/:id" element={<ReceptionStaffDetail />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="students/:id" element={<UserDetail />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Manager Routes */}
        <Route path="/manager" element={<ProtectedRoute role="manager"><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="branches" element={<ManagerBranches />} />
          <Route path="branches/:id" element={<ManagerBranchDetail />} />
          <Route path="reception" element={<AdminReception />} />
          <Route path="reception/:id" element={<ReceptionStaffDetail />} />
          <Route path="teachers" element={<AdminTeachers />} />
          <Route path="teachers/:id" element={<ReceptionTeacherDetail />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="students/:id" element={<UserDetail />} />
          <Route path="groups" element={<AdminGroups />} />
          <Route path="groups/:id" element={<GroupDetail />} />
          <Route path="payments" element={<ManagerPayments />} />
          <Route path="settings" element={<ManagerSettings />} />
        </Route>

        {/* CRM Dashboard */}
        <Route path="/crm" element={<ProtectedRoute role={['manager', 'admin', 'reception']}><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<CrmDashboard />} />
        </Route>

        {/* Leads CRM and Finance are shared by the management roles */}
        <Route path="/leads" element={<ProtectedRoute role={['manager', 'admin', 'reception']} permission="canManageLeads"><MainLayout /></ProtectedRoute>}>
          <Route index element={<ManagerLeads />} />
        </Route>
        <Route path="/finance" element={<ProtectedRoute role={['admin', 'manager', 'reception']} permission="canViewFinance"><MainLayout /></ProtectedRoute>}>
          <Route index element={<FinanceDashboard />} />
          <Route path="expenses" element={<FinanceExpenses />} />
        </Route>
        {/* ERP Routes */}
        <Route path="/erp" element={<ProtectedRoute role={['admin', 'manager', 'reception']}><MainLayout /></ProtectedRoute>}>
          <Route path="rooms" element={<ProtectedRoute role={['admin', 'manager', 'reception']} permission="canManageTimetable"><RoomsPage /></ProtectedRoute>} />
          <Route path="timetable" element={<ProtectedRoute role={['admin', 'manager', 'reception']} permission="canManageTimetable"><TimetablePage /></ProtectedRoute>} />
          <Route path="cashbox" element={<ProtectedRoute role={['admin', 'manager', 'reception']} permission="canViewCashbox"><CashboxPage /></ProtectedRoute>} />
          <Route path="receipt/:id" element={<PaymentReceiptPage />} />
        </Route>

        <Route path="/finance/payroll" element={<ProtectedRoute role={['manager']}><MainLayout /></ProtectedRoute>}>
          <Route index element={<FinancePayroll />} />
        </Route>

        {/* Reception Routes - has operational capabilities bounded by permissions */}
        <Route path="/reception" element={<ProtectedRoute role="reception"><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="teachers" element={<ProtectedRoute role="reception" permission="canManageTeachers"><AdminTeachers /></ProtectedRoute>} />
          <Route path="groups" element={<ProtectedRoute role="reception" permission="canManageGroups"><ReceptionGroups /></ProtectedRoute>} />
          <Route path="groups/:id" element={<ProtectedRoute role="reception" permission="canManageGroups"><ReceptionGroupDetail /></ProtectedRoute>} />
          <Route path="teachers/:id" element={<ProtectedRoute role="reception" permission="canManageTeachers"><ReceptionTeacherDetail /></ProtectedRoute>} />
          <Route path="students" element={<ProtectedRoute role="reception" permission="canManageStudents"><ReceptionStudents /></ProtectedRoute>} />
          <Route path="students/:id" element={<ProtectedRoute role="reception" permission="canManageStudents"><UserDetail /></ProtectedRoute>} />
          <Route path="payments" element={<ProtectedRoute role="reception" permission="canManagePayments"><ReceptionPayments /></ProtectedRoute>} />
          <Route path="settings" element={<ReceptionSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

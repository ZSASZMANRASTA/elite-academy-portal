import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import PublicLayout from "@/layouts/PublicLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import About from "./pages/About";
import Academics from "./pages/Academics";
import Admissions from "./pages/Admissions";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import DashboardHome from "./pages/dashboard/DashboardHome";
import CoursesPage from "./pages/dashboard/CoursesPage";
import QuizManagePage from "./pages/dashboard/QuizManagePage";
import MaterialsPage from "./pages/dashboard/MaterialsPage";
import AssignmentsPage from "./pages/dashboard/AssignmentsPage";
import UsersPage from "./pages/dashboard/UsersPage";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage";
import QuizTakePage from "./pages/dashboard/QuizTakePage";
import AnnouncementsPage from "./pages/dashboard/AnnouncementsPage";
import EmailListPage from "./pages/dashboard/EmailListPage";
import ClassesPage from "./pages/dashboard/ClassesPage";
import AttendancePage from "./pages/dashboard/AttendancePage";
import FinancePage from "./pages/dashboard/FinancePage";
import NotificationsPage from "./pages/dashboard/NotificationsPage";
import ProgressPage from "./pages/dashboard/ProgressPage";
import SiteEditorPage from "./pages/dashboard/SiteEditorPage";
import SchoolCalendarPage from "./pages/dashboard/SchoolCalendarPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/academics" element={<Academics />} />
              <Route path="/admissions" element={<Admissions />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/contact" element={<Contact />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/dashboard/subjects" element={<CoursesPage />} />
              <Route path="/dashboard/quizzes" element={<QuizManagePage />} />
              <Route path="/dashboard/materials" element={<MaterialsPage />} />
              <Route path="/dashboard/assignments" element={<AssignmentsPage />} />
              <Route path="/dashboard/users" element={<UsersPage />} />
              <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
              <Route path="/dashboard/take-quiz" element={<QuizTakePage />} />
              <Route path="/dashboard/announcements" element={<AnnouncementsPage />} />
              <Route path="/dashboard/email-list" element={<EmailListPage />} />
              <Route path="/dashboard/classes" element={<ClassesPage />} />
              <Route path="/dashboard/attendance" element={<AttendancePage />} />
              <Route path="/dashboard/finance" element={<FinancePage />} />
              <Route path="/dashboard/notifications" element={<NotificationsPage />} />
              <Route path="/dashboard/progress" element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ProgressPage />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/site-editor" element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <SiteEditorPage />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/school-calendar" element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <SchoolCalendarPage />
                </ProtectedRoute>
              } />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

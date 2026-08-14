import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/AuthContext";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CalendarPage } from "./pages/CalendarPage";
import { ClassesListPage } from "./pages/classes/ClassesListPage";
import { TimetableBuilderPage } from "./pages/classes/TimetableBuilderPage";
import { ClassDetailPage } from "./pages/classes/ClassDetailPage";
import { PupilsPage } from "./pages/PupilsPage";
import { PlanningGoalsPage } from "./pages/PlanningGoalsPage";
import { MarkbookPage } from "./pages/MarkbookPage";
import { CoverWorkPage } from "./pages/CoverWorkPage";
import { PastoralPage } from "./pages/PastoralPage";
import { TeamsListPage } from "./pages/teams/TeamsListPage";
import { TeamDetailPage } from "./pages/teams/TeamDetailPage";
import { CpdCareerPage } from "./pages/CpdCareerPage";
import { ContactsPage } from "./pages/ContactsPage";
import { ProceduresPage } from "./pages/ProceduresPage";
import { SearchPage } from "./pages/SearchPage";
import { SettingsPage } from "./pages/SettingsPage";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50">
      <p className="text-sm text-ink-400">Loading…</p>
    </div>
  );
}

export default function App() {
  const { authenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!authenticated) return <LoginPage />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/classes" element={<ClassesListPage />} />
        <Route path="/classes/timetable" element={<TimetableBuilderPage />} />
        <Route path="/classes/:classId" element={<ClassDetailPage />} />
        <Route path="/pupils" element={<PupilsPage />} />
        <Route path="/planning" element={<PlanningGoalsPage />} />
        <Route path="/markbook" element={<MarkbookPage />} />
        <Route path="/cover-work" element={<CoverWorkPage />} />
        <Route path="/pastoral" element={<PastoralPage />} />
        <Route path="/co-curricular" element={<TeamsListPage />} />
        <Route path="/co-curricular/:teamId" element={<TeamDetailPage />} />
        <Route path="/cpd" element={<CpdCareerPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/procedures" element={<ProceduresPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

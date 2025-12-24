import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import ScrollRestoration from "@/components/ScrollRestoration";
import Home from "@/pages/Home";
import ExamSyllabus from "@/pages/ExamSyllabus";
import ModernExamSyllabus from "@/pages/ModernExamSyllabus";
import SoloPractice from "@/pages/SoloPractice";
import Leaderboard from "@/pages/Leaderboard";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import AuthCallback from "@/pages/AuthCallback";
import SheetManager from "@/pages/SheetManager";
import VictoryLane from "@/pages/VictoryLane";
import Profile from "@/pages/Profile";
import Books from "@/pages/Books";
import BookDetails from "@/pages/BookDetails";
import Courses from "@/pages/Courses";
import AboutUs from "@/pages/AboutUs";
import FAQ from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import TestSheets from "@/pages/TestSheets";
import TestSocket from "@/pages/TestSocket";
import TestLatex from "@/pages/TestLatex";
import UserDashboard from "@/pages/UserDashboard";
import Dashboard from "@/pages/Dashboard";
import PublicProfile from "@/pages/PublicProfile";
import Notifications from "@/pages/Notifications";
import PrivacySettings from "@/pages/PrivacySettings";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";

// PIN-based Room Quiz (Multiple players, like Kahoot)
import CreateRoom from "@/pages/CreateRoom";
import JoinRoom from "@/pages/JoinRoom";
import BattleLobby from "@/pages/BattleLobby";
import LiveBattle from "@/pages/LiveBattle";
import BattleResults from "@/pages/BattleResults";
import QuizRoom from "@/pages/QuizRoom";
import QuizResults from "@/pages/QuizResults";
import Board from "@/pages/Board";
import RoomDetail from "@/pages/RoomDetail";

// 1v1 Live Battle with video (Original matchmaking)
import LiveBattleMode from "@/pages/LiveBattleMode";

// Admin Panel
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";

// Exam Pages
import RRB_NTPC from "@/pages/RRB_NTPC";
import AFCAT from "@/pages/AFCAT";

// Chapter Test Pages
import ChapterTestHome from "@/pages/ChapterTestHome";
import ChapterTestSubjects from "@/pages/ChapterTestSubjects";
import ChapterTestStreams from "@/pages/ChapterTestStreams";
import ChapterTestStreamSubjects from "@/pages/ChapterTestStreamSubjects";
import ChapterTestChapters from "@/pages/ChapterTestChapters";

// Single Post View
import SinglePost from "@/pages/SinglePost";

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="App" style={{ paddingTop: '64px' }}>
          <BrowserRouter>
            <ScrollRestoration />
            <Routes>
              <Route path="/" element={<Home />} />
            <Route path="/exam/:examId" element={<ModernExamSyllabus />} />
            <Route path="/topic-quiz/:examId/:subjectName/:topicName" element={<SoloPractice />} />
            <Route path="/solo-practice/:examName/:subjectName" element={<SoloPractice />} />
            
            {/* Dedicated Exam Pages */}
          <Route path="/exams/rrb-ntpc" element={<RRB_NTPC />} />
          <Route path="/exams/afcat" element={<AFCAT />} />
          
          {/* Chapter Test Routes */}
          <Route path="/chapter-tests" element={<ChapterTestHome />} />
          
          {/* For Classes 11 and 12 - Stream Selection (most specific routes first) */}
          <Route path="/chapter-tests/class-11/select-stream" element={<ChapterTestStreams />} />
          <Route path="/chapter-tests/class-12/select-stream" element={<ChapterTestStreams />} />
          <Route path="/chapter-tests/class-11/:stream/:subject" element={<ChapterTestChapters />} />
          <Route path="/chapter-tests/class-12/:stream/:subject" element={<ChapterTestChapters />} />
          <Route path="/chapter-tests/class-11/:stream" element={<ChapterTestStreamSubjects />} />
          <Route path="/chapter-tests/class-12/:stream" element={<ChapterTestStreamSubjects />} />
          
          {/* For Classes 6-10 - Direct Subject Selection */}
          <Route path="/chapter-tests/:classNumber/:subject" element={<ChapterTestChapters />} />
          <Route path="/chapter-tests/:classNumber" element={<ChapterTestSubjects />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth-callback" element={<AuthCallback />} />
          <Route path="/old-dashboard" element={<UserDashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/profile/:username" element={<PublicProfile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings/privacy" element={<PrivacySettings />} />
          
          {/* Social Routes - Redirect old routes to VictoryLane */}
          <Route path="/social" element={<VictoryLane />} />
          <Route path="/social-feed" element={<VictoryLane />} />
          <Route path="/victory-lane" element={<VictoryLane />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/sheets" element={<SheetManager />} />
          <Route path="/sheet-manager" element={<SheetManager />} />
          
          {/* Platform Pages */}
          <Route path="/about" element={<AboutUs />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/test-sheets" element={<TestSheets />} />
          <Route path="/test-socket" element={<TestSocket />} />
          <Route path="/test-latex" element={<TestLatex />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          
          {/* Books Routes */}
          <Route path="/books" element={<Books />} />
          <Route path="/books/:bookId" element={<BookDetails />} />
          
          {/* Courses Route */}
          <Route path="/courses" element={<Courses />} />
          
          {/* PIN-based Room Quiz Routes (Multiple players) */}
          <Route path="/create-room/:examId/:subject/:topic" element={<CreateRoom />} />
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/battle-lobby/:pin" element={<BattleLobby />} />
          <Route path="/quiz-room/:roomCode" element={<QuizRoom />} />
          <Route path="/live-battle/:pin" element={<LiveBattle />} />
          <Route path="/battle-results/:pin" element={<BattleResults />} />
          <Route path="/quiz-results/:pin" element={<QuizResults />} />
          <Route path="/profile/board" element={<Board />} />
          <Route path="/board" element={<Board />} />
          <Route path="/room/:pin" element={<RoomDetail />} />
          
          {/* 1v1 Live Battle with video (matchmaking) */}
          <Route path="/live-battle-1v1/:examId/:subject/:topic" element={<LiveBattleMode />} />
        </Routes>
      </BrowserRouter>
    </div>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;

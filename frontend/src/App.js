import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import ExamSyllabus from "@/pages/ExamSyllabus";
import ModernExamSyllabus from "@/pages/ModernExamSyllabus";
import SoloPractice from "@/pages/SoloPractice";
import Leaderboard from "@/pages/Leaderboard";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import SheetManager from "@/pages/SheetManager";
import SocialFeed from "@/pages/SocialFeed";
import AboutUs from "@/pages/AboutUs";
import FAQ from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import TestSheets from "@/pages/TestSheets";
import TestSocket from "@/pages/TestSocket";
import UserDashboard from "@/pages/UserDashboard";

// PIN-based Room Quiz (Multiple players, like Kahoot)
import CreateRoom from "@/pages/CreateRoom";
import JoinRoom from "@/pages/JoinRoom";
import BattleLobby from "@/pages/BattleLobby";
import LiveBattle from "@/pages/LiveBattle";
import BattleResults from "@/pages/BattleResults";

// 1v1 Live Battle with video (Original matchmaking)
import LiveBattleMode from "@/pages/LiveBattleMode";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exam/:examId" element={<ModernExamSyllabus />} />
          <Route path="/topic-quiz/:examId/:subjectName/:topicName" element={<SoloPractice />} />
          <Route path="/solo-practice/:examName/:subjectName" element={<SoloPractice />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          
          {/* Social Routes */}
          <Route path="/social" element={<SocialFeed />} />
          
          {/* Admin Routes */}
          <Route path="/admin/sheets" element={<SheetManager />} />
          <Route path="/sheet-manager" element={<SheetManager />} />
          
          {/* Platform Pages */}
          <Route path="/about" element={<AboutUs />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/test-sheets" element={<TestSheets />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          
          {/* PIN-based Room Quiz Routes (Multiple players) */}
          <Route path="/create-room/:examId/:subject/:topic" element={<CreateRoom />} />
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/battle-lobby/:pin" element={<BattleLobby />} />
          <Route path="/live-battle/:pin" element={<LiveBattle />} />
          <Route path="/battle-results/:pin" element={<BattleResults />} />
          
          {/* 1v1 Live Battle with video (matchmaking) */}
          <Route path="/live-battle-1v1/:examId/:subject/:topic" element={<LiveBattleMode />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

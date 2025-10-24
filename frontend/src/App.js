import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NewHome from "@/pages/NewHome";
import ExamSyllabus from "@/pages/ExamSyllabus";
import SoloPractice from "@/pages/SoloPractice";
import Leaderboard from "@/pages/Leaderboard";
import CreatorDashboard from "@/pages/CreatorDashboard";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import SheetManager from "@/pages/SheetManager";

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
          <Route path="/exam/:examId" element={<ExamSyllabus />} />
          <Route path="/topic-quiz/:examId/:subjectName/:topicName" element={<SoloPractice />} />
          <Route path="/solo-practice/:examName/:subjectName" element={<SoloPractice />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Admin Routes */}
          <Route path="/admin/sheets" element={<SheetManager />} />
          
          {/* Platform Pages */}
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/creator-dashboard" element={<CreatorDashboard />} />
          
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

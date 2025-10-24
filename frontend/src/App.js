import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import ExamSyllabus from "@/pages/ExamSyllabus";
import SoloPractice from "@/pages/SoloPractice";
import BattleMode from "@/pages/BattleMode";
import CreateRoom from "@/pages/CreateRoom";
import JoinRoom from "@/pages/JoinRoom";
import BattleLobby from "@/pages/BattleLobby";
import LiveBattle from "@/pages/LiveBattle";
import BattleResults from "@/pages/BattleResults";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exam/:examId" element={<ExamSyllabus />} />
          <Route path="/topic-quiz/:examId/:subjectName/:topicName" element={<SoloPractice />} />
          <Route path="/solo-practice/:examName/:subjectName" element={<SoloPractice />} />
          
          {/* Live Battle Routes */}
          <Route path="/create-room/:examId/:subject/:topic" element={<CreateRoom />} />
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/battle-lobby/:pin" element={<BattleLobby />} />
          <Route path="/live-battle/:pin" element={<LiveBattle />} />
          <Route path="/battle-results/:pin" element={<BattleResults />} />
          
          {/* Legacy routes */}
          <Route path="/battle/:examName/:subjectName" element={<BattleMode />} />
          <Route path="/battle/:examId/:subjectName/:topicName" element={<BattleMode />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

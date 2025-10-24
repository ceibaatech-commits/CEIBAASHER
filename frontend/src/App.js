import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import ExamSyllabus from "@/pages/ExamSyllabus";
import SoloPractice from "@/pages/SoloPractice";
import BattleMode from "@/pages/BattleMode";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exam/:examId" element={<ExamSyllabus />} />
          <Route path="/topic-quiz/:examId/:subjectName/:topicName" element={<SoloPractice />} />
          <Route path="/solo-practice/:examName/:subjectName" element={<SoloPractice />} />
          <Route path="/battle/:examName/:subjectName" element={<BattleMode />} />
          <Route path="/battle/:examId/:subjectName/:topicName" element={<BattleMode />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

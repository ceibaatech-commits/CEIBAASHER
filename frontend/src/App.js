import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import ExamPage from "@/pages/ExamPage";
import SoloPractice from "@/pages/SoloPractice";
import BattleMode from "@/pages/BattleMode";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exam/:examName" element={<ExamPage />} />
          <Route path="/solo-practice/:examName/:subjectName" element={<SoloPractice />} />
          <Route path="/battle/:examName/:subjectName" element={<BattleMode />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

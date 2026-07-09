import React, { useState } from 'react';
import { GraduationCap, School, Landmark, ArrowLeft, CheckCircle, X } from 'lucide-react';

const GOAL_OPTIONS = {
  competitive: {
    name: "Competitive Exams",
    icon: GraduationCap,
    description: "JEE, NEET, UPSC, Defence, Banking & more",
    color: "from-purple-500 to-indigo-600",
    categories: [
      { id: "jee", name: "JEE (Engineering)", icon: "\u{1F3AF}" },
      { id: "neet", name: "NEET (Medical)", icon: "\u{1F3E5}" },
      { id: "upsc", name: "UPSC (Civil Services)", icon: "\u{1F3DB}\u{FE0F}" },
      { id: "defence", name: "Defence Exams", icon: "\u{1F396}\u{FE0F}", image: "https://cdn-icons-png.flaticon.com/512/6142/6142033.png" },
      { id: "banking", name: "Banking & SSC", icon: "\u{1F3E6}", image: "https://cdn-icons-png.flaticon.com/512/3696/3696141.png" },
      { id: "gate", name: "GATE", icon: "\u{2699}\u{FE0F}" },
      { id: "cat", name: "CAT (MBA)", icon: "\u{1F4CA}" }
    ]
  },
  school: {
    name: "School (Class 6-12)",
    icon: School,
    description: "RBSE, CBSE, ICSE & other State Boards",
    color: "from-emerald-500 to-teal-600",
    // School is a 2-step pick: board first, then class. `boards` drives step 2,
    // `categories` (classes) are shared across every board and drive step 3.
    boards: [
      { id: "cbse", name: "CBSE", icon: "\u{1F1EE}\u{1F1F3}" },
      { id: "rbse", name: "RBSE (Rajasthan Board)", icon: "\u{1F3F0}" },
      { id: "icse", name: "ICSE / ISC", icon: "\u{1F4D8}" },
      { id: "up_board", name: "UP Board", icon: "\u{1F4D5}" },
      { id: "mp_board", name: "MP Board", icon: "\u{1F4D7}" },
      { id: "bihar_board", name: "Bihar Board", icon: "\u{1F4D9}" },
      { id: "other_state_board", name: "Other State Board", icon: "\u{1F4DA}" }
    ],
    categories: [
      { id: "class_6", name: "Class 6", icon: "6\u{FE0F}\u{20E3}" },
      { id: "class_7", name: "Class 7", icon: "7\u{FE0F}\u{20E3}" },
      { id: "class_8", name: "Class 8", icon: "8\u{FE0F}\u{20E3}" },
      { id: "class_9", name: "Class 9", icon: "9\u{FE0F}\u{20E3}" },
      { id: "class_10", name: "Class 10", icon: "\u{1F51F}" },
      { id: "class_11_science", name: "Class 11 (Science)", icon: "\u{1F52C}" },
      { id: "class_11_commerce", name: "Class 11 (Commerce)", icon: "\u{1F4BC}" },
      { id: "class_11_arts", name: "Class 11 (Arts)", icon: "\u{1F3A8}" },
      { id: "class_12_science", name: "Class 12 (Science)", icon: "\u{1F9EA}" },
      { id: "class_12_commerce", name: "Class 12 (Commerce)", icon: "\u{1F4C8}" },
      { id: "class_12_arts", name: "Class 12 (Arts)", icon: "\u{1F58C}\u{FE0F}" }
    ]
  },
  university: {
    name: "College / University",
    icon: Landmark,
    description: "B.Com, BBA, LLB, BA, B.Sc, Masters & more",
    color: "from-orange-500 to-amber-600",
    categories: [
      { id: "ba", name: "B.A.", icon: "\u{1F4DA}" },
      { id: "bcom", name: "B.Com", icon: "\u{1F4B0}" },
      { id: "bba", name: "BBA", icon: "\u{1F4BC}" },
      { id: "bsc", name: "B.Sc", icon: "\u{1F9EA}" },
      { id: "btech", name: "B.Tech / B.E.", icon: "\u{1F6E0}\u{FE0F}" },
      { id: "bca", name: "BCA", icon: "\u{1F4BB}" },
      { id: "llb", name: "LLB", icon: "\u{2696}\u{FE0F}" },
      { id: "other_bachelors", name: "Other Bachelor's", icon: "\u{1F393}" },
      { id: "ma", name: "M.A.", icon: "\u{1F4D6}" },
      { id: "mcom", name: "M.Com", icon: "\u{1F4C8}" },
      { id: "mba", name: "MBA", icon: "\u{1F4BC}" },
      { id: "msc", name: "M.Sc", icon: "\u{1F52C}" },
      { id: "llm", name: "LLM", icon: "\u{2696}\u{FE0F}" },
      { id: "other_masters", name: "Other Master's", icon: "\u{1F393}" }
    ]
  }
};

export const GoalSelectionModal = ({ isOpen, onClose, onSelectGoal, currentGoal }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [loading, setLoading] = useState(false);

  // Final goal_category saved on the user doc:
  //   competitive / university -> the flat category id, e.g. "jee", "bcom"
  //   school                   -> "{board}_{class}", e.g. "rbse_class_10"
  const handleSelectCategory = async (type, categoryId) => {
    const finalCategoryId = type === 'school' && selectedBoard
      ? `${selectedBoard}_${categoryId}`
      : categoryId;
    setLoading(true);
    await onSelectGoal(type, finalCategoryId);
    setLoading(false);
    onClose();
  };

  const handleBack = () => {
    if (selectedType === 'school' && selectedBoard) {
      setSelectedBoard(null);
    } else {
      setSelectedType(null);
      setSelectedBoard(null);
    }
  };

  if (!isOpen) return null;

  const isSchoolBoardStep = selectedType === 'school' && !selectedBoard;
  const isCategoryStep = selectedType && (selectedType !== 'school' || selectedBoard);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Study Goal</h2>
            <p className="text-gray-500">Personalize your dashboard and recommendations</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {!selectedType ? (
            // Step 1: competitive / school / university
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(GOAL_OPTIONS).map(([type, data]) => {
                const Icon = data.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`p-6 rounded-xl border-2 border-gray-200 hover:border-transparent hover:shadow-lg transition-all text-left group bg-gradient-to-br hover:${data.color} hover:text-white`}
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${data.color} flex items-center justify-center mb-4 group-hover:bg-white/20`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-white">{data.name}</h3>
                    <p className="text-gray-500 group-hover:text-white/80">{data.description}</p>
                  </button>
                );
              })}
            </div>
          ) : isSchoolBoardStep ? (
            // Step 2 (school only): which board
            <div>
              <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
                <ArrowLeft className="w-4 h-4" />
                Back to categories
              </button>
              <h3 className="text-lg font-semibold mb-4">Select your Board</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOAL_OPTIONS.school.boards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => setSelectedBoard(board.id)}
                    className="p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left flex items-center gap-3"
                  >
                    <span className="text-2xl">{board.icon}</span>
                    <span className="font-semibold text-gray-800">{board.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : isCategoryStep ? (
            // Step 2 (competitive/university) or Step 3 (school, after board chosen)
            <div>
              <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h3 className="text-lg font-semibold mb-4">
                {selectedType === 'school'
                  ? `Select your Class - ${GOAL_OPTIONS.school.boards.find(b => b.id === selectedBoard)?.name}`
                  : `Select your ${GOAL_OPTIONS[selectedType].name}`}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOAL_OPTIONS[selectedType].categories.map((cat) => {
                  const finalId = selectedType === 'school' ? `${selectedBoard}_${cat.id}` : cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(selectedType, cat.id)}
                      disabled={loading}
                      className={`p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left flex items-center gap-3 ${
                        currentGoal?.goal_category === finalId ? 'border-emerald-500 bg-emerald-50' : ''
                      } disabled:opacity-50`}
                    >
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-7 h-7 object-contain" />
                      ) : (
                        <span className="text-2xl">{cat.icon}</span>
                      )}
                      <span className="font-semibold text-gray-800">{cat.name}</span>
                      {currentGoal?.goal_category === finalId && (
                        <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
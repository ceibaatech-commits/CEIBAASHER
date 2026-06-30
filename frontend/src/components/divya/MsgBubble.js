import React from 'react';
import { Volume2 } from 'lucide-react';

const MsgBubble = ({ msg, tutor, selectedTutor, onPlayAudio, isSpeaking }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {isUser ? (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 text-white text-[11px] font-bold">You</div>
      ) : (
        <img src={tutor.avatar} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover"
          style={{ backgroundColor: selectedTutor === 'divya' ? '#e9d5ff' : '#ccfbf1' }} />
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isUser ? 'bg-gray-800 text-white rounded-tr-sm' : `${tutor.light} rounded-tl-sm`}`}>
        <p className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-700'}`}>{msg.text}</p>
        {onPlayAudio && !isUser && (
          <button onClick={onPlayAudio}
            className={`mt-1.5 flex items-center gap-1 text-[10px] font-semibold ${tutor.text} hover:opacity-70 transition`}
            data-testid="play-audio-btn">
            <Volume2 className="w-3 h-3" /> {isSpeaking ? 'Playing...' : 'Play audio'}
          </button>
        )}
      </div>
    </div>
  );
};

export default MsgBubble;

import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const TestSocket = () => {
  const [status, setStatus] = useState('Initializing...');
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('🚀 TestSocket component mounted');
    addLog('📦 Attempting to import socket.io-client...');
    
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      addLog(`🔗 BACKEND_URL: ${BACKEND_URL}`);
      
      addLog('📡 Creating Socket.io connection...');
      const socket = io(BACKEND_URL, {
        transports: ['polling'],
        upgrade: false
      });
      
      addLog('✅ Socket.io client created');
      setStatus('Connecting...');

      socket.on('connect', () => {
        addLog('✅ CONNECTED! Socket ID: ' + socket.id);
        setStatus('Connected ✅');
        
        // Try to join a test room
        addLog('📤 Emitting test join-room...');
        socket.emit('join-room', {
          pin: '999999',
          playerName: 'Test User',
          isHost: true
        });
      });

      socket.on('connect_error', (error) => {
        addLog('❌ Connection error: ' + error.message);
        setStatus('Connection Error ❌');
      });

      socket.on('error', (data) => {
        addLog('⚠️ Socket error: ' + JSON.stringify(data));
      });

      socket.on('player-joined', (data) => {
        addLog('📬 Received player-joined: ' + JSON.stringify(data));
      });

      return () => {
        addLog('🔌 Disconnecting...');
        socket.close();
      };
    } catch (error) {
      addLog('❌ ERROR: ' + error.message);
      setStatus('Error ❌');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Socket.io Connection Test</h1>
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <div className="text-2xl">Status: {status}</div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Connection Logs:</h2>
          <div className="space-y-1 font-mono text-sm">
            {logs.map((log, i) => (
              <div key={i} className="text-green-400">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSocket;

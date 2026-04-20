import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global error caught:", message, error);
  const root = document.getElementById('root');
  if (root && root.innerHTML === "") {
    root.innerHTML = `<div style="padding: 20px; font-family: sans-serif;">
      <h2>앱 실행 중 오류가 발생했습니다.</h2>
      <p>${message}</p>
      <button onclick="location.reload()">새로고침</button>
    </div>`;
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

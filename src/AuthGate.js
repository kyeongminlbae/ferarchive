// src/AuthGate.js
import React, { useEffect, useState } from 'react';

const PASS = process.env.REACT_APP_APP_PASS ?? '';
console.log('[AuthGate] PASS set?', Boolean(PASS)); // ← 프로덕션 콘솔에서 true 떠야 정상

export default function AuthGate({ children }) {
  // 항상 hooks는 최상단에서 선언!
  const [ok, setOk] = useState(false);
  const [pw, setPw] = useState('');

  // PASS가 없으면 잠금 꺼짐 → 그냥 통과
  useEffect(() => {
    if (!PASS) {
      setOk(true);
      return;
    }
    if (localStorage.getItem('ferauth') === '1') setOk(true);
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    if (pw === PASS) {
      localStorage.setItem('ferauth', '1');
      setOk(true);
    } else {
      alert('비밀번호가 달라요!');
    }
  };

  // ok면 children 보여줌
  if (ok) return children;

  // 비밀번호 폼
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#faf7f2', padding: 16
    }}>
      <form
        onSubmit={onSubmit}
        style={{
          background: 'white', padding: 24, borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: 320
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>ferarchive 🔐</h2>
        <p style={{ marginTop: 0, color: '#666' }}>비밀번호를 입력하세요</p>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          placeholder="Password"
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10,
            border: '1px solid #ddd', outline: 'none'
          }}
        />
        <button
          type="submit"
          style={{
            marginTop: 12, width: '100%', padding: '10px 12px',
            borderRadius: 10, border: 0, background: '#222', color: 'white',
            cursor: 'pointer'
          }}
        >
          Enter
        </button>
      </form>
    </div>
  );
}

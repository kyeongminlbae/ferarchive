// src/App.js
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import AuthGate from './AuthGate';
import './App.css';

/* ===== DiaryPanel (옆 패널) ===== */
function DiaryPanel({ open, form, setForm, onSave, onDelete, onClose, editing, setEditing }) {
  if (!open) return null;
  const change = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{
      position:'fixed', top:0, right:0, width:380, height:'100vh',
      background:'#fff', boxShadow:'-12px 0 30px rgba(0,0,0,.08)', padding:20, overflow:'auto', zIndex:50
    }}>
      <button onClick={onClose} style={{float:'right', border:0, background:'transparent', fontSize:22, cursor:'pointer'}}>×</button>
      <h3 style={{margin:'6px 0 16px'}}>기록</h3>

      {/* 날짜 */}
      <label style={{display:'block', fontSize:12, color:'#666'}}>날짜</label>
      <input
        type="date"
        value={form.date}
        onChange={change('date')}
        disabled={!editing}
        style={{width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #ddd', marginBottom:10}}
      />

      {/* 제목 */}
      <label style={{display:'block', fontSize:12, color:'#666'}}>제목</label>
      <input
        type="text"
        value={form.title}
        onChange={change('title')}
        disabled={!editing}
        style={{width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #ddd', marginBottom:10}}
      />

      {/* 카테고리 */}
      <label style={{display:'block', fontSize:12, color:'#666'}}>카테고리</label>
      <select
        value={form.category || ''}
        onChange={change('category')}
        disabled={!editing}
        style={{width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #ddd', marginBottom:10}}
      >
        <option value="">선택</option>
        <option value="영화">영화</option>
        <option value="책">책</option>
        <option value="전시">전시</option>
      </select>

      {/* 크레딧 */}
      <label style={{display:'block', fontSize:12, color:'#666'}}>크레딧</label>
      <input
        type="text"
        value={form.creator || ''}
        onChange={change('creator')}
        disabled={!editing}
        placeholder="감독/작가/기획자"
        style={{width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #ddd', marginBottom:10}}
      />
      <input
        type="text"
        value={form.actorsOrAuthor || ''}
        onChange={change('actorsOrAuthor')}
        disabled={!editing}
        placeholder="배우/출판사/장소"
        style={{width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #ddd', marginBottom:10}}
      />

      {/* 감상평 */}
      <label style={{display:'block', fontSize:12, color:'#666'}}>감상평</label>
      <textarea
        rows={8}
        value={form.review || ''}
        onChange={change('review')}
        disabled={!editing}
        style={{width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ddd', marginBottom:16, resize:'vertical'}}
      />

      {/* 버튼들 */}
      <div style={{display:'flex', gap:8}}>
        {!editing ? (
          <button onClick={() => setEditing(true)} style={{padding:'8px 12px', borderRadius:8, border:0, background:'#222', color:'#fff', cursor:'pointer'}}>수정</button>
        ) : (
          <button onClick={onSave} style={{padding:'8px 12px', borderRadius:8, border:0, background:'#222', color:'#fff', cursor:'pointer'}}>저장</button>
        )}
        <button onClick={onDelete} style={{padding:'8px 12px', borderRadius:8, border:'1px solid #eee', background:'#fff', color:'#d33', cursor:'pointer'}}>삭제</button>
        <button onClick={onClose} style={{marginLeft:'auto', padding:'8px 12px', borderRadius:8, border:'1px solid #eee', background:'#fff', cursor:'pointer'}}>닫기</button>
      </div>
    </div>
  );
}

function App() {
  const [events, setEvents] = useState([]);

  // 패널 상태/폼
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    id: null, title: '', date: '', category: '', creator: '', actorsOrAuthor: '', review: ''
  });

  // 1) 로드: DB → 그대로 (date는 YYYY-MM-DD 문자열)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        const formatted = data.map(ev => ({
          id: ev.id,
          title: ev.title,
          date: ev.date, // 그대로
          extendedProps: ev.extendedProps || {},
        }));
        setEvents(formatted);
        console.log('📂 API에서 불러옴:', formatted);
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };
    load();
  }, []);

  // 2) 추가: 클릭한 셀의 날짜(arg.dateStr)를 그대로 저장
  const handleDateClick = async (arg) => {
    const categoryOption = prompt(
      '어떤 기록을 남기시겠어요?\n\n1: 영화 🎬\n2: 책 📚\n3: 전시 🖼️\n\n번호를 입력하세요 (취소하려면 ESC)'
    );
    if (!categoryOption) return;

    let title, creator, actorsOrAuthor, review;
    let categoryTitle = '';

    switch (categoryOption) {
      case '1':
        title = prompt('🎬 영화 제목을 입력하세요:'); if (!title) return;
        creator = prompt('🎬 감독/연출/작가 (쉼표 가능)');
        actorsOrAuthor = prompt('🎭 배우 (쉼표 가능)');
        review = prompt('📝 한 줄 감상평:');
        categoryTitle = '영화';
        break;
      case '2':
        title = prompt('📚 책 제목을 입력하세요:'); if (!title) return;
        creator = prompt('🧑‍💻 작가:');
        actorsOrAuthor = prompt('📖 출판사:');
        review = prompt('📝 한 줄 감상평:');
        categoryTitle = '책';
        break;
      case '3':
        title = prompt('🖼️ 전시 제목을 입력하세요:'); if (!title) return;
        creator = prompt('🎨 작가/기획자:');
        actorsOrAuthor = prompt('🏛️ 장소:');
        review = prompt('📝 한 줄 감상평:');
        categoryTitle = '전시';
        break;
      default:
        alert('잘못된 번호입니다.'); return;
    }

    const newEvent = {
      title,
      date: arg.dateStr, // 'YYYY-MM-DD'
      extendedProps: { category: categoryTitle, creator, actorsOrAuthor, review },
    };

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });

      // 서버가 id를 주면 반영
      let created = newEvent;
      if (res.ok) {
        try {
          const payload = await res.json();
          if (payload?.id) created = { ...newEvent, id: payload.id };
        } catch (_) {}
      }

      setEvents(prev => [...prev, created]);
      console.log('💾 저장됨:', created);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  // 3) 이벤트 클릭 → 패널 열기
  const handleEventClick = (clickInfo) => {
    const ev = clickInfo.event;
    const f = {
      id: ev.id ? Number(ev.id) : null,
      title: ev.title,
      date: ev.startStr?.slice(0,10) || ev.extendedProps.date || '',
      category: ev.extendedProps.category || '',
      creator: ev.extendedProps.creator || '',
      actorsOrAuthor: ev.extendedProps.actorsOrAuthor || '',
      review: ev.extendedProps.review || '',
    };
    setForm(f);
    setEditing(false);
    setPanelOpen(true);
  };

  // 패널: 닫기/저장/삭제
  const onClosePanel = () => { setPanelOpen(false); setEditing(false); };

  const onSavePanel = async () => {
    if (!form.id) { alert('방금 추가한 항목은 새로고침 후 수정 가능해요(서버 id 필요)'); return; }
    try {
      await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          title: form.title,
          date: form.date, // 그대로
          extendedProps: {
            category: form.category,
            creator: form.creator,
            actorsOrAuthor: form.actorsOrAuthor,
            review: form.review,
          }
        })
      });

      // 캘린더 즉시 반영
      setEvents(prev => prev.map(e =>
        String(e.id) === String(form.id)
          ? { ...e,
              title: form.title,
              date: form.date,
              extendedProps: {
                ...(e.extendedProps || {}),
                category: form.category,
                creator: form.creator,
                actorsOrAuthor: form.actorsOrAuthor,
                review: form.review
              }
            }
          : e
      ));
      setEditing(false);
      alert('저장 완료!');
    } catch (err) {
      console.error(err); alert('저장 실패');
    }
  };

  const onDeletePanel = async () => {
    if (!window.confirm('정말 삭제할까요?')) return;
    if (!form.id) {
      setEvents(prev => prev.filter(e => !(e.title===form.title && e.date===form.date)));
      onClosePanel();
      return;
    }
    try {
      await fetch('/api/events', {
        method: 'DELETE',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ id: form.id })
      });
      setEvents(prev => prev.filter(e => String(e.id) !== String(form.id)));
      onClosePanel();
    } catch (err) {
      console.error(err); alert('삭제 실패');
    }
  };

  return (
    <AuthGate>
      <div className="App">
        <h1>ferarchive 🔐</h1>

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          timeZone="local"               // 로컬 기준
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventContent={(arg) => ({ html: arg.event.title.replace(/\n/g, '<br/>') })}
          height="auto"
        />

        <DiaryPanel
          open={panelOpen}
          form={form}
          setForm={setForm}
          onSave={onSavePanel}
          onDelete={onDeletePanel}
          onClose={onClosePanel}
          editing={editing}
          setEditing={setEditing}
        />
      </div>
    </AuthGate>
  );
}

export default App;

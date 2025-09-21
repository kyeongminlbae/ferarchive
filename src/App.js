// src/App.js

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import './App.css';

/* ───────────────── 스타일 + 패널 컴포넌트 ───────────────── */

const styles = {
  panel: {
    position: 'fixed', right: 16, top: 16, bottom: 16, width: 360,
    background: '#fff', border: '1px solid #eee', borderRadius: 12,
    padding: 16, boxShadow: '0 8px 24px rgba(0,0,0,.08)', overflowY: 'auto',
    zIndex: 1000,
  },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 },
  close: { border: 'none', background: 'transparent', fontSize: 24, lineHeight: 1, cursor: 'pointer' },
  date: { fontSize: 12, color: '#888' },
  title: { fontSize: 18, fontWeight: 700, marginTop: 4 },
  meta: { fontSize: 13, color: '#666', marginTop: 4 },
  hr: { margin: '16px 0', border: 0, borderTop: '1px solid #eee' },
  label: { fontSize: 12, color: '#888', marginBottom: 6 },
  review: { whiteSpace: 'pre-wrap', lineHeight: 1.6 },
  actions: { display: 'flex', gap: 8, marginTop: 16 },
  btn: { padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fafafa', cursor: 'pointer' },
  danger: { borderColor: '#f2c6c6', background: '#fff5f5', color: '#c22' },
};

const DiaryPanel = ({ event, onClose, onEdit, onDelete }) => {
  if (!event) return null;
  const d = event.start
    ? event.start.toISOString().slice(0,10)
    : event.extendedProps?.date || '';

  const xp = event.extendedProps || {};
  const category = xp.category || '';
  const creator = xp.creator || '';
  const sub = xp.actorsOrAuthor || '';
  const review = xp.review || '';

  return (
    <aside style={styles.panel}>
      <div style={styles.panelHeader}>
        <div>
          <div style={styles.date}>{d}</div>
          <div style={styles.title}>{event.title || ''}</div>
          <div style={styles.meta}>
            <span>{category}</span>
            {creator && <> · {creator}</>}
            {sub && <> · {sub}</>}
          </div>
        </div>
        <button style={styles.close} onClick={onClose}>×</button>
      </div>

      <hr style={styles.hr} />

      <div style={styles.label}>감상평</div>
      <div style={styles.review}>{review || '— (아직 없음)'}</div>

      <div style={styles.actions}>
        <button onClick={onEdit} style={styles.btn}>수정</button>
        <button onClick={onDelete} style={{...styles.btn, ...styles.danger}}>삭제</button>
      </div>
    </aside>
  );
};

/* ───────────────── App ───────────────── */

function App() {
  const [events, setEvents] = useState([]);
  const [detailEvent, setDetailEvent] = useState(null); // 패널 표시용

  // 1) 로드 시 DB에서 가져오기
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();

        const formatted = data.map(ev => ({
          id: ev.id,
          title: ev.title,
          date: typeof ev.date === 'string' ? ev.date.slice(0, 10) : ev.date,
          extendedProps: ev.extendedProps || {}
        }));
        setEvents(formatted);
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };
    load();
  }, []);

  // 2) 날짜 클릭 → 새 이벤트 추가
  const handleDateClick = async (arg) => {
    const categoryOption = prompt(
      '어떤 기록을 남기시겠어요?\n\n1: 영화 🎬\n2: 책 📚\n3: 전시 🖼️\n\n번호를 입력하세요 (취소하려면 ESC)'
    );
    if (!categoryOption) return;

    let title, creator, actorsOrAuthor, review;
    let categoryTitle = "";

    switch (categoryOption) {
      case '1':
        title = prompt('🎬 영화 제목을 입력하세요:');
        if (!title) return;
        creator = prompt('🎬 감독, 작가, 연출은 누구인가요? (쉼표로 구분)');
        actorsOrAuthor = prompt('🎭 배우는 누구인가요? (쉼표로 구분)');
        review = prompt('📝 한 줄 감상평을 입력해주세요:');
        categoryTitle = "영화";
        break;
      case '2':
        title = prompt('📚 책 제목을 입력하세요:');
        if (!title) return;
        creator = prompt('🧑‍💻 작가는 누구인가요?');
        actorsOrAuthor = prompt('📖 출판사는 어디인가요?');
        review = prompt('📝 한 줄 감상평을 입력해주세요:');
        categoryTitle = "책";
        break;
      case '3':
        title = prompt('🖼️ 전시 제목을 입력하세요:');
        if (!title) return;
        creator = prompt('🎨 작가는 누구인가요?');
        actorsOrAuthor = prompt('🏛️ 장소는 어디인가요?');
        review = prompt('📝 한 줄 감상평을 입력해주세요:');
        categoryTitle = "전시";
        break;
      default:
        alert('잘못된 번호를 입력하셨어요. 다시 시도해 주세요.');
        return;
    }

    const newEvent = {
      title,
      date: arg.dateStr,
      extendedProps: { category: categoryTitle, creator, actorsOrAuthor, review },
    };

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      setEvents((prev) => [...prev, newEvent]);
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  // 3) 이벤트 클릭 → 우측 패널 열기
  const handleEventClick = (clickInfo) => {
    setDetailEvent(clickInfo.event);
  };

  // 4) 패널: 수정
  const editSelected = async () => {
    if (!detailEvent) return;
    const current = detailEvent.extendedProps?.review || '';
    const next = prompt('감상평 수정', current);
    if (next == null) return;

    await fetch('/api/events', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: Number(detailEvent.id),
        title: detailEvent.title,
        date: detailEvent.start
          ? detailEvent.start.toISOString().slice(0,10)
          : detailEvent.extendedProps?.date || '',
        extendedProps: { ...detailEvent.extendedProps, review: next }
      })
    });

    detailEvent.setExtendedProp('review', next); // 화면 즉시 반영
  };

  // 5) 패널: 삭제
  const deleteSelected = async () => {
    if (!detailEvent) return;
    if (!window.confirm('정말 삭제할까요?')) return;

    await fetch('/api/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: Number(detailEvent.id) })
    });

    detailEvent.remove();
    setDetailEvent(null);
  };

  return (
    <div className="App">
      <h1>ferarchive</h1>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventContent={(arg) => {
          // 달력 셀 안 표시 (원하면 리뷰 첫줄도 살짝 붙일 수 있어)
          return { html: arg.event.title.replace(/\n/g, "<br/>") };
        }}
        height="auto"
      />

      <DiaryPanel
        event={detailEvent}
        onClose={() => setDetailEvent(null)}
        onEdit={editSelected}
        onDelete={deleteSelected}
      />
    </div>
  );
}

export default App;
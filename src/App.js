// src/App.js
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);

  // 1) 로드: DB → 그대로 써 (date는 YYYY-MM-DD 문자열 전제)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();

        const formatted = data.map((ev) => ({
          id: ev.id,                 // DB에 있다면 id 포함
          title: ev.title,
          date: ev.date,             // ← 날짜 문자열 그대로
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

  // 2) 추가: 클릭한 셀의 날짜 문자열(arg.dateStr)을 그대로 저장
  const handleDateClick = async (arg) => {
    const categoryOption = prompt(
      '어떤 기록을 남기시겠어요?\n\n1: 영화 🎬\n2: 책 📚\n3: 전시 🖼️\n\n번호를 입력하세요 (취소하려면 ESC)'
    );
    if (!categoryOption) return;

    let title, creator, actorsOrAuthor, review;
    let categoryTitle = '';

    switch (categoryOption) {
      case '1':
        title = prompt('🎬 영화 제목을 입력하세요:');
        if (!title) return;
        creator = prompt('🎬 감독/연출/작가 (쉼표로 구분 가능)');
        actorsOrAuthor = prompt('🎭 배우 (쉼표로 구분 가능)');
        review = prompt('📝 한 줄 감상평:');
        categoryTitle = '영화';
        break;
      case '2':
        title = prompt('📚 책 제목을 입력하세요:');
        if (!title) return;
        creator = prompt('🧑‍💻 작가:');
        actorsOrAuthor = prompt('📖 출판사:');
        review = prompt('📝 한 줄 감상평:');
        categoryTitle = '책';
        break;
      case '3':
        title = prompt('🖼️ 전시 제목을 입력하세요:');
        if (!title) return;
        creator = prompt('🎨 작가/기획자:');
        actorsOrAuthor = prompt('🏛️ 장소:');
        review = prompt('📝 한 줄 감상평:');
        categoryTitle = '전시';
        break;
      default:
        alert('잘못된 번호입니다.');
        return;
    }

    const newEvent = {
      title,
      date: arg.dateStr, // ← 'YYYY-MM-DD' 그대로 저장
      extendedProps: {
        category: categoryTitle,
        creator,
        actorsOrAuthor,
        review,
      },
    };

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });

      // DB가 id를 반환해 주면 반영 (없으면 새로고침 후 로드 시 붙음)
      let created = newEvent;
      if (res.ok) {
        try {
          const payload = await res.json();
          if (payload?.id) created = { ...newEvent, id: payload.id };
        } catch (_) {}
      }

      setEvents((prev) => [...prev, created]);
      console.log('💾 저장됨:', created);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  // 3) 수정/삭제 (id 필요) — 새로 추가 직후엔 id가 없을 수도 → 새로고침 후 수정 가능
  const handleEventClick = async (clickInfo) => {
    const ev = clickInfo.event;
    const action = prompt('무엇을 하시겠어요?\n1: 감상평 수정\n2: 삭제\n(취소: Esc)', '1');
    if (!action) return;

    // 수정
    if (action === '1') {
      const current = ev.extendedProps.review || '';
      const review = prompt('감상평 입력/수정', current);
      if (review == null) return;

      if (!ev.id) {
        alert('방금 추가한 항목은 새로고침 후 수정 가능해요(서버 id 필요)');
        return;
      }

      try {
        await fetch('/api/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: Number(ev.id),
            title: ev.title,
            date: ev.startStr?.slice(0, 10) || ev.extendedProps.date || ev.extendedProps?.date || '',
            extendedProps: { ...ev.extendedProps, review },
          }),
        });
        ev.setExtendedProp('review', review);
        alert('수정 완료!');
      } catch (err) {
        console.error('Error updating event:', err);
        alert('수정 실패');
      }
    }

    // 삭제
    if (action === '2') {
      if (!window.confirm('정말 삭제할까요?')) return;

      if (!ev.id) {
        // id가 없으면 클라이언트에서만 제거
        ev.remove();
        setEvents((prev) => prev.filter((e) => e !== ev));
        return;
      }

      try {
        await fetch('/api/events', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: Number(ev.id) }),
        });
        ev.remove();
        alert('삭제 완료!');
      } catch (err) {
        console.error('Error deleting event:', err);
        alert('삭제 실패');
      }
    }
  };

  return (
    <div className="App">
      <h1>ferarchive</h1>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        timeZone="local"            // ✅ 로컬 기준으로 표시
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventContent={(arg) => {
          // 셀 안에서 줄바꿈 유지
          return { html: arg.event.title.replace(/\n/g, '<br/>') };
        }}
        height="auto"
      />
    </div>
  );
}

export default App;
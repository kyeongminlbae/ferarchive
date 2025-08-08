import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import './App.css';


function App() {
  const [events, setEvents] = useState(() => {
  const saved = localStorage.getItem('movieEvents');
  return saved ? JSON.parse(saved) : [];
});
  const isInitialLoad = useRef(true); // ✅ 초기 로드 여부 체크

  // 1️⃣ 새로고침 시 localStorage에서 불러오기
  useEffect(() => {
    const savedEvents = localStorage.getItem('movieEvents');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
      console.log("📂 불러옴:", JSON.parse(savedEvents));
    }
    isInitialLoad.current = false; // 불러오기 끝
  }, []);

  // 2️⃣ events가 변경될 때만 저장 (단, 초기 로드 직후는 제외)
  useEffect(() => {
      localStorage.setItem('movieEvents', JSON.stringify(events));
      console.log("💾 저장됨:", events);
  }, [events]);

  // 날짜 클릭 시 영화 기록 추가
  const handleDateClick = (arg) => {
    const title = prompt('🎬 영화 제목을 입력하세요:');
    if (!title) return;

    const director = prompt('🎬 감독, 작가, 연출은 누구인가요? (쉼표로 구분)');
    const actors = prompt('🎭 배우는 누구인가요? (쉼표로 구분)');
    const review = prompt('📝 한 줄 감상평을 입력해주세요:');

    const fullTitle = `${title}
🎬 감독: ${director || "없음"}
🧑‍🎤 배우: ${actors || "없음"}
⭐ 감상평: ${review || "없음"}`;

    setEvents([
      ...events,
      {
        title: fullTitle,
        date: arg.dateStr,
        extendedProps: {
          director,
          actor: actors,
          review,
        },
      },
    ]);
  };

  // 이벤트 클릭 시 수정/삭제
  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    const action = prompt(
      `📌 '${event.title.split("\n")[0]}'을(를) 어떻게 할까요?\n\n1: 수정\n2: 삭제\n\n번호를 입력하세요 (취소하려면 ESC)`
    );

    if (action === '1') {
      const currentTitle = event.title.split("\n")[0].trim();
      const currentDirector = prompt('🎬 감독, 작가, 연출을 수정하세요:', event.extendedProps?.director || "");
      const currentActor = prompt('🎭 배우를 수정하세요:', event.extendedProps?.actor || "");
      const currentReview = prompt('📝 감상평을 수정하세요:', event.extendedProps?.review || "");

      const newTitle = `${currentTitle}
🎬 감독: ${currentDirector || "없음"}
🧑‍🎤 배우: ${currentActor || "없음"}
⭐ 감상평: ${currentReview || "없음"}`;

      setEvents((prevEvents) =>
        prevEvents.map((ev) =>
          ev.date === event.startStr && ev.title === event.title
            ? {
                ...ev,
                title: newTitle,
                extendedProps: {
                  director: currentDirector,
                  actor: currentActor,
                  review: currentReview,
                },
              }
            : ev
        )
      );
    } else if (action === '2') {
      if (window.confirm("정말로 삭제하시겠어요? 🗑️")) {
        setEvents((prevEvents) =>
          prevEvents.filter(
            (ev) => !(ev.date === event.startStr && ev.title === event.title)
          )
        );
      }
    }
  };

  return (
    <div className="App">
      <h1>🎞️ 영화 기록장</h1>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventContent={(arg) => {
          return { html: arg.event.title.replace(/\n/g, "<br/>") };
        }}
        height="auto"
      />
    </div>
  );
}

export default App;
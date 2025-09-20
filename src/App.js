import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import './App.css';

function App() {
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('movieEvents');
    return saved ? JSON.parse(saved) : [];
  });

  // 2️⃣ events가 변경될 때만 저장
  useEffect(() => {
    localStorage.setItem('movieEvents', JSON.stringify(events));
    console.log("💾 저장됨:", events);
  }, [events]);

  // 날짜 클릭 시 카테고리 선택 후 기록 추가
  const handleDateClick = (arg) => {
    const categoryOption = prompt(
      '어떤 기록을 남기시겠어요?\n\n1: 영화 🎬\n2: 책 📚\n3: 전시 🖼️\n\n번호를 입력하세요 (취소하려면 ESC)'
    );

    if (!categoryOption) return; // 취소 버튼을 누르면 종료

    let title, creator, actorsOrAuthor, review;
    let categoryTitle = ""; // 이벤트 제목에 표시될 카테고리

    switch (categoryOption) {
      case '1': // 영화
        title = prompt('🎬 영화 제목을 입력하세요:');
        if (!title) return;
        creator = prompt('🎬 감독, 작가, 연출은 누구인가요? (쉼표로 구분)');
        actorsOrAuthor = prompt('🎭 배우는 누구인가요? (쉼표로 구분)');
        review = prompt('📝 한 줄 감상평을 입력해주세요:');
        categoryTitle = "영화";
        break;

      case '2': // 책
        title = prompt('📚 책 제목을 입력하세요:');
        if (!title) return;
        creator = prompt('🧑‍💻 작가는 누구인가요?');
        actorsOrAuthor = prompt('📖 출판사는 어디인가요?');
        review = prompt('📝 한 줄 감상평을 입력해주세요:');
        categoryTitle = "책";
        break;

      case '3': // 전시
        title = prompt('🖼️ 전시 제목을 입력하세요:');
        if (!title) return;
        creator = prompt('🎨 작가, 기획자는 누구인가요?');
        actorsOrAuthor = prompt('🏛️ 장소는 어디인가요?');
        review = prompt('📝 한 줄 감상평을 입력해주세요:');
        categoryTitle = "전시";
        break;

      default:
        alert('잘못된 번호를 입력하셨습니다. 다시 시도해주세요.');
        return;
    }

    const fullTitle = `${title}
${categoryTitle === "영화" ? "🎬 감독" : categoryTitle === "책" ? "🧑‍💻 작가" : "🎨 작가, 기획자"}: ${creator || "없음"}
${categoryTitle === "영화" ? "🧑‍🎤 배우" : categoryTitle === "책" ? "📖 출판사" : "🏛️ 장소"}: ${actorsOrAuthor || "없음"}
⭐ 감상평: ${review || "없음"}`;

    setEvents([
      ...events,
      {
        title: fullTitle,
        date: arg.dateStr,
        extendedProps: {
          category: categoryTitle, // ✅ 카테고리 정보 추가
          creator,
          actorsOrAuthor,
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

    if (!action) return;

    // 현재 이벤트의 카테고리 가져오기
    const currentCategory = event.extendedProps?.category;
    const currentTitle = event.title.split("\n")[0].trim();

    if (action === '1') {
      let updatedCreator, updatedActorsOrAuthor, updatedReview;
      let promptCreator, promptActorsOrAuthor;

      // 카테고리에 따라 프롬프트 문구 변경
      if (currentCategory === "영화") {
        promptCreator = '🎬 감독, 작가, 연출을 수정하세요:';
        promptActorsOrAuthor = '🎭 배우를 수정하세요:';
      } else if (currentCategory === "책") {
        promptCreator = '🧑‍💻 작가를 수정하세요:';
        promptActorsOrAuthor = '📖 출판사를 수정하세요:';
      } else { // 전시
        promptCreator = '🎨 작가, 기획자를 수정하세요:';
        promptActorsOrAuthor = '🏛️ 장소를 수정하세요:';
      }

      updatedCreator = prompt(promptCreator, event.extendedProps?.creator || "");
      updatedActorsOrAuthor = prompt(promptActorsOrAuthor, event.extendedProps?.actorsOrAuthor || "");
      updatedReview = prompt('📝 감상평을 수정하세요:', event.extendedProps?.review || "");

      const newTitle = `${currentTitle}
${currentCategory === "영화" ? "🎬 감독" : currentCategory === "책" ? "🧑‍💻 작가" : "🎨 작가, 기획자"}: ${updatedCreator || "없음"}
${currentCategory === "영화" ? "🧑‍🎤 배우" : currentCategory === "책" ? "📖 출판사" : "🏛️ 장소"}: ${updatedActorsOrAuthor || "없음"}
⭐ 감상평: ${updatedReview || "없음"}`;

      setEvents((prevEvents) =>
        prevEvents.map((ev) =>
          ev.date === event.startStr && ev.title === event.title
            ? {
                ...ev,
                title: newTitle,
                extendedProps: {
                  category: currentCategory,
                  creator: updatedCreator,
                  actorsOrAuthor: updatedActorsOrAuthor,
                  review: updatedReview,
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
      <h1>🎞️ 영화, 책, 전시 기록장</h1>
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
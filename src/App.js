import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import './App.css';

// ✅ 모달 컴포넌트
const DetailModal = ({ event, onClose }) => {
  if (!event) return null;

  // 확장 속성에서 카테고리에 맞는 제목 추출
  const getLabel = (category) => {
    switch(category) {
      case '영화': return '감독, 연출, 작가';
      case '책': return '작가';
      case '전시': return '작가, 기획자';
      default: return '';
    }
  };

  const getSubLabel = (category) => {
    switch(category) {
      case '영화': return '배우';
      case '책': return '출판사';
      case '전시': return '장소';
      default: return '';
    }
  };

  const mainTitle = event.title.split('\n')[0];
  const creatorLabel = getLabel(event.extendedProps.category);
  const actorsOrAuthorLabel = getSubLabel(event.extendedProps.category);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        <div className="modal-header">
          <h2>{mainTitle}</h2>
          <p className="modal-category">{event.extendedProps.category}</p>
        </div>
        <div className="modal-body">
          <div className="modal-section">
            <p><strong>{creatorLabel}:</strong> {event.extendedProps.creator || '없음'}</p>
            <p><strong>{actorsOrAuthorLabel}:</strong> {event.extendedProps.actorsOrAuthor || '없음'}</p>
          </div>
          <hr />
          <div className="modal-section review-section">
            <h3>나의 감상평</h3>
            <p>{event.extendedProps.review || '없음'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('movieEvents');
    return saved ? JSON.parse(saved) : [];
  });
  // ✅ 모달 관련 상태
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

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
          category: categoryTitle, 
          creator,
          actorsOrAuthor,
          review,
        },
      },
    ]);
  };

  // ✅ 이벤트 클릭 시 모달 띄우기
  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    // 이벤트 클릭 시 바로 모달을 띄우고, 모달 내부에서 수정/삭제 기능 제공
    setSelectedEvent(event);
    setShowModal(true);
  };
  
  // 모달 닫기
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };
  
  // 모달 내부에서 수정
  const handleEdit = () => {
    const currentCategory = selectedEvent.extendedProps?.category;
    const currentTitle = selectedEvent.title.split("\n")[0].trim();
    let updatedCreator, updatedActorsOrAuthor, updatedReview;
    let promptCreator, promptActorsOrAuthor;
  
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
  
    updatedCreator = prompt(promptCreator, selectedEvent.extendedProps?.creator || "");
    updatedActorsOrAuthor = prompt(promptActorsOrAuthor, selectedEvent.extendedProps?.actorsOrAuthor || "");
    updatedReview = prompt('📝 감상평을 수정하세요:', selectedEvent.extendedProps?.review || "");

    if (!updatedCreator && !updatedActorsOrAuthor && !updatedReview) return;
  
    const newTitle = `${currentTitle}
${currentCategory === "영화" ? "🎬 감독" : currentCategory === "책" ? "🧑‍💻 작가" : "🎨 작가, 기획자"}: ${updatedCreator || "없음"}
${currentCategory === "영화" ? "🧑‍🎤 배우" : currentCategory === "책" ? "📖 출판사" : "🏛️ 장소"}: ${updatedActorsOrAuthor || "없음"}
⭐ 감상평: ${updatedReview || "없음"}`;
  
    setEvents((prevEvents) =>
      prevEvents.map((ev) =>
        ev.date === selectedEvent.startStr && ev.title === selectedEvent.title
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
    handleCloseModal(); // 수정 후 모달 닫기
  };
  
  // 모달 내부에서 삭제
  const handleDelete = () => {
    if (window.confirm("정말로 삭제하시겠어요? 🗑️")) {
      setEvents((prevEvents) =>
        prevEvents.filter(
          (ev) => !(ev.date === selectedEvent.startStr && ev.title === selectedEvent.title)
        )
      );
      handleCloseModal(); // 삭제 후 모달 닫기
    }
  };
  

  return (
    <div className="App">
      <h1>🎞️ ferarchive</h1>
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
      {showModal && (
        <DetailModal
          event={selectedEvent}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default App;
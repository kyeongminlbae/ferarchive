// ferarchive/src/App.js

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import './App.css';

// ✅ 모달 컴포넌트 (이전과 동일)
const DetailModal = ({ event, onClose }) => {
  if (!event) return null;

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
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // ✅ 1. 컴포넌트 로드 시 API에서 데이터 가져오기
  useEffect(() => {
    fetch('/api/events')
      .then(response => response.json())
      .then(data => {
        // API에서 가져온 데이터 형식에 맞게 변환
        const formattedEvents = data.map(event => ({
          title: event.title,
          date: event.date,
          extendedProps: event.extendedprops
        }));
        setEvents(formattedEvents);
        console.log("📂 API에서 불러옴:", formattedEvents);
      })
      .catch(error => console.error("Error fetching events:", error));
  }, []);

  // ✅ 2. 새로운 기록 추가 시 API에 데이터 전송하기
  const handleDateClick = async (arg) => {
    const categoryOption = prompt(
      '어떤 기록을 남기시겠어요?\n\n1: 영화 🎬\n2: 책 📚\n3: 전시 🖼️\n\n번호를 입력하세요 (취소하려면 ESC)'
    );
    // ... (기존 로직과 동일, 데이터베이스에 저장할 정보만 준비)
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

    const newEvent = {
      title: fullTitle,
      date: arg.dateStr,
      extendedProps: {
        category: categoryTitle, 
        creator,
        actorsOrAuthor,
        review,
      },
    };

    // ✅ API에 POST 요청 보내기
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      });
      // 성공 시 상태 업데이트
      setEvents((prevEvents) => [...prevEvents, newEvent]);
      console.log("💾 데이터베이스에 저장됨:", newEvent);
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  // ✅ 이벤트 클릭 시 모달 띄우기 (이전과 동일)
  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    setSelectedEvent(event);
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
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
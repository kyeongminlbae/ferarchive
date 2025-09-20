// ferarchive/src/App.js

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import './App.css';

// ✅ 모달 컴포넌트
const DetailModal = ({ event, onClose }) => {
  if (!event) return null;

  const getLabel = (category) => {
    switch (category) {
      case '영화': return '감독, 연출, 작가';
      case '책': return '작가';
      case '전시': return '작가, 기획자';
      default: return '';
    }
  };

  const getSubLabel = (category) => {
    switch (category) {
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
        console.log('📂 API에서 불러옴:', formatted);
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };

    load();
  }, []);

  // ✅ 2. 새로운 기록 추가 (POST)
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
        alert('잘못된 번호를 입력하셨습니다. 다시 시도해주세요.');
        return;
    }

    const newEvent = {
      title,
      date: arg.dateStr,
      extendedProps: {
        category: categoryTitle,
        creator,
        actorsOrAuthor,
        review,
      },
    };

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      setEvents((prev) => [...prev, newEvent]);
      console.log("💾 데이터베이스에 저장됨:", newEvent);
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  // ✅ 3. 이벤트 클릭 → 수정 / 삭제
  const handleEventClick = async (clickInfo) => {
    const ev = clickInfo.event;

    const action = prompt('무엇을 하시겠어요?\n1: 감상평 수정\n2: 삭제\n(취소하려면 Esc)', '1');
    if (!action) return;

    // 수정
    if (action === '1') {
      const current = ev.extendedProps.review || '';
      const review = prompt('감상평을 입력/수정하세요', current);
      if (review == null) return;

      try {
        await fetch('/api/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: Number(ev.id),
            title: ev.title,
            date: ev.startStr?.slice(0, 10) || ev.extendedProps.date || '',
            extendedProps: { ...ev.extendedProps, review }
          })
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

      try {
        await fetch('/api/events', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: Number(ev.id) })
        });

        ev.remove();
        alert('삭제 완료!');
      } catch (err) {
        console.error('Error deleting event:', err);
        alert('삭제 실패');
      }
    }
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
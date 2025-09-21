// api/events.js
// Vercel 서버리스 함수 (CommonJS)
// DB: @vercel/postgres (Neon 연결), 환경변수: POSTGRES_URL

const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  try {
    // 테이블 없으면 생성
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        date DATE NOT NULL,
        extendedprops JSONB
      );
    `;

    // GET: 전체 가져오기
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT
          id, title, date,
          extendedprops AS "extendedProps"
        FROM events
        ORDER BY id DESC;
      `;
      return res.status(200).json(rows);
    }

    // POST: 새로 추가
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { title, date, extendedProps } = body || {};
      if (!title || !date) return res.status(400).json({ error: 'title, date는 필수입니다.' });

      await sql`
        INSERT INTO events (title, date, extendedprops)
        VALUES (${title}, ${date}, ${JSON.stringify(extendedProps || {})}::jsonb);
      `;
      return res.status(200).json({ ok: true });
    }

    // PUT: 수정 (전체 교체 방식)
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, title, date, extendedProps } = body || {};
      if (!id) return res.status(400).json({ error: 'id는 필수입니다.' });

      await sql`
        UPDATE events
        SET
          title = ${title},
          date = ${date},
          extendedprops = ${JSON.stringify(extendedProps || {})}::jsonb
        WHERE id = ${id};
      `;
      return res.status(200).json({ ok: true });
    }

    // DELETE: 삭제
    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id } = body || {};
      if (!id) return res.status(400).json({ error: 'id는 필수입니다.' });

      await sql`DELETE FROM events WHERE id = ${id};`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
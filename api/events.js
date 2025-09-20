// ferarchive/api/events.js
const { sql } = require('@vercel/postgres');

module.exports = async (req, res) => {
  try {
    // 테이블 없으면 생성
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT,
        date DATE,
        extendedprops JSONB
      );
    `;

    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT id, title, date, extendedprops AS "extendedProps"
        FROM events
        ORDER BY id DESC;
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { title, date, extendedProps } = body || {};
      if (!title || !date) return res.status(400).json({ error: 'title과 date는 필수입니다.' });

      await sql`
        INSERT INTO events (title, date, extendedprops)
        VALUES (${title}, ${date}, ${JSON.stringify(extendedProps || {})}::jsonb);
      `;
      return res.status(200).json({ ok: true });
    }

    // ✅ 수정
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, title, date, extendedProps } = body || {};
      if (!id) return res.status(400).json({ error: 'id는 필수입니다.' });

      // 간단하게 전체 필드 교체 방식 (부분 수정 필요하면 말해줘)
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

    // ✅ 삭제
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
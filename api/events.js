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

      // 🔁 여기! sql.json 대신 JSON 문자열 + ::jsonb 캐스팅 사용
      await sql`
        INSERT INTO events (title, date, extendedprops)
        VALUES (${title}, ${date}, ${JSON.stringify(extendedProps || {})}::jsonb);
      `;

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
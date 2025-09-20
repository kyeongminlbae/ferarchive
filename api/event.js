// ferarchive/api/events.js

import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  try {
    const { method } = request;

    // GET 요청: 모든 이벤트 데이터 가져오기
    if (method === 'GET') {
      const { rows } = await sql`SELECT * FROM events;`;
      return response.status(200).json(rows);
    }
    
    // POST 요청: 새로운 이벤트 데이터 추가하기
    if (method === 'POST') {
      const { title, date, extendedProps } = request.body;
      await sql`INSERT INTO events (title, date, extendedProps) VALUES (${title}, ${date}, ${extendedProps});`;
      return response.status(200).json({ message: 'Event added successfully' });
    }

    return response.status(405).json({ message: 'Method Not Allowed' });

  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
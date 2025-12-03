import fs from 'fs';
import path from 'path';
const { getPool } = require('../../../lib/db');

const sharedFile = path.join(process.cwd(), 'data', 'uploads', 'typing', 'shared.json');

async function readShared() {
  try {
    const raw = await fs.promises.readFile(sharedFile, 'utf8');
    const j = JSON.parse(raw || '{}');
    return j;
  } catch (e) {
    return { beginner: [], practice: [] };
  }
}

async function writeShared(obj) {
  await fs.promises.mkdir(path.dirname(sharedFile), { recursive: true });
  await fs.promises.writeFile(sharedFile, JSON.stringify(obj, null, 2), 'utf8');
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Try to read from DB first; fall back to filesystem
    try {
      const pool = await getPool();
      const [rows] = await pool.query('SELECT id, title, text, category, visible, savedAt FROM typing_shared ORDER BY savedAt DESC');
      const obj = { beginner: [], practice: [] };
      for (const r of rows) {
        const cat = (r.category === 'beginner') ? 'beginner' : 'practice';
        obj[cat].push({ id: r.id, title: r.title, text: r.text, visible: !!r.visible, savedAt: (r.savedAt ? new Date(r.savedAt).toISOString() : null) });
      }
      return res.json(obj);
    } catch (e) {
      // fallback to file
      const j = await readShared();
      return res.json(j);
    }
  }

  if (req.method === 'POST') {
    // create new shared item in category
    const { text, title, visible, category } = req.body || {};
    const cat = category === 'beginner' ? 'beginner' : 'practice';
    try {
      const id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
      // MySQL DATETIME requires 'YYYY-MM-DD HH:MM:SS' (no timezone). Convert to compatible format.
      const savedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const item = { id, title: title || '', text: text || '', visible: !!visible, savedAt };
      // try DB insert
      try {
        const pool = await getPool();
        await pool.query('INSERT INTO typing_shared (id, title, text, category, visible, savedAt) VALUES (?, ?, ?, ?, ?, ?)', [id, item.title, item.text, cat, item.visible ? 1 : 0, item.savedAt]);
        return res.json({ ok: true, item });
      } catch (dbErr) {
        // fallback to file storage
        const obj = await readShared();
        if (!Array.isArray(obj[cat])) obj[cat] = [];
        obj[cat].unshift(item);
        await writeShared(obj);
        return res.json({ ok: true, item, fallback: true });
      }
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'server error' });
    }
  }

  if (req.method === 'PUT') {
    // update existing shared item
    const { id, text, title, visible, category } = req.body || {};
    if (!id) return res.status(400).json({ error: 'missing id' });
    const cat = category === 'beginner' ? 'beginner' : 'practice';
    try {
      // try DB update first
      try {
        const pool = await getPool();
        const savedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await pool.query('UPDATE typing_shared SET title = ?, text = ?, visible = ?, category = ?, savedAt = ? WHERE id = ?', [title, text, visible ? 1 : 0, cat, savedAt, id]);
        return res.json({ ok: true, item: { id, title, text, visible: !!visible, category: cat, savedAt } });
      } catch (dbErr) {
        // fallback to file
        const obj = await readShared();
        if (!Array.isArray(obj[cat])) obj[cat] = [];
        const idx = obj[cat].findIndex(it => it.id === id);
        if (idx === -1) return res.status(404).json({ error: 'not found' });
        obj[cat][idx] = { ...obj[cat][idx], title: title || obj[cat][idx].title, text: text || obj[cat][idx].text, visible: typeof visible === 'boolean' ? visible : obj[cat][idx].visible, savedAt: new Date().toISOString() };
        await writeShared(obj);
        return res.json({ ok: true, item: obj[cat][idx], fallback: true });
      }
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'server error' });
    }
  }

  if (req.method === 'DELETE') {
    // delete by id and category
    const { id, category } = req.body || {};
    if (!id) return res.status(400).json({ error: 'missing id' });
    const cat = category === 'beginner' ? 'beginner' : 'practice';
    try {
      try {
        const pool = await getPool();
        await pool.query('DELETE FROM typing_shared WHERE id = ?', [id]);
        return res.json({ ok: true });
      } catch (dbErr) {
        const obj = await readShared();
        if (!Array.isArray(obj[cat])) obj[cat] = [];
        const idx = obj[cat].findIndex(it => it.id === id);
        if (idx === -1) return res.status(404).json({ error: 'not found' });
        obj[cat].splice(idx, 1);
        await writeShared(obj);
        return res.json({ ok: true, fallback: true });
      }
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'server error' });
    }
  }

  return res.status(405).json({ error: 'method not allowed' });
}

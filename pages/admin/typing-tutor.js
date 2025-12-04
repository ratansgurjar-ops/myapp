import React, { useEffect, useState } from 'react';

export default function AdminTypingTutor() {
  const [users, setUsers] = useState([]);
  const [sharedText, setSharedText] = useState('');
  const [sharedTitle, setSharedTitle] = useState('');
  const [sharedVisible, setSharedVisible] = useState(true);
  const [sharedObj, setSharedObj] = useState({});
  const [selectedSharedCategory, setSelectedSharedCategory] = useState('practice');
  const [editingId, setEditingId] = useState('');
  const [msg, setMsg] = useState('');
  const beginnerLessons = (() => {
    const L = {};
    L['L1'] = 'f j'; L['L2'] = 'd k'; L['L3'] = 's l'; L['L4'] = 'a ;'; L['L5'] = 'a s d f';
    L['L6'] = 'j k l ;'; L['L7'] = 'g h'; L['L8'] = L['L5'] + ' g'; L['L9'] = L['L6'] + ' h';
    L['L10'] = 'a s d f j k l ;';
    return Object.keys(L).sort((a,b)=>parseInt(a.slice(1))-parseInt(b.slice(1))).map(k=>({ key:k, label:`${k}: ${L[k]}`, text:L[k]}));
  })();
  

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/typing/users');
      const j = await res.json();
      setUsers(j.items || []);
    } catch (e) { setUsers([]); }
  };

  const fetchShared = async () => {
    try {
      const res = await fetch('/api/typing/shared');
      const j = await res.json();
      setSharedObj(j || {});
      const sList = (j && j[selectedSharedCategory]) || [];
      const first = Array.isArray(sList) && sList.length > 0 ? sList[0] : null;
      setSharedText(first ? first.text : '');
      setSharedTitle(first ? first.title : '');
      setSharedVisible(first ? !!first.visible : true);
    } catch (e) {}
  };

  useEffect(()=>{ fetchUsers(); fetchShared(); }, []);
  
  useEffect(() => {
    const s = (sharedObj && sharedObj[selectedSharedCategory]) || [];
    const first = Array.isArray(s) ? (s[0] || null) : null;
    setSharedText(first ? first.text : '');
    setSharedTitle(first ? first.title : '');
    setSharedVisible(first ? !!first.visible : true);
  }, [selectedSharedCategory, sharedObj]);

  const saveShared = async () => {
    try {
      let res;
      if (editingId) {
        res = await fetch('/api/typing/shared', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id: editingId, text: sharedText, title: sharedTitle, visible: sharedVisible, category: selectedSharedCategory }) });
      } else {
        res = await fetch('/api/typing/shared', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ text: sharedText, title: sharedTitle, visible: sharedVisible, category: selectedSharedCategory }) });
      }
      const j = await res.json();
      if (j && j.ok) {
        setMsg(editingId ? 'Updated shared exercise' : 'Saved shared exercise');
        // clear inputs after successful save/update
        setEditingId('');
        setSharedTitle('');
        setSharedText('');
        setSharedVisible(true);
        fetchShared();
      } else setMsg('Error saving');
    } catch (e) { setMsg('Error saving'); }
  };

  

  return (
    <div className="container layout">
      <main style={{ flex:1 }}>
        <h2>Admin — Typing Tutor</h2>
        <div style={{ marginTop:12 }}>
          <div style={{ fontWeight:600 }}>Users</div>
          <div style={{ marginTop:8 }}>
            {users.length === 0 && <div style={{ color:'#666' }}>No users</div>}
            {users.map(u => (
              <div key={u.username} style={{ padding:8, border:'1px solid #eee', borderRadius:6, marginBottom:6, display:'flex', justifyContent:'space-between' }}>
                <div><strong>{u.username}</strong> {u.displayName ? ` — ${u.displayName}` : ''}</div>
                <div style={{ color:'#666' }}>{u.count} practices</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop:20 }}>
          <div style={{ fontWeight:600 }}>Shared Manual Content (visible to all users)</div>
          <input placeholder="Shared title" value={sharedTitle} onChange={e=>setSharedTitle(e.target.value)} style={{ width:'100%', padding:8, marginTop:8 }} />
          <textarea rows={6} value={sharedText} onChange={e=>setSharedText(e.target.value)} style={{ width:'100%', padding:8, marginTop:8 }} />
          {/* Live counts for the shared text: words, characters, 5-char units */}
          <div style={{ marginTop:8, fontSize:13, color:'#444' }}>
            {(() => {
              const s = sharedText || '';
              const chars = s.length;
              const words = (s.trim().length === 0) ? 0 : (s.trim().match(/\S+/g) || []).length;
              const units = Math.ceil(chars / 5);
              return `${words} words · ${chars} characters · ${units} units (5‑char)`;
            })()}
          </div>
          <div style={{ marginTop:8 }}>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <label style={{ display:'inline-flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={sharedVisible} onChange={e=>setSharedVisible(e.target.checked)} /> Visible</label>
              <label style={{ marginLeft:12 }}>Category:</label>
              <select value={selectedSharedCategory} onChange={e=>setSelectedSharedCategory(e.target.value)} style={{ padding:6 }}>
                <option value="beginner">Beginner</option>
                <option value="practice">Practice</option>
              </select>
              <button onClick={saveShared} style={{ marginLeft:12 }}>{editingId ? 'Update Shared Exercise' : 'Save Shared Exercise'}</button>
              {editingId && <button onClick={() => { setEditingId(''); fetchShared(); setMsg('Edit cancelled'); }} style={{ marginLeft:8 }}>Cancel</button>}
              {msg && <span style={{ marginLeft:12 }}>{msg}</span>}
            </div>
          </div>

          <div style={{ marginTop:20 }}>
            <div style={{ fontWeight:600 }}>Saved Shared Exercises ({selectedSharedCategory})</div>
            <div style={{ marginTop:8 }}>
              {(!Array.isArray(sharedObj[selectedSharedCategory]) || sharedObj[selectedSharedCategory].length === 0) && (
                <div style={{ color:'#666' }}>No shared exercises for this category</div>
              )}
              {Array.isArray(sharedObj[selectedSharedCategory]) && sharedObj[selectedSharedCategory].length > 0 && (
                <table style={{ width:'100%', borderCollapse:'collapse', marginTop:8 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign:'left', borderBottom:'1px solid #ddd', padding:6 }}>Title</th>
                      <th style={{ textAlign:'left', borderBottom:'1px solid #ddd', padding:6 }}>Visible</th>
                      <th style={{ textAlign:'right', borderBottom:'1px solid #ddd', padding:6 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sharedObj[selectedSharedCategory].map(item => (
                      <tr key={item.id}>
                        <td style={{ padding:6, borderBottom:'1px solid #f5f5f5' }}>{item.title}</td>
                        <td style={{ padding:6, borderBottom:'1px solid #f5f5f5' }}>{item.visible ? 'Yes' : 'No'}</td>
                        <td style={{ padding:6, borderBottom:'1px solid #f5f5f5', textAlign:'right' }}>
                          <button onClick={() => {
                            setEditingId(item.id);
                            setSharedTitle(item.title || '');
                            setSharedText(item.text || '');
                            setSharedVisible(!!item.visible);
                            setSelectedSharedCategory(selectedSharedCategory);
                          }} style={{ marginRight:8 }}>Edit</button>
                          <button onClick={async () => {
                            if (!confirm('Delete this shared exercise?')) return;
                            try {
                              const res = await fetch('/api/typing/shared', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id: item.id, category: selectedSharedCategory }) });
                              const j = await res.json();
                              if (j && j.ok) { setMsg('Deleted'); fetchShared(); }
                              else setMsg('Error deleting');
                            } catch (e) { setMsg('Error deleting'); }
                          }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

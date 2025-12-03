import React, { useState } from 'react';

export default function AdminRegister(){
  const [status, setStatus] = useState('');

  async function submit(ev){
    ev && ev.preventDefault();
    setStatus('Registering...');
    const form = ev.target;
    const email = form.email.value;
    const password = form.password.value;
    const secretAnswer = form.secretAnswer.value;
    try{
      const res = await fetch('/api/admin/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, secretAnswer }), credentials: 'same-origin' });
      const j = await res.json().catch(()=>null);
      if(!res.ok) return setStatus(j && j.error ? j.error : `Register failed: ${res.status}`);
      setStatus('Registered. You can now login.');
      setTimeout(()=>{ window.location.href = '/ad81188/admin/login'; }, 800);
    }catch(e){ console.error(e); setStatus('Network error'); }
  }

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
      <form onSubmit={submit} style={{width:420,padding:20,border:'1px solid #eee',borderRadius:6}}>
        <h3 style={{marginTop:0}}>Admin Register</h3>
        <div style={{marginBottom:8}}>
          <input name="email" placeholder="Email" style={{width:'100%',padding:8}} required />
        </div>
        <div style={{marginBottom:8}}>
          <input type="password" name="password" placeholder="Password" style={{width:'100%',padding:8}} required />
        </div>
        <div style={{marginBottom:12}}>
          <input name="secretAnswer" placeholder="First school name (security answer)" style={{width:'100%',padding:8}} required />
        </div>
        <div style={{display:'flex',gap:8}}>
          <button type="submit">Register</button>
          <div style={{marginLeft:8,color:'#666'}}>{status}</div>
        </div>
      </form>
    </div>
  );
}

import React, { useState } from 'react';

export default function AdminForgot(){
  const [status, setStatus] = useState('');

  async function submit(ev){
    ev && ev.preventDefault();
    setStatus('Processing...');
    const form = ev.target;
    const email = form.email.value;
    const securityAnswer = form.securityAnswer.value;
    const newPassword = form.newPassword.value;
    try{
      const res = await fetch('/api/admin/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, securityAnswer, newPassword }), credentials: 'same-origin' });
      const j = await res.json().catch(()=>null);
      if(!res.ok) return setStatus(j && j.error ? j.error : `Failed: ${res.status}`);
      if (j && j.token) {
        setStatus('Security answer correct. Use token to reset if needed.');
      } else {
        setStatus(j && j.message ? j.message : 'Password updated');
      }
    }catch(e){ console.error(e); setStatus('Network error'); }
  }

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
      <form onSubmit={submit} style={{width:420,padding:20,border:'1px solid #eee',borderRadius:6}}>
        <h3 style={{marginTop:0}}>Forgot / Reset Password</h3>
        <div style={{marginBottom:8}}>
          <input name="email" placeholder="Email" style={{width:'100%',padding:8}} required />
        </div>
        <div style={{marginBottom:8}}>
          <input name="securityAnswer" placeholder="First school name (security answer)" style={{width:'100%',padding:8}} required />
        </div>
        <div style={{marginBottom:12}}>
          <input type="password" name="newPassword" placeholder="New password (will be set if answer matches)" style={{width:'100%',padding:8}} />
        </div>
        <div style={{display:'flex',gap:8}}>
          <button type="submit">Submit</button>
          <div style={{marginLeft:8,color:'#666'}}>{status}</div>
        </div>
        <div style={{marginTop:12}}><a href="/ad81188/admin/login">Back to login</a></div>
      </form>
    </div>
  );
}

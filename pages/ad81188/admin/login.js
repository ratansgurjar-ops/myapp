import React, { useState } from 'react';

export default function AdminLogin() {
  const [status, setStatus] = useState('');

  async function submit(ev) {
    ev && ev.preventDefault();
    setStatus('Logging in...');
    const form = ev.target;
    const email = form.email.value;
    const password = form.password.value;
    try {
      const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), credentials: 'same-origin' });
      const j = await res.json().catch(() => null);
      if (!res.ok) return setStatus(j && j.error ? j.error : `Login failed: ${res.status}`);
      // success
      window.location.href = '/ad81188/admin/dashboard';
    } catch (e) {
      setStatus('Network error — login failed');
    }
  }

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
      <form onSubmit={submit} style={{width:360,padding:20,border:'1px solid #eee',borderRadius:6}}>
        <h3 style={{marginTop:0}}>Admin Login</h3>
        <div style={{marginBottom:8}}>
          <input name="email" placeholder="Email" style={{width:'100%',padding:8}} defaultValue={process.env.NEXT_PUBLIC_ADMIN_EMAIL || ''} />
        </div>
        <div style={{marginBottom:12}}>
          <input type="password" name="password" placeholder="Password" style={{width:'100%',padding:8}} />
        </div>
        <div style={{display:'flex',gap:8}}>
          <button type="submit">Login</button>
          <div style={{marginLeft:8,color:'#666'}}>{status}</div>
        </div>
        <div style={{marginTop:12,display:'flex',justifyContent:'space-between'}}>
          <a href="/ad81188/admin/register">Register</a>
          <a href="/ad81188/admin/forgot">Forgot password</a>
        </div>
      </form>
    </div>
  );
}

import { useRouter } from 'next/router';
import AdminTypingTutor from '../../admin/typing-tutor';

export default function Page(props) {
  const router = useRouter();
  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => router.push('/ad81188/admin/dashboard')} style={{ padding: '8px 12px' }}>&larr; Dashboard</button>
      </div>
      <AdminTypingTutor {...props} />
    </div>
  );
}

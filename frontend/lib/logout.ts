import { useRouter } from 'next/router';

export default function useLogout() {
    const router = useRouter();
  
    const handleLogout = async () => {
      const response = await fetch('/api/logout');
      const data = await response.json();
      if (data.ok) {
        router.push('/');
      } else {
        console.error('Failed to logout');
      }
    };
  
    return handleLogout;
}
  
  
  
  
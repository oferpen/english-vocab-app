'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/?loggedOut=true' });
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-600 hover:text-red-600 transition-colors"
      title="התנתק"
    >
      🚪
    </button>
  );
}

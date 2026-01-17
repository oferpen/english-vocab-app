'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-red-600 hover:text-red-800 underline"
    >
      התנתק
    </button>
  );
}

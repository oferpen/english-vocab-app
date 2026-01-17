'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/learn', label: 'ללמוד', icon: '📚' },
    { href: '/quiz', label: 'חידון', icon: '✏️' },
    { href: '/progress', label: 'התקדמות', icon: '⭐' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50">
      <div className="flex justify-around items-center h-16 md:h-20">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/learn' && pathname === '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                isActive 
                  ? 'text-primary-600 scale-110' 
                  : 'text-gray-500 hover:text-primary-500 hover:scale-105'
              }`}
            >
              <span className="text-2xl md:text-3xl mb-1 transition-transform duration-200">{item.icon}</span>
              <span className={`text-xs md:text-sm font-semibold ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

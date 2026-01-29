'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import {
    Zap, Star, LogOut, Shield, Map, Trophy, Users, Book,
    Settings, User as UserIcon
} from 'lucide-react';

interface ModernNavBarProps {
    childName: string;
    avatar: string;
    level: number;
    streak: number;
    xp: number;
    onOpenParentGate?: () => void;
}

export default function ModernNavBar({
    childName,
    avatar,
    level,
    streak,
    xp,
    onOpenParentGate
}: ModernNavBarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleParentClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onOpenParentGate) {
            onOpenParentGate();
        } else {
            // Fallback if no gate handler (though there should be)
            window.location.href = '/parent';
        }
    };

    return (
        <>
            {/* Desktop Sticky Top Bar */}
            <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 h-16 hidden md:flex items-center justify-between px-4 lg:px-8 shadow-sm transition-all duration-300">

                {/* Left: Logo/Brand */}
                <Link href="/learn/path" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shadow-sm border border-primary-200">
                        <Book className="w-6 h-6 text-primary-600" />
                    </div>
                    <span className="font-black text-xl text-neutral-800 tracking-tight">English<span className="text-primary-500">Path</span></span>
                </Link>

                {/* Center: Stats (Desktop) */}
                <div className="flex items-center gap-6">
                    {/* Level/XP */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-50 rounded-full border border-accent-200 hover:bg-accent-100 transition-colors cursor-help" title={`רמה ${level} - ${xp} נקודות`}>
                        <Star className="w-5 h-5 text-accent-500 fill-accent-500" />
                        <span className="font-black text-accent-700">{xp}</span>
                    </div>

                    {/* Streak */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-100/50 rounded-full border border-accent-200 hover:bg-accent-100 transition-colors cursor-help" title={`${streak} ימים ברציפות!`}>
                        <Zap className="w-5 h-5 text-accent-600 fill-accent-600" />
                        <span className="font-black text-accent-600">{streak}</span>
                    </div>
                </div>

                {/* Right: Profile & Actions */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/parent"
                        onClick={handleParentClick}
                        className="flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-primary-600 px-3 py-2 rounded-xl hover:bg-neutral-50 transition-all"
                    >
                        <Shield className="w-4 h-4" />
                        אזור הורים
                    </Link>

                    <div className="relative group">
                        <button
                            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-neutral-100 border border-transparent hover:border-neutral-200 transition-all"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <span className="font-black text-neutral-700">{childName}</span>
                            <div className="w-9 h-9 bg-neutral-200 rounded-full flex items-center justify-center shadow-sm border border-white ring-2 ring-neutral-50 relative overflow-hidden">
                                {avatar ? (
                                    (avatar.startsWith('/') || avatar.startsWith('http')) ? (
                                        <Image src={avatar} alt={childName} fill className="object-cover" />
                                    ) : (
                                        <span className="text-xl">{avatar}</span>
                                    )
                                ) : (
                                    <UserIcon className="w-5 h-5 text-neutral-500" />
                                )}
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        <div className={`absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-200 origin-top-left ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                            <div className="py-1">
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="w-full text-right px-4 py-3 text-sm font-bold text-danger-600 hover:bg-danger-50 flex items-center gap-2 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" /> התנתק
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Top Bar (Stats & Logo) */}
            <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-neutral-100 z-50 h-14 flex md:hidden items-center justify-between px-4 shadow-sm">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Book className="w-5 h-5 text-primary-600" />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-accent-50 px-2.5 py-1 rounded-full border border-accent-200 shadow-sm">
                        <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
                        <span className="font-black text-sm text-accent-700">{xp}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-accent-100/50 px-2.5 py-1 rounded-full border border-accent-200 shadow-sm">
                        <Zap className="w-4 h-4 text-accent-600 fill-accent-600" />
                        <span className="font-black text-sm text-accent-600">{streak}</span>
                    </div>
                </div>

                <div className="w-8"></div> {/* Spacer to center stats roughly */}
            </nav>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-neutral-100 z-50 h-16 flex md:hidden items-center justify-around pb-safe">
                <Link href="/learn/path" className="flex flex-col items-center justify-center w-full h-full text-primary-600 transition-all active:scale-90">
                    <Map className="w-6 h-6 mb-0.5" />
                    <span className="text-[10px] font-black tracking-tight">למידה</span>
                </Link>

                <button className="flex flex-col items-center justify-center w-full h-full text-neutral-300 hover:text-neutral-500 transition-all active:scale-90">
                    <Trophy className="w-6 h-6 mb-0.5" />
                    <span className="text-[10px] font-bold tracking-tight">הישגים</span>
                </button>

                <Link
                    href="/parent"
                    onClick={handleParentClick}
                    className="flex flex-col items-center justify-center w-full h-full text-neutral-400 hover:text-primary-600 transition-all active:scale-90"
                >
                    <Users className="w-6 h-6 mb-0.5" />
                    <span className="text-[10px] font-bold tracking-tight">הורים</span>
                </Link>

                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex flex-col items-center justify-center w-full h-full text-neutral-400 hover:text-danger-500 transition-all active:scale-90"
                >
                    <LogOut className="w-6 h-6 mb-0.5" />
                    <span className="text-[10px] font-bold tracking-tight">התנתק</span>
                </button>
            </nav>
        </>
    );
}

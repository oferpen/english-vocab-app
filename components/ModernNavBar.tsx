'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import {
    Zap, Star, LogOut, Book, User as UserIcon, ChevronDown, Sparkles
} from 'lucide-react';

interface ModernNavBarProps {
    name: string;
    avatar: string;
    level: number;
    streak: number;
    xp: number;
}

export default function ModernNavBar({
    name,
    avatar,
    level,
    streak,
    xp,
}: ModernNavBarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/?loggedOut=true' });
    };

    return (
        <>
            {/* Desktop Sticky Top Bar */}
            <nav className="fixed top-0 left-0 right-0 glass-premium !overflow-visible z-[100] h-20 hidden md:flex items-center justify-between px-8 lg:px-12 transition-all duration-500 shadow-2xl shadow-primary-500/10">

                {/* Left: Logo/Brand */}
                <Link href="/learn/path" className="flex items-center gap-4 hover:scale-105 transition-all duration-500 group">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:rotate-6 transition-transform">
                        <Book className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-3xl font-black tracking-tighter text-white drop-shadow-lg">EnglishPath</span>
                </Link>

                {/* Center: Stats (Desktop) */}
                <div className="flex items-center gap-6">
                    {/* Level/XP */}
                    <div className="flex items-center gap-3 px-5 py-2.5 glass-card rounded-2xl border-white/40 hover:scale-105 transition-all duration-300 group cursor-help glow-accent" title={`רמה ${level} - ${xp} נקודות`}>
                        <Star className="w-6 h-6 text-accent-400 fill-accent-400 group-hover:rotate-12 transition-transform" />
                        <span className="font-black text-neutral-800 text-lg drop-shadow-sm">{xp}</span>
                    </div>

                    {/* Streak */}
                    <div className="flex items-center gap-3 px-5 py-2.5 glass-card rounded-2xl border-white/40 hover:scale-105 transition-all duration-300 group cursor-help glow-primary" title={`${streak} ימים ברציפות!`}>
                        <Zap className="w-6 h-6 text-primary-400 fill-primary-400 group-hover:animate-pulse" />
                        <span className="font-black text-neutral-800 text-lg drop-shadow-sm">{streak}</span>
                    </div>
                </div>

                {/* Right: Profile & Actions */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button
                            className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 transition-all group active:scale-95"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <span className="font-black text-neutral-700 text-sm">{name}</span>
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm ring-2 ring-white overflow-hidden relative border border-neutral-100">
                                {avatar ? (
                                    (avatar.startsWith('/') || avatar.startsWith('http')) ? (
                                        <Image src={avatar} alt={name} fill sizes="32px" className="object-cover" />
                                    ) : (
                                        <span className="text-lg">{avatar}</span>
                                    )
                                ) : (
                                    <UserIcon className="w-4 h-4 text-neutral-500" />
                                )}
                            </div>
                            <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="absolute left-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-neutral-100 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                                <div className="p-1.5 border-t border-neutral-100 bg-neutral-50/20">
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-red-50 text-red-500 transition-all font-bold text-sm"
                                    >
                                        <LogOut className="w-5 h-5" /> התנתק
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Mobile Top Bar (Stats & Logo) */}
            <nav className="fixed top-0 left-0 right-0 glass-premium !overflow-visible z-[100] h-16 flex md:hidden items-center justify-between px-4 transition-all duration-500 shadow-2xl">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                    <Book className="w-6 h-6 text-white" />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-xl glow-primary">
                        <Sparkles className="w-4 h-4 text-primary-400" />
                        <span className="font-black text-neutral-800 text-sm">{level}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-xl glow-accent">
                        <Star className="w-4 h-4 text-accent-400 fill-accent-400" />
                        <span className="font-black text-neutral-800 text-sm">{xp}</span>
                    </div>
                </div>

                {/* Mobile Profile Switcher Trigger */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-9 h-9 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-200 active:scale-90 transition-transform overflow-hidden relative"
                >
                    {avatar ? (
                        (avatar.startsWith('/') || avatar.startsWith('http')) ? (
                            <Image src={avatar} alt={name} fill sizes="36px" className="object-cover" />
                        ) : (
                            <span className="text-xl">{avatar}</span>
                        )
                    ) : (
                        <UserIcon className="w-5 h-5 text-neutral-500" />
                    )}
                </button>
            </nav>

            {/* Mobile Profile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-[3rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[80vh] overflow-y-auto">
                        <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-8"></div>

                        <h2 className="text-xl font-black text-neutral-800 text-center mb-8">שלום {name}!</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="py-4 px-6 bg-neutral-100 rounded-2xl font-black text-neutral-600 active:scale-95 transition-transform"
                            >
                                ביטול
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="py-4 px-6 bg-red-50 text-red-600 rounded-2xl font-black active:scale-95 transition-transform"
                            >
                                התנתק
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 glass-premium z-50 h-16 flex md:hidden items-center justify-around pb-safe">
                <Link href="/learn/path" className="flex flex-col items-center justify-center w-full h-full text-primary-600 transition-all active:scale-90">
                    <Book className="w-6 h-6 mb-0.5" />
                    <span className="text-[10px] font-black tracking-tight">הרפתקה</span>
                </Link>

                <button
                    onClick={handleSignOut}
                    className="flex flex-col items-center justify-center w-full h-full text-neutral-400 hover:text-danger-500 transition-all active:scale-90"
                >
                    <LogOut className="w-6 h-6 mb-0.5" />
                    <span className="text-[10px] font-bold tracking-tight">התנתק</span>
                </button>
            </nav>
        </>
    );
}

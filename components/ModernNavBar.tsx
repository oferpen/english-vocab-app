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
    const [infoModal, setInfoModal] = useState<'xp' | 'streak' | 'level' | null>(null);

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
                    <button 
                        onClick={() => setInfoModal('xp')}
                        className="flex items-center gap-3 px-5 py-2.5 glass-card rounded-2xl border-white/40 hover:scale-105 transition-all duration-300 group glow-accent cursor-pointer"
                    >
                        <Star className="w-6 h-6 text-accent-400 fill-accent-400 group-hover:rotate-12 transition-transform" />
                        <span className="font-black text-white text-lg drop-shadow-sm">{xp}</span>
                    </button>

                    {/* Streak */}
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setInfoModal('streak');
                        }}
                        className="flex items-center gap-3 px-5 py-2.5 glass-card rounded-2xl border-white/40 hover:scale-105 transition-all duration-300 group glow-primary cursor-pointer"
                        style={{ pointerEvents: 'auto', zIndex: 10 }}
                    >
                        <Zap className="w-6 h-6 text-primary-400 fill-primary-400 group-hover:animate-pulse" />
                        <span className="font-black text-white text-lg drop-shadow-sm">{streak}</span>
                    </button>
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
            <nav className="fixed top-0 left-0 right-0 !overflow-visible z-[100] flex md:hidden items-center justify-between px-3 py-1.5 transition-all duration-500 shadow-2xl safe-top mobile-header" style={{ height: 'auto', minHeight: 'calc(3rem + env(safe-area-inset-top))' }}>
                <Link href="/learn/path" className="w-9 h-9 bg-gradient-to-br from-primary-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95 transition-transform">
                    <Book className="w-5 h-5 text-white" />
                </Link>

                <div className="flex items-center gap-2">
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setInfoModal('level');
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 glass-card rounded-lg glow-primary cursor-pointer active:scale-95 transition-transform"
                        style={{ pointerEvents: 'auto', zIndex: 10 }}
                    >
                        <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                        <span className="font-black text-white text-xs">{level}</span>
                    </button>
                    <button 
                        onClick={() => setInfoModal('xp')}
                        className="flex items-center gap-1.5 px-2 py-1 glass-card rounded-lg glow-accent cursor-pointer active:scale-95 transition-transform"
                    >
                        <Star className="w-3.5 h-3.5 text-accent-400 fill-accent-400" />
                        <span className="font-black text-white text-xs">{xp}</span>
                    </button>
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setInfoModal('streak');
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 glass-card rounded-lg glow-primary cursor-pointer active:scale-95 transition-transform"
                        style={{ pointerEvents: 'auto', zIndex: 10 }}
                    >
                        <Zap className="w-3.5 h-3.5 text-primary-400 fill-primary-400" />
                        <span className="font-black text-white text-xs">{streak}</span>
                    </button>
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

            {/* Info Modal */}
            {infoModal && (
                <div 
                    className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 flex items-center justify-center p-4"
                    onClick={() => setInfoModal(null)}
                >
                    <div 
                        className="glass-premium rounded-2xl p-6 md:p-8 max-w-md w-full border-white/30 shadow-2xl animate-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {infoModal === 'xp' && (
                            <>
                                <div className="flex items-center justify-center mb-4">
                                    <Star className="w-12 h-12 text-accent-400 fill-accent-400" />
                                </div>
                                <h3 className="text-2xl font-black text-white text-center mb-4">נקודות נסיון</h3>
                                <div className="space-y-3 text-white/90">
                                    <p className="text-center font-bold text-lg">רמה {level}</p>
                                    <p className="text-center text-lg">{xp} נקודות</p>
                                    <div className="pt-4 border-t border-white/20">
                                        <p className="text-sm text-white/70 text-center">
                                            אתה מקבל נקודות נסיון על כל מילה או אות שאתה לומד ומתרגל. ככל שאתה צובר יותר נקודות, אתה עולה ברמות!
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                        {infoModal === 'streak' && (
                            <>
                                <div className="flex items-center justify-center mb-4">
                                    <Zap className="w-12 h-12 text-primary-400 fill-primary-400" />
                                </div>
                                <h3 className="text-2xl font-black text-white text-center mb-4">רצף ימים</h3>
                                <div className="space-y-3 text-white/90">
                                    <p className="text-center font-bold text-lg">{streak} ימים ברציפות!</p>
                                    <div className="pt-4 border-t border-white/20">
                                        <p className="text-sm text-white/70 text-center">
                                            הרצף שלך נשמר כשאתה לומד או מתרגל כל יום. המשך כך כדי לשמור על הרצף שלך ולהרוויח בונוסים!
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                        {infoModal === 'level' && (
                            <>
                                <div className="flex items-center justify-center mb-4">
                                    <Sparkles className="w-12 h-12 text-primary-400 fill-primary-400" />
                                </div>
                                <h3 className="text-2xl font-black text-white text-center mb-4">רמה</h3>
                                <div className="space-y-3 text-white/90">
                                    <p className="text-center font-bold text-lg">רמה {level}</p>
                                    <p className="text-center text-lg">{xp} נקודות נסיון</p>
                                    <div className="pt-4 border-t border-white/20">
                                        <p className="text-sm text-white/70 text-center">
                                            הרמה שלך עולה ככל שאתה צובר יותר נקודות נסיון. כל רמה חדשה פותחת לך תוכן חדש ומאתגר יותר!
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                        <button
                            onClick={() => setInfoModal(null)}
                            className="mt-6 w-full bg-primary-500 hover:bg-primary-400 text-white py-3 rounded-xl font-black transition-all active:scale-95"
                        >
                            סגור
                        </button>
                    </div>
                </div>
            )}

        </>
    );
}

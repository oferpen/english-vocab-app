'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import {
    Zap, Star, LogOut, Shield, Map, Trophy, Users, Book,
    Settings, User as UserIcon, Plus, ChevronDown
} from 'lucide-react';
import { setActiveChild } from '@/app/actions/children';
import { useRouter } from 'next/navigation';

interface ModernNavBarProps {
    childName: string;
    avatar: string;
    level: number;
    streak: number;
    xp: number;
    allChildren?: any[];
    onOpenParentGate?: () => void;
}

export default function ModernNavBar({
    childName,
    avatar,
    level,
    streak,
    xp,
    allChildren = [],
    onOpenParentGate
}: ModernNavBarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();

    const handleParentClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onOpenParentGate) {
            onOpenParentGate();
        } else {
            window.location.href = '/parent';
        }
    };

    const handleSwitchChild = async (id: string) => {
        try {
            await setActiveChild(id);
            setIsMenuOpen(false);
            router.refresh();
        } catch (error) {
            console.error('Error switching child:', error);
        }
    };

    const handleSignOut = async () => {
        console.log('[ModernNavBar] signOut clicked');
        await signOut({ callbackUrl: '/?loggedOut=true' });
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

                    <div className="relative">
                        <button
                            className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 transition-all group active:scale-95"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <span className="font-black text-neutral-700 text-sm">{childName}</span>
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm ring-2 ring-white overflow-hidden relative border border-neutral-100">
                                {avatar ? (
                                    (avatar.startsWith('/') || avatar.startsWith('http')) ? (
                                        <Image src={avatar} alt={childName} fill className="object-cover" />
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
                                <div className="p-2 border-b border-neutral-50 bg-neutral-50/50">
                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-3">החחלף פרופיל</span>
                                </div>
                                <div className="p-1.5 space-y-1">
                                    {allChildren.map((child) => (
                                        <button
                                            key={child.id}
                                            onClick={() => handleSwitchChild(child.id)}
                                            className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${child.name === childName ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-neutral-50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-neutral-100 overflow-hidden relative">
                                                    {child.avatar ? (
                                                        (child.avatar.startsWith('/') || child.avatar.startsWith('http')) ? (
                                                            <Image src={child.avatar} alt={child.name} fill className="object-cover" />
                                                        ) : (
                                                            <span className="text-xl">{child.avatar}</span>
                                                        )
                                                    ) : (
                                                        <UserIcon className="w-5 h-5 text-neutral-400" />
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className={`font-black text-sm ${child.name === childName ? 'text-indigo-600' : 'text-neutral-700'}`}>{child.name}</div>
                                                    <div className="text-[10px] text-neutral-400 font-bold">דרגה {child.level || 1}</div>
                                                </div>
                                            </div>
                                            {child.name === childName && (
                                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                            )}
                                        </button>
                                    ))}

                                    <Link
                                        href="/parent"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-all group"
                                    >
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-emerald-100 group-hover:border-emerald-200">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <span className="font-black text-sm">פרופיל חדש</span>
                                    </Link>
                                </div>

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

                {/* Mobile Profile Switcher Trigger */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-9 h-9 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-200 active:scale-90 transition-transform overflow-hidden relative"
                >
                    {avatar ? (
                        (avatar.startsWith('/') || avatar.startsWith('http')) ? (
                            <Image src={avatar} alt={childName} fill className="object-cover" />
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

                        <h2 className="text-xl font-black text-neutral-800 text-center mb-8">מי לומד עכשיו?</h2>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {allChildren.map((child) => (
                                <button
                                    key={child.id}
                                    onClick={() => handleSwitchChild(child.id)}
                                    className={`flex flex-col items-center gap-3 p-5 rounded-[2.5rem] transition-all active:scale-95 ${child.name === childName ? 'bg-indigo-50 border-2 border-indigo-200 shadow-lg shadow-indigo-100' : 'bg-neutral-50 border-2 border-transparent'}`}
                                >
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md border border-neutral-100 overflow-hidden relative">
                                        {child.avatar ? (
                                            (child.avatar.startsWith('/') || child.avatar.startsWith('http')) ? (
                                                <Image src={child.avatar} alt={child.name} fill className="object-cover" />
                                            ) : (
                                                <span className="text-4xl">{child.avatar}</span>
                                            )
                                        ) : (
                                            <UserIcon className="w-10 h-10 text-neutral-400" />
                                        )}
                                    </div>
                                    <span className={`font-black text-lg ${child.name === childName ? 'text-indigo-600' : 'text-neutral-700'}`}>{child.name}</span>
                                </button>
                            ))}

                            <Link
                                href="/parent"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex flex-col items-center gap-3 p-5 rounded-[2.5rem] bg-emerald-50 border-2 border-emerald-100 transition-all active:scale-95"
                            >
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md border border-emerald-50">
                                    <Plus className="w-10 h-10 text-emerald-500" />
                                </div>
                                <span className="font-black text-lg text-emerald-600">פרופיל חדש</span>
                            </Link>
                        </div>

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

'use client';

import { useState, useEffect } from 'react';

export default function AnimatedBackground() {
    const [stars, setStars] = useState<{ top: string; left: string; delay: string; size: number }[]>([]);

    useEffect(() => {
        const newStars = [...Array(30)].map(() => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            size: Math.random() * 2 + 2 // Smaller stars: 2-4px
        }));
        setStars(newStars);
    }, []);

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-900">
            {/* Simple blue gradient base */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 to-slate-900" />
            
            {/* Two animated blue blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/40 rounded-full blur-[120px] animate-blob" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/40 rounded-full blur-[120px] animate-blob delay-2000" />

            {/* Stars */}
            {stars.map((star, i) => (
                <div
                    key={i}
                    className="absolute bg-white rounded-full animate-star-float"
                    style={{
                        top: star.top,
                        left: star.left,
                        animationDelay: star.delay,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.6)`
                    }}
                />
            ))}
        </div>
    );
}

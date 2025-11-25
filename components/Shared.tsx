import React, { useState, useEffect, useRef } from 'react';

// --- Icons ---
export const Icon = ({ name, className }: { name: string, className?: string }) => {
    const icons: Record<string, React.ReactNode> = {
        plus: <path d="M5 12h14M12 5v14" />,
        trash: <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />,
        home: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
        settings: <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />,
        chevronLeft: <path d="M15 18l-6-6 6-6" />,
        chevronRight: <path d="M9 18l6-6-6-6" />,
        chevronDown: <path d="M6 9l6 6 6-6" />,
        wand: <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />,
        users: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />,
        edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />,
        briefcase: <path d="M20 7h-3a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />,
        camera: <g><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></g>,
        download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
        upload: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
        database: <g><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></g>,
        tag: <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />,
        layers: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
        tool: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
        dollar: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
        image: <g><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></g>
    };
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            {icons[name] || <circle cx="12" cy="12" r="10" />}
        </svg>
    );
};

export const DeleteConfirmButton = ({ onDelete, className }: { onDelete: () => void, className?: string }) => {
    const [confirming, setConfirming] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Vital for lists where rows are clickable
        
        if (confirming) {
            onDelete();
            setConfirming(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        } else {
            setConfirming(true);
            timeoutRef.current = window.setTimeout(() => setConfirming(false), 3000);
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`transition-all flex items-center gap-1 rounded px-2 py-1 ${
                confirming
                ? 'bg-red-100 text-red-600'
                : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
            } ${className}`}
            title={confirming ? "Click again to delete" : "Delete"}
        >
            <Icon name="trash" className="w-4 h-4 pointer-events-none" />
            {confirming && <span className="text-xs font-bold whitespace-nowrap animate-in fade-in">Confirm?</span>}
        </button>
    );
};

export const BottomNav = ({ current, onChange }: { current: string, onChange: (v: any) => void }) => {
    const navItems = [
        { id: 'projects', label: 'Estimates', icon: 'home' },
        { id: 'clients', label: 'Clients', icon: 'users' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
    ];

    return (
        <div className="bg-white border-t border-slate-200 fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 flex justify-around py-2 pb-safe z-20 print:hidden">
            {navItems.map(item => (
                <button 
                    key={item.id}
                    onClick={() => onChange(item.id)}
                    className={`flex flex-col items-center p-2 w-full ${current === item.id ? 'text-secondary' : 'text-slate-400'}`}
                >
                    <Icon name={item.icon} className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase">{item.label}</span>
                </button>
            ))}
        </div>
    );
};
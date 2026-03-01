import React, { useEffect, useRef, forwardRef } from 'react';
import { cn } from "@/lib/utils";

// --- Reusable Grid Item Component ---
const BioluminescentGridItem = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => {
    const itemRef = useRef<HTMLDivElement>(null);

    // Effect to track mouse position and update CSS custom properties
    useEffect(() => {
        const item = itemRef.current;
        if (!item) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            item.style.setProperty('--mouse-x', `${x}px`);
            item.style.setProperty('--mouse-y', `${y}px`);
        };

        item.addEventListener('mousemove', handleMouseMove);

        return () => {
            item.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div
            ref={(node) => {
                // Handle both refs appropriately
                // @ts-ignore - node will never be null here, just silencing TS
                itemRef.current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
            }}
            className={cn(
                "relative rounded-[32px] overflow-hidden bg-white/40 dark:bg-[#0A0A0A]/60 backdrop-blur-3xl border border-white/60 dark:border-white/10 group",
                "transition-all duration-500 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_48px_rgba(35,134,255,0.15)]",
                className
            )}
            {...props}
        >
            {/* Background glow effect based on cursor for dark mode */}
            <div
                className="pointer-events-none hidden dark:block absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    background: 'radial-gradient(600px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(255,255,255,0.06), transparent 40%)',
                    zIndex: 0
                }}
            />
            {/* Background glow effect based on cursor for light mode */}
            <div
                className="pointer-events-none dark:hidden absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    background: 'radial-gradient(600px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(0,0,0,0.03), transparent 40%)',
                    zIndex: 0
                }}
            />

            {/* Border glow effect based on cursor */}
            <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-[32px] hidden dark:block"
                style={{
                    padding: '1px',
                    background: 'radial-gradient(400px circle at var(--mouse-x, 0) var(--mouse-y, 0), var(--glow-color-1, #0077ff), transparent 40%)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    zIndex: 2
                }}
            />

            <div className="relative z-10 h-full w-full flex flex-col p-4 sm:p-6">
                {children}
            </div>
        </div>
    );
});
BioluminescentGridItem.displayName = "BioluminescentGridItem";


// --- Main Grid Container Component ---
export const BioluminescentGrid = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => {
    return (
        <div ref={ref} className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(200px,auto)]", className)} {...props}>
            {children}
        </div>
    );
});
BioluminescentGrid.displayName = "BioluminescentGrid";

// Exporting the item as a named export for clarity
export { BioluminescentGridItem };

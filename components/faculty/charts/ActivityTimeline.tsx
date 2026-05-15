"use client";

import { useEffect, useState } from "react";

interface TimelineData {
  session: string;
  count: number;
}

interface ActivityTimelineProps {
  data: TimelineData[];
}

export function ActivityTimeline({ data }: ActivityTimelineProps) {
  const [animatedIndices, setAnimatedIndices] = useState<Set<number>>(new Set());
  const [pathAnimation, setPathAnimation] = useState(0);

  useEffect(() => {
    // Path drawing animation
    if (data.length > 0) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setPathAnimation(Math.min(progress, 100));
        if (progress >= 100) clearInterval(interval);
      }, 20);
      return () => clearInterval(interval);
    }
  }, [data]);

  useEffect(() => {
    // Stagger animation of dots with varied timing
    data.forEach((_, index) => {
      const timer = setTimeout(() => {
        setAnimatedIndices((prev) => new Set([...prev, index]));
      }, 200 + index * 120);

      return () => clearTimeout(timer);
    });
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="h-[240px] w-full flex items-center justify-center text-muted">
        No activity data available
      </div>
    );
  }

  // Calculate dimensions and positions
  const padding = 40;
  const containerWidth = typeof window !== "undefined" ? window.innerWidth - 120 : 800;
  const svgWidth = Math.max(600, containerWidth - padding * 2);
  const svgHeight = 200;
  const graphWidth = svgWidth - padding * 2;
  const graphHeight = svgHeight - padding * 2;

  // Find min and max count for scaling
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const minCount = 0;

  // Calculate positions
  const getXPos = (index: number) => {
    const step = graphWidth / (data.length - 1 || 1);
    return padding + index * step;
  };

  const getYPos = (count: number) => {
    const normalized = (count - minCount) / (maxCount - minCount || 1);
    return padding + graphHeight - normalized * graphHeight;
  };

  // Generate SVG path for smooth curve
  const points = data.map((d, i) => ({
    x: getXPos(i),
    y: getYPos(d.count),
    count: d.count,
  }));

  // Create smooth curve using quadratic bezier curves
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    if (next) {
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y + (curr.y - prev.y) / 2;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = curr.y + (next.y - curr.y) / 2;

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    } else {
      pathD += ` L ${curr.x} ${curr.y}`;
    }
  }

  return (
    <div className="w-full flex justify-center">
      <svg
        width={svgWidth}
        height={svgHeight}
        className="overflow-visible"
        style={{ maxWidth: "100%", height: "auto" }}
      >
        <defs>
          {/* Main gradient */}
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="1" />
            <stop offset="50%" stopColor="rgb(168, 85, 247)" stopOpacity="1" />
            <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="1" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Animation keyframes */}
          <style>{`
            @keyframes pulse-glow {
              0%, 100% {
                opacity: 0.3;
                r: 8;
              }
              50% {
                opacity: 0.8;
                r: 14;
              }
            }

            @keyframes dot-pop {
              0% {
                r: 0;
                opacity: 1;
              }
              70% {
                r: 8;
                opacity: 0.8;
              }
              100% {
                r: 6;
                opacity: 1;
              }
            }

            @keyframes float-up {
              0% {
                opacity: 0;
                transform: translateY(10px);
              }
              50% {
                opacity: 0.6;
              }
              100% {
                opacity: 0;
                transform: translateY(-15px);
              }
            }

            @keyframes shimmer {
              0%, 100% {
                opacity: 0.3;
                r: 10;
              }
              50% {
                opacity: 0.8;
                r: 12;
              }
            }
          `}</style>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = padding + (graphHeight / 4) * i;
          return (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={y}
              x2={svgWidth - padding}
              y2={y}
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.3"
            />
          );
        })}

        {/* Curve path with animation */}
        <path
          d={pathD}
          stroke="url(#gradient)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
          style={{
            strokeDasharray: `${svgWidth * 2}`,
            strokeDashoffset: `${svgWidth * 2 * (1 - pathAnimation / 100)}`,
            transition: "stroke-dashoffset 0.5s ease-out",
          }}
        />

        {/* Main curve (solid) */}
        <path
          d={pathD}
          stroke="url(#gradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Animated dots with enhanced effects */}
        {points.map((point, index) => (
          <g key={`dot-${index}`}>
            {/* Outer glow halo - animated shimmer */}
            {animatedIndices.has(index) && (
              <circle
                cx={point.x}
                cy={point.y}
                r="10"
                fill="none"
                stroke="rgb(99, 102, 241)"
                strokeWidth="1.5"
                opacity="0.4"
                style={{
                  animationName: "shimmer",
                  animationDuration: "2s",
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                  animationDelay: `${index * 0.15}s`,
                }}
              />
            )}

            {/* Pulsing background glow */}
            {animatedIndices.has(index) && (
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="rgb(99, 102, 241)"
                opacity="0.15"
                style={{
                  animationName: "pulse-glow",
                  animationDuration: "2s",
                  animationTimingFunction: "cubic-bezier(0.4, 0, 0.6, 1)",
                  animationIterationCount: "infinite",
                  animationDelay: `${index * 0.15}s`,
                }}
              />
            )}

            {/* Floating particles - only for first few dots */}
            {animatedIndices.has(index) && index < 4 && (
              <>
                {Array.from({ length: 3 }).map((_, pIdx) => (
                  <circle
                    key={`particle-${index}-${pIdx}`}
                    cx={point.x}
                    cy={point.y}
                    r="2"
                    fill="rgb(168, 85, 247)"
                    opacity="0.6"
                    style={{
                      animationName: "float-up",
                      animationDuration: `${1.2 + pIdx * 0.1}s`,
                      animationTimingFunction: "ease-out",
                      animationIterationCount: "infinite",
                      animationDelay: `${index * 0.15 + pIdx * 0.2}s`,
                    }}
                  />
                ))}
              </>
            )}

            {/* Main dot with pop animation */}
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill="rgb(99, 102, 241)"
              stroke="#fff"
              strokeWidth="2"
              filter="url(#glow)"
              style={{
                opacity: animatedIndices.has(index) ? 1 : 0.4,
                animationName: animatedIndices.has(index) ? "dot-pop" : "none",
                animationDuration: "0.6s",
                animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                animationDelay: `${index * 0.15}s`,
                transformOrigin: `${point.x}px ${point.y}px`,
              }}
            />

            {/* Label with count */}
            <g
              style={{
                opacity: animatedIndices.has(index) ? 1 : 0.5,
                transition: "opacity 0.3s ease",
              }}
            >
              <text
                x={point.x}
                y={point.y - 25}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill="rgb(17, 24, 39)"
                className="dark:fill-white"
                style={{
                  animationName: animatedIndices.has(index) ? "float-up" : "none",
                  animationDuration: "0.8s",
                  animationTimingFunction: "ease-out",
                  transformOrigin: `${point.x}px ${point.y - 25}px`,
                }}
              >
                {point.count}
              </text>
              <text
                x={point.x}
                y={point.y + 25}
                textAnchor="middle"
                fontSize="10"
                fill="rgb(107, 114, 128)"
                className="dark:fill-gray-400"
              >
                {data[index].session}
              </text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * The resting motion behind every kiosk screen.
 *
 * Five layers, none above 7% opacity, on 9–120 second cycles. This is a tablet
 * bolted to a wall for eight hours a day: anything livelier becomes wallpaper
 * people resent by mid-morning. Delays are deliberately uneven so no layer
 * announces its loop.
 *
 * Server component — no state, no effects, nothing to hydrate.
 */
export function IdleBackdrop() {
    return (
        <div className="idle-layer" aria-hidden="true">
            <div className="idle-halftone"/>

            <div className="idle-arcs">
                <div className="idle-arc"/>
                <div className="idle-arc"/>
                <div className="idle-arc"/>
                <div className="idle-arc"/>
            </div>

            {/* Chunky chevrons, drifting far behind the content. */}
            {CHEVRONS.map((c, i) => (
                <span key={i} className="idle-chev" style={{top: c.top, left: c.left, animationDelay: c.delay}}>
                    <svg width={c.size} height={c.size} viewBox="0 0 24 24" fill="none"
                         stroke={c.stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 7-7 7 7"/>
                        <path d="m5 19 7-7 7 7"/>
                    </svg>
                </span>
            ))}

            {SPARKS.map((s, i) => (
                <span
                    key={i}
                    className="idle-spark"
                    style={{top: s.top, left: s.left, animationDelay: s.delay, width: s.size, height: s.size}}
                />
            ))}

            {/* One slow pass of light, roughly every 26 seconds. */}
            <div className="idle-sheen"/>
        </div>
    );
}

const CHEVRONS = [
    {top: "8%", left: "62%", size: 190, delay: "0s", stroke: "#10b981"},
    {top: "58%", left: "6%", size: 130, delay: "9s", stroke: "#f59e0b"},
    {top: "70%", left: "72%", size: 96, delay: "17s", stroke: "#6366f1"},
];

const SPARKS = [
    {top: "14%", left: "15%", delay: "0s", size: 16},
    {top: "36%", left: "77%", delay: "2.6s", size: 16},
    {top: "74%", left: "33%", delay: "5.1s", size: 14},
    {top: "26%", left: "55%", delay: "7.4s", size: 11},
    {top: "62%", left: "88%", delay: "3.8s", size: 12},
];

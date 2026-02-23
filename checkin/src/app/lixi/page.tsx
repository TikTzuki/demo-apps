"use client";

import {useCallback, useEffect, useRef, useState} from "react";

const COUNT = 5;
const TOTAL = 200000;
const DEFAULT_NAMES = ["Mr. Lộc", "Mr. Thiện", "Mr. Tân", "Mr. Long", "Mr. Huy"];

const SEGMENTS = [
    {label: "Chúc mừng!", color: "#c0392b"},
    {label: "May mắn!", color: "#7b241c"},
    {label: "Phát tài!", color: "#e74c3c"},
    {label: "Sung túc!", color: "#922b21"},
    {label: "Thịnh vượng!", color: "#b03a2e"},
    {label: "An khang!", color: "#a93226"},
    {label: "Phúc lộc!", color: "#cd6155"},
    {label: "Vạn như ý!", color: "#7b241c"},
    {label: "Sức khỏe!", color: "#c0392b"},
    {label: "Hạnh phúc!", color: "#e74c3c"},
];

const WISHES = [
    "💰 Năm Tỵ rắn vàng đến gõ cửa — xin mời vào, đừng ngại!",
    "🤑 Tiền vào như nước, tiền ra... ờ thôi mình không bàn chuyện đó!",
    "🐍 Rắn năm nay khôn lắm — nó biết bò thẳng vào ví của anh!",
    "💸 Lì xì nhỏ là lộc mở đầu, phần còn lại trời sẽ bù thêm cho!",
    "🍀 Cầm tiền này chắc tay — đây là lộc đầu năm, không phải trả lại đâu nha!",
    "🌿 Chúc anh năm mới thân thể cường tráng, không cần gặp bác sĩ trừ khi... đi khám định kỳ thôi!",
    "🌸 Bình an là lộc lớn nhất — tiền nhiều mà bệnh hoài thì cũng chán!",
    "☀️ Chúc ngủ ngon, ăn khỏe, stress ít — sống thọ để tiêu hết số tiền sắp kiếm được!",
    "🧘 Năm mới tâm an, trí sáng — mọi quyết định đều đúng, kể cả lúc quay vòng này!",
    "🚀 Chúc năm nay thăng chức nhanh hơn tốc độ sếp... quên mất tên mình!",
    "📈 Cổ phiếu xanh, dự án thắng, sếp khen — năm Tỵ trọn vẹn ba điều này là đủ!",
    "🎯 Chúc mọi mục tiêu đều đạt — trừ mục tiêu thức khuya làm báo cáo, cái đó bỏ đi!",
    "💼 Năm mới công việc suôn sẻ, deadline không dí, họp sáng thứ 2 được cancel dài dài!",
    "🏆 Chúc anh là ngôi sao sáng nhất team — nhưng đừng sáng quá kẻo sếp giao thêm việc!",
    "🏠 Gia đình bình an, sum vầy — đó mới là tài sản quý hơn lì xì này nhiều lần!",
    "❤️ Chúc cả nhà mạnh khỏe, vui vẻ — Tết nào cũng đầy tiếng cười!",
    "🌺 Hạnh phúc không cần nhiều tiền — nhưng có thêm chút lì xì này cũng không thừa đâu nha!",
    "👨‍👩‍👧 Năm mới gia đình thuận hòa, con cái ngoan ngoãn, ba mẹ khỏe mạnh — đủ cả rồi!",
];

function toLuckyNumber(n: number): number {
    const lucky2 = [68, 86, 88, 66, 99, 69, 96, 89, 98, 79, 97, 78, 87, 38, 83, 48, 84, 18, 81, 28, 82];
    const base = Math.floor(n / 100) * 100;
    const remainder = n % 100;
    let best = lucky2[0], bestDiff = Infinity;
    for (const l of lucky2) {
        const diff = Math.abs(l - remainder);
        if (diff < bestDiff) {
            bestDiff = diff;
            best = l;
        }
    }
    return base + best;
}

function generateAmounts(total: number, count: number): number[] {
    const min = 15000;
    let pool = total - min * count;
    const raws = new Array(count).fill(0);
    for (let i = 0; i < count - 1; i++) {
        const maxExtra = pool * 0.65;
        const e = Math.floor(Math.random() * maxExtra);
        raws[i] = e;
        pool -= e;
    }
    raws[count - 1] = pool;
    let amounts = raws.map((e: number) => toLuckyNumber(min + e));

    const sum = amounts.reduce((a: number, b: number) => a + b, 0);
    const diff = total - sum;
    const maxIdx = amounts.indexOf(Math.max(...amounts));
    amounts[maxIdx] += diff;
    if (amounts[maxIdx] > 0) amounts = amounts.map((a: number, i: number) => i === maxIdx ? toLuckyNumber(a) : a);

    for (let i = amounts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [amounts[i], amounts[j]] = [amounts[j], amounts[i]];
    }
    return amounts;
}

function drawWheel(ctx: CanvasRenderingContext2D, size: number, angle: number) {
    ctx.clearRect(0, 0, size, size);
    const cx = size / 2, cy = size / 2, r = size / 2 - 4;
    const n = SEGMENTS.length;
    const arc = (2 * Math.PI) / n;

    for (let i = 0; i < n; i++) {
        const start = angle + i * arc;
        const end = start + arc;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, end);
        ctx.closePath();
        ctx.fillStyle = SEGMENTS[i].color;
        ctx.fill();
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(start + arc / 2);
        ctx.beginPath();
        ctx.moveTo(r * 0.55, -1);
        ctx.lineTo(r * 0.88, -1);
        ctx.strokeStyle = "rgba(255,215,0,0.35)";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(start + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffd700";
        ctx.font = `bold ${size * 0.038}px Baloo 2, sans-serif`;
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 4;
        ctx.fillText(SEGMENTS[i].label, r * 0.86, 4);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 5;
    ctx.stroke();

    for (let i = 0; i < n * 2; i++) {
        const a = angle + (i * Math.PI) / n;
        ctx.beginPath();
        ctx.arc(cx + (r - 8) * Math.cos(a), cy + (r - 8) * Math.sin(a), 3, 0, 2 * Math.PI);
        ctx.fillStyle = i % 2 === 0 ? "#ffd700" : "#fff";
        ctx.fill();
    }
}

export default function LixiPage() {
    const [screen, setScreen] = useState<"setup" | "game">("setup");
    const [names, setNames] = useState<string[]>([...DEFAULT_NAMES]);
    const [playerNames, setPlayerNames] = useState<string[]>([]);
    const [amounts, setAmounts] = useState<number[]>([]);
    const [remaining, setRemaining] = useState(COUNT);
    const [spinning, setSpinning] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
    const [playerDone, setPlayerDone] = useState<boolean[]>(new Array(COUNT).fill(false));
    const [playerResults, setPlayerResults] = useState<(number | null)[]>(new Array(COUNT).fill(null));
    const [spinCount, setSpinCount] = useState(0);
    const [sessionLoaded, setSessionLoaded] = useState(false);

    const [resultVisible, setResultVisible] = useState(false);
    const [resultEmoji, setResultEmoji] = useState("🧧");
    const [resultName, setResultName] = useState("");
    const [resultAmount, setResultAmount] = useState("");
    const [resultWish, setResultWish] = useState("");

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const angleRef = useRef(0);
    const animFrameRef = useRef<number>(0);

    const redrawWheel = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const s = canvas.offsetWidth;
        canvas.width = s;
        canvas.height = s;
        drawWheel(ctx, s, angleRef.current);
    }, []);

    useEffect(() => {
        if (screen !== "game") return;
        const timer = setTimeout(redrawWheel, 50);
        window.addEventListener("resize", redrawWheel);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", redrawWheel);
        };
    }, [screen, redrawWheel]);

    // Petals effect
    useEffect(() => {
        const petals = ["🌸", "🌺", "✨", "🍀"];
        const els: HTMLDivElement[] = [];
        for (let i = 0; i < 12; i++) {
            const el = document.createElement("div");
            el.className = "petal";
            el.textContent = petals[Math.floor(Math.random() * petals.length)];
            el.style.left = Math.random() * 100 + "vw";
            el.style.animationDuration = (4 + Math.random() * 6) + "s";
            el.style.animationDelay = (Math.random() * 5) + "s";
            el.style.fontSize = (0.8 + Math.random() * 0.8) + "rem";
            document.body.appendChild(el);
            els.push(el);
        }
        return () => els.forEach(el => el.remove());
    }, []);

    // Load existing session on mount
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/lixi/session");
                const data = await res.json();
                if (data.success && data.data) {
                    const session = data.data;
                    const spins = session.spins || [];
                    if (spins.length > 0 && spins.length < COUNT) {
                        // Restore in-progress game
                        setAmounts(session.amounts);
                        setPlayerNames([...DEFAULT_NAMES]);
                        const done = new Array(COUNT).fill(false);
                        const results: (number | null)[] = new Array(COUNT).fill(null);
                        for (const spin of spins) {
                            const idx = DEFAULT_NAMES.indexOf(spin.playerName);
                            if (idx !== -1) {
                                done[idx] = true;
                                results[idx] = spin.amount;
                            }
                        }
                        setPlayerDone(done);
                        setPlayerResults(results);
                        setRemaining(COUNT - spins.length);
                        setSpinCount(spins.length);
                        setScreen("game");
                    } else if (spins.length === COUNT) {
                        // Game complete — show results
                        setAmounts(session.amounts);
                        setPlayerNames([...DEFAULT_NAMES]);
                        const done = new Array(COUNT).fill(true);
                        const results = new Array(COUNT).fill(null);
                        for (const spin of spins) {
                            const idx = DEFAULT_NAMES.indexOf(spin.playerName);
                            if (idx !== -1) results[idx] = spin.amount;
                        }
                        setPlayerDone(done);
                        setPlayerResults(results);
                        setRemaining(0);
                        setSpinCount(COUNT);
                        setScreen("game");
                    }
                }
            } catch {
                // No existing session
            }
            setSessionLoaded(true);
        })();
    }, []);

    const launchConfetti = () => {
        const colors = ["#ffd700", "#c0392b", "#e74c3c", "#ff6b6b", "#fff", "#f4c542", "#ff9500"];
        for (let i = 0; i < 60; i++) {
            setTimeout(() => {
                const el = document.createElement("div");
                el.className = "confetti-piece";
                el.style.left = (15 + Math.random() * 70) + "vw";
                el.style.top = "0";
                el.style.background = colors[Math.floor(Math.random() * colors.length)];
                el.style.width = (6 + Math.random() * 8) + "px";
                el.style.height = (6 + Math.random() * 8) + "px";
                el.style.animationDuration = (1.2 + Math.random() * 1.5) + "s";
                el.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
                document.body.appendChild(el);
                setTimeout(() => el.remove(), 3000);
            }, i * 25);
        }
    };

    const startGame = async () => {
        const finalNames = names.map((n, i) => n.trim() || `Người ${i + 1}`);
        const newAmounts = generateAmounts(TOTAL, COUNT);
        setPlayerNames(finalNames);
        setAmounts(newAmounts);
        setRemaining(COUNT);
        setSpinCount(0);
        setPlayerDone(new Array(COUNT).fill(false));
        setPlayerResults(new Array(COUNT).fill(null));
        setSelectedPlayer(null);
        setResultVisible(false);
        setScreen("game");

        try {
            await fetch("/api/lixi/session", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({total: TOTAL, amounts: newAmounts}),
            });
        } catch {
            // Continue without persistence
        }
    };

    const selectPlayer = (i: number) => {
        if (playerDone[i] || remaining === 0) return;
        setSelectedPlayer(i);
    };

    const spin = () => {
        if (spinning || remaining === 0 || selectedPlayer === null) return;
        setSpinning(true);
        setResultVisible(false);

        const extraSpins = 5 + Math.floor(Math.random() * 5);
        const targetAngle = angleRef.current + (2 * Math.PI * extraSpins) + (Math.random() * 2 * Math.PI);
        const duration = 4000;
        const startTime = performance.now();
        const startAngle = angleRef.current;

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            angleRef.current = startAngle + (targetAngle - startAngle) * ease;

            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) drawWheel(ctx, canvas.width, angleRef.current);
            }

            if (t < 1) {
                animFrameRef.current = requestAnimationFrame(animate);
            } else {
                setSpinning(false);
                showResult();
            }
        };
        animFrameRef.current = requestAnimationFrame(animate);
    };

    const showResult = async () => {
        const idx = selectedPlayer!;
        const name = playerNames[idx];
        const currentSpinCount = spinCount;
        const amount = amounts[currentSpinCount];

        const newDone = [...playerDone];
        newDone[idx] = true;
        const newResults = [...playerResults];
        newResults[idx] = amount;
        const newRemaining = remaining - 1;

        setPlayerDone(newDone);
        setPlayerResults(newResults);
        setRemaining(newRemaining);
        setSpinCount(currentSpinCount + 1);
        setSelectedPlayer(null);

        const emojis = ["🧧", "🎊", "✨", "🌟", "💰", "🍀"];
        setResultEmoji(emojis[Math.floor(Math.random() * emojis.length)]);
        setResultName(`${name} nhận được`);
        setResultAmount(amount.toLocaleString("vi-VN") + "đ");
        setResultWish(WISHES[Math.floor(Math.random() * WISHES.length)]);
        setResultVisible(true);
        launchConfetti();

        try {
            await fetch("/api/lixi/spin", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    playerName: name,
                    amount,
                    spinOrder: currentSpinCount + 1,
                }),
            });
        } catch {
            // Continue without persistence
        }
    };

    const resetGame = async () => {
        cancelAnimationFrame(animFrameRef.current);
        angleRef.current = 0;
        setScreen("setup");
        setResultVisible(false);

        const newAmounts = generateAmounts(TOTAL, COUNT);
        try {
            await fetch("/api/lixi/session", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({total: TOTAL, amounts: newAmounts, reset: true}),
            });
        } catch {
            // Continue
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&family=Baloo+2:wght@600;800&display=swap');

                :root {
                    --red: #c0392b;
                    --dark-red: #922b21;
                    --gold: #f4c542;
                    --bright-gold: #ffd700;
                    --dark: #1a0000;
                    --light-gold: #fff3b0;
                }

                body { background: var(--dark) !important; }

                .lantern {
                    position: fixed;
                    font-size: 2rem;
                    animation: swing 3s ease-in-out infinite;
                    filter: drop-shadow(0 0 8px #f4c542);
                    pointer-events: none;
                    z-index: 50;
                }
                .lantern:nth-child(1) { top: 10px; left: 5%; animation-delay: 0s; }
                .lantern:nth-child(2) { top: 10px; right: 5%; animation-delay: 0.5s; }
                .lantern:nth-child(3) { top: 10px; left: 20%; animation-delay: 1s; font-size: 1.5rem; }
                .lantern:nth-child(4) { top: 10px; right: 20%; animation-delay: 1.5s; font-size: 1.5rem; }

                @keyframes swing {
                    0%, 100% { transform: rotate(-8deg); }
                    50% { transform: rotate(8deg); }
                }

                .petal {
                    position: fixed;
                    animation: fall linear infinite;
                    opacity: 0.7;
                    pointer-events: none;
                }
                @keyframes fall {
                    0% { transform: translateY(-20px) rotate(0deg); opacity: 0.7; }
                    100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes popIn {
                    0% { transform: scale(0.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }

                .confetti-piece {
                    position: fixed;
                    animation: confettiFall 2s ease-in forwards;
                    pointer-events: none;
                    z-index: 100;
                    border-radius: 2px;
                }
                @keyframes confettiFall {
                    0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
                }
            `}</style>

            <div className="lantern">🏮</div>
            <div className="lantern">🏮</div>
            <div className="lantern">🧧</div>
            <div className="lantern">🧧</div>

            <div style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Baloo 2', cursive",
                padding: "1rem",
            }}>
                {screen === "setup" && (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        animation: "fadeIn 0.5s ease"
                    }}>
                        <h1 style={{
                            fontFamily: "'Noto Serif', serif",
                            color: "var(--bright-gold)",
                            fontSize: "clamp(1.3rem, 4vw, 1.9rem)",
                            textAlign: "center",
                            marginBottom: "1.2rem",
                            textShadow: "0 0 20px #f4c542, 0 2px 0 #8b0000",
                            letterSpacing: "2px",
                        }}>
                            🧧 Vòng Quay Lì Xì 🧧
                        </h1>
                        <div style={{
                            background: "linear-gradient(135deg, #7b0000, #c0392b)",
                            border: "2px solid var(--bright-gold)",
                            borderRadius: "20px",
                            padding: "1.5rem 1.8rem",
                            width: "min(360px, 90vw)",
                            boxShadow: "0 0 30px rgba(244,197,66,0.25)",
                        }}>
                            <p style={{
                                color: "var(--bright-gold)",
                                fontSize: "1rem",
                                fontWeight: 700,
                                textAlign: "center",
                                marginBottom: "1rem",
                                letterSpacing: "1px",
                            }}>✍️ Nhập tên 5 người chơi</p>
                            {names.map((name, i) => (
                                <div key={i} style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.6rem",
                                    marginBottom: "0.6rem"
                                }}>
                                    <span style={{
                                        color: "var(--bright-gold)",
                                        fontSize: "1rem",
                                        fontWeight: 700,
                                        minWidth: "22px",
                                        textAlign: "center"
                                    }}>{i + 1}.</span>
                                    <input
                                        type="text"
                                        value={name}
                                        placeholder={DEFAULT_NAMES[i]}
                                        maxLength={20}
                                        onChange={(e) => {
                                            const updated = [...names];
                                            updated[i] = e.target.value;
                                            setNames(updated);
                                        }}
                                        style={{
                                            flex: 1,
                                            background: "rgba(0,0,0,0.3)",
                                            border: "1.5px solid rgba(255,215,0,0.4)",
                                            borderRadius: "10px",
                                            padding: "0.5rem 0.8rem",
                                            color: "#fff",
                                            fontFamily: "'Baloo 2', cursive",
                                            fontSize: "0.95rem",
                                            outline: "none",
                                        }}
                                    />
                                </div>
                            ))}
                            <button
                                onClick={startGame}
                                style={{
                                    width: "100%",
                                    background: "linear-gradient(135deg, #c0392b, #e74c3c)",
                                    color: "white",
                                    border: "2px solid var(--bright-gold)",
                                    padding: "0.75rem",
                                    fontFamily: "'Baloo 2', cursive",
                                    fontSize: "1.1rem",
                                    fontWeight: 800,
                                    borderRadius: "50px",
                                    cursor: "pointer",
                                    marginTop: "1rem",
                                    boxShadow: "0 4px 15px rgba(192,57,43,0.4)",
                                    letterSpacing: "1px",
                                }}
                            >🎋 Bắt đầu quay!
                            </button>
                        </div>
                    </div>
                )}

                {screen === "game" && (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: "100%",
                        animation: "fadeIn 0.5s ease"
                    }}>
                        <h1 style={{
                            fontFamily: "'Noto Serif', serif",
                            color: "var(--bright-gold)",
                            fontSize: "clamp(1.3rem, 4vw, 1.9rem)",
                            textAlign: "center",
                            marginBottom: "1.2rem",
                            textShadow: "0 0 20px #f4c542, 0 2px 0 #8b0000",
                            letterSpacing: "2px",
                        }}>
                            🧧 Vòng Quay Lì Xì 🧧
                        </h1>

                        {/* Player selector */}
                        {remaining > 0 && (
                            <div style={{
                                width: "min(360px, 90vw)",
                                background: "rgba(255,215,0,0.08)",
                                border: "1.5px solid rgba(255,215,0,0.35)",
                                borderRadius: "16px",
                                padding: "0.8rem 1rem",
                                marginBottom: "0.9rem",
                            }}>
                                <div style={{
                                    color: "var(--bright-gold)",
                                    fontSize: "0.82rem",
                                    fontWeight: 700,
                                    textAlign: "center",
                                    marginBottom: "0.6rem",
                                    letterSpacing: "0.5px",
                                }}>👆 Bạn là ai? Tick vào tên trước khi quay!
                                </div>
                                <div style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "0.5rem",
                                    justifyContent: "center"
                                }}>
                                    {playerNames.map((name, i) => {
                                        const isDone = playerDone[i];
                                        const isSelected = selectedPlayer === i;
                                        return (
                                            <div
                                                key={i}
                                                onClick={() => !isDone && selectPlayer(i)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.4rem",
                                                    background: isSelected ? "linear-gradient(135deg, #c0392b, #e74c3c)" : "rgba(0,0,0,0.25)",
                                                    border: `1.5px solid ${isSelected ? "var(--bright-gold)" : "rgba(255,215,0,0.3)"}`,
                                                    borderRadius: "30px",
                                                    padding: "0.35rem 0.85rem",
                                                    cursor: isDone ? "not-allowed" : "pointer",
                                                    color: isSelected ? "#fff" : "var(--light-gold)",
                                                    fontSize: "0.88rem",
                                                    fontWeight: 600,
                                                    opacity: isDone ? 0.3 : 1,
                                                    textDecoration: isDone ? "line-through" : "none",
                                                    boxShadow: isSelected ? "0 0 12px rgba(255,215,0,0.3)" : "none",
                                                    userSelect: "none",
                                                }}
                                            >
                                                <span
                                                    style={{fontSize: "0.9rem"}}>{isDone ? "✅" : isSelected ? "🎯" : "👤"}</span>
                                                <span>{name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Selected badge */}
                        {selectedPlayer !== null && (
                            <div style={{
                                background: "rgba(255,215,0,0.12)",
                                border: "1.5px solid var(--bright-gold)",
                                borderRadius: "30px",
                                padding: "0.35rem 1.4rem",
                                color: "var(--bright-gold)",
                                fontSize: "0.95rem",
                                fontWeight: 700,
                                marginBottom: "0.8rem",
                                letterSpacing: "1px",
                                animation: "popIn 0.3s ease",
                            }}>
                                🎯 {playerNames[selectedPlayer]} đang quay...
                            </div>
                        )}

                        {remaining === 0 && (
                            <div style={{
                                background: "rgba(255,215,0,0.12)",
                                border: "1.5px solid var(--bright-gold)",
                                borderRadius: "30px",
                                padding: "0.35rem 1.4rem",
                                color: "var(--bright-gold)",
                                fontSize: "0.95rem",
                                fontWeight: 700,
                                marginBottom: "0.8rem",
                                letterSpacing: "1px",
                            }}>
                                🎊 Tất cả đã quay xong!
                            </div>
                        )}

                        {/* Wheel */}
                        <div style={{
                            position: "relative",
                            width: "min(320px, 82vw)",
                            height: "min(320px, 82vw)",
                            marginBottom: "1.2rem"
                        }}>
                            <canvas
                                ref={canvasRef}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: "50%",
                                    border: "6px solid var(--bright-gold)",
                                    boxShadow: "0 0 30px rgba(244,197,66,0.5), inset 0 0 20px rgba(0,0,0,0.3)",
                                }}
                            />
                            <div style={{
                                position: "absolute",
                                top: "50%",
                                right: "-20px",
                                transform: "translateY(-50%)",
                                width: 0,
                                height: 0,
                                borderTop: "18px solid transparent",
                                borderBottom: "18px solid transparent",
                                borderRight: "34px solid var(--bright-gold)",
                                filter: "drop-shadow(0 0 6px var(--gold))",
                                zIndex: 10,
                            }}/>
                            <div
                                onClick={spin}
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    width: "48px",
                                    height: "48px",
                                    background: "radial-gradient(circle, #ffd700, #c0392b)",
                                    borderRadius: "50%",
                                    border: "3px solid #fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.3rem",
                                    boxShadow: "0 0 15px rgba(255,215,0,0.8)",
                                    zIndex: 5,
                                    cursor: "pointer",
                                }}
                            >🎋
                            </div>
                        </div>

                        {/* Spin button */}
                        <button
                            onClick={spin}
                            disabled={spinning || remaining === 0 || selectedPlayer === null}
                            style={{
                                background: "linear-gradient(135deg, #c0392b, #e74c3c)",
                                color: "white",
                                border: "3px solid var(--bright-gold)",
                                padding: "0.75rem 2rem",
                                fontFamily: "'Baloo 2', cursive",
                                fontSize: "1.05rem",
                                fontWeight: 800,
                                borderRadius: "50px",
                                cursor: (spinning || remaining === 0 || selectedPlayer === null) ? "not-allowed" : "pointer",
                                letterSpacing: "1px",
                                boxShadow: "0 4px 20px rgba(192,57,43,0.5)",
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                opacity: (spinning || remaining === 0 || selectedPlayer === null) ? 0.5 : 1,
                            }}
                        >
                            {remaining === 0 ? "🎊 Đã hết lượt!" : "🎉 QUAY NGAY!"}
                        </button>

                        {/* Result panel */}
                        {resultVisible && (
                            <div style={{
                                marginTop: "0.9rem",
                                background: "linear-gradient(135deg, #7b0000, #c0392b)",
                                border: "2px solid var(--bright-gold)",
                                borderRadius: "16px",
                                padding: "0.8rem 1.8rem",
                                textAlign: "center",
                                minWidth: "220px",
                                boxShadow: "0 0 25px rgba(244,197,66,0.3)",
                                animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                            }}>
                                <div style={{fontSize: "1.6rem", marginBottom: "0.2rem"}}>{resultEmoji}</div>
                                <div style={{
                                    color: "var(--light-gold)",
                                    fontSize: "0.85rem",
                                    marginBottom: "0.2rem"
                                }}>{resultName}</div>
                                <div style={{
                                    color: "var(--bright-gold)",
                                    fontSize: "1.8rem",
                                    fontWeight: 800,
                                    textShadow: "0 0 12px rgba(255,215,0,0.6)"
                                }}>{resultAmount}</div>
                                <div style={{
                                    color: "#fff",
                                    fontSize: "0.88rem",
                                    marginTop: "0.5rem",
                                    lineHeight: 1.5,
                                    fontStyle: "italic",
                                    opacity: 0.92,
                                    borderTop: "1px solid rgba(255,215,0,0.25)",
                                    paddingTop: "0.5rem",
                                }}>{resultWish}</div>
                            </div>
                        )}

                        {/* History table */}
                        {spinCount > 0 && (
                            <div style={{
                                marginTop: "0.9rem",
                                width: "min(360px, 90vw)",
                                background: "rgba(255,215,0,0.07)",
                                border: "1.5px solid rgba(255,215,0,0.3)",
                                borderRadius: "14px",
                                overflow: "hidden",
                            }}>
                                <div style={{
                                    background: "rgba(255,215,0,0.15)",
                                    color: "var(--bright-gold)",
                                    fontSize: "0.82rem",
                                    fontWeight: 700,
                                    textAlign: "center",
                                    padding: "0.4rem",
                                    letterSpacing: "1px",
                                    borderBottom: "1px solid rgba(255,215,0,0.2)",
                                }}>🏆 BẢNG KẾT QUẢ
                                </div>
                                <table style={{width: "100%", borderCollapse: "collapse"}}>
                                    <tbody>
                                    {playerNames.map((name, i) => {
                                        const isDone = playerDone[i];
                                        const isCurrent = selectedPlayer === i && !isDone;
                                        const opacity = (!isDone && !isCurrent) ? 0.35 : 1;
                                        return (
                                            <tr key={i}>
                                                <td style={{
                                                    padding: "0.38rem 0.9rem",
                                                    fontSize: "0.88rem",
                                                    borderBottom: i < COUNT - 1 ? "1px solid rgba(255,215,0,0.1)" : "none",
                                                    textAlign: "center",
                                                    width: "32px",
                                                    opacity
                                                }}>
                                                    {isDone ? "✅" : isCurrent ? "🎯" : "⏳"}
                                                </td>
                                                <td style={{
                                                    padding: "0.38rem 0.9rem",
                                                    fontSize: "0.88rem",
                                                    borderBottom: i < COUNT - 1 ? "1px solid rgba(255,215,0,0.1)" : "none",
                                                    fontWeight: 700,
                                                    color: isCurrent ? "var(--bright-gold)" : "var(--light-gold)",
                                                    opacity,
                                                }}>{name}</td>
                                                <td style={{
                                                    padding: "0.38rem 0.9rem",
                                                    fontSize: "0.88rem",
                                                    borderBottom: i < COUNT - 1 ? "1px solid rgba(255,215,0,0.1)" : "none",
                                                    textAlign: "right",
                                                    fontWeight: 800,
                                                    color: isDone ? "var(--bright-gold)" : "var(--light-gold)",
                                                    opacity,
                                                }}>
                                                    {isDone ? playerResults[i]!.toLocaleString("vi-VN") + "đ" : isCurrent ? "???" : "---"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Reset button */}
                        {remaining === 0 && (
                            <button
                                onClick={resetGame}
                                style={{
                                    background: "transparent",
                                    color: "var(--gold)",
                                    border: "1px solid var(--gold)",
                                    padding: "0.4rem 1.2rem",
                                    fontFamily: "'Baloo 2', cursive",
                                    fontSize: "0.85rem",
                                    borderRadius: "20px",
                                    cursor: "pointer",
                                    marginTop: "0.8rem",
                                    opacity: 0.75,
                                }}
                            >🔄 Chơi lại</button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

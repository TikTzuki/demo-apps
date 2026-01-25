import {CSSProperties, useState} from 'react';

const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    textAlign: 'center',
    padding: '20px',
    boxSizing: 'border-box',
};

const titleStyle: CSSProperties = {
    fontSize: 'clamp(2rem, 8vw, 4rem)',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #ffd700, #ff6b6b, #ffd700)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
    marginBottom: '10px',
    letterSpacing: '2px',
};

const yearStyle: CSSProperties = {
    fontSize: 'clamp(3rem, 12vw, 6rem)',
    fontWeight: 900,
    background: 'linear-gradient(180deg, #fff, #ffd700)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 40px rgba(255, 255, 255, 0.6)',
    marginBottom: '20px',
    letterSpacing: '8px',
};

const messageStyle: CSSProperties = {
    fontSize: 'clamp(1rem, 3vw, 1.5rem)',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: 300,
    maxWidth: '600px',
    lineHeight: 1.6,
    marginBottom: '30px',
};

const buttonStyle: CSSProperties = {
    padding: '15px 40px',
    fontSize: '1.1rem',
    fontWeight: 600,
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #ff6b6b, #ffd700)',
    color: '#1a1a2e',
    boxShadow: '0 8px 25px rgba(255, 107, 107, 0.4)',
    transition: 'all 0.3s ease',
};

export function HappyNewYear() {
    const [clickCount, setClickCount] = useState(0);

    const messages = [
        "Hello bé như",
        "Tết này chúc bé luôn vui vẻ, mạnh khỏe và học giỏi nhé!",
        "Mong rằng mọi điều tốt đẹp sẽ đến với bé trong năm mới!",
        "Chúc bé một năm mới tràn đầy hạnh phúc và thành công!",
        "Hy vọng bé sẽ luôn giữ được nụ cười tươi sáng trên môi!",
        "Chúc bé có những trải nghiệm tuyệt vời và kỷ niệm đáng nhớ trong năm mới!",
        "Mong rằng bé sẽ luôn được bao quanh bởi tình yêu và sự quan tâm từ gia đình và bạn bè!",
    ];

    const handleClick = () => {
        setClickCount(prev => prev + 1);
    };

    return (
        <div style={containerStyle}>
            <h1 style={titleStyle}>Happy New Year</h1>
            <div style={yearStyle}>2025</div>
            <p style={messageStyle}>
                {messages[clickCount % messages.length]}
            </p>
        </div>
    );
}

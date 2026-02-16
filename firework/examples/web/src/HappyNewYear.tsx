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
  paddingBottom: 'env(safe-area-inset-bottom, 20px)',
  paddingTop: 'env(safe-area-inset-top, 20px)',
};

const titleStyle: CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 'clamp(2rem, 8vw, 4rem)',
  fontWeight: 700,
  background: 'linear-gradient(135deg, #ffd700, #ff6b6b, #ffd700)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: '8px',
  letterSpacing: '2px',
};

const yearStyle: CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 'clamp(3rem, 14vw, 7rem)',
  fontWeight: 900,
  background: 'linear-gradient(180deg, #fff, #ffd700)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: '20px',
  letterSpacing: '8px',
};

const messageStyle: CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 'clamp(1rem, 3.5vw, 1.4rem)',
  color: 'rgba(255, 255, 255, 0.85)',
  fontWeight: 400,
  maxWidth: '80vw',
  lineHeight: 1.8,
  fontStyle: 'italic',
};

export function HappyNewYear() {
  const [clickCount, setClickCount] = useState(0);

  const messages = [
    'Hello bé như',
    'Tết này chúc bé luôn vui vẻ, mạnh khỏe và học giỏi nhé!',
    'Mong rằng mọi điều tốt đẹp sẽ đến với bé trong năm mới!',
    'Chúc bé một năm mới tràn đầy hạnh phúc và thành công!',
    'Hy vọng bé sẽ luôn giữ được nụ cười tươi sáng trên môi!',
    'Chúc bé có những trải nghiệm tuyệt vời và kỷ niệm đáng nhớ trong năm mới!',
    'Mong rằng bé sẽ luôn được bao quanh bởi tình yêu và sự quan tâm từ gia đình và bạn bè!',
  ];

  const handleClick = () => {
    setClickCount((prev) => prev + 1);
  };

  return (
      <div style={containerStyle} onClick={handleClick}>
        <h1 style={titleStyle}>Happy New Year</h1>
        <div style={yearStyle}>2026</div>
        <p style={messageStyle}>{messages[clickCount % messages.length]}</p>
      </div>
  );
}

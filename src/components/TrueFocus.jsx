/* TrueFocus — Animated text focus effect (no external dependencies) */
const { useEffect, useRef, useState } = React;

function TrueFocus({
  sentence = 'Berpikir bersama, memutuskan dengan yakin.',
  blurAmount = 4,
  borderColor = '#6366f1',
  animationDuration = 0.5,
  pauseBetweenAnimations = 1.5,
  manualMode = false
}) {
  const words = sentence.split(' ');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [focusRect, setFocusRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const containerRef = useRef(null);
  const wordRefs = useRef([]);

  // Auto-cycle through words
  useEffect(() => {
    if (manualMode) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % words.length);
    }, (animationDuration + pauseBetweenAnimations) * 1000);

    return () => clearInterval(interval);
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  // Update focus frame position
  useEffect(() => {
    if (currentIndex < 0 || !wordRefs.current[currentIndex] || !containerRef.current) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = wordRefs.current[currentIndex].getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height
    });
  }, [currentIndex]);

  const handleMouseEnter = (index) => {
    if (manualMode) setCurrentIndex(index);
  };

  return (
    <div className="true-focus-container" ref={containerRef}>
      {/* Animated focus frame */}
      <div
        className="true-focus-frame"
        style={{
          left: `${focusRect.x}px`,
          top: `${focusRect.y}px`,
          width: `${focusRect.width}px`,
          height: `${focusRect.height}px`,
          '--border-color': borderColor,
          transitionDuration: `${animationDuration}s`
        }}
      >
        <span className="corner top-left" />
        <span className="corner top-right" />
        <span className="corner bottom-left" />
        <span className="corner bottom-right" />
      </div>

      {/* Words with blur effect */}
      <div className="true-focus-words">
        {words.map((word, index) => {
          const isActive = index === currentIndex;
          return (
            <span
              key={index}
              ref={el => (wordRefs.current[index] = el)}
              className={classNames('true-focus-word', { active: isActive })}
              style={{
                filter: isActive ? 'blur(0px)' : `blur(${blurAmount}px)`,
                transitionDuration: `${animationDuration}s`
              }}
              onMouseEnter={() => handleMouseEnter(index)}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Export
if (typeof window !== 'undefined') {
  window.TrueFocus = TrueFocus;
}

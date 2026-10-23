import React, { useState, useEffect, useRef } from 'react';

const Counter = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const decimals = !Number.isInteger(end);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || end <= 0) return;

    let start = 0;
    const increment = end / (duration / 16);
    let rafId;

    const animate = () => {
      start += increment;
      if (start >= end) {
        setCount(end);
      } else {
        setCount(decimals ? Math.floor(start * 10) / 10 : Math.floor(start));
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isVisible, end, duration, decimals]);

  const format = (n) => (decimals ? n.toFixed(1).replace('.', ',') : n);

  if (end <= 0) return <span ref={countRef}>{format(end)}{suffix}</span>;

  return (
    <span ref={countRef}>
      {format(count)}{suffix}
    </span>
  );
};

export default Counter;

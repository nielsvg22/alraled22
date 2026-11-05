import React from 'react';

// Vlaggen als SVG (emoji-vlaggen worden op Windows niet getoond en vallen terug op "NL"/"GB")
export default function Flag({ code, className = 'w-5 h-[15px]' }) {
  const common = { viewBox: '0 0 30 20', className: `${className} rounded-[2px] shadow-sm ring-1 ring-black/10 shrink-0`, 'aria-hidden': true, focusable: 'false' };
  if (code === 'de') {
    return (<svg {...common}><rect width="30" height="7" fill="#000" /><rect y="6.67" width="30" height="6.67" fill="#DD0000" /><rect y="13.33" width="30" height="6.67" fill="#FFCE00" /></svg>);
  }
  if (code === 'en') {
    return (
      <svg {...common}>
        <rect width="30" height="20" fill="#012169" />
        <path d="M0 0L30 20M30 0L0 20" stroke="#fff" strokeWidth="4" />
        <path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.6" />
        <path d="M15 0V20M0 10H30" stroke="#fff" strokeWidth="6.5" />
        <path d="M15 0V20M0 10H30" stroke="#C8102E" strokeWidth="3.5" />
      </svg>
    );
  }
  return (<svg {...common}><rect width="30" height="7" fill="#AE1C28" /><rect y="6.67" width="30" height="6.67" fill="#fff" /><rect y="13.33" width="30" height="6.67" fill="#21468B" /></svg>);
}

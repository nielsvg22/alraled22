import React from 'react';

// Toont tekst met **dikgedrukt** als <strong>. Alles blijft React-tekst (geen innerHTML).
const FormattedText = ({ text }) => {
  const parts = String(text || '').split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-bold text-secondary">{part}</strong> : part))}
    </>
  );
};

export default FormattedText;

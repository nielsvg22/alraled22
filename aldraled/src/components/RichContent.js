import React from 'react';
import { isRichBlock, sanitizeRich } from '../lib/api';

// Toont tekst uit het CRM. Opgemaakte tekst (editor) wordt eerst opgeschoond en als HTML getoond;
// oudere platte tekst gaat via `legacy` (zoals de pagina dat voorheen deed).
const RichContent = ({ value, className = '', legacy = null }) => {
  if (isRichBlock(value)) {
    return <div className={`rich-description ${className}`} dangerouslySetInnerHTML={{ __html: sanitizeRich(value) }} />;
  }
  return legacy ? legacy(value) : null;
};

export default RichContent;

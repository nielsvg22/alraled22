import React from 'react';
import { isRichBlock, sanitizeRich } from '../lib/api';

// Eén tekstveld uit het CRM. Opgemaakte tekst (editor) wordt opgeschoond en als HTML getoond,
// gewone tekst blijft een normaal element (enters worden regeleinden via de stijl).
const RichText = ({ value, as: Tag = 'p', className = '' }) => {
  if (!value) return null;
  if (isRichBlock(value)) {
    return <div className={`rich-description ${className}`} dangerouslySetInnerHTML={{ __html: sanitizeRich(value) }} />;
  }
  return <Tag className={className}>{value}</Tag>;
};

export default RichText;

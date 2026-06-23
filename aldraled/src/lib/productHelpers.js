import { getMediaUrl } from './api';

export function getProductImages(product) {
  const urls = Array.isArray(product?.images)
    ? product.images.map((image) => image.url || image).filter(Boolean)
    : [];
  if (urls.length > 0) return urls;
  return product?.imageUrl ? [product.imageUrl] : [];
}

export function getPrimaryImage(product) {
  return getProductImages(product)[0] || null;
}

export function getImageSrc(product, placeholder = 'https://via.placeholder.com/800') {
  const url = getPrimaryImage(product);
  return getMediaUrl(url) || placeholder;
}

import axios from 'axios';

const STRAPI_URL = (process.env.REACT_APP_STRAPI_URL || 'http://localhost:1337').trim();
const API_PREFIX = '/api/webbycommerce';

export const strapi = axios.create({
  baseURL: `${STRAPI_URL}/api/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ecommerce = axios.create({
  baseURL: `${STRAPI_URL}${API_PREFIX}/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchAPI = async (path, params = {}) => {
  try {
    // Bepaal of we de ecommerce instantie moeten gebruiken
    const isEcommercePath = path.includes('products') || path.includes('orders') || path.includes('categories') || path.includes('webbycommerce');
    const hasPrefix = path.startsWith(API_PREFIX) || path.startsWith('/webbycommerce');
    
    let api = strapi;
    let finalPath = path.startsWith('/') ? path.substring(1) : path;

    if (isEcommercePath && !hasPrefix) {
      api = ecommerce;
    } else if (hasPrefix) {
      // Als het pad al de prefix heeft, verwijder deze dan voor de ecommerce instantie
      api = ecommerce;
      finalPath = path.replace(API_PREFIX, '').replace('/webbycommerce', '');
      if (finalPath.startsWith('/')) {
        finalPath = finalPath.substring(1);
      }
    }

    const response = await api.get(finalPath, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching from Strapi (${path}):`, error);
    return null;
  }
};

export const getStrapiMedia = (url) => {
  if (url == null) {
    return null;
  }

  // Return the full URL if it's already absolute
  if (url.startsWith('http') || url.startsWith('//')) {
    return url;
  }

  // Otherwise prepend the Strapi URL
  return `${STRAPI_URL}${url}`;
};

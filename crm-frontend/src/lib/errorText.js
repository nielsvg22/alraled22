export function errorText(value, fallback = 'Something went wrong') {
  if (!value) return fallback;
  if (typeof value === 'string') return value;

  const maybeAxios = value;
  const data = maybeAxios?.response?.data;
  if (typeof data === 'string') return data;

  const candidate =
    data?.error ??
    data?.message ??
    maybeAxios?.message ??
    maybeAxios?.error ??
    value;

  if (typeof candidate === 'string') return candidate;

  try {
    return JSON.stringify(candidate);
  } catch {
    return fallback;
  }
}


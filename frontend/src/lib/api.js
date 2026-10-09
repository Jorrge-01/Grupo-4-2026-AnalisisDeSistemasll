export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7096'

export async function apiFetch(path, options = {}) {
  const esFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers = esFormData
    ? { ...options.headers }
    : { 'Content-Type': 'application/json', ...options.headers }

  let res
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (err) {
    throw new Error('No se pudo conectar con el servidor. Verifica tu conexión o intenta más tarde.')
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const mensaje = data?.mensaje || 'Ocurrió un error. Intenta de nuevo.'
    throw new Error(mensaje)
  }

  return data
}
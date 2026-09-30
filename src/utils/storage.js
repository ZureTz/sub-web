export const getLocalStorageItem = (itemKey) => {
  try {
    const raw = localStorage.getItem(itemKey)
    if (!raw) return ''
    const data = JSON.parse(raw)
    if (data?.expire > Date.now()) return data.value
    localStorage.removeItem(itemKey)
  } catch {
    // Storage may be disabled or contain a value from an older installation.
  }
  return ''
}

export const setLocalStorageItem = (itemKey, itemValue, ttl) => {
  try {
    const now = Date.now()
    localStorage.setItem(itemKey, JSON.stringify({
      setTime: now, ttl, expire: now + ttl * 1000, value: itemValue
    }))
  } catch {
    // A full or disabled cache must not prevent conversion.
  }
}

export async function copyText(value) {
  if (!value) return false
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    // Support HTTP self-hosted installations where Clipboard API is unavailable.
    const previousFocus = document.activeElement
    const input = document.createElement('textarea')
    input.value = value
    input.className = 'clipboard-fallback'
    input.setAttribute('readonly', '')
    document.body.appendChild(input)
    input.select()
    let copied = false
    try {
      copied = document.execCommand('copy')
    } catch {
      copied = false
    } finally {
      input.remove()
      previousFocus?.focus()
    }
    return copied
  }
}

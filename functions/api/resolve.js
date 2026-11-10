const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const DEFAULT_ORIGINS = 'https://short.trozure.uk,http://short.trozure.uk'
const MAX_REQUEST_BYTES = 8192

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

function parseUrl(value, base) {
  const url = new URL(value, base)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('invalid URL')
  }
  url.hash = ''
  return url
}

async function readInput(request) {
  if (!request.body) return null
  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let size = 0
  let body = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel()
        throw new Error('request too large')
      }
      body += decoder.decode(value, { stream: true })
    }
    return JSON.parse(body + decoder.decode())
  } finally {
    reader.releaseLock()
  }
}

export async function onRequest({ request, env = {} }) {
  if (request.method !== 'POST') return json({ error: '请使用 POST 请求解析短链接' }, 405)

  let url
  try {
    const input = await readInput(request)
    if (typeof input?.url !== 'string' || !input.url.trim()) throw new Error('missing URL')
    url = parseUrl(input.url.trim())
  } catch {
    return json({ error: '请输入有效的 HTTP 或 HTTPS 短链接（请求不超过 8 KB）' }, 400)
  }

  let allowedOrigins
  try {
    allowedOrigins = new Set((env.VITE_SHORT_URL_ALLOWED_ORIGINS || DEFAULT_ORIGINS)
      .split(',').map(value => parseUrl(value.trim()).origin))
  } catch {
    return json({ error: '短链接解析服务配置有误，请联系站点管理员' }, 500)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  const visited = new Set()
  try {
    for (let hops = 0; hops < 5; hops += 1) {
      // Only trusted short-link origins are fetched; the final converter URL is returned as data.
      if (!allowedOrigins.has(url.origin)) {
        return json({ error: '暂不支持此短链服务，请使用本站生成的短链接' }, 403)
      }
      if (visited.has(url.href)) return json({ error: '短链接存在循环跳转' }, 422)
      visited.add(url.href)

      const response = await fetch(url.href, {
        method: 'GET', redirect: 'manual', signal: controller.signal,
        headers: { Accept: '*/*' }, cache: 'no-store'
      })
      const location = response.headers.get('Location')
      await response.body?.cancel()
      if (response.status === 404 || response.status === 410) {
        return json({ error: '短链接不存在或已过期' }, 404)
      }
      if (!REDIRECT_STATUSES.has(response.status) || !location) {
        return json({ error: '短链服务未返回有效跳转地址' }, 422)
      }
      try {
        url = parseUrl(location, url)
      } catch {
        return json({ error: '短链接返回了无效的跳转地址' }, 422)
      }
      // Do not request the subscription backend: it may be slow or lack CORS headers.
      if (url.searchParams.has('target') && url.searchParams.has('url')) {
        return json({ url: url.href })
      }
    }
    return json({ error: '短链接跳转次数过多' }, 422)
  } catch {
    return json({ error: controller.signal.aborted ? '短链接解析超时，请稍后重试' : '无法连接短链服务，请稍后重试' }, controller.signal.aborted ? 504 : 502)
  } finally {
    clearTimeout(timer)
  }
}

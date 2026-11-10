import { CONSTANTS } from '@/config/constants'

export class UrlResolveService {
  static async resolve(value) {
    let url
    try {
      url = new URL(value)
    } catch {
      throw new Error('请输入完整的 HTTP 或 HTTPS 链接')
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('仅支持 HTTP 或 HTTPS 链接')
    }
    if (url.searchParams.has('target')) return url.href
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch(CONSTANTS.URL_RESOLVE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.href }),
        signal: controller.signal,
        cache: 'no-store'
      })
      if (!response.headers.get('Content-Type')?.includes('application/json')) {
        throw new Error('短链接解析接口不可用，请联系站点管理员')
      }
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '短链接解析失败，请稍后重试')
      if (typeof data.url !== 'string') throw new Error('短链接解析服务未返回有效链接')
      const resolved = new URL(data.url)
      if (!['http:', 'https:'].includes(resolved.protocol) || !resolved.searchParams.has('target') || !resolved.searchParams.has('url')) {
        throw new Error('该短链接未指向有效的 Subconverter 链接')
      }
      return resolved.href
    } catch (error) {
      if (controller.signal.aborted) throw new Error('短链接解析超时，请稍后重试')
      if (error instanceof TypeError || error instanceof SyntaxError) throw new Error('短链接解析服务不可用，请稍后重试')
      throw error
    } finally {
      clearTimeout(timer)
    }
  }
}

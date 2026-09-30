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
    const timer = setTimeout(() => controller.abort(), 10000)
    try {
      const response = await fetch(url.href, { redirect: 'follow', signal: controller.signal })
      if (!response.ok) throw new Error('请求失败')
      return response.url
    } catch {
      throw new Error('解析短链接失败，请检查链接及短链服务的跨域设置')
    } finally {
      clearTimeout(timer)
    }
  }
}

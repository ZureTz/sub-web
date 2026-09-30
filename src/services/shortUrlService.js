import { CONSTANTS } from '@/config/constants'

export class ShortUrlService {
  static async generateShortUrl(http, longUrl) {
    const formData = new FormData()
    const bytes = new TextEncoder().encode(longUrl)
    formData.append('longUrl', btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')))

    // Let the browser set the multipart boundary for FormData.
    const { data } = await http.post(CONSTANTS.SHORT_URL_API, formData)
    if (data.Code === 1 && typeof data.ShortUrl === 'string' && data.ShortUrl.trim()) {
      return data.ShortUrl
    }
    throw new Error(data.Message || '短链接获取失败')
  }
}

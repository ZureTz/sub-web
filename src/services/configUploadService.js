import { CONSTANTS } from '@/config/constants'

export class ConfigUploadService {
  static async uploadConfig(http, content) {
    const response = await http.post(CONSTANTS.CONFIG_UPLOAD_API, { content })
    return response.data
  }
}

import { useSubscriptionForm } from '@/composables/useSubscriptionForm'
import { CLIENT_TYPES } from '@/config/client-types'
import { UrlResolveService } from '@/services/urlResolveService'

export function useUrlParser() {
  const analyzeUrl = loadConfig => UrlResolveService.resolve(loadConfig)

  const parseUrl = async (loadConfig, form, customParams, onSuccess, onError) => {
    if (!loadConfig.trim()) {
      onError('订阅链接不能为空')
      return false
    }

    try {
      const url = new URL(await analyzeUrl(loadConfig.trim()))
      const params = url.searchParams
      const target = params.get('target')
      const clientType = target === 'surge' ? `surge&ver=${params.get('ver') || '4'}` : target
      const source = params.get('url')
      if (!['http:', 'https:'].includes(url.protocol) || !source?.trim() || !Object.values(CLIENT_TYPES).includes(clientType)) {
        onError('请输入包含有效 target 和 url 参数的 Subconverter 链接')
        return false
      }

      // Parse into a fresh object so invalid links never partially overwrite the form.
      const next = useSubscriptionForm().form
      next.clientType = clientType
      next.customBackend = `${url.origin}${url.pathname}?`
      next.sourceSubUrl = source.replace(/\|/g, '\n')
      const known = new Set(['target', 'url', 'ver'])
      const textFields = { config: 'remoteConfig', exclude: 'excludeRemarks', include: 'includeRemarks', filename: 'filename' }
      const booleanFields = {
        insert: 'insert', append_type: 'appendType', emoji: 'emoji', list: 'nodeList',
        tfo: 'tfo', scv: 'scv', fdn: 'fdn', sort: 'sort', udp: 'udp', expand: 'expand', new_name: 'new_name'
      }
      for (const [param, field] of Object.entries(textFields)) {
        known.add(param)
        next[field] = params.get(param) || ''
      }
      for (const [param, field] of Object.entries(booleanFields)) {
        known.add(param)
        if (params.has(param)) next[field] = params.get(param) === 'true'
      }
      for (const client of ['surge', 'clash']) {
        known.add(`${client}.doh`)
        next.tpl[client].doh = params.get(`${client}.doh`) === 'true'
      }
      const extras = Array.from(params.entries())
        .filter(([name]) => !known.has(name))
        .map(([name, value]) => ({ name, value }))
      Object.assign(form, next)
      customParams.splice(0, customParams.length, ...extras)
      onSuccess({ needUdp: params.has('udp') })
      return true
    } catch (error) {
      onError(error.message || '请输入正确的订阅地址')
      return false
    }
  }

  return { analyzeUrl, parseUrl }
}

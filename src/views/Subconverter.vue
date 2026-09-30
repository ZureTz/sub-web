<template>
  <div class="app-shell">
    <a class="skip-link" href="#workspace">跳转到订阅配置</a>
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" :href="homeUrl" aria-label="Subweb 首页">
          <span class="brand-mark"><ArrowLeftRight :size="21" :stroke-width="2.4" /></span>
          <span>subweb<span class="brand-dot">.</span></span>
        </a>
        <nav class="header-nav" aria-label="主导航">
          <span class="nav-active">订阅转换</span>
          <a :href="constants.DOC_ADVANCED" target="_blank" rel="noopener noreferrer">使用文档 <ArrowUpRight :size="13" /></a>
        </nav>
        <div class="header-actions">
          <UiButton variant="ghost" size="icon" :aria-label="isDark ? '切换浅色主题' : '切换深色主题'" @click="toggleTheme">
            <Sun v-if="isDark" :size="18" /><Moon v-else :size="18" />
          </UiButton>
          <span class="header-divider"></span>
          <UiButton variant="ghost" size="icon" as-child>
            <a :href="constants.PROJECT" target="_blank" rel="noopener noreferrer" aria-label="GitHub 项目"><Github :size="19" /></a>
          </UiButton>
        </div>
      </div>
    </header>

    <main id="workspace" class="workspace">
      <div class="breadcrumb"><Layers3 :size="14" /><span>工作空间</span><ChevronRight :size="12" /><span>订阅转换</span></div>
      <section class="page-intro">
        <div>
          <div class="eyebrow"><span></span> SIMPLE. CONNECTED.</div>
          <h1>你的订阅，无缝连接。</h1>
          <p>合并订阅、自定义规则，为你喜欢的客户端生成专属配置。</p>
        </div>
        <div class="client-support"><span class="support-icon"><Waypoints :size="21" /></span><div><strong>{{ clientCount }} 种客户端</strong><span>一个工具，轻松转换</span></div></div>
      </section>

      <Tabs v-model="advanced" class="mode-tabs">
        <div class="workspace-toolbar">
          <TabsList class="mode-list" aria-label="转换模式">
            <TabsTrigger value="1"><Zap :size="14" />基础模式</TabsTrigger>
            <TabsTrigger value="2"><SlidersHorizontal :size="14" />进阶模式</TabsTrigger>
          </TabsList>
          <span class="toolbar-hint"><LockKeyhole :size="13" />链接在浏览器本地生成</span>
        </div>
        <TabsContent :value="advanced">
      <div class="workspace-grid">
        <div class="configuration-column">
          <section class="panel source-panel" aria-labelledby="source-heading">
            <div class="section-heading">
              <div class="heading-group"><span class="step-number">01</span><div><h2 id="source-heading">添加订阅</h2><p>从一个链接开始，也可以合并多个订阅</p></div></div>
              <span class="count-badge">{{ sourceCount }} 个链接</span>
            </div>
            <div class="source-input-wrap">
              <UiLabel for="source-url" class="sr-only">订阅链接</UiLabel>
              <UiTextarea id="source-url" v-model="form.sourceSubUrl" class="source-textarea" rows="5" spellcheck="false" placeholder="在这里粘贴你的订阅链接…&#10;&#10;https://example.com/subscribe?token=…" @blur="saveSubUrl" />
              <UiButton v-if="form.sourceSubUrl" class="clear-source" variant="ghost" size="icon" aria-label="清空订阅链接" @click="clearSource"><X :size="15" /></UiButton>
            </div>
            <div class="source-help"><Info :size="13" /><span>支持订阅及 SS / SSR / VMess 等节点链接，多个链接用换行或 <code>|</code> 分隔</span></div>
            <div class="source-tools">
              <UiButton variant="outline" size="sm" @click="dialogLoadConfigVisible = true"><Link2 :size="14" />从 URL 解析</UiButton>
              <UiButton variant="ghost" size="sm" @click="dialogUploadConfigVisible = true"><Upload :size="14" />上传配置</UiButton>
            </div>
          </section>

          <section class="panel settings-panel" aria-labelledby="settings-heading">
            <div class="section-heading">
              <div class="heading-group"><span class="step-number">02</span><div><h2 id="settings-heading">转换设置</h2><p>选择客户端，让配置更合你的心意</p></div></div>
              <Settings2 :size="18" class="muted-icon" />
            </div>
            <div class="field">
              <UiLabel for="client-type">目标客户端 <span class="required-dot">*</span></UiLabel>
              <UiSelect v-model="form.clientType">
                <SelectTrigger id="client-type" class="w-full h-11"><span class="select-with-icon"><Monitor :size="16" /><SelectValue placeholder="选择客户端" /></span></SelectTrigger>
                <SelectContent><SelectItem v-for="(value, label) in options.clientTypes" :key="label" :value="value">{{ label }}</SelectItem></SelectContent>
              </UiSelect>
            </div>

            <template v-if="advanced === '2'">
              <div class="field">
                <div class="field-label-row"><UiLabel for="backend-url">转换后端</UiLabel><a :href="constants.BACKEND_RELEASE" target="_blank" rel="noopener noreferrer">自行搭建 <ArrowUpRight :size="12" /></a></div>
                <div class="input-with-icon"><Server :size="16" /><UiInput id="backend-url" v-model="form.customBackend" :placeholder="constants.DEFAULT_BACKEND" list="backend-options" spellcheck="false" /></div>
                <datalist id="backend-options"><option :value="constants.DEFAULT_BACKEND">默认后端</option></datalist>
                <p class="field-hint">留空使用默认后端，也可以填写你信任的服务地址。</p>
              </div>
              <div class="field">
                <div class="field-label-row"><UiLabel for="remote-config">远程配置</UiLabel><a :href="constants.REMOTE_CONFIG_SAMPLE" target="_blank" rel="noopener noreferrer">配置示例 <ArrowUpRight :size="12" /></a></div>
                <UiSelect :model-value="remoteSelection" @update:model-value="selectRemoteConfig">
                  <SelectTrigger id="remote-config" class="w-full h-11"><span class="select-with-icon"><FileSliders :size="16" /><SelectValue placeholder="使用后端默认配置" /></span></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">使用后端默认配置</SelectItem>
                    <SelectItem value="__custom__">自定义配置链接</SelectItem>
                    <SelectGroup v-for="group in options.remoteConfig" :key="group.label">
                      <SelectLabel>{{ group.label }}</SelectLabel>
                      <SelectItem v-for="item in group.options" :key="item.value" :value="item.value">{{ item.label }}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </UiSelect>
                <UiInput v-if="remoteSelection === '__custom__'" id="custom-config-url" v-model="form.remoteConfig" class="mt-2" aria-label="自定义远程配置链接" placeholder="https://example.com/config.ini" spellcheck="false" />
              </div>
              <div class="quick-options">
                <div><UiLabel for="emoji-switch"><Smile :size="16" />节点 Emoji</UiLabel><UiSwitch id="emoji-switch" v-model="form.emoji" /></div>
                <div><UiLabel for="nodelist-switch"><List :size="16" />仅输出节点</UiLabel><UiSwitch id="nodelist-switch" v-model="form.nodeList" /></div>
              </div>
              <details class="advanced-details">
                <summary><span><SlidersHorizontal :size="15" />更多高级设置</span><ChevronDown :size="16" /></summary>
                <div class="advanced-content">
                  <div class="filter-grid">
                    <div class="field"><UiLabel for="include">包含节点</UiLabel><UiInput id="include" v-model="form.includeRemarks" placeholder="关键词或正则表达式" /></div>
                    <div class="field"><UiLabel for="exclude">排除节点</UiLabel><UiInput id="exclude" v-model="form.excludeRemarks" placeholder="关键词或正则表达式" /></div>
                  </div>
                  <div class="field"><UiLabel for="filename">配置文件名</UiLabel><UiInput id="filename" v-model="form.filename" placeholder="例如：my-subscription" /></div>
                  <div class="switch-grid">
                    <div v-for="option in booleanOptions" :key="option.key" class="switch-row"><UiLabel :for="`option-${option.key}`">{{ option.label }}</UiLabel><UiSwitch :id="`option-${option.key}`" v-model="form[option.key]" @update:model-value="option.key === 'udp' && (needUdp = true)" /></div>
                    <div class="switch-row"><UiLabel for="surge-doh">Surge DoH</UiLabel><UiSwitch id="surge-doh" v-model="form.tpl.surge.doh" /></div>
                    <div class="switch-row"><UiLabel for="clash-doh">Clash DoH</UiLabel><UiSwitch id="clash-doh" v-model="form.tpl.clash.doh" /></div>
                  </div>
                  <div class="custom-params-heading"><UiLabel>自定义参数</UiLabel><UiButton variant="ghost" size="sm" @click="addCustomParam"><Plus :size="14" />添加参数</UiButton></div>
                  <div v-for="(param, index) in customParams" :key="index" class="custom-param-row">
                    <UiInput v-model="param.name" :aria-label="`参数 ${index + 1} 名称`" placeholder="参数名" />
                    <UiInput v-model="param.value" :aria-label="`参数 ${index + 1} 内容`" placeholder="参数值" />
                    <UiButton variant="ghost" size="icon" :aria-label="`删除参数 ${index + 1}`" @click="customParams.splice(index, 1)"><Trash2 :size="15" /></UiButton>
                  </div>
                  <p v-if="!customParams.length" class="field-hint">需要更多控制？添加自定义参数，或查看<a :href="constants.DOC_ADVANCED" target="_blank" rel="noopener noreferrer">进阶文档 ↗</a>。</p>
                </div>
              </details>
            </template>
            <div v-else class="basic-note"><Sparkles :size="18" /><p>保持简单，使用默认配置。<br /><span>需要自定义规则和节点？切换到进阶模式。</span></p></div>
          </section>
        </div>

        <aside class="result-column" aria-label="转换结果">
          <section class="panel result-panel">
            <div class="section-heading"><div class="heading-group"><span class="step-number">03</span><div><h2>生成订阅</h2><p>准备就绪，一键连接你的客户端</p></div></div><span class="result-status" :class="{ ready: customSubUrl }"><span></span>{{ customSubUrl ? '已生成' : '待生成' }}</span></div>
            <div class="output-summary"><span>目标客户端</span><strong><span class="tiny-dot"></span>{{ clientLabel }}</strong></div>
            <div v-if="!customSubUrl" class="empty-result">
              <div class="output-illustration"><span class="orbit-dot"></span><div><Link2 :size="29" :stroke-width="1.5" /></div><span class="illustration-spark">+</span></div>
              <h3>好连接，从这里开始</h3><p>添加订阅链接并完成设置<br />你的专属订阅将在这里生成</p>
            </div>
            <div v-else class="generated-result" aria-live="polite">
              <div class="result-label"><UiLabel for="result-url">专属订阅链接</UiLabel><span><Check :size="12" />生成成功</span></div>
              <UiTextarea id="result-url" :model-value="customSubUrl" readonly rows="5" class="result-textarea" spellcheck="false" />
              <UiButton variant="outline" class="w-full mt-3" @click="copyResult(customSubUrl)"><Copy :size="14" />复制订阅链接</UiButton>
              <div v-if="shortSubUrl" class="short-result"><UiLabel for="short-url">订阅短链接</UiLabel><div><UiInput id="short-url" :model-value="shortSubUrl" readonly /><UiButton variant="outline" size="icon" aria-label="复制短链接" @click="copyResult(shortSubUrl)"><Copy :size="14" /></UiButton></div></div>
            </div>
            <UiButton class="generate-button w-full" :disabled="!canGenerateUrl" @click="makeUrlClick"><Sparkles :size="16" />{{ customSubUrl ? '重新生成订阅链接' : '生成订阅链接' }}<ArrowRight :size="16" /></UiButton>
            <p v-if="!canGenerateUrl" class="generate-hint">先在左侧添加订阅链接，即可开始转换</p>
            <p v-else class="generate-hint">{{ customSubUrl ? '修改配置后，请重新生成订阅' : '生成后可复制链接，或直接导入客户端' }}</p>
            <div class="secondary-actions">
              <UiButton variant="outline" :disabled="!customSubUrl || shortLoading" @click="makeShortUrlClick"><LoaderCircle v-if="shortLoading" class="animate-spin" :size="14" /><Link2 v-else :size="14" />{{ shortLoading ? '生成中…' : '生成短链接' }}</UiButton>
              <UiButton variant="outline" :disabled="!canImportClash" @click="clashInstall"><ExternalLink :size="14" />导入 Clash</UiButton>
            </div>
          </section>

          <section class="privacy-note"><span class="privacy-icon"><ShieldCheck :size="19" /></span><div><h3>你的隐私，始终重要</h3><p>链接在本地生成。实际转换时，订阅将由所选后端处理；短链与配置上传会使用对应服务。请仅使用你信任的服务。</p></div></section>
          <section class="getting-started"><div class="guide-heading"><BookOpen :size="16" /><h3>三步，轻松开始</h3></div><ol><li><span>1</span>粘贴一个或多个原始订阅链接</li><li><span>2</span>选择客户端，按需调整配置</li><li><span>3</span>生成链接并导入你的客户端</li></ol><a :href="constants.DOC_ADVANCED" target="_blank" rel="noopener noreferrer">查看完整使用指南 <ArrowUpRight :size="13" /></a></section>
        </aside>
      </div>
        </TabsContent>
      </Tabs>
      <footer class="page-footer"><span>subweb<span class="brand-dot">.</span><span class="footer-separator">/</span>让连接更简单</span><span>{{ backendVersion || 'Powered by Subconverter' }}<span class="footer-separator">·</span><a :href="constants.PROJECT" target="_blank" rel="noopener noreferrer">开源，自由，连接 <ArrowUpRight :size="12" /></a></span></footer>
    </main>

    <ConfigUploadDialog :visible="dialogUploadConfigVisible" :loading="uploadLoading" :error="uploadError" @cancel="dialogUploadConfigVisible = false" @confirm="handleConfigUpload" />
    <UrlParseDialog :visible="dialogLoadConfigVisible" :loading="parseLoading" :error="parseError" @cancel="dialogLoadConfigVisible = false" @confirm="handleUrlParse" />
    <Transition name="toast"><div v-if="notice" class="toast-message" :class="notice.type" :role="notice.type === 'error' ? 'alert' : 'status'"><CircleAlert v-if="notice.type === 'error'" :size="18" /><CheckCircle2 v-else :size="18" /><span>{{ notice.text }}</span><button aria-label="关闭提示" @click="notice = null"><X :size="15" /></button></div></Transition>
  </div>
</template>

<script>
import { ArrowLeftRight, ArrowUpRight, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight, CircleAlert, Copy, ExternalLink, FileSliders, Info, Layers3, Link2, List, LoaderCircle, LockKeyhole, Monitor, Moon, Plus, Server, Settings2, ShieldCheck, SlidersHorizontal, Smile, Sparkles, Sun, Trash2, Upload, Waypoints, X, Zap } from '@lucide/vue'
import Github from '@/components/GithubIcon.vue'
import { CONSTANTS } from '@/config/constants'
import { CLIENT_TYPES } from '@/config/client-types'
import { REMOTE_CONFIGS } from '@/config/remote-configs'
import { useSubscriptionForm, addCustomParam, saveSubUrl } from '@/composables/useSubscriptionForm'
import { useSubscription } from '@/composables/useSubscription'
import { useUrlParser } from '@/composables/useUrlParser'
import { getLocalStorageItem, setLocalStorageItem } from '@/utils/storage'
import { formatErrorMessage, processSubUrl } from '@/utils/formatters'
import { validateBackend } from '@/utils/validators'
import { copyText } from '@/utils/clipboard'
import { http } from '@/services/http'
import { BackendService } from '@/services/backendService'
import { ShortUrlService } from '@/services/shortUrlService'
import { ConfigUploadService } from '@/services/configUploadService'
import { Button as UiButton } from '@/components/ui/button'
import { Input as UiInput } from '@/components/ui/input'
import { Textarea as UiTextarea } from '@/components/ui/textarea'
import { Label as UiLabel } from '@/components/ui/label'
import { Select as UiSelect, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch as UiSwitch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ConfigUploadDialog from '@/components/ConfigUploadDialog.vue'
import UrlParseDialog from '@/components/UrlParseDialog.vue'

export default {
  name: 'Subconverter',
  components: {
    ArrowLeftRight, ArrowUpRight, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight, CircleAlert, Copy, ExternalLink, FileSliders, Github, Info, Layers3, Link2, List, LoaderCircle, LockKeyhole, Monitor, Moon, Plus, Server, Settings2, ShieldCheck, SlidersHorizontal, Smile, Sparkles, Sun, Trash2, Upload, Waypoints, X, Zap,
    UiButton, UiInput, UiTextarea, UiLabel, UiSelect, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, UiSwitch, Tabs, TabsContent, TabsList, TabsTrigger, ConfigUploadDialog, UrlParseDialog
  },
  data() {
    return {
      ...useSubscriptionForm(),
      constants: CONSTANTS,
      options: { clientTypes: CLIENT_TYPES, remoteConfig: REMOTE_CONFIGS },
      booleanOptions: [
        { key: 'udp', label: '启用 UDP' }, { key: 'tfo', label: 'TCP Fast Open' },
        { key: 'scv', label: '跳过证书验证' }, { key: 'appendType', label: '显示节点类型' },
        { key: 'sort', label: '排序节点' }, { key: 'fdn', label: '过滤非法节点' },
        { key: 'expand', label: '展开规则' }, { key: 'insert', label: '插入默认节点' },
        { key: 'new_name', label: 'Clash 新字段' }
      ],
      backendVersion: '', shortSubUrl: '', shortLoading: false, uploadLoading: false, parseLoading: false,
      uploadError: '', parseError: '',
      dialogUploadConfigVisible: false, dialogLoadConfigVisible: false, customRemote: false,
      isDark: false, notice: null, noticeTimer: null
    }
  },
  computed: {
    homeUrl() { return this.$router.resolve('/').href },
    clientCount() { return Object.keys(CLIENT_TYPES).length },
    clientLabel() { return Object.keys(CLIENT_TYPES).find(key => CLIENT_TYPES[key] === this.form.clientType) || '请选择' },
    sourceCount() { return this.processedSubUrl ? this.processedSubUrl.split('|').length : 0 },
    processedSubUrl() { return processSubUrl(this.form.sourceSubUrl) },
    currentBackend() { return this.form.customBackend.trim() || CONSTANTS.DEFAULT_BACKEND },
    canGenerateUrl() { return Boolean(this.processedSubUrl && this.form.clientType) },
    canImportClash() { return Boolean(this.customSubUrl && ['clash', 'clashr'].includes(this.form.clientType)) },
    remoteSelection() {
      if (this.customRemote) return '__custom__'
      if (!this.form.remoteConfig) return '__default__'
      return REMOTE_CONFIGS.some(group => group.options.some(item => item.value === this.form.remoteConfig)) ? this.form.remoteConfig : '__custom__'
    }
  },
  watch: {
    form: { deep: true, handler() { this.invalidateResult() } },
    customParams: { deep: true, handler() { this.invalidateResult() } },
    advanced() { this.invalidateResult() },
    dialogUploadConfigVisible() { this.uploadError = '' },
    dialogLoadConfigVisible() { this.parseError = '' }
  },
  created() {
    this.form.clientType = CONSTANTS.DEFAULT_CLIENT_TYPE
    if (CONSTANTS.USE_STORAGE) this.form.sourceSubUrl = getLocalStorageItem('sourceSubUrl') || ''
    this.isDark = getLocalStorageItem('theme') === 'dark'
    document.documentElement.classList.toggle('dark', this.isDark)
  },
  async mounted() {
    this.backendVersion = await BackendService.getBackendVersion(http)
  },
  beforeUnmount() { clearTimeout(this.noticeTimer) },
  methods: {
    ...useSubscription(),
    ...useUrlParser(),
    notify(text, type = 'success') {
      clearTimeout(this.noticeTimer)
      this.notice = { text, type }
      this.noticeTimer = setTimeout(() => { this.notice = null }, 5000)
    },
    toggleTheme() {
      this.isDark = !this.isDark
      document.documentElement.classList.toggle('dark', this.isDark)
      setLocalStorageItem('theme', this.isDark ? 'dark' : 'light', 31536000)
    },
    invalidateResult() { this.customSubUrl = ''; this.shortSubUrl = '' },
    saveSubUrl() { saveSubUrl(this.form) },
    clearSource() {
      this.form.sourceSubUrl = ''
      if (CONSTANTS.USE_STORAGE) setLocalStorageItem('sourceSubUrl', '', CONSTANTS.CACHE_TTL)
    },
    addCustomParam() { addCustomParam(this.customParams) },
    selectRemoteConfig(value) {
      this.customRemote = value === '__custom__'
      this.form.remoteConfig = value.startsWith('__') ? '' : value
    },
    makeUrlClick() {
      if (!validateBackend(this.currentBackend)) {
        this.notify('请输入有效的 HTTP 或 HTTPS 转换后端地址', 'error')
        return
      }
      const url = this.makeUrl(this.form, this.advanced, this.processedSubUrl, this.currentBackend, this.customParams, this.needUdp)
      if (!url) return this.notify('请填写订阅链接并选择客户端', 'error')
      this.customSubUrl = url
      this.shortSubUrl = ''
      this.saveSubUrl()
      this.notify('订阅链接已生成')
    },
    async copyResult(value) {
      const copied = await copyText(value)
      this.notify(copied ? '链接已复制到剪贴板' : '复制失败，请选中链接后手动复制', copied ? 'success' : 'error')
    },
    async makeShortUrlClick() {
      if (!this.customSubUrl || this.shortLoading) return
      const source = this.customSubUrl
      this.shortLoading = true
      try {
        const shortUrl = await ShortUrlService.generateShortUrl(http, source)
        if (this.customSubUrl !== source) return
        this.shortSubUrl = shortUrl
        this.notify('短链接已生成')
      } catch (error) {
        this.notify(`短链接获取失败：${formatErrorMessage(error)}`, 'error')
      } finally { this.shortLoading = false }
    },
    clashInstall() {
      if (!this.canImportClash) return
      window.location.href = `clash://install-config?url=${encodeURIComponent(this.shortSubUrl || this.customSubUrl)}`
    },
    async handleConfigUpload(content) {
      if (!content.trim() || this.uploadLoading) return
      this.uploadError = ''
      this.uploadLoading = true
      try {
        const result = await ConfigUploadService.uploadConfig(http, content)
        if (result.code !== 0 || !result.data?.url) throw new Error(result.msg || '服务未返回配置链接')
        this.form.remoteConfig = result.data.url
        this.customRemote = true
        this.advanced = '2'
        this.dialogUploadConfigVisible = false
        this.notify('配置已上传并填入远程配置，有效期三个月')
      } catch (error) {
        this.uploadError = `配置上传失败：${formatErrorMessage(error)}`
      } finally { this.uploadLoading = false }
    },
    async handleUrlParse(url) {
      if (this.parseLoading) return
      this.parseError = ''
      this.parseLoading = true
      try {
        await this.parseUrl(url, this.form, this.customParams, ({ needUdp }) => {
          this.needUdp = needUdp
          this.customRemote = false
          this.advanced = '2'
          this.dialogLoadConfigVisible = false
          this.saveSubUrl()
          this.notify('链接已解析，配置已恢复到表单')
        }, error => { this.parseError = error })
      } finally { this.parseLoading = false }
    }
  }
}
</script>

<style scoped>
.app-shell { min-height: 100vh; }
.site-header { height: 76px; background: var(--card); border-bottom: 1px solid var(--border); }
.header-inner { max-width: 1216px; margin: auto; padding: 0 32px; height: 100%; display: flex; align-items: center; gap: 70px; }
.brand { display: flex; align-items: center; gap: 10px; font-size: 25px; font-weight: 750; letter-spacing: -1px; color: var(--foreground); }
.brand-mark { display: grid; place-items: center; width: 35px; height: 35px; background: #5264dc; color: #fff; border-radius: 10px; box-shadow: 0 3px 7px #5264dc20; }
.brand-dot { color: var(--primary); }
.header-nav { display: flex; height: 100%; align-items: center; gap: 30px; font-size: 13px; color: var(--muted-foreground); }
.header-nav a { display: flex; align-items: center; gap: 4px; }
.nav-active { display: flex; height: 100%; align-items: center; border-bottom: 2px solid var(--primary); color: var(--primary); font-weight: 600; padding-top: 2px; }
.header-actions { margin-left: auto; display: flex; gap: 8px; align-items: center; color: var(--muted-foreground); }
.header-divider { height: 18px; width: 1px; background: var(--border); margin: 0 4px; }
.workspace { max-width: 1216px; padding: 30px 32px 0; margin: auto; }
.breadcrumb { display: flex; align-items: center; gap: 9px; color: var(--muted-foreground); font-size: 11px; }
.breadcrumb span:last-child { color: var(--secondary-foreground); }
.page-intro { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 31px 0 33px; }
.eyebrow { display: flex; align-items: center; gap: 7px; font-size: 10px; letter-spacing: 1.9px; font-weight: 650; color: var(--primary); }
.eyebrow > span { width: 5px; height: 5px; background: var(--primary); border-radius: 50%; }
h1 { font-size: 31px; font-weight: 650; letter-spacing: -1px; margin: 10px 0 10px; line-height: 1.5; }
.page-intro p { color: var(--muted-foreground); font-size: 13px; }
.client-support { display: flex; align-items: center; gap: 12px; margin-right: 5px; }
.support-icon { background: var(--accent); color: var(--primary); padding: 11px; border-radius: 13px; }
.client-support strong { display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; }
.client-support div > span { color: var(--muted-foreground); font-size: 11px; }
.workspace-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.mode-list { padding: 4px; height: 40px; background: var(--border); border-radius: 8px; }
.mode-list :deep(button) { gap: 7px; font-size: 12px; border-radius: 5px; padding: 6px 16px; }
.mode-list :deep(button[data-state='active']) { background: var(--card); color: var(--foreground); box-shadow: 0 1px 3px #19244412; }
.toolbar-hint { display: flex; align-items: center; gap: 6px; color: var(--muted-foreground); font-size: 11px; }
.workspace-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: 24px; align-items: start; }
.configuration-column { display: flex; flex-direction: column; gap: 22px; min-width: 0; }
.panel { background: var(--card); border: 1px solid var(--border); border-radius: 13px; padding: 25px 26px; box-shadow: 0 2px 4px #1d284203; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 23px; }
.heading-group { display: flex; gap: 12px; align-items: flex-start; }
.step-number { display: grid; place-items: center; width: 29px; height: 29px; flex-shrink: 0; margin-top: 1px; color: var(--primary); background: var(--accent); border: 1px solid color-mix(in srgb, var(--primary) 10%, transparent); border-radius: 8px; font-size: 11px; font-weight: 650; font-variant-numeric: tabular-nums; }
h2 { font-size: 15px; font-weight: 650; line-height: 1.7; }
.heading-group p { color: var(--muted-foreground); font-size: 11px; margin-top: 3px; }
.count-badge { font-size: 10px; color: var(--muted-foreground); padding: 4px 8px; border-radius: 5px; background: var(--muted); white-space: nowrap; }
.source-input-wrap { position: relative; }
.source-textarea { min-height: 153px; font-size: 12px; line-height: 1.8; padding: 14px 37px 14px 15px; border-radius: 8px; resize: vertical; box-shadow: none; background: color-mix(in srgb, var(--background) 45%, var(--card)); }
.source-textarea::placeholder { color: var(--muted-foreground); opacity: .8; }
.clear-source { position: absolute; top: 5px; right: 5px; height: 28px; width: 28px; color: var(--muted-foreground); }
.source-help { display: flex; align-items: flex-start; gap: 6px; color: var(--muted-foreground); font-size: 10px; line-height: 1.8; margin-top: 10px; }
.source-help svg { flex-shrink: 0; margin-top: 2px; }
.source-help code { color: var(--primary); padding: 0 3px; }
.source-tools { display: flex; align-items: center; gap: 8px; border-top: 1px solid var(--border); margin-top: 18px; padding-top: 17px; }
.source-tools :deep(button) { font-size: 11px; gap: 7px; }
.muted-icon { color: var(--muted-foreground); }
.field { display: flex; flex-direction: column; gap: 9px; margin-bottom: 21px; min-width: 0; }
.field :deep(label) { font-size: 12px; font-weight: 550; gap: 3px; }
.field :deep(input), .field :deep(button[role='combobox']) { font-size: 12px; min-height: 42px; box-shadow: none; background: var(--card); }
.required-dot { color: var(--primary); margin-left: 3px; }
.field-label-row { display: flex; align-items: center; justify-content: space-between; }
.field-label-row a { display: flex; align-items: center; gap: 2px; color: var(--muted-foreground); font-size: 10px; }
.field-label-row a:hover, .header-nav a:hover { color: var(--primary); }
.select-with-icon { display: flex; gap: 10px; align-items: center; min-width: 0; }
.select-with-icon > svg { color: var(--muted-foreground); flex-shrink: 0; }
.select-with-icon :deep(span) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.input-with-icon { position: relative; }
.input-with-icon > svg { position: absolute; left: 13px; top: 13px; color: var(--muted-foreground); }
.input-with-icon :deep(input) { padding-left: 39px; }
.field-hint { color: var(--muted-foreground); font-size: 10px; line-height: 1.8; }
.field-hint a { color: var(--primary); margin-left: 3px; }
.quick-options { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin: 25px 0 21px; }
.quick-options > div { display: flex; align-items: center; justify-content: space-between; gap: 9px; }
.quick-options :deep(label) { display: flex; gap: 8px; font-size: 12px; font-weight: 400; }
.quick-options :deep(label svg) { color: var(--muted-foreground); }
.advanced-details { border-top: 1px solid var(--border); padding-top: 18px; }
.advanced-details summary { display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: var(--secondary-foreground); cursor: pointer; list-style: none; }
.advanced-details summary::-webkit-details-marker { display: none; }
.advanced-details summary > span { display: flex; align-items: center; gap: 8px; }
.advanced-details[open] summary > svg { transform: rotate(180deg); }
.advanced-content { padding-top: 24px; }
.filter-grid, .switch-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.switch-grid { gap: 18px 26px; margin-bottom: 20px; }
.switch-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.switch-row :deep(label) { font-size: 11px; font-weight: 400; }
.custom-params-heading { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid var(--border); margin-bottom: 7px; }
.custom-params-heading :deep(label), .custom-params-heading :deep(button) { font-size: 11px; }
.custom-param-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; margin-bottom: 10px; }
.custom-param-row :deep(input) { font-size: 12px; min-width: 0; }
.basic-note { background: var(--muted); border-radius: 8px; display: flex; align-items: center; gap: 12px; padding: 16px; color: var(--primary); }
.basic-note p { color: var(--secondary-foreground); font-size: 12px; line-height: 1.9; }
.basic-note span { color: var(--muted-foreground); font-size: 11px; }
.result-column { position: sticky; top: 24px; min-width: 0; }
.result-panel { padding: 25px 23px 23px; }
.result-panel .section-heading { gap: 5px; }
.result-panel .heading-group { gap: 10px; }
.result-status { display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--muted-foreground); white-space: nowrap; }
.result-status > span { width: 5px; height: 5px; border-radius: 50%; background: #a7adba; }
.result-status.ready { color: #279777; }
.result-status.ready > span { background: #279777; }
.output-summary { display: flex; justify-content: space-between; align-items: center; padding: 12px 13px; background: var(--muted); border-radius: 7px; font-size: 11px; }
.output-summary > span { color: var(--muted-foreground); }
.output-summary strong { display: flex; align-items: center; gap: 6px; font-weight: 550; }
.tiny-dot { width: 5px; height: 5px; background: var(--primary); border-radius: 50%; }
.empty-result { display: flex; flex-direction: column; align-items: center; padding: 33px 0 31px; text-align: center; }
.output-illustration { width: 94px; height: 84px; position: relative; display: grid; place-items: center; margin-bottom: 16px; }
.output-illustration::before { content: ''; position: absolute; width: 84px; height: 84px; border: 1px dashed color-mix(in srgb, var(--primary) 24%, transparent); border-radius: 50%; transform: rotate(-15deg); }
.output-illustration > div { width: 56px; height: 56px; border: 1px solid color-mix(in srgb, var(--primary) 18%, transparent); border-radius: 17px; background: var(--accent); color: var(--primary); display: grid; place-items: center; transform: rotate(-8deg); box-shadow: 0 5px 12px #5264dc0c; }
.orbit-dot { position: absolute; z-index: 1; left: 6px; bottom: 14px; width: 7px; height: 7px; border: 2px solid var(--card); background: #aab3f8; border-radius: 50%; }
.illustration-spark { position: absolute; right: 0; top: 3px; font-size: 16px; color: #aab3f8; }
.empty-result h3 { font-size: 13px; font-weight: 550; margin-bottom: 8px; }
.empty-result p { color: var(--muted-foreground); font-size: 11px; line-height: 1.9; }
.generate-button { height: 43px; font-size: 12px; gap: 8px; border-radius: 7px; box-shadow: 0 3px 7px #5264dc14; }
.generate-button:disabled { opacity: .55; }
.generate-button :deep(svg:last-child) { margin-left: auto; }
.generate-button :deep(svg:first-child) { margin-right: auto; }
.generate-hint { text-align: center; color: var(--muted-foreground); font-size: 10px; padding: 11px 0 20px; }
.secondary-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 17px; border-top: 1px solid var(--border); }
.secondary-actions :deep(button) { font-size: 11px; height: 36px; gap: 7px; }
.generated-result { padding: 23px 0; }
.result-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.result-label :deep(label), .short-result :deep(label) { font-size: 11px; }
.result-label > span { display: flex; gap: 3px; align-items: center; color: #279777; font-size: 10px; }
.result-textarea { font-family: ui-monospace, monospace; font-size: 11px; line-height: 1.8; word-break: break-all; resize: vertical; background: var(--muted); }
.generated-result :deep(button) { font-size: 11px; }
.short-result { padding-top: 20px; }
.short-result > div { display: flex; gap: 7px; margin-top: 9px; }
.short-result :deep(input) { font-size: 11px; min-width: 0; }
.short-result :deep(button) { flex-shrink: 0; }
.privacy-note { display: flex; align-items: flex-start; gap: 11px; padding: 20px 17px; margin-top: 18px; background: color-mix(in srgb, var(--primary) 4%, var(--background)); border: 1px solid color-mix(in srgb, var(--primary) 10%, var(--border)); border-radius: 10px; }
.privacy-icon { color: var(--primary); margin-top: 2px; }
.privacy-note h3 { font-size: 12px; font-weight: 550; margin-bottom: 6px; }
.privacy-note p { font-size: 10px; color: var(--muted-foreground); line-height: 1.9; }
.getting-started { padding: 28px 17px 18px; }
.guide-heading { display: flex; align-items: center; gap: 8px; color: var(--secondary-foreground); }
.guide-heading h3 { font-size: 12px; font-weight: 550; }
.getting-started ol { margin: 17px 0 18px; display: flex; flex-direction: column; gap: 13px; }
.getting-started li { display: flex; align-items: center; gap: 10px; font-size: 11px; color: var(--muted-foreground); }
.getting-started li span { display: grid; place-items: center; width: 19px; height: 19px; border: 1px solid var(--border); border-radius: 50%; font-size: 9px; background: var(--card); }
.getting-started > a { display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--primary); margin-left: 29px; }
.page-footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border); margin-top: 42px; padding: 23px 0 27px; font-size: 10px; color: var(--muted-foreground); gap: 14px; }
.page-footer > span { display: flex; align-items: center; flex-wrap: wrap; }
.page-footer > span:first-child { font-weight: 500; }
.page-footer a { display: inline-flex; align-items: center; gap: 3px; }
.footer-separator { margin: 0 10px; opacity: .55; }
.toast-message { position: fixed; z-index: 100; right: 28px; bottom: 28px; display: flex; align-items: center; gap: 11px; background: var(--card); color: var(--foreground); border: 1px solid var(--border); border-radius: 11px; padding: 16px 18px; box-shadow: 0 8px 32px #14204a18; max-width: min(470px, calc(100vw - 32px)); font-size: 13px; }
.toast-message > svg { color: #279777; flex-shrink: 0; }
.toast-message.error > svg { color: var(--destructive); }
.toast-message > button { flex-shrink: 0; color: var(--muted-foreground); padding: 3px; }
.toast-enter-active, .toast-leave-active { transition: opacity .2s, transform .2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }
.skip-link { position: fixed; z-index: 100; top: -60px; left: 20px; padding: 12px; background: var(--card); border: 1px solid var(--primary); border-radius: 8px; }
.skip-link:focus { top: 12px; }
@media (min-width: 1450px) { .workspace { padding-top: 36px; } .page-intro { margin-top: 36px; margin-bottom: 38px; } }
@media (max-width: 1023px) { .header-inner { gap: 44px; } .workspace-grid { grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 18px; } .panel { padding: 21px 19px; } .result-panel .heading-group p { max-width: 130px; } .quick-options { gap: 15px; } .result-status { align-self: flex-start; margin-top: 7px; } }
@media (max-width: 767px) { .site-header { height: 65px; } .header-inner { padding: 0 20px; gap: 32px; } .header-nav { gap: 20px; font-size: 12px; } .brand { font-size: 23px; } .brand-mark { width: 31px; height: 31px; } .workspace { padding: 23px 20px 0; } .page-intro { margin: 26px 0; } h1 { font-size: 28px; } .page-intro p { max-width: 360px; line-height: 1.8; font-size: 12px; } .client-support { display: none; } .workspace-grid { grid-template-columns: 1fr; gap: 20px; } .result-column { position: static; } .result-panel .heading-group p { max-width: none; } .panel { padding: 23px; } .empty-result { padding: 25px 0; } .toolbar-hint { font-size: 10px; } .page-footer { flex-direction: column; align-items: flex-start; margin-top: 22px; gap: 10px; } .getting-started { padding-bottom: 8px; } .toast-message { bottom: 16px; right: 16px; } }
@media (max-width: 440px) { .header-nav { display: none; } .header-inner, .workspace { padding-left: 16px; padding-right: 16px; } .panel { padding: 20px; } .toolbar-hint { max-width: 103px; line-height: 1.6; gap: 4px; } .toolbar-hint svg { flex-shrink: 0; } .mode-list :deep(button) { padding: 6px 10px; font-size: 11px; } .heading-group p { font-size: 10px; } .section-heading { gap: 6px; } .quick-options { gap: 18px; } .quick-options :deep(label) { gap: 5px; font-size: 11px; } .switch-grid { gap: 16px 20px; } .filter-grid { grid-template-columns: 1fr; gap: 0; } .result-status { font-size: 9px; } h1 { font-size: 26px; } }
</style>

<template>
  <UiDialog :open="visible" @update:open="handleOpenChange">
    <DialogContent :show-close-button="!loading" class="sm:max-w-xl" @escape-key-down="guardClose" @pointer-down-outside="guardClose">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2"><Upload class="size-5 text-primary" />上传远程配置</DialogTitle>
        <DialogDescription>粘贴配置内容，上传后自动填入远程配置。托管链接有效期为三个月。</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleConfirm">
        <div class="space-y-2">
          <div class="flex items-center justify-between"><UiLabel for="upload-content">配置内容</UiLabel><a :href="sampleConfig" target="_blank" rel="noopener noreferrer" class="text-xs text-primary">参考配置 ↗</a></div>
          <UiTextarea id="upload-content" v-model="content" :disabled="loading" rows="12" maxlength="10000" class="max-h-[45vh] font-mono text-xs leading-relaxed" placeholder="[custom]&#10;ruleset=…&#10;custom_proxy_group=…" spellcheck="false" />
          <p class="text-right text-xs text-muted-foreground">{{ content.length }} / 10,000</p>
        </div>
        <p v-if="error" role="alert" class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{{ error }}</p>
        <DialogFooter><UiButton type="button" variant="outline" :disabled="loading" @click="$emit('cancel')">取消</UiButton><UiButton type="submit" :disabled="!content.trim() || loading"><LoaderCircle v-if="loading" class="size-4 animate-spin" /><Upload v-else class="size-4" />{{ loading ? '正在上传…' : '上传并应用' }}</UiButton></DialogFooter>
      </form>
    </DialogContent>
  </UiDialog>
</template>

<script>
import { LoaderCircle, Upload } from '@lucide/vue'
import { CONSTANTS } from '@/config/constants'
import { Button as UiButton } from '@/components/ui/button'
import { Textarea as UiTextarea } from '@/components/ui/textarea'
import { Label as UiLabel } from '@/components/ui/label'
import { Dialog as UiDialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default {
  name: 'ConfigUploadDialog',
  components: { LoaderCircle, Upload, UiButton, UiTextarea, UiLabel, UiDialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle },
  props: { visible: Boolean, loading: Boolean, error: { type: String, default: '' } },
  emits: ['cancel', 'confirm'],
  data() { return { content: '', sampleConfig: CONSTANTS.REMOTE_CONFIG_SAMPLE } },
  watch: { visible(value) { if (!value) this.content = '' } },
  methods: {
    guardClose(event) { if (this.loading) event.preventDefault() },
    handleOpenChange(open) { if (!open && !this.loading) this.$emit('cancel') },
    handleConfirm() { if (this.content.trim() && !this.loading) this.$emit('confirm', this.content) }
  }
}
</script>

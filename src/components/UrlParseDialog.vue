<template>
  <UiDialog :open="visible" @update:open="handleOpenChange">
    <DialogContent :show-close-button="!loading" class="sm:max-w-lg" @escape-key-down="guardClose" @pointer-down-outside="guardClose">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2"><Link2 class="size-5 text-primary" />从 URL 恢复配置</DialogTitle>
        <DialogDescription>直接粘贴 Subconverter 长链接或本站生成的短链接，自动还原订阅和转换参数，无需先打开短链接。</DialogDescription>
      </DialogHeader>
      <form class="min-w-0 space-y-5" @submit.prevent="handleConfirm">
        <div class="space-y-2"><UiLabel for="parse-url">订阅转换链接</UiLabel><UiTextarea id="parse-url" v-model="url" :disabled="loading" rows="4" placeholder="https://example.com/sub?target=clash&amp;url=…" spellcheck="false" class="field-sizing-fixed resize-y text-sm" /></div>
        <p class="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">解析成功后会替换当前表单。短链接会通过本站解析服务展开，请仅粘贴你信任的链接。</p>
        <p v-if="error" role="alert" class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{{ error }}</p>
        <DialogFooter><UiButton type="button" variant="outline" :disabled="loading" @click="$emit('cancel')">取消</UiButton><UiButton type="submit" :disabled="!url.trim() || loading"><LoaderCircle v-if="loading" class="size-4 animate-spin" /><ArrowRight v-else class="size-4" />{{ loading ? '正在解析…' : '解析并填入' }}</UiButton></DialogFooter>
      </form>
    </DialogContent>
  </UiDialog>
</template>

<script>
import { ArrowRight, Link2, LoaderCircle } from '@lucide/vue'
import { Button as UiButton } from '@/components/ui/button'
import { Textarea as UiTextarea } from '@/components/ui/textarea'
import { Label as UiLabel } from '@/components/ui/label'
import { Dialog as UiDialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default {
  name: 'UrlParseDialog',
  components: { ArrowRight, Link2, LoaderCircle, UiButton, UiTextarea, UiLabel, UiDialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle },
  props: { visible: Boolean, loading: Boolean, error: { type: String, default: '' } },
  emits: ['cancel', 'confirm'],
  data() { return { url: '' } },
  watch: { visible(value) { if (!value) this.url = '' } },
  methods: {
    guardClose(event) { if (this.loading) event.preventDefault() },
    handleOpenChange(open) { if (!open && !this.loading) this.$emit('cancel') },
    handleConfirm() { if (this.url.trim() && !this.loading) this.$emit('confirm', this.url) }
  }
}
</script>

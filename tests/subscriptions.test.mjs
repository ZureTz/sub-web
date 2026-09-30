import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
after(() => server.close())
const { useSubscriptionForm } = await server.ssrLoadModule('/src/composables/useSubscriptionForm.js')
const { useSubscription } = await server.ssrLoadModule('/src/composables/useSubscription.js')
const { useUrlParser } = await server.ssrLoadModule('/src/composables/useUrlParser.js')
const { CLIENT_TYPES } = await server.ssrLoadModule('/src/config/client-types.js')
const { processSubUrl } = await server.ssrLoadModule('/src/utils/formatters.js')
const { validateBackend } = await server.ssrLoadModule('/src/utils/validators.js')
const { ShortUrlService } = await server.ssrLoadModule('/src/services/shortUrlService.js')
const { ConfigUploadService } = await server.ssrLoadModule('/src/services/configUploadService.js')
const { UrlResolveService } = await server.ssrLoadModule('/src/services/urlResolveService.js')
const { getLocalStorageItem, setLocalStorageItem } = await server.ssrLoadModule('/src/utils/storage.js')
const { makeUrl } = useSubscription()
const { parseUrl } = useUrlParser()
const backend = 'https://converter.example/sub?'
const source = 'https://example.com/sub?token=a&name=测试|vmess://demo'
const newForm = (clientType = 'clash') => ({ ...useSubscriptionForm().form, clientType, sourceSubUrl: source })

for (const [label, client] of Object.entries(CLIENT_TYPES)) {
  test(`${label}: generates and restores target/version/source`, async () => {
    const generated = makeUrl(newForm(client), '2', source, backend, [], false)
    const params = new URL(generated).searchParams
    assert.equal(params.get('target'), client.split('&')[0])
    assert.equal(params.get('url'), source)
    if (client.startsWith('surge')) assert.equal(params.get('ver'), client.split('=')[1])
    const restored = newForm()
    assert.equal(await parseUrl(generated, restored, [], () => {}, assert.fail), true)
    assert.equal(restored.clientType, client)
    assert.equal(processSubUrl(restored.sourceSubUrl), source)
  })
}

test('advanced parameters round-trip, including explicit UDP false and custom Unicode', async () => {
  const form = newForm()
  Object.assign(form, {
    remoteConfig: 'https://example.com/config.ini', includeRemarks: '香港|日本', excludeRemarks: '到期',
    filename: '我的配置', emoji: false, nodeList: true, tfo: true, scv: false,
    fdn: true, expand: false, sort: true, appendType: true, insert: true, new_name: false
  })
  form.tpl.clash.doh = true
  form.tpl.surge.doh = true
  const extras = [{ name: 'rename', value: '香港@HK & JP' }]
  const generated = makeUrl(form, '2', source, backend, extras, true)
  assert.equal(new URL(generated).searchParams.get('udp'), 'false')
  const restored = newForm()
  const restoredExtras = []
  let explicitUdp
  await parseUrl(generated, restored, restoredExtras, meta => { explicitUdp = meta.needUdp }, assert.fail)
  assert.equal(explicitUdp, true)
  for (const key of Object.keys(form).filter(key => !['sourceSubUrl', 'customBackend'].includes(key))) {
    assert.deepEqual(restored[key], form[key], key)
  }
  assert.deepEqual(restoredExtras, extras)
  assert.equal(makeUrl(restored, '2', processSubUrl(restored.sourceSubUrl), restored.customBackend, restoredExtras, explicitUdp), generated)
})

test('basic mode omits advanced settings and unspecified UDP stays absent', () => {
  const form = newForm()
  form.remoteConfig = 'https://example.com/config.ini'
  const basic = new URL(makeUrl(form, '1', source, backend, [{ name: 'rename', value: 'demo' }], true)).searchParams
  assert.deepEqual([...basic.keys()], ['target', 'url', 'insert'])
  const advanced = new URL(makeUrl(form, '2', source, backend, [], false)).searchParams
  assert.equal(advanced.has('udp'), false)
})

test('invalid parsed URLs leave existing form and custom parameters untouched', async () => {
  const form = newForm()
  const original = structuredClone(form)
  const extras = [{ name: 'keep', value: 'yes' }]
  for (const link of ['', 'not a url', 'javascript:alert(1)', `${backend}target=clash`, `${backend}target=unknown&url=x`]) {
    let error = ''
    assert.equal(await parseUrl(link, form, extras, assert.fail, message => { error = message }), false)
    assert.ok(error)
    assert.deepEqual(form, original)
    assert.deepEqual(extras, [{ name: 'keep', value: 'yes' }])
  }
})

test('missing optional parameters preserve defaults; no iterator helpers required', async () => {
  const form = newForm()
  await parseUrl(`${backend}target=clash&url=https%3A%2F%2Fexample.com%2Fsub&custom=yes`, form, [], () => {}, assert.fail)
  assert.equal(form.emoji, true)
  assert.equal(form.expand, true)
  assert.equal(form.new_name, true)
  assert.equal(form.remoteConfig, '')
})

test('normalizes multiline sources and backend query separators', () => {
  assert.equal(processSubUrl(' https://a.test\r\n\nhttps://b.test | vmess://demo | '), 'https://a.test|https://b.test|vmess://demo')
  for (const endpoint of ['https://converter.example/sub', backend, `${backend}key=demo`]) {
    const url = new URL(makeUrl(newForm(), '1', source, endpoint, [], false))
    assert.equal(url.searchParams.get('target'), 'clash')
    assert.equal(url.searchParams.get('url'), source)
  }
  assert.equal(makeUrl({ ...newForm(), sourceSubUrl: '   ' }, '1', '', backend, [], false), '')
  assert.equal(validateBackend('javascript:alert(1)'), false)
  assert.equal(validateBackend('https://converter.example/sub?'), true)
})

test('short URL API sends UTF-8 base64 in FormData and handles service errors', async () => {
  const original = 'https://example.com/sub?name=中文'
  const url = await ShortUrlService.generateShortUrl({ post: async (_url, body, options) => {
    assert.ok(body instanceof FormData)
    assert.equal(Buffer.from(body.get('longUrl'), 'base64').toString('utf8'), original)
    assert.equal(options, undefined, 'browser supplies multipart boundary')
    return { data: { Code: 1, ShortUrl: 'https://short.example/demo' } }
  } }, original)
  assert.equal(url, 'https://short.example/demo')
  await assert.rejects(() => ShortUrlService.generateShortUrl({ post: async () => ({ data: { Code: 0, Message: '服务不可用' } }) }, original), /服务不可用/)
})

test('config upload keeps existing request/response contract', async () => {
  const response = await ConfigUploadService.uploadConfig({ post: async (_url, body) => {
    assert.deepEqual(body, { content: '[custom]\nruleset=demo' })
    return { data: { code: 0, data: { url: 'https://config.example/demo.ini' } } }
  } }, '[custom]\nruleset=demo')
  assert.equal(response.data.url, 'https://config.example/demo.ini')
})

test('short-link resolver follows redirects and reports network failure', async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async (_url, options) => {
      assert.equal(options.redirect, 'follow')
      return { ok: true, url: `${backend}target=clash&url=https%3A%2F%2Fexample.com` }
    }
    assert.ok((await UrlResolveService.resolve('https://short.example/demo')).includes('target=clash'))
    globalThis.fetch = async () => { throw new Error('offline') }
    await assert.rejects(() => UrlResolveService.resolve('https://short.example/demo'), /跨域/)
  } finally { globalThis.fetch = originalFetch }
})

test('corrupt, expired, or blocked storage never breaks conversion', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const data = new Map()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key)
  } })
  try {
    setLocalStorageItem('source', 'demo', 60)
    assert.equal(getLocalStorageItem('source'), 'demo')
    setLocalStorageItem('expired', 'demo', -1)
    assert.equal(getLocalStorageItem('expired'), '')
    data.set('corrupt', '{')
    assert.equal(getLocalStorageItem('corrupt'), '')
    globalThis.localStorage.getItem = () => { throw new Error('blocked') }
    globalThis.localStorage.setItem = () => { throw new Error('blocked') }
    assert.equal(getLocalStorageItem('source'), '')
    assert.doesNotThrow(() => setLocalStorageItem('source', 'demo', 60))
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
    else delete globalThis.localStorage
  }
})

test('clipboard helper reports success and restores focus on fallback without system clipboard access', async () => {
  const { copyText } = await server.ssrLoadModule('/src/utils/clipboard.js')
  const savedNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const savedDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  let written = ''
  let restored = false
  let removed = false
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
    clipboard: { writeText: async value => { written = value } }
  } })
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    activeElement: { focus: () => { restored = true } },
    body: { appendChild: () => {} },
    createElement: () => ({ setAttribute: () => {}, select: () => {}, remove: () => { removed = true } }),
    execCommand: () => true
  } })
  try {
    assert.equal(await copyText('demo-link'), true)
    assert.equal(written, 'demo-link')
    assert.equal(await copyText(''), false)
    globalThis.navigator.clipboard.writeText = async () => { throw new Error('denied') }
    assert.equal(await copyText('fallback-link'), true)
    assert.ok(restored)
    assert.ok(removed)
    globalThis.document.execCommand = () => false
    assert.equal(await copyText('failed-link'), false)
  } finally {
    if (savedNavigator) Object.defineProperty(globalThis, 'navigator', savedNavigator)
    else delete globalThis.navigator
    if (savedDocument) Object.defineProperty(globalThis, 'document', savedDocument)
    else delete globalThis.document
  }
})

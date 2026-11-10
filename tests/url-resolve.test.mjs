import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
after(() => server.close())
const { onRequest } = await server.ssrLoadModule('/functions/api/resolve.js')
const shortUrl = 'https://short.trozure.uk/demo'
const longUrl = 'https://converter.example/sub?target=clash&url=https%3A%2F%2Fexample.com%2Fsub&filename=%E6%B5%8B%E8%AF%95'
const request = (url = shortUrl, env) => onRequest({
  request: new Request('https://subweb.example/api/resolve', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: 'private=session', Authorization: 'Bearer private' },
    body: JSON.stringify({ url })
  }), env
})

for (const status of [301, 302, 303, 307, 308]) {
  test(`resolver reads HTTP ${status} Location without fetching the conversion backend`, async t => {
    const calls = []
    t.mock.method(globalThis, 'fetch', async (url, options) => {
      calls.push(url)
      assert.equal(options.method, 'GET')
      assert.equal(options.redirect, 'manual')
      assert.equal(options.cache, 'no-store')
      assert.deepEqual(options.headers, { Accept: '*/*' }, 'never forward browser credentials')
      return new Response('ignored response body', { status, headers: { Location: longUrl } })
    })
    const response = await request()
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
    assert.deepEqual(await response.json(), { url: longUrl })
    assert.deepEqual(calls, [shortUrl])
  })
}

test('relative redirects and HTTP-to-HTTPS redirects are resolved within trusted origins', async t => {
  const calls = []
  t.mock.method(globalThis, 'fetch', async url => {
    calls.push(url)
    const location = calls.length === 1 ? shortUrl : calls.length === 2 ? '/next' : longUrl
    return new Response(null, { status: 302, headers: { Location: location } })
  })
  const response = await request('http://short.trozure.uk/demo')
  assert.deepEqual(await response.json(), { url: longUrl })
  assert.deepEqual(calls, ['http://short.trozure.uk/demo', shortUrl, 'https://short.trozure.uk/next'])
})

test('unsupported origins, private addresses, credentials and protocols are rejected before fetching', async t => {
  t.mock.method(globalThis, 'fetch', async () => assert.fail('untrusted URL must never be fetched'))
  for (const url of [
    'http://localhost/demo', 'http://127.0.0.1/demo', 'http://2130706433/demo', 'http://[::1]/demo',
    'http://169.254.169.254/', 'https://unknown.example/demo', 'https://short.trozure.uk.evil.example/demo',
    'https://short.trozure.uk:444/demo', 'https://short.trozure.uk@evil.example/demo',
    'https://user:pass@short.trozure.uk/demo', 'file:///etc/passwd', 'javascript:alert(1)', '', null, 42
  ]) {
    const response = await request(url)
    assert.ok([400, 403].includes(response.status), String(url))
  }
})

test('each intermediate redirect is checked, including redirects to private networks', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch')
  for (const location of ['http://127.0.0.1/secret', 'https://unknown.example/next', 'file:///etc/passwd', 'https://user:pass@short.trozure.uk/next']) {
    fetchMock.mock.mockImplementation(async url => {
      assert.equal(url, shortUrl, 'untrusted redirect must never be requested')
      return new Response(null, { status: 302, headers: { Location: location } })
    })
    const response = await request()
    assert.ok([403, 422].includes(response.status))
  }
  assert.equal(fetchMock.mock.callCount(), 4)
})

test('Pages environment can configure another trusted short-link origin', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url, 'https://links.example/demo')
    return new Response(null, { status: 302, headers: { Location: longUrl } })
  })
  const response = await request('https://links.example/demo', { VITE_SHORT_URL_ALLOWED_ORIGINS: 'https://links.example' })
  assert.deepEqual(await response.json(), { url: longUrl })
  assert.equal((await request(shortUrl, { VITE_SHORT_URL_ALLOWED_ORIGINS: 'invalid' })).status, 500)
})

test('expired links, missing Location and non-redirect pages produce useful errors', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch')
  for (const [status, expectedStatus, expectedMessage] of [
    [404, 404, /过期/], [410, 404, /过期/], [200, 422, /未返回有效跳转/],
    [302, 422, /未返回有效跳转/], [500, 422, /未返回有效跳转/]
  ]) {
    fetchMock.mock.mockImplementation(async () => new Response(null, { status }))
    const response = await request()
    assert.equal(response.status, expectedStatus)
    assert.match((await response.json()).error, expectedMessage)
  }
})

test('redirect loops and excessive redirect chains stop promptly', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 302, headers: { Location: shortUrl } }))
  assert.match((await (await request()).json()).error, /循环/)
  assert.equal(fetchMock.mock.callCount(), 1)
  let count = 0
  fetchMock.mock.mockImplementation(async () => new Response(null, { status: 302, headers: { Location: `/next-${++count}` } }))
  assert.match((await (await request()).json()).error, /次数过多/)
  assert.equal(count, 5)
})

test('malformed, missing and oversized request bodies are rejected without a fetch', async t => {
  t.mock.method(globalThis, 'fetch', async () => assert.fail('invalid request must never fetch'))
  for (const body of ['{', 'null', '{}', JSON.stringify({ url: shortUrl + 'a'.repeat(8192) })]) {
    assert.equal((await onRequest({ request: new Request('https://subweb.example/api/resolve', { method: 'POST', body }) })).status, 400)
  }
  assert.equal((await onRequest({ request: new Request('https://subweb.example/api/resolve', { method: 'POST' }) })).status, 400)
  assert.equal((await onRequest({ request: new Request('https://subweb.example/api/resolve') })).status, 405)
})

test('upstream failure does not leak network details', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('private upstream details') })
  const response = await request()
  assert.equal(response.status, 502)
  assert.deepEqual(await response.json(), { error: '无法连接短链服务，请稍后重试' })
})

test('resolver aborts upstream requests after ten seconds', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let started
  const fetching = new Promise(resolve => { started = resolve })
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
    started()
  }))
  const pending = request()
  await fetching
  t.mock.timers.tick(10000)
  const response = await pending
  assert.equal(response.status, 504)
  assert.match((await response.json()).error, /超时/)
})

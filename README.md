# sub-web

![Vue](https://img.shields.io/badge/Vue-3.5.x-brightgreen.svg)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg)
![Bun](https://img.shields.io/badge/Bun-1.4.2-f9f1e1.svg)
![Node](https://img.shields.io/badge/Node-24.x-green.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)

基于 Vue.js 3 与 [tindy2013/subconverter](https://github.com/tindy2013/subconverter) 后端实现的订阅配置自动生成 Web 界面。

## ✨ 特性

- 基于 Vue 3 + shadcn-vue + Tailwind CSS 4 的现代化界面
- Vite 8 构建，热重载开发体验
- 模块化架构：composables / services / utils / config 分层
- Lucide 图标、深浅主题、响应式双栏布局
- 基础 / 进阶模式，16 种客户端与可折叠高级参数
- 本地存储缓存，TTL 可配置
- 短链接与配置文件上传集成
- 一键导入 Clash
- Docker 一键部署

## 🚀 快速开始

### 使用 Docker（推荐）

```bash
docker run -d \
  -p 58080:80 \
  --restart always \
  --name subweb \
  careywong/subweb:latest
```

访问 <http://localhost:58080/>

### 本地开发

```bash
git clone https://github.com/CareyWang/sub-web.git
cd sub-web
bun install
bun run dev
```

访问 <http://localhost:5173/>

## 📦 环境要求

- **Node.js**: 24.x（工具链及 Node 内置测试运行器）
- **Bun**: 1.4.2（包管理，版本固定于 `package.json`）
- **Docker**: 20.10+（可选）

## 🛠️ 常用命令

| 命令 | 说明 |
|------|------|
| `bun run dev` | 启动开发服务器 |
| `bun run build` | 构建生产版本 |
| `bun run preview` | 本地预览构建产物 |
| `bun run lint` | ESLint 代码检查 |
| `bun run test` | Node 内置测试：订阅生成、解析与服务契约 |

## ⚙️ 环境配置

创建 `.env` 文件（参考如下）：

```env
# Subconverter 后端地址
VITE_SUBCONVERTER_DEFAULT_BACKEND=https://sub.trozure.uk

# 项目与社区链接
VITE_PROJECT=https://github.com/CareyWang/sub-web
VITE_BOT_LINK=https://t.me/subconverter_discuss

# 后端版本页
VITE_BACKEND_RELEASE=https://github.com/tindy2013/subconverter/actions

# 远程配置示例与进阶文档
VITE_SUBCONVERTER_REMOTE_CONFIG=https://raw.githubusercontent.com/tindy2013/subconverter/master/base/config/example_external_config.ini
VITE_SUBCONVERTER_DOC_ADVANCED=https://github.com/tindy2013/subconverter/blob/master/README-cn.md

# 短链接后端
VITE_MYURLS_API=https://suosuo.de/short

# 配置文件托管后端
VITE_CONFIG_UPLOAD_API=https://oss.wcc.best/upload

# 本地存储与缓存 TTL（秒）
VITE_USE_STORAGE=true
VITE_CACHE_TTL=86400
```

如果部署在子路径（如 `/sub-web/`），在构建时指定 base：

```bash
bun run build --base=/sub-web/
```

或在 `vite.config.mjs` 中设置 `base: '/sub-web/'`。

## 📁 目录结构

```
src/
├── main.js              # Vue 3 createApp 入口
├── App.vue
├── router/              # Vue Router（history 模式）
├── views/
│   └── Subconverter.vue # 主页面
├── components/          # 业务弹窗、ui/ 下的 shadcn-vue 组件
├── composables/         # 共享逻辑（表单、订阅、URL 解析）
├── services/            # API 封装（后端版本、短链接、配置上传）
├── config/              # 常量、客户端类型、远程配置列表
├── utils/               # 工具函数（storage、validators、formatters）
├── assets/main.css      # Tailwind、主题变量与全局样式
└── lib/utils.js         # shadcn-vue class 合并工具
```

## UI 组件与验证

[shadcn-vue](https://www.shadcn-vue.com/docs/installation/vite) 组件源码位于 `src/components/ui/`，使用官方 `new-york` 风格的 JavaScript 版本。配置见 `components.json`，主题颜色在 `src/assets/main.css` 中维护。业务页面保留 Options API，基础组件保留官方生成的 `script setup`。

```bash
bunx shadcn-vue@2.8.2 add <component>
bun run lint
bun run test
bun run build
# 运行单个回归场景
node --test --test-name-pattern="advanced parameters" tests/subscriptions.test.mjs
```

本地开发、CI 和 Docker 统一使用 Bun，仅维护 `bun.lock`。修改依赖后运行 `bun install` 并提交锁文件；CI 使用 `bun install --frozen-lockfile`。升级 Bun 时同步修改 `package.json` 的 `packageManager` / `engines.bun` 和 Docker 基础镜像版本。

短链接、上传和短链解析依赖所配置的外部服务。Vite 不自带 `/api/short` 接口，本地调试可在 `.env.local` 中将 `VITE_MYURLS_API` 指向支持跨域的服务；生产环境也可以使用原有反向代理。

## CI 检查

`.github/workflows/build.yml` 在 push 到 `master` 和面向 `master` 的 Pull Request 上运行：

1. 使用 Node 24 和 `package.json` 指定的 Bun 版本安装锁定依赖。
2. 运行生产规则下的 ESLint（覆盖页面、服务、Cloudflare Functions、测试及 Vite 配置，零警告）。
3. 运行订阅回归测试和生产构建，保存 `dist` 构建产物 7 天。
4. 仅当 `master` push 的检查通过时，将同一份构建产物部署到 Cloudflare Pages；PR 只检查，不部署。

Docker 镜像继续由现有的 `docker-build-push.yml` 工作流在 `master` push 后构建。

## 🐳 Docker 部署

### 本地构建

```bash
docker build -t subweb-local:latest .

docker run -d \
  -p 58080:80 \
  --restart always \
  --name subweb \
  subweb-local:latest
```

### Docker Compose（含短链接服务）

```bash
cd services

# 编辑 .env，配置端口和域名
# 默认：SUBWEB_PORT=58080, MYURLS_PORT=8002, MYURLS_DOMAIN=example.com
vim .env

docker-compose up -d
```

## 🌐 Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/sub-web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
    gzip_min_length 1k;

    location ~* \.(css|js|png|jpg|svg|woff2|ttf|eot)$ {
        add_header Cache-Control "public,max-age=86400";
    }
}
```

## 🔗 相关项目

- **[tindy2013/subconverter](https://github.com/tindy2013/subconverter)** - 订阅转换后端
- **[CareyWang/MyUrls](https://github.com/CareyWang/MyUrls)** - 短链接服务

## 🤝 贡献

1. Fork 本仓库
2. 创建特性分支 `git checkout -b feature/AmazingFeature`
3. 提交更改 `git commit -m 'Add some AmazingFeature'`
4. 推送到分支 `git push origin feature/AmazingFeature`
5. 创建 Pull Request

代码风格：2 空格缩进、单引号、无分号，遵循 ESLint 配置。

## 📄 许可证

MIT License — Copyright © 2020-2025 CareyWang

## 📈 项目统计

<a href="https://www.star-history.com/#CareyWang/sub-web&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=CareyWang/sub-web&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=CareyWang/sub-web&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=CareyWang/sub-web&type=date&legend=top-left" />
 </picture>
</a>

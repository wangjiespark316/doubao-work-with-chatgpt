# Doubao Work with ChatGPT

ChatGPT thinks. Doubao Work works. ChatGPT 负责思考，豆包工作负责干活。

> 本项目改编自 [codex-with-chatgpt](https://github.com/XiaoDuoYa/codex-with-chatgpt)（MIT 协议），将原本面向 OpenAI Codex 的"ChatGPT 当大脑"方案移植到豆包工作（Doubao Work）。底层桥接（本地 HTTP 服务、只读 MCP、OAuth、Cloudflare 隧道）与原项目完全一致，仅重写了 Skill 层以适配豆包工作的工具链和浏览器自动化。

## 解决什么问题

你付费订阅的 ChatGPT 网页版额度大量闲置，而豆包工作在处理复杂任务时，规划和审查环节可以借助更强的模型能力。本项目把"思考"交给你已付费的网页版 ChatGPT，豆包工作只负责执行。不用 API Key、不搞逆向代理——官方网页 + 只读 MCP 桥接。

## 这是什么

把 ChatGPT 网页版变成豆包工作会话的"规划与审查大脑"，执行权完全保留在豆包工作手里。你的仓库永远不会被上传：ChatGPT 通过一条安全的、OAuth 保护的**只读** MCP 连接，按需读取当前工作区里它真正需要的那几行代码。

## 一段话安装

不懂 git、Node、终端？完全不需要懂。把下面这段话原样复制给你的豆包工作，然后去倒杯咖啡：

```
请帮我完整安装并配置 Doubao Work with ChatGPT，全程自动，我是不懂技术的小白，
所有事情你自己做：

1. 环境自检：需要 git 和 Node.js ≥ 20，缺什么就自动安装
 （macOS 用 Homebrew，Windows 用 winget），同时安装 cloudflared。
2. 下载：把 https://github.com/wangjiespark316/doubao-work-with-chatgpt 克隆到
 ~/doubao-work-with-chatgpt（已存在就 git pull 更新）。
3. 构建：在该目录里执行 corepack pnpm install 和 corepack pnpm build。
4. 安装 Skill：把仓库里的 skill/SKILL.md 复制到你的豆包工作技能目录
 （通常是 ~/DoubaoWork/skills/doubao-work-with-chatgpt/SKILL.md），
 并把文件中 "The doubao-work-with-chatgpt checkout lives at:" 那一行的路径
 改成实际克隆路径。
5. 首次配置：按 SKILL.md 里的 first-time setup 流程执行
 （运行 c2c setup，用内置浏览器打开 ChatGPT 配置连接器并输入配对码）。
 全程只用内置浏览器，禁止打开任何第三方浏览器。
6. 只有遇到需要我登录（ChatGPT / Cloudflare）、验证码或两步验证时才叫我，
 而且一次只告诉我一个动作。
7. 完成后给我看 ✓ 清单，并确认文件读取测试通过。我不懂 MCP、OAuth、
 Tunnel、端口这些词，不要向我解释；出了问题先自己修。
```

## 手动安装 → 配置 → 使用

1. 安装 Skill：把 `skill/` 复制到你的豆包工作技能目录下的 `doubao-work-with-chatgpt/`。

2. 告诉豆包工作：**"使用 Doubao Work with ChatGPT 完成首次配置。"**

3. 正常使用豆包工作：**"使用 Doubao Work with ChatGPT 实现 XXX。"**

就是这么简单。你不需要知道 MCP、OAuth、隧道、端口是什么——豆包工作会自动配置好一切，你只会看到：

```
Doubao Work with ChatGPT

✓ 当前项目已识别
✓ Workspace Bridge 已启动
✓ 安全连接已建立
✓ ChatGPT 已连接
✓ 文件读取测试通过

Ready.
```

唯一可能需要你做的步骤：登录 ChatGPT（以及，如果你想要稳定域名，登录一次 Cloudflare）。新工作区还会让你在 ChatGPT 里创建一个项目（合集）一次——选**仅限项目记忆**，用工作区名字命名。如果侧栏没有项目行，把鼠标放在「聊天」上，点 … 菜单，选「按项目整理」。之后豆包工作会保存那个合集链接，从那个页面启动聊天。已有工作区如果已经有 C2C 聊天，会保持旧的单对话模式，直到你要求切换。

### 可选稳定域名

默认公开地址是临时的 Cloudflare URL。桥接重启时地址会变，豆包工作会通过删除该工作区的连接器并重新添加来修复 ChatGPT 连接。

如果你有 Cloudflare 账号和已托管在 Cloudflare 的域名，首次配置（以及下一次编码会话，一次）会问你是否想要稳定域名，如 `c2c-<project>.your-domain.com`。这一步会打开浏览器让你授权 Cloudflare。之后 ChatGPT 连接器在重启后也能持续工作。如果你跳过或登录失败，豆包工作会保持临时地址——功能相同，只是修复稍慢。

凭据保存在系统应用状态目录中，不在项目里。

## 工作原理

```
 ┌───────────────────────────┐
 │ ChatGPT Web               │
 │ Reason / Plan / Review    │
 └──────────┬──────────▲─────┘
            │          │
      MCP   │          │ Computer Use
  Data Plane│          │ Control Plane (<1 KB messages)
            ▼          │
 ┌─────────────────────┐
 │ C2C Bridge          │ loopback-only HTTP server
 │ read-only MCP       │ OAuth 2.1 + one-time pairing code
 │ OAuth + Pairing     │ Cloudflare Quick Tunnel
 │ Tunnel Manager      │
 └──────────┬──────────┘
            │ read-only
            ▼
 ┌─────────────────────┐ ┌─────────────────────┐
 │ Local Workspace     │◀─────────│ Doubao Work Harness  │
 └─────────────────────┘ edit/git  │ shell / tests / fix │
                                   └─────────────────────┘
```

- **控制面（Computer Use）**：豆包工作和 ChatGPT 交换很小的结构化 `[C2C]` 状态消息——`INIT → PLAN → EXECUTED → REVIEW → DONE`。从不粘贴 diff、日志或文件内容。

- **数据面（MCP）**：ChatGPT 通过 9 个只读工具自己拉取需要的内容：`workspace_info`、`list_directory`、`read_file`、`search_workspace`、`git_status`、`git_diff`、`test_status`、`execution_summary`、`execution_output`。

- **独立审查**：豆包工作执行后，ChatGPT 通过 MCP 检查实际的 git diff 和测试记录——它不会轻信"测试全过"的自述。

## 安全模型（简述）

- **构造上只读**：服务端根本不存在写/删/执行/提交工具。任何提示注入都无法启用它们。

- **一个工作区 = 一个边界**：每个 token 绑定单一工作区；路径包含检查使用规范真实路径（symlink、`../`、绝对路径逃逸全部被拦截并有测试覆盖）。

- **敏感文件从不离开**：`.env*`、密钥、SSH、凭据默认被拒绝（`.env.example` 允许）；`.c2cignore` 可添加你自己的规则。

- **知道 URL 也没用**：公开 MCP 端点需要 OAuth 2.1（PKCE S256、动态客户端注册、轮换刷新令牌）。没有 token：401。错误工作区：403。

- **模型看不到长期凭据**：唯一接触浏览器的秘密是一次性配对码（5 分钟有效、限次、速率限制、用完即毁）。

完整威胁模型：`docs/security.md`

## 开发者

```
pnpm install
pnpm build          # -> dist/, exposes the c2c bin
pnpm test           # vitest: 150 tests (path security, OAuth, pairing, MCP e2e)

c2c setup           # bridge + tunnel + pairing code, all in one
c2c sandbox-allow   # ensure state dir exists (no-op on Doubao Work)
c2c status / doctor / pair / unpair / logs / stop
```

要求：Node.js >= 20、git。公开连接需要 `cloudflared`（自动检测；Skill 会帮你安装）。如果 QUIC 被阻断，设置 `C2C_TUNNEL_PROTOCOL=http2` 并重启桥接。

文档：`docs/architecture` · `docs/protocol` · `docs/security` · `docs/troubleshooting`

## 项目结构

```
src/
  bridge/       loopback HTTP server, port recovery, admin API
  mcp/          9 read-only tools, stateless Streamable HTTP
  auth/         OAuth 2.1 (PKCE, DCR, refresh rotation, revocation)
  pairing/      one-time pairing codes (CSPRNG, TTL, rate limits)
  workspace/    path containment, sensitive-file policy, search, git
  tunnel/       TunnelProvider abstraction + Cloudflare Quick/Named Tunnel
  execution/    execution records for the review loop
  process/      daemon lifecycle
  cli/          the c2c CLI
skill/          the Doubao Work Skill (the real UX layer)
tests/          unit + integration tests
docs/           architecture / protocol / security / troubleshooting
```

## 与原项目的差异

本项目基于 codex-with-chatgpt v0.1.3 改编，主要改动：

| 方面 | 原项目 (Codex) | 本项目 (Doubao Work) |
| --- | --- | --- |
| Skill 路径 | `~/.codex/skills/` | 豆包工作技能目录 |
| 浏览器自动化 | Codex 内置浏览器 API (`agent.browsers`) | `browser-use-automation-mac` Skill + `mac_computer_use_tool` (`bu` 库) |
| 沙箱机制 | 写 `~/.codex/config.toml` 的 `writable_roots` | 无沙箱，`sandbox-allow` 为确保状态目录存在的空操作 |
| 状态目录 | `~/Library/Application Support/codex-with-chatgpt` | `~/Library/Application Support/doubao-work-with-chatgpt` |
| 产品名/连接器名 | Codex with ChatGPT | Doubao Work with ChatGPT |

底层桥接代码（bridge、mcp、auth、pairing、tunnel、workspace、execution、cli）与原项目完全一致，未做功能改动。

## 状态与免责声明

V1（改编版）。底层桥接已在原项目中端到端验证：桥接、OAuth + 配对、公开隧道、ChatGPT 连接器设置、零接触首次运行体验。豆包工作版 Skill 为新增适配层。

**非官方社区项目。与 OpenAI、字节跳动/豆包无关联，也未获其认可。**

## License

MIT

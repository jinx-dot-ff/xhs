# 小红书笔试 评里找完整开发交付

**在线预览：[打开评里找](https://jinx-dot-ff.github.io/xhs/)** · [咖啡店详情](https://jinx-dot-ff.github.io/xhs/app/note.html?id=cafe) · [产品文档](https://jinx-dot-ff.github.io/xhs/PRD.html)

本仓库保存最新版完整源码与素材。GitHub Pages 从 main 分支根目录发布，根 index.html 跳转到 app/index.html；app 内界面与交互保持当前版本。后续提交 main 后，GitHub 会自动更新在线预览。

这是「评里找」的完整前端源码、素材和开发文档快照，包含用户多轮标注后的最新实现，整理日期为 2026 年 10 月 11 日。直接运行现有代码即可复现当前原型；后续 AI 应先阅读本文件及 [AI开发交接.md](AI开发交接.md)，再继续修改。

## 快速打开

Windows 双击根目录的 **启动预览.cmd**。它会启动本地服务并打开首页；关闭终端窗口即可停止。

需要 **Node.js 18 或更新版本**。前端没有构建步骤和第三方安装依赖，不需要 npm install、API 密钥或 Codex 账号。启动脚本先检查 NODE_BIN 指定的解释器、可选 runtime/node.exe、系统 Node.js，最后检查当前用户的 Codex 自带 Node.js；项目不包含 Node.js 安装包。

其他系统或 AI 开发环境，在本文件夹执行：

~~~sh
node server.cjs
~~~

打开终端输出的地址。默认端口 8765；端口被占用时会尝试后续十个端口，请以终端实际地址为准。根地址也会打开首页。需要指定端口时，可设置环境变量 PORT，例如 PowerShell 中先执行 $env:PORT=8776，再执行 node server.cjs。

- 首页：/app/index.html
- 咖啡店详情：/app/note.html?id=cafe
- 其他详情 ID：outfit、study、trail、earbuds、home
- 产品文档：/PRD.html

不建议使用 file:// 作为验收方式；HTTP 访问的浏览器存储和跨页行为更一致。移交到其他目录后，只需保持本文件夹内部结构。

## 文件夹内容

| 路径 | 用途 |
| --- | --- |
| app/ | 可直接运行的完整 HTML、CSS、JavaScript 和本地图标及 WebP 图片 |
| source-assets/ | 七张 AI 生成图片的原始 PNG，保留分辨率便于编辑 |
| reference-assets/ | 用户提供的六张界面参考截图及适用说明 |
| PRD.md 和 PRD.html | 详细产品设计、匹配规则、计数、上下文、接口与后续实验要求 |
| AI开发交接.md | 当前模块、最终界面约束、数据结构、检索实现和后续修改说明 |
| screenshots/ | 验收截图；最新字号以 comment-placeholder-font.jpg 为准，首页以 typography-home.jpg 为准 |
| ASSET-PROMPTS.md | 图片来源、生成提示概要、尺寸和头像裁切方式 |
| tests/ | 检索测试及检查结果 |
| scripts/ | 可移植的 Node.js 启动辅助脚本和交付完整性检查 |
| bundle-manifest.json | 每个交付文件的 SHA-256 和字节数，检测缺失或意外修改 |
| 交付核验说明.txt | 本次复制、运行、素材、测试的实际核验结论 |

PRD 和较早验收截图保留了初版设计。**若与最新代码冲突，先以 AI开发交接.md 中的最终用户约束及 app/ 当前实现为准**，不要根据历史截图恢复已删除的建议标签、可点击菜单或宽手机框。顶部产品文档入口保留初版 PRD，AI开发交接.md 补充当前实现差异。

## 验证完整性

Windows 双击 **验证交付.cmd**，或执行：

~~~sh
node tests/search.test.js
node scripts/verify-bundle.cjs
~~~

第一条验证 63 条检索用例。第二条检查文件哈希、页面相对资源、全部笔记图片、JavaScript 语法及本地 HTTP 服务能否从本目录独立提供页面和素材；检查服务会使用临时端口并自动停止，不影响已有预览。

开发后代码变更导致哈希不同是正常的。确认修改有效后，可执行 node scripts/verify-bundle.cjs --refresh-manifest 更新文件清单，再重新检查。不要用刷新清单掩盖丢失的素材。

## 复现范围

app/ 和 source-assets/ 与整理时的现有原型逐文件一致。颜色、字体、头像分配、封面、虚构文字、回复与检索逻辑均已包含；没有远程图片、CDN、字体下载或额外后端依赖。系统中文字体、浏览器版本和预览窗口大小可能让字形或实际显示尺寸略有不同。

「相关评论」使用本地主题、同义词和约束规则模拟 AI 意图检索，并未连接真实大模型或小红书接口。全部笔记、评论和页面使用的图片都是虚构示意内容。用户参考截图仅用于说明交互样式，页面没有使用其中的真实账号或文字。

点赞、关注、收藏、评论和查询记录保存在浏览器 localStorage 中，以 plz: 为键前缀；不包含这台电脑的个人浏览器数据。迁移目录和端口后默认显示原始数据。需要与截图一致的初始状态时，使用全新浏览器配置，或仅清理本原型站点的 plz: 存储项。

本地代码可以完整复现当前演示；生产 AI 检索、真实社交接口、上线实验和全站时长评估需要继续开发，具体边界在交接文档与 PRD 中说明。所有图标的第三方许可保存在 app/assets/LICENSE-lucide.txt。

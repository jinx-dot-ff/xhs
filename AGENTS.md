# 小红书笔试 评里找开发约定

本目录是用户要求完整移交的前端原型。接手 AI 先读 README.md 与 AI开发交接.md，再运行现有代码，在同一实现上继续开发。

- app/ 是用户多轮浏览器标注后的当前实现，source-assets/、app/assets/ 和 reference-assets/ 已完整保存；不要重新生成图片来复现已有外观。
- 初版 PRD 与旧截图用于产品背景；它们与最新约束冲突时，以 AI开发交接.md 和现有 app/ 为准。最新截图优先级已写在交接文档。
- 当前版本为2026-10-12九篇笔记；新增travel旅游、benefits虚构禾序科技福利/职场、computer电脑配置/数码。保存九张封面和一张头像图集的WebP及原始PNG；另外保存用户指定自己的头像JPG，页面使用app/assets/self-avatar.jpg，原样来源保存为source-assets/self-avatar.jpg。六张用户界面参考截图仍只作参考。
- 无 npm 依赖、无构建步骤、无业务后端；可原样静态部署。Node.js18+运行 node server.cjs 仅作本地预览。保留根index.html、.nojekyll和相对路径，不引入作者机器绝对路径或未说明的远程资源。
- 保留关键行为：.app 内滚动；搜索图标右侧、替换评论输入栏、展开不自动跳转；原讨论默认展示一条回复；搜索结果保留命中与必要上下文；点赞全数字；正文、评论、回复和输入提示13px。
- 评论输入入口、搜索框外左侧及“我的小日常”的所有本地评论和回复统一使用固定self-avatar.jpg，不用笔记作者头像替代自己的头像；笔记作者与其他评论者继续使用原图集。框内右侧麦克风只展示原型toast，不录音、不请求权限。顶部说明栏已删除；整体手机框使用76/146.6比例和最大460px，黑环5px/窄屏4px及现有字号不变。不要依据旧文档恢复70.6/146.6或430px。
- 搜索从右侧搜索图标位置向左展开约360ms，取消反向收回约280ms；仅开关搜索时运行，输入、切模式及结果渲染不能重播。连续开关需取消旧过渡任务，系统减少动效时直接切换；展开仍不自动滚动。设计参考Apple官方WWDC26“Design intuitive search experiences”（https://developer.apple.com/videos/play/wwdc2026/292/）与HIG Motion（https://developer.apple.com/design/human-interface-guidelines/motion），时长是本原型参数，并非Apple规定。
- 相关评论是本地规则模拟。真实模型、社交接口和生产实验并未接入，描述和开发时要区分当前功能与PRD生产目标。
- 修改检索逻辑后运行 node tests/search.test.js，当前82条通过（原63条加新增19条），最新结果以tests/search-results.json为准。修改页面后通过正常浏览器流程核对布局与交互，不能只用引擎测试替代界面验收。
- 文件完整性用 node scripts/verify-bundle.cjs。完成有意修改并验证后，可用 --refresh-manifest 更新清单；不要通过刷新掩盖缺失的文件或素材。
- 最新截图为screenshots/latest-home.jpg、latest-search-avatar.jpg、latest-travel.jpg、latest-benefits.jpg和latest-computer.jpg；其优先级高于历史截图。原PRD和旧验收保留历史，不用其六篇/旧框说明覆盖当前代码。
- 所有页面数据和AI生成图片为虚构。用户参考截图只是设计参考；保留图标许可。继续修改按用户的新要求执行，无需扩大未请求的功能范围。

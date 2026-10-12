# 「评里找」原型图片素材说明

## 素材来源与虚构范围

本原型的九张笔记封面及一张头像图集均通过内置 **image_gen** 图像生成工具创建。2026 年 10 月 12 日新增旅游、公司福利和电脑配置三张封面。未使用网络图库、真实小红书笔记截图、实际用户头像或用户照片，也未调用需要 API 密钥的生成脚本。

这些是 **AI 生成的虚构示意图片**，采用自然手机摄影的视觉风格，并非实地拍摄或真实使用记录。人物、房间、露台、森林路线及无品牌商品均为虚构；未指定或使用真实店铺、学校、目的地、商标、产品型号及真人身份。人物均设定为虚构成年人。文字、笔记作者、正文及评论应由前端另行提供虚构内容，不能将图片包装成真实案例证据。

生成要求：生活随手拍的自然光与材质，适量日常细节，无商业大片效果；不添加封面文字、Logo、水印或界面。学习图片仅有淡淡的数学符号和草图，无可辨识的真实教材、学校名称。

## 最终素材与提示词概要

| 前端素材 | 原始素材 | 尺寸 | 提示词概要 |
| --- | --- | --- | --- |
| app/assets/cafe.webp | source-assets/cafe.png | 1086 × 1448 | 虚构安静露台；温暖木桌上的白陶瓷咖啡杯，浅色奶泡；绿植与木椅；自然下午光；无人物、店名和品牌。 |
| app/assets/outfit.webp | source-assets/outfit.png | 1086 × 1448 | 虚构普通身高成年人物的无脸全身穿搭；奶油色衬衫、棕色直筒裤、白鞋；简单住宅墙边；真实衣料与自然站姿；无品牌。 |
| app/assets/study.webp | source-assets/study.png | 1086 × 1448 | 虚构普通窗边学习桌；数学手写符号与草图、铅笔、橡皮、水杯和无字笔记本；随手俯拍、自然光；无真实教材或学校标识。 |
| app/assets/trail.webp | source-assets/trail.png | 1086 × 1448 | 虚构绿色森林步道；缓坡、浅石阶、蕨类与树木；步行视角与斑驳日光；无地名路牌或真实可辨识目的地。 |
| app/assets/earbuds.webp | source-assets/earbuds.png | 1086 × 1448 | 虚构通用奶白无线耳机与打开的充电盒；浅木桌与普通布袋；窗边自然光、真实塑料材质；不指定真实产品型号，无品牌字样。 |
| app/assets/home.webp | source-assets/home.png | 1086 × 1448 | 虚构小户型窗边工作角；浅木书桌、奶白台灯、笔记本、杯子和绿植；薄窗帘与柔和窗光；日常住宅视角。 |
| app/assets/avatars.webp | source-assets/avatars.png | 1448 × 1086 | 精确 4 列 × 3 行、等大无缝方格的 12 个社区头像；虚构成年男女的自然人像，搭配橘猫、奶白犬、灰猫、绿植、杯子与雏菊；无标签、边框和间隙。 |
| app/assets/travel.webp | source-assets/travel.png | 1086 × 1448 | 虚构江南小城河巷、白墙黛瓦与小桥；自然旅行随拍，适合路线、酒店和交通选择讨论；无真实地标、可读标牌、品牌或人群。 |
| app/assets/benefits.webp | source-assets/benefits.png | 1086 × 1448 | 虚构科技公司明亮休息区、咖啡机、餐食、木桌、绿植和座位；自然办公生活摄影，无公司名称、品牌、文字或人物。 |
| app/assets/computer.webp | source-assets/computer.png | 1086 × 1448 | 日常电脑工作角，黑色侧透台式机、显示器、键鼠与木桌；克制白光，无夸张 RGB、可读品牌、屏幕文字或具体界面。 |

每张封面独立生成，为 3:4 竖图，便于双列信息流和详情页使用。头像图集为 4:3 横图，每格 362 × 362，适合通过 CSS 裁切后显示为圆形。

## 头像图集顺序

按从左到右、从上到下排列：

1. 长发成年女性；短发成年男性；橘猫；绿植。
2. 短发成年女性；奶白犬；黑衣成年男性；陶瓷杯。
3. 戴眼镜成年女性；灰猫；戴眼镜成年男性；雏菊。

CSS 参考：`background-size: 400% 300%`。列位置为 `0% / 33.333% / 66.667% / 100%`，行位置为 `0% / 50% / 100%`。

## 交付与检查

前端使用同尺寸 WebP，质量参数为 90；只进行格式转换和编码压缩，不裁切、不改变画面和尺寸。原始 PNG 保存于 `source-assets/`，便于之后继续复用或调整。

原有七张 WebP 合计约 2.24 MB，原始 PNG 合计约 19.53 MB。新增三张 WebP 合计 920,092 字节，原 PNG 同时保留。已核对编码后文件可读取、尺寸保持一致，并逐张检查原始画面的主题、构图、明显文字与品牌等内容；人物与场景仅用作虚构原型展示。复现时直接使用已保存图像，不要重新生成。

## 2026-10-12 新增素材的最终提示词

生成方式：内置 `image_gen__imagegen`，每个素材一次独立调用，`transparent_background=false`。WebP 使用 Pillow `quality=90, method=6` 转换，无裁切、无拉伸。

三张素材共用以下提示词，并各自追加场景提示词：

```text
Use case: photorealistic-natural.
Asset type: cover photo for a fictional Chinese social note app prototype.
Style: believable candid mobile phone lifestyle photograph, natural textures, slight handheld framing, understated neutral warm grading, authentic everyday detail.
Composition: portrait 3:4 image, no border, fills frame.
Constraints: entirely fictional scene, no text, no logos, no watermark, no readable signage or brands; no sharp recognizable human faces.
```

`travel.png` 场景提示词：

```text
Primary request: a relaxed travel snapshot of an invented Jiangnan small town canal lane, narrow river, white plaster houses with dark tile roofs, weathered stone path beside the water and a small stone arch bridge in the middle distance. River reflections and restrained greenery, late morning soft daylight, eye-level view as if walking on the lane. Not a known identifiable landmark, no crowd. The atmosphere should invite a weekend discussion of itineraries, accommodation and getting around.
```

`benefits.png` 场景提示词：

```text
Primary request: a casual snapshot inside an invented technology company's bright staff break area. A warm wood countertop holding a generic unlabeled coffee machine, a plain mug and simple plated light snacks; communal seats, windows, indoor plants and a tidy lounge area beyond. Soft daylight, lived-in office details, natural materials, calm working-day atmosphere. No brand or company name, no writing, no people.
```

`computer.png` 场景提示词：

```text
Primary request: a casual photograph of a home work corner with a black desktop PC case with transparent side panel beside a simple widescreen monitor, keyboard and mouse on a warm wood desk. Realistic visible PC internals with restrained neutral white lighting and no exaggerated colorful RGB. Screen is a blank soft dark gradient without text or UI. A clean but lived-in desk with daylight from a nearby window, modest setup, grounded materials, no visible brands.
```

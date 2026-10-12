/* 全部人物、地点、产品、文字与讨论均为本原型虚构。无外部网络依赖。 */
(function () {
  'use strict';

  const people = [
    '橘子慢半拍', '小满的日常', '晴天收信人', '一颗盐粒', '阿栗不着急', '云朵下班了',
    '西柚气泡', '今天也走走', '半碗乌冬', '月亮存档', '小树发芽', '晚风不加糖',
    '米粒有点圆', '山雀借过', '蓝色便签', '秋天的口袋', '软糖看世界', '早起喝热水',
    '不吃香菜籽', '露台晒太阳', '麦芽小记', '梨涡的周末', '慢慢打个结', '木木一小步',
    '柠檬有回声', '纸飞机暂停', '雨后石板路', '叮当散步中', '把云装进口袋', '半颗牛油果',
    '葡萄小圆', '棉花糖收纳员', '海盐留声机', '好好吃早餐', '小岛来信', '乌梅冰一点',
    '小熊等红灯', '咖啡续半杯', '睡前翻两页', '花生的小确幸', '泡芙不熬夜', '绕一圈回家',
    '陶陶慢生活', '树影落肩头', '燕麦散散步', '菠萝等周末', '晚点再出门', '绿豆有计划',
    '小河往前走', '冬瓜云朵', '薄荷留一页', '铃兰小屋', '米酒不加冰', '晴空便当',
    '芝麻记录簿', '卷卷在路上', '草莓别太甜', '山间小信箱', '南瓜好天气', '桃子向前看',
    '白开水和书', '森森在休息', '一把小黄伞', '清晨的饼干', '半页日记', '风吹纸书',
    '番茄小站', '糖栗走四方', '蜗牛有回音', '温柔小蘑菇', '路过一片云', '核桃留灯',
    '小贝有记性', '静静拾光', '苹果多一口', '竹子长高了', '小陆睡醒了', '碎碎念小夏',
    '灯下吃桔子', '轻轻放个假', '南风看窗外', '木棉白日梦', '八月小邮差', '甜梨不加糖',
    '阿陶与晴天', '柚子跑得慢', '摸鱼记账本', '石榴晚一点', '可可散散心', '黄昏叠被子',
    '栗子不迷路', '小北看日落', '空白格小兔', '汤圆先出门', '远山又一程', '小鹿收纸箱'
  ];
  const C = (body, topics, focus, kind, extra = {}) => ({ body, topics, focus, kind, ...extra });
  const R = (body, topics = [], extra = {}) => ({ body, topics, kind: 'answer', ...extra });
  const tones = ['#b57655', '#8f9b88', '#8897ad', '#b394a8', '#b4a273', '#829b99'];

  function toDate(short) { return '2026-' + short + 'T12:00:00+08:00'; }
  function makeCore(note, raw, index) {
    const id = note.id + '-c' + String(index + 1).padStart(2, '0');
    const author = raw.author || people[(index * 3 + note.seed) % people.length];
    const short = raw.time || ('10-' + String(10 - (index % 6)).padStart(2, '0'));
    const comment = {
      id, author, avatar: author.slice(0, 1), avatarTone: tones[index % tones.length],
      body: raw.body, time: short, publishedAt: toDate(short), likes: raw.likes == null ? Math.max(2, 68 - index * 2 + (index % 3) * 5) : raw.likes,
      topics: raw.topics || [], focus: raw.focus || '', kind: raw.kind || 'opinion', constraints: raw.constraints || {}, replies: []
    };
    comment.replies = (raw.replies || []).map((reply, replyIndex) => {
      const replyId = id + '-r' + (replyIndex + 1);
      const replyAuthor = reply.isAuthor ? note.author : (reply.author || people[(index * 3 + replyIndex + 43 + note.seed) % people.length]);
      const replyTime = reply.time || short;
      return {
        id: replyId, author: replyAuthor, avatar: replyAuthor.slice(0, 1), avatarTone: reply.isAuthor ? '#dc685f' : tones[(index + replyIndex + 2) % tones.length],
        body: reply.body, time: replyTime, publishedAt: toDate(replyTime), likes: reply.likes == null ? 5 + ((index + replyIndex) % 13) : reply.likes,
        topics: reply.topics || raw.topics || [], focus: reply.focus || '', kind: reply.kind || 'answer',
        constraints: reply.constraints || raw.constraints || {}, isAuthor: !!reply.isAuthor,
        replyToId: reply.replyToIndex == null ? id : id + '-r' + (reply.replyToIndex + 1),
        replyToAuthor: reply.replyToIndex == null ? author : (raw.replies[reply.replyToIndex].isAuthor ? note.author : raw.replies[reply.replyToIndex].author || people[(index * 3 + reply.replyToIndex + 43 + note.seed) % people.length]),
        replies: []
      };
    });
    return comment;
  }

  /* 补充讨论由不同的完整句子组成；总数始终按真实数据计算，不使用展示占位数量。 */
  function makeAmbient(note, openings, endings) {
    const comments = [];
    openings.forEach((opening, oi) => endings.forEach((ending, ei) => {
      const index = oi * endings.length + ei;
      const author = people[(index + note.seed + 25) % people.length];
      const short = '10-' + String(4 + index % 7).padStart(2, '0');
      comments.push({
        id: note.id + '-a' + String(index + 1).padStart(2, '0'), author, avatar: author.slice(0, 1), avatarTone: tones[index % tones.length],
        body: opening + ending, time: short, publishedAt: toDate(short), likes: 1 + (index * 7) % 19,
        kind: 'opinion', topics: [], constraints: {}, focus: '', replies: []
      });
    }));
    return comments;
  }

  const notes = [
    {
      id: 'cafe', seed: 2, title: '在这家小店，把周末调成慢速', author: '小满的城市散步', authorInitial: '满', authorTone: '#ae8267',
      category: '生活', cover: 'assets/cafe.webp', images: ['assets/cafe.webp'],
      body: [
        '周末绕进青榆街，发现了一家叫「缓缓」的咖啡小店。门脸不大，窗边和露台加起来大约十几桌。我们下午三点到，点了桂花拿铁和一块烤芝士蛋糕，一坐就是一个多小时。',
        '最喜欢外面这一排座位，风吹进来的时候，连回消息都慢了下来。拿铁甜度不高，蛋糕边缘微焦，适合两个人分着吃。室内光线比较柔和，拍照不用一直找角度。',
        '这次只顾着聊天，关于带宠物、停车和能不能办公，我自己没有全部确认。评论里有去过的朋友，可以补充你们的体验，出门前再跟店里核对一下当天安排。'
      ],
      tags: ['周末去哪', '咖啡小店', '城市散步', '露台'], publishedAt: '2026-09-01T10:20:00+08:00', location: '栖禾市 · 青榆街', likes: 2341, collects: 968,
      core: [
        C('有人带毛孩子去过吗？我家那只坐得住，但不太想把它留在家里。', ['pet'], '带毛孩子去过', 'question', { replies: [R('上周带了小型犬，店员安排在露台，水碗也帮忙拿了。室内当时不让进。', ['pet'], { kind: 'experience', focus: '室内当时不让进' }), R('谢谢！那我先问一下露台有没有位。', ['pet'], { replyToIndex: 0, kind: 'opinion' })] }),
        C('四脚小朋友可以坐外面。我们去的时候旁边有一只安静趴着的柯基，大家都牵着绳。', ['pet'], '四脚小朋友可以坐外面', 'experience', { likes: 91, replies: [R('补充一下，我也是在露台看到的，室内没见到。', ['pet'], { kind: 'experience' })] }),
        C('我带狗去过，店员很友好，但当天露台满了，我们等了一会儿。建议先确认位置。', ['pet', 'queue'], '我带狗去过', 'experience'),
        C('9月初带小狗进去，店员说当天室内可以。是不是规则后来改了？', ['pet'], '当天室内可以', 'experience', { time: '09-06', replies: [R('我10月6日去问过，答复是宠物只坐露台，可能当天安排不同，还是提前问店里。', ['pet'], { time: '10-07', kind: 'experience', focus: '宠物只坐露台' }), R('我是这篇的作者，今天问到的也是露台可以、室内不可以。请以当天店员确认的为准。', ['pet'], { isAuthor: true, time: '10-08', focus: '露台可以、室内不可以' })] }),
        C('猫咪能带吗？装在包里会不会有另外的要求？', ['pet'], '猫咪能带吗', 'question'),
        C('露台没有完全围起来，胆子小的宠物最好带熟悉的垫子，别松开牵引。', ['pet'], '别松开牵引', 'experience'),
        C('停车怎么解决？看照片门口好像没有划车位。', ['parking'], '停车怎么解决', 'question', { replies: [R('青榆街北侧有一个公共停车场，步行大约六七分钟。门口不要停。', ['parking'], { isAuthor: true, focus: '步行大约六七分钟' })] }),
        C('周六下午公共车场基本满了，我们转了两圈。后来停在桥边那一处，走过来稍远。', ['parking'], '公共车场基本满了', 'experience'),
        C('开车去的话别照着店门口导航停车，门前是窄路，我们差点挡住送货车。', ['parking'], '门前是窄路', 'experience'),
        C('公共车场第一小时8元，之后我没注意。吃喝没有停车券，我们那天自己付了。', ['parking'], '没有停车券', 'experience'),
        C('周日几点去不用排队呀？我只想坐一下，不想在门口等半小时。', ['queue'], '几点去不用排队', 'question', { replies: [R('我们周日开门后十几分钟到的，直接坐了。下午两点以后开始等位。', ['queue'], { kind: 'experience' }), R('那我改早一点，谢谢你。', ['queue'], { replyToIndex: 0, kind: 'opinion' })] }),
        C('上周六15点排了大概25分钟。室外比室内换桌慢，想坐露台的话耐心一点。', ['queue'], '排了大概25分钟', 'experience'),
        C('工作日十一点去没等，但不代表周末也这样。那天店里还有两张空桌。', ['queue'], '工作日十一点去没等', 'experience'),
        C('可以带电脑办公吗？需要开个短会，不确定这里适不适合。', ['work'], '带电脑办公', 'question', { replies: [R('有网络，插座主要在靠墙座位。不过午后音乐和聊天声都比较明显，不建议语音会议。', ['work'], { isAuthor: true, focus: '不建议语音会议' })] }),
        C('带电脑坐过一个小时。网能连，靠窗没找到插座；写点东西可以，开会不太行。', ['work'], '开会不太行', 'experience'),
        C('室内两张靠墙的小桌有电源，我们用自己的充电器。露台我没有看到插座。', ['work'], '露台我没有看到插座', 'experience'),
        C('想找安静地方看书的话，上午可能更合适。下午有人聊天，我耳机戴上才看得进去。', ['work'], '上午可能更合适', 'experience'),
        C('桂花拿铁能做不甜吗？怕喝完一整杯有点腻。', ['taste'], '能做不甜吗', 'question', { replies: [R('我点的少糖，仍有一点桂花酱的甜。完全无糖能不能做要问一下店员。', ['taste'], { kind: 'experience' })] }),
        C('蛋糕边缘烤得香，但中心有一点软。喜欢扎实口感的可能不会特别爱。', ['taste'], '中心有一点软', 'experience'),
        C('露台的木椅看着舒服，实际坐久了腰需要靠垫。我后来换了旁边的座位。', ['seat'], '坐久了腰需要靠垫', 'experience'),
        C('店里有无障碍洗手间吗？家人出门需要提前确认这个。', ['access'], '有无障碍洗手间吗', 'question'),
        C('阴天去也拍得出来，玻璃窗的光很均匀。最好别把包放在过道，真的不宽。', ['photo'], '玻璃窗的光很均匀', 'experience'),
        C('两个人点两杯和一块蛋糕，够坐一下午的开心了。只是当天出杯略慢。', ['taste'], '当天出杯略慢', 'experience'),
        C('看完想起以前常去的小店，喜欢这种大家能好好说话的地方。', ['mood'], '能好好说话的地方', 'opinion')
      ],
      ambient: {
        openings: ['这组照片的颜色很舒服。', '周末想给自己留一点空闲。', '我也是喜欢小店多过大商场。', '看到窗边那张图就停住了。', '翻完正文有种慢下来的感觉。', '这条街的气质被你拍出来了。'],
        endings: ['那只杯子和桌面很搭，想学着拍一张。', '等朋友有空再约一次，不急着打卡。', '喜欢你把普通的一天也认真记下来。', '木桌的暖色和旁边的绿植很搭。', '这张照片像电影里的一个停顿。', '我会留一点时间给聊天，不赶下一站。', '不需要每个周末都安排得满满的。', '这种简单的记录会让我愿意看下去。', '照片里的光有点像我小时候的午后。', '看完给朋友发了一句，下次一起出来走走。', '留存了这份周末气氛，忙起来也能回头看看。', '好喜欢杯子边缘落下来的这点阳光。']
      }
    },
    {
      id: 'outfit', seed: 14, title: '160cm也能穿松弛一点，别急着塞衣角', author: '阿栗的衣橱日记', authorInitial: '栗', authorTone: '#8a9a83',
      category: '穿搭', cover: 'assets/outfit.webp', images: ['assets/outfit.webp'],
      body: [
        '身高160cm，最近给自己的搭配减了减法：一件米白衬衫、一条棕色直筒裤，加上常穿的白色平底鞋。这次只把衣角轻轻收进腰头，没有拽得很紧，留一点松量反而更自在。',
        '这一套的重点是裤脚轻轻落在鞋面上。我穿的衬衫偏宽松，裤子腰部合适但裤长改短了两厘米。这篇主要聊比例和穿着感，选同类衣服时还是要试试自己的尺寸。',
        '衬衫面料比较轻薄，有自然的褶皱，不是特别挺括的那种。照片里的效果和每个人的肩宽、腰臀比例都有关系，如果你试过类似组合，也欢迎补充自己的尺码和感受。'
      ], tags: ['小个子穿搭', '日常搭配', '160cm', '松弛感'], publishedAt: '2026-09-03T14:00:00+08:00', location: '栖禾市', likes: 4628, collects: 1847,
      core: [
        C('我也是160，穿这类直筒裤总容易拖地，你这条改过裤长吗？', ['height', 'size'], '我也是160', 'question', { constraints: { height: 160 }, replies: [R('改短了两厘米，现在穿平底鞋不踩裤脚。我腿长不算特别长，裤长还是要量自己的。', ['height', 'size'], { isAuthor: true, constraints: { height: 160 }, focus: '改短了两厘米' })] }),
        C('160cm、肩膀比较窄，照着试了宽松上衣，袖子一挽整个人轻了很多。', ['height', 'size'], '160cm、肩膀比较窄', 'experience', { constraints: { height: 160 } }),
        C('我158，裤子不改的话堆在鞋面上了，稍微缩短会更利落。', ['height', 'size'], '我158', 'experience', { constraints: { height: 158 } }),
        C('168穿同样长度会露一点脚踝。喜欢这个比例，但图里的裤长不一定适合所有人。', ['height', 'size'], '168穿同样长度', 'experience', { constraints: { height: 168 } }),
        C('预算1600能配一套类似的吗？不求同款，主要想找到这种颜色组合。', ['budget'], '预算1600', 'question', { constraints: { budget: 1600 }, replies: [R('我会先从已有的棕色裤子找起，再补一件米白衬衫。搭配不一定要整套买。', ['budget'], { isAuthor: true })] }),
        C('小个子如果腰线不明显，不塞衣角真的不会显矮吗？', ['height'], '不塞衣角真的不会显矮吗', 'question', { replies: [R('我试过全塞反而肚子那一块鼓。现在只在侧边塞一点，站着和坐下都舒服些。', ['height'], { kind: 'experience' }), R('我也是，薄衬衫只收一点衣角，比把厚上衣全部塞进去更自然。', ['height', 'fabric'], { replyToIndex: 0, kind: 'experience' })] }),
        C('上衣应该选S还是M？我肩宽一点，不想袖子把手盖住。', ['size'], '应该选S还是M', 'question', { replies: [R('图里是S，但这是偏宽的版型。建议比肩宽和袖长，光看字母尺码会不准。', ['size'], { isAuthor: true, focus: '图里是S' })] }),
        C('试了M，身上松但是袖口很长。换成S以后抬手也不紧，主要还是版型。', ['size'], '换成S以后抬手也不紧', 'experience'),
        C('裤子腰围合适、臀部略紧的别硬选小一码。我坐下试了两次才换大一号。', ['size'], '坐下试了两次才换大一号', 'experience'),
        C('面料会不会硬？我对贴脖子的衣领比较敏感，怕磨到皮肤。', ['fabric'], '面料会不会硬', 'question', { replies: [R('身上这部分比较软，但领口贴久了有一点痒。我会松开最上面一颗扣子。', ['fabric'], { isAuthor: true, focus: '领口贴久了有一点痒' })] }),
        C('这件衬衫我只隔着打底穿，直接贴皮肤略痒。敏感皮还是先摸一摸。', ['fabric'], '直接贴皮肤略痒', 'experience'),
        C('摸起来软，但肩包磨到的地方起了点小球。不是那种完全不用打理的布料。', ['fabric'], '肩包磨到的地方起了点小球', 'experience'),
        C('裤子的布料不是厚的，空调房里刚好。冬天室外穿就得再加层了。', ['fabric'], '裤子的布料不是厚的', 'experience'),
        C('洗了一次没明显缩水，我是装洗衣袋冷水洗，稍微甩干再挂起来晾。别直接烘干试运气。', ['fabric', 'care'], '没明显缩水', 'experience', { replies: [R('谢谢补充！我也低温洗，晾之前把衣领和门襟理平，干了没那么皱。', ['care'], { isAuthor: true })] }),
        C('浅色上衣会透吗？里面穿深色背心能不能看出来？', ['fabric'], '浅色上衣会透吗', 'question', { replies: [R('窗边强光下能隐约看到深色轮廓，肉色或浅色打底更稳。', ['fabric'], { isAuthor: true })] }),
        C('同样是160，我上半身长一些，照着穿没图里这么显腿长，侧塞更适合我。', ['height'], '同样是160', 'experience', { constraints: { height: 160 } }),
        C('身高160但喜欢更宽的裤腿，可以把鞋面露出来一点，走路不绊就挺好。', ['height', 'size'], '身高160', 'experience', { constraints: { height: 160 } }),
        C('我搭了灰棕色鞋，和棕色裤子接得很顺。图里白鞋更清爽，两种感觉都可以。', ['color'], '灰棕色鞋', 'experience'),
        C('脚背高穿图里这种鞋会压吗？有人跟我情况一样吗？', ['shoe'], '脚背高', 'question'),
        C('腰围这块有没有松紧？吃完饭会不会勒？', ['size'], '有没有松紧', 'question', { replies: [R('后腰有一小段松紧，但吃完饭仍会有一点紧，我没当居家裤穿。', ['size'], { isAuthor: true })] }),
        C('晚上暖光下上衣偏奶黄，白天才是偏米白的样子，照片颜色有点参考范围。', ['color'], '晚上暖光下上衣偏奶黄', 'experience'),
        C('刚试完，宽松不等于随便挑大码。肩线和裤长调对，比多买一件更管用。', ['size'], '肩线和裤长调对', 'opinion'),
        C('周一穿这套去上班了，坐一整天没有觉得被衣服绑住。', ['work'], '坐一整天没有觉得被衣服绑住', 'experience'),
        C('看着普通但越看越舒服，想从衣橱里找两件现成的试试。', ['style'], '从衣橱里找两件现成的', 'opinion')
      ],
      ambient: {
        openings: ['今天也想把穿衣服这件事变简单。', '这套配色很容易记住。', '翻到这张图，正好想起衣柜里的棕色裤子。', '最近更愿意穿自己舒服的衣服。', '你这篇让我想重新整理一下衣橱。', '搭配里有一点日常的小心思。'],
        endings: ['米白配棕色很耐看，通勤也不会太用力。', '先尝试现有的衣服，看看自己的比例。', '包包换成帆布袋应该也挺轻松。', '喜欢照片里的自然姿势，很有生活感。', '细细的项链点到为止，少一个选择挺好。', '周末出去散步，我想穿得这么轻便。', '看完把明天的搭配先放在椅子上了。', '头发简单扎起来也很清爽。', '希望自己慢慢找到舒服的固定搭配。', '图里的自然光让整套颜色更柔和了。', '已经发给和我一起整理衣柜的朋友。', '这种不用赶着追趋势的感觉很喜欢。']
      }
    },
    {
      id: 'study', seed: 26, title: '高二数学｜从“看懂了”到“自己会做”的一小步', author: '小树慢慢学', authorInitial: '树', authorTone: '#78968e',
      category: '学习', cover: 'assets/study.webp', images: ['assets/study.webp'],
      body: [
        '这两周把数学复习方式改了一下：看例题时先遮住解答，自己写出第一步。不会也先记下卡在哪里，再去看解析。只增加了几分钟，但比一口气看完好多题更能发现问题。',
        '函数这部分，我先整理定义域、单调性和图像之间的关系，每次只选一类练。错题旁边写一句“我为什么会这样想”，暂时不急着抄一整页标准解。',
        '这只是我目前用得顺的学习记录，适不适合你还要看基础和进度。有类似“看懂不会做”经历的朋友，可以一起聊聊。'
      ], tags: ['高二数学', '学习方法', '函数', '错题复盘'], publishedAt: '2026-09-02T18:20:00+08:00', location: '学习记录', likes: 5310, collects: 3496,
      core: [
        C('数学基础薄弱，看到函数题连第一步该设什么都想不出来，从哪补比较合适？', ['math', 'function', 'basics'], '数学基础薄弱', 'question', { constraints: { year: '高二' }, replies: [R('我先补定义域和基本图像，再按一种题型做短练习。先确认题目条件是什么意思，别急着刷综合题。', ['function', 'basics'], { isAuthor: true, focus: '先补定义域和基本图像' }), R('对，遇到不会的先分清是概念不懂还是运算出错，我做这个分类后没那么慌了。', ['basics'], { replyToIndex: 0, kind: 'experience' })] }),
        C('我最常见的情况是解析一看就懂，合上书就不会。遮住答案重新写确实能发现自己漏了哪一步。', ['basics', 'method'], '合上书就不会', 'experience', { likes: 119 }),
        C('函数单调性那几种图像总混，画在同一页对照会不会更容易记？', ['math', 'function'], '函数单调性', 'question', { replies: [R('我放一起对照了，但会标出前提条件。只记形状的话，换一个定义域又容易错。', ['function'], { isAuthor: true, focus: '会标出前提条件' })] }),
        C('基础概念没吃透的时候，抄整本错题也没用。我先讲给同桌听，讲不清楚的再翻书。', ['basics', 'method'], '基础概念没吃透', 'experience'),
        C('数学从42到63不是突然开窍，就是每天真的做完两道基础题，别把所有时间用来看。', ['math', 'basics'], '每天真的做完两道基础题', 'experience', { constraints: { year: '高二' } }),
        C('高二现在跟不上课堂，还适合每天留时间回头补高一吗？', ['math', 'basics'], '回头补高一', 'question', { constraints: { year: '高二' }, replies: [R('我是当天课程先完成，再挑跟当前章节相关的旧知识补。整本从头重看很容易拖得更乱。', ['basics', 'time'], { kind: 'experience', constraints: { year: '高二' } })] }),
        C('我试过一次做很多函数题，后面全靠惯性写。现在拆成十几分钟一组，错得少了一点。', ['math', 'function', 'time'], '十几分钟一组', 'experience'),
        C('同样叫看懂不会做，我其实卡在计算，中间一长串运算就丢符号，不完全是思路问题。', ['basics', 'calculation'], '卡在计算', 'experience', { replies: [R('这个补充很有用，定位卡点比统一加题量更有帮助。', ['basics'], { isAuthor: true })] }),
        C('你说的第一步到底怎么练？完全没思路的时候，是写已知条件还是先画图？', ['method', 'basics'], '第一步到底怎么练', 'question', { replies: [R('我先把条件翻成自己能懂的话，再看是否需要图。写不出下一步就把卡点标记下来，不硬编。', ['method', 'basics'], { isAuthor: true }), R('我今天照做了，原来有个条件我一直理解反了。', ['basics'], { replyToIndex: 0, kind: 'experience' })] }),
        C('高三来看看，高二的时候把函数图像基础练熟，后来至少不会一上来就发懵。', ['math', 'function'], '把函数图像基础练熟', 'experience', { constraints: { year: '高三' } }),
        C('物理也有看懂解答不会独立做的情况，我把受力图自己重画一遍才知道没真懂。', ['physics', 'method'], '物理也有看懂解答不会独立做', 'experience'),
        C('生物的遗传题也能这样复盘吗？我有时连题目问什么都没看明白。', ['biology', 'method'], '生物的遗传题', 'question'),
        C('错题只写一句原因，会不会过段时间就看不懂当时怎么解了？', ['method'], '只写一句原因', 'question', { replies: [R('我保留题目和必要步骤，“一句原因”是额外写的，不是只剩那一句。', ['method'], { isAuthor: true, focus: '保留题目和必要步骤' })] }),
        C('定义域真的要先写。我之前图画对了，忽略范围还是会把结论写错。', ['math', 'function'], '定义域真的要先写', 'experience'),
        C('练了一周，没有立刻涨很多分，但做题时没那么依赖翻解析了，这一点挺实在。', ['method', 'basics'], '没那么依赖翻解析', 'experience'),
        C('我照着每天两道练了三天还是会卡，后来发现例题难度选高了，先换成基础题。', ['basics', 'method'], '例题难度选高了', 'experience'),
        C('数学习惯乱写草稿，复盘时连自己都找不到步骤。把草稿分区域也有帮助。', ['math', 'method'], '把草稿分区域', 'experience'),
        C('这个方法适合2026这一届吗？我们课程进度比较快，有点担心来不及。', ['math', 'time'], '适合2026这一届吗', 'question', { constraints: { year: 2026 }, replies: [R('这里记录的是复盘习惯，不是某一届的考试范围。具体练习内容还是以你当前课程为准。', ['method'], { isAuthor: true, constraints: { year: 2026 } })] }),
        C('每天花多久整理呢？我一开始做得太好看，结果写完就没力气做题了。', ['time', 'method'], '每天花多久整理', 'question', { replies: [R('我通常十分钟以内，只写自己会看的内容。排版不重要，能回头用才重要。', ['time'], { isAuthor: true })] }),
        C('最近先讲思路再算，发现自己有时只是背过这道题，换个数字就又不会。', ['basics', 'method'], '换个数字就又不会', 'experience'),
        C('有适合基础薄弱的几何练习顺序吗？函数能跟一点，几何还是很乱。', ['math', 'geometry', 'basics'], '几何练习顺序', 'question'),
        C('最有共鸣的是别急着抄解析，我抄完会有一种做完很多题的错觉。', ['method'], '做完很多题的错觉', 'opinion'),
        C('和同学每人讲一道小题，比各自闷头看答案更能发现不懂的地方。', ['method'], '每人讲一道小题', 'experience'),
        C('笔记里不是每一页都工整，反而让我觉得真的在学。我自己的草稿也是这样。', ['mood'], '真的在学', 'opinion')
      ],
      ambient: {
        openings: ['把今天不会的地方写下来以后，心里没那么乱。', '我也在慢慢调整自己的学习节奏。', '这篇先存着，晚自习前想再读一遍。', '最近希望自己少一点假装努力。', '看见有人分享过程，比只晒结果更有力量。', '好喜欢这种不夸张的学习记录。'],
        endings: ['不用每次都做得完美，先认真完成一次。', '给自己留一点停下来想清楚的时间。', '今天先把桌上的一小摞整理好。', '有时候能说出哪里不会，就算往前走了一点。', '会把这个想法和同桌聊一聊。', '写完计划以后更重要的是坐下来开始。', '不要用别人一天的进度催自己。', '纸上留着修改痕迹，看起来很踏实。', '明天再来看，看看自己有没有真正用上。', '我准备先做一件很小但能坚持的事。', '每次回头看旧记录，才知道已经走了多远。', '累的时候休息一下，回来继续就好。']
      }
    },
    {
      id: 'trail', seed: 38, title: '松岚环线｜半天走进绿意，不必走到山顶', author: '今天走哪条路', authorInitial: '走', authorTone: '#769184',
      category: '出行', cover: 'assets/trail.webp', images: ['assets/trail.webp'],
      body: [
        '这次走的是松岚环线，从木桥入口进去，到湖边折返，慢慢走了约两小时。前半段树荫比较多，穿过一小段石阶后，可以在观景台停下来。',
        '我没有走最远的一段，带了水和一件薄外套，看到好看的地方就停。沿途有几张长椅，但不是每个岔路口都有明显指示，第一次来最好保留路线图。',
        '照片看起来轻松，不代表每个人走起来一样。同行人的体力、天气和是否走石阶都会影响体验，评论区有不同走法可以参考。'
      ], tags: ['周末徒步', '轻徒步', '树荫步道', '半日出行'], publishedAt: '2026-09-01T09:20:00+08:00', location: '栖禾市 · 松岚步道', likes: 3892, collects: 2190,
      core: [
        C('带爸妈走会不会太折腾？他们平时散步没问题，但不太能爬很长的坡。', ['parents', 'stairs', 'distance'], '带爸妈走会不会太折腾', 'question', { replies: [R('只走木桥到湖边那段比较平。观景台前有石阶，我们带家人时就没上去。', ['parents', 'stairs'], { kind: 'experience', focus: '带家人时就没上去' }), R('我妈妈平时能走四十分钟，那天边走边休息还好，没追求走完整圈。', ['parents', 'distance'], { replyToIndex: 0, kind: 'experience' })] }),
        C('上周和父母只走了平路段，长椅上歇了两次。膝盖不舒服的那位没有走上观景台。', ['parents', 'stairs', 'distance'], '膝盖不舒服的那位没有走上观景台', 'experience'),
        C('照片看不出台阶多少，实际有一段要连续往上走。想全程平坦的话不太适合。', ['stairs'], '有一段要连续往上走', 'experience'),
        C('我爸六十出头平时常爬楼，走完问题不大；同行的姨妈觉得有点累，不能只看年龄。', ['parents', 'distance'], '不能只看年龄', 'experience'),
        C('推轮椅能走到湖边吗？不知道木桥的宽度和中间有没有台阶。', ['access', 'stairs'], '推轮椅能走到湖边吗', 'question'),
        C('全程大概多少公里？两小时是包含停下来拍照的时间吗？', ['distance'], '全程大概多少公里', 'question', { replies: [R('我走的折返段大约3.2公里，两小时包含拍照和休息。完整环线我这次没走。', ['distance'], { isAuthor: true, focus: '折返段大约3.2公里' })] }),
        C('照着前半段走了，慢慢走也能在半天里结束。不过岔路有两个，第一次看清楚再转。', ['distance', 'route'], '在半天里结束', 'experience', { replies: [R('我在第一个岔路差点往上走，停下来对了一下路线才发现应该靠左。', ['route'], { kind: 'experience' })] }),
        C('我记录完整环线是5.6公里，和作者折返走法不一样，别直接照两小时安排。', ['distance', 'route'], '完整环线是5.6公里', 'experience'),
        C('带六岁孩子走过平路那一段，中间停着看水，反而走得挺开心。石阶我们绕开了。', ['children', 'stairs', 'distance'], '石阶我们绕开了', 'experience', { constraints: { age: 6 } }),
        C('下雨后会滑吗？周末可能有小雨，担心石头路不好走。', ['rain', 'stairs'], '下雨后会滑吗', 'question', { replies: [R('雨后木桥和长青苔的石阶很滑，我那天到桥边就折返了。别照晴天的照片判断。', ['rain', 'stairs'], { kind: 'experience', focus: '木桥和长青苔的石阶很滑' }), R('对，下雨就调整计划，照片里这一趟是晴天。', ['rain'], { isAuthor: true, replyToIndex: 0 })] }),
        C('刚下过雨去的，鞋底抓地一般，石阶确实滑。穿有纹路的鞋也别走太快。', ['rain', 'stairs'], '石阶确实滑', 'experience'),
        C('9月那次雨后平路积了两处水，不深，但裤脚被蹭湿了。', ['rain'], '平路积了两处水', 'experience', { time: '09-14' }),
        C('10月7日去平路已经干了，石阶角落还是潮的。同一条路天气一变体验差很多。', ['rain', 'stairs'], '石阶角落还是潮的', 'experience', { time: '10-08' }),
        C('长椅多不多？家人可能需要每隔一会儿坐一坐。', ['parents', 'rest'], '每隔一会儿坐一坐', 'question', { replies: [R('入口附近和湖边都有，两个点之间有一段没座位。需要频繁休息的话，先走短段试试。', ['parents', 'rest'], { isAuthor: true })] }),
        C('步道上没找到买水的地方，出发前带够比较好，湖边那台机器我去时没开。', ['supply'], '出发前带够', 'experience'),
        C('石阶不是一口气都连着，中间有平缓处，但下坡时对膝盖还是不太友好。', ['stairs', 'parents'], '下坡时对膝盖还是不太友好', 'experience'),
        C('木桥入口怎么到？公交下车之后还有多远？', ['transit', 'distance'], '公交下车之后还有多远', 'question', { replies: [R('我们下车后步行约八分钟到木桥入口，沿湖边小路一直走就能看到。', ['transit'], { isAuthor: true })] }),
        C('去的时候岔路指示牌被树叶挡住了一部分，我打开路线图才找对，别只凭感觉走。', ['route'], '指示牌被树叶挡住了一部分', 'experience'),
        C('傍晚树荫里有小虫，穿长裤更安心。空气很好，走完又想吃一大碗面。', ['supply'], '穿长裤更安心', 'experience'),
        C('厕所是在入口还是湖边？带老人出门会特别在意。', ['parents', 'toilet'], '厕所是在入口还是湖边', 'question', { replies: [R('我只用过入口的，湖边有没有没确认。建议出发前处理一下，不要假设途中都有。', ['toilet'], { isAuthor: true })] }),
        C('周末上午人稍多，下午树影很好看。我们没开音乐，沿途还能听到鸟叫。', ['crowd'], '沿途还能听到鸟叫', 'experience'),
        C('爸妈喜欢走到哪算哪，所以那天没走完。能在湖边聊一会儿就已经很开心。', ['parents', 'distance'], '那天没走完', 'experience'),
        C('看到你说不必走到山顶，突然松了一口气。出来散步也不用给自己设完成任务。', ['mood'], '不用给自己设完成任务', 'opinion'),
        C('想知道能不能带自行车进去？入口会不会有限制？', ['bike'], '能不能带自行车进去', 'question')
      ],
      ambient: {
        openings: ['这片绿意看着就舒服。', '周末想给眼睛放个假。', '最近总觉得应该多出门走走。', '你这组图有风吹过的感觉。', '看完想起小时候住过的院子。', '很喜欢没有赶行程的散步。'],
        endings: ['给自己半天，手机也可以少看一会儿。', '最喜欢这张里从树叶间透进来的光。', '和朋友慢慢聊天比拍很多照片更开心。', '树叶的颜色看起来像刚洗过一样。', '把平常的路认真拍下来也很有意思。', '准备带一个轻一点的小包出门。', '不用给每一次出门都找一个宏大的理由。', '我想把这一张画进手帐里。', '忙的时候看一眼这样的照片也挺治愈。', '下次出门想试着不一直看表。', '走到哪就认真看看哪，挺好的。', '希望今年能多攒一点普通的快乐。']
      }
    },
    {
      id: 'earbuds', seed: 50, title: 'N7用满三周｜通勤够用，开会先别急着下结论', author: '半页数码记录', authorInitial: '页', authorTone: '#8195a8',
      category: '数码', cover: 'assets/earbuds.webp', images: ['assets/earbuds.webp'],
      body: [
        '这篇记录我用了三周的一副N7耳机，主要是地铁通勤、听播客和偶尔的语音通话。它和N7 Pro是两个不同型号，这里不要混着看。',
        '我在安静室内打电话，对方能听清。到路边遇到风声就没那么稳，不能把“能通话”直接当成“适合所有会议”。降噪开着听歌，单次续航也比关闭时短一些。',
        '佩戴感觉比较看耳型，我换成小号耳塞才舒服。准备试这类耳机的朋友，可以在评论里看看不同使用场景。也欢迎补充你们的长期体验。'
      ], tags: ['耳机体验', '通勤装备', '通话测试', '三周记录'], publishedAt: '2026-09-01T16:20:00+08:00', location: '栖禾市', likes: 1786, collects: 725,
      core: [
        C('N7通话在办公室里怎么样？每天有两个短会，主要怕声音忽大忽小。', ['calls'], 'N7通话', 'question', { constraints: { model: 'N7' }, replies: [R('安静工位通话能听清，但旁边同时有人说话会带进来。重要会议我还是换有线麦。', ['calls'], { isAuthor: true, constraints: { model: 'N7' }, focus: '旁边同时有人说话会带进来' }), R('我也是N7，日常短会可以，整屋都在讲话的时候就不太理想。', ['calls'], { replyToIndex: 0, kind: 'experience', constraints: { model: 'N7' } })] }),
        C('N7在地铁里接电话，对方说听着有闷感。回到办公室以后正常，不建议只测安静环境。', ['calls'], '地铁里接电话', 'experience', { constraints: { model: 'N7' }, replies: [R('我昨天遇到同样的情况，把手机拿出来继续说就清楚了。', ['calls'], { kind: 'experience', constraints: { model: 'N7' } })] }),
        C('用了三周N7，室内语音还行，骑车时风声压不住。走路也得避开大风口。', ['calls'], '风声压不住', 'experience', { constraints: { model: 'N7' } }),
        C('N7 Pro的拾音比我之前那副顺一点，开线上会两次都没人提醒声音小。', ['calls'], 'N7 Pro的拾音', 'experience', { constraints: { model: 'N7 Pro' } }),
        C('提醒下N7和N7 Pro别混看，我两款都试过，在路边通话的表现不完全一样。', ['calls', 'model'], 'N7和N7 Pro别混看', 'opinion', { constraints: { model: 'N7', comparedModel: 'N7 Pro' } }),
        C('N7能同时连电脑和手机吗？切设备是不是要每次进设置？', ['compatibility'], '同时连电脑和手机', 'question', { constraints: { model: 'N7' }, replies: [R('我这副N7只能保留一台正在连接，切到电脑前会断开手机。没有测到自动切换。', ['compatibility'], { isAuthor: true, constraints: { model: 'N7' }, focus: '只能保留一台正在连接' })] }),
        C('我的旧电脑连N7以后能听，麦克风有一次没选对。先检查会议软件输入设备。', ['compatibility', 'calls'], '检查会议软件输入设备', 'experience', { constraints: { model: 'N7' } }),
        C('N7 Pro可以在我那两台设备之间切，不过要看具体系统和固件，不能当成N7也有。', ['compatibility'], '不能当成N7也有', 'experience', { constraints: { model: 'N7 Pro' } }),
        C('N7和较旧的平板兼容吗？我那台只能装老版本系统，想看看有没有同样的情况。', ['compatibility'], '较旧的平板兼容吗', 'question', { constraints: { model: 'N7' } }),
        C('N7连接手机听播客正常，但游戏里我能感觉到一点延迟。听歌不太在意，打游戏会在意。', ['compatibility', 'latency'], '能感觉到一点延迟', 'experience', { constraints: { model: 'N7' } }),
        C('N7开降噪续航大概多久？我来回通勤各一小时，中午还会用。', ['battery'], 'N7开降噪续航', 'question', { constraints: { model: 'N7' }, replies: [R('我的音量中等，连续听大约四个多小时开始提醒低电。这个是个人记录，不能当固定参数。', ['battery'], { isAuthor: true, constraints: { model: 'N7' }, focus: '四个多小时' })] }),
        C('N7关降噪用过接近六小时，中间暂停几次，实际连续播放可能会短一些。', ['battery'], '接近六小时', 'experience', { constraints: { model: 'N7' } }),
        C('N7 Pro我开降噪约五小时还没提醒低电，不过音量低，环境也安静。', ['battery'], 'N7 Pro我开降噪约五小时', 'experience', { constraints: { model: 'N7 Pro' } }),
        C('N7用了三个月感觉比刚拿到时短一点，也可能最近通话多，没认真统一条件测。', ['battery'], '比刚拿到时短一点', 'experience', { constraints: { model: 'N7' }, time: '09-22' }),
        C('更新以后N7断连少了，9月初我还遇过从盒子拿出来一边没连上的情况。', ['compatibility'], '更新以后N7断连少了', 'experience', { constraints: { model: 'N7' }, time: '10-09', replies: [R('我还没更新就偶尔有这个问题，回头再试。', ['compatibility'], { kind: 'experience', constraints: { model: 'N7' } })] }),
        C('小耳朵戴N7会胀吗？想问问长时间戴过的人。', ['fit'], '小耳朵戴N7会胀吗', 'question', { constraints: { model: 'N7' }, replies: [R('换小号耳塞之后好了些，但两小时我还是要拿下来透透气。', ['fit'], { isAuthor: true, constraints: { model: 'N7' } })] }),
        C('N7左耳总比右耳电量掉得快，有人一样吗？左右差十几个点。', ['battery'], '左耳总比右耳电量掉得快', 'question', { constraints: { model: 'N7' }, replies: [R('我差得没这么多。可以先确认两边触点和充电状态，再找售后核对，别只靠评论判断。', ['battery'], { isAuthor: true, constraints: { model: 'N7' } })] }),
        C('N7的盒子放小包里不占地方，盖子是哑光的，指纹没那么明显。', ['design'], '盖子是哑光的', 'experience', { constraints: { model: 'N7' } }),
        C('N7 Pro比N7更适合我耳型，但这种差别很个人，最好有条件试戴。', ['fit', 'model'], '最好有条件试戴', 'experience', { constraints: { model: 'N7 Pro', comparedModel: 'N7' }, replies: [R('是耳塞尺寸不同，还是外壳形状不同呀？', ['fit'], { kind: 'question', constraints: { model: 'N7 Pro' } }), R('主要是外壳落在耳朵里的角度，小号耳塞我两款都换过。', ['fit'], { kind: 'experience', constraints: { model: 'N7 Pro' }, replyToIndex: 0 })] }),
        C('N7能直接用线连电脑当耳机吗？找不到这个说明。', ['compatibility', 'wired'], '直接用线连电脑', 'question', { constraints: { model: 'N7' } }),
        C('坐在图书馆用N7，开关降噪差别能听出来。路边低频弱下去了，但人声还在。', ['noise'], '人声还在', 'experience', { constraints: { model: 'N7' } }),
        C('N7麦克风试过室内和商场，室内可以，商场那次朋友让我换回手机。', ['calls'], '商场那次朋友让我换回手机', 'experience', { constraints: { model: 'N7' } }),
        C('N7 Pro通话声音更亮不代表更适合所有人，我还是更在意戴久了耳朵痛不痛。', ['calls', 'fit'], '戴久了耳朵痛不痛', 'opinion', { constraints: { model: 'N7 Pro' } }),
        C('喜欢把没测过的地方直接写出来，比一句全场景都好用更有参考价值。', ['mood'], '没测过的地方直接写出来', 'opinion')
      ],
      ambient: {
        openings: ['这种用一段时间再写的记录挺值得看。', '我也是通勤路上离不开耳机。', '桌面照片拍得干净，先停下来读完了。', '有时候小物件的体验比参数更重要。', '谢谢把普通的一天怎么用写出来。', '最近想认真看看自己的使用习惯。'],
        endings: ['会先想清楚自己最常用的地方。', '平时听播客，比听歌还多一点。', '盒子放在木桌上很像我下班前的桌面。', '不着急跟着换新的，先看看旧的还能不能用。', '整理包的时候总会找一下有没有带充电线。', '喜欢把优点和不顺手的地方都写清楚。', '照片里的奶白色和木色很舒服。', '昨天一路听完一个故事，路好像没那么长。', '每个人在意的点不同，留言也很有意思。', '会发给最近总忘记带耳机的朋友。', '希望自己买东西之前先想一下需要。', '先把这篇放进自己的小清单里。']
      }
    },
    {
      id: 'home', seed: 62, title: '给小房间留一张书桌，100cm也能好好坐下', author: '木木的房间角落', authorInitial: '木', authorTone: '#b29676',
      category: '家居', cover: 'assets/home.webp', images: ['assets/home.webp'],
      body: [
        '房间不大，最后选了100cm宽桌面。平时放一台显示器、键盘和一本摊开的书刚刚好，这天收起屏幕，留一本本子和一杯水。桌子没有复杂的架子，收线以后这个角落清爽了不少。',
        '桌面看着浅，但窗边有时候会反光。用屏幕时我会转一个小角度，晚上再用台灯补光。拍照这天桌面少了一点东西，也是想给自己一个安心写字的下午。',
        '安装是两个人一起做的，一个扶着，一个拧螺丝。靠墙坐很稳，空着一侧时会有一点晃。欢迎一起聊聊小空间还能怎么布置。'
      ], tags: ['小房间改造', '书桌布置', '100cm书桌', '日常桌面'], publishedAt: '2026-09-04T19:10:00+08:00', location: '栖禾市', likes: 3176, collects: 1425,
      core: [
        C('100cm宽能放显示器加笔记本吗？怕摆完就没地方写字。', ['width'], '100cm宽', 'question', { constraints: { width: 100 }, replies: [R('我放一个显示器加键盘，摊开书还行。两台设备横着放就挤了，要看屏幕宽度。', ['width'], { isAuthor: true, constraints: { width: 100 }, focus: '两台设备横着放就挤了' })] }),
        C('同样100cm，我把笔记本竖着用支架放，手写区空了不少。两台横排不太够。', ['width'], '两台横排不太够', 'experience', { constraints: { width: 100 } }),
        C('120cm那款放在我房间挡衣柜门，最后换了100cm，椅子收进去刚刚好。', ['width'], '换了100cm', 'experience', { constraints: { width: 100, comparedWidth: 120 } }),
        C('80cm能不能照着摆？我只有床和墙之间这一小块位置。', ['width'], '80cm能不能照着摆', 'question', { constraints: { width: 80 } }),
        C('桌面深度够吗？显示器离眼睛太近会不会不舒服？', ['width', 'depth'], '桌面深度够吗', 'question', { replies: [R('深度是55cm，我把显示器靠后、键盘留在前面。自己的视距还是要坐下来实际试。', ['depth'], { isAuthor: true, constraints: { depth: 55 }, focus: '深度是55cm' })] }),
        C('桌面会反光吗？家里窗在侧边，白天看屏幕总有一条亮亮的。', ['glare'], '桌面会反光吗', 'question', { replies: [R('侧面强光过来会有反光，我转了一点屏幕角度，桌面也铺了小块哑光桌垫。', ['glare'], { isAuthor: true, focus: '侧面强光过来会有反光' })] }),
        C('照片看着哑光，实际窗边太阳直照还是亮。桌垫有改善，光源角度也很重要。', ['glare'], '太阳直照还是亮', 'experience'),
        C('我窗在背后，屏幕反光比桌面明显，拉纱帘后好多了，光线不是只靠换桌子解决。', ['glare'], '拉纱帘后好多了', 'experience'),
        C('晚上的台灯如果正对桌面，浅色面板会有亮斑。我把灯移到左后方了。', ['glare'], '浅色面板会有亮斑', 'experience'),
        C('一个人安装难吗？租房找不到第二个人帮忙。', ['setup'], '一个人安装难吗', 'question', { replies: [R('我一个人先装了一半，翻桌面这步找人扶了。重量不轻，能有人帮最好。', ['setup'], { kind: 'experience', focus: '翻桌面这步找人扶了' }), R('我们也是两个人装的，先对齐再分次拧紧，别一开始把单颗拧到底。', ['setup'], { isAuthor: true, replyToIndex: 0 })] }),
        C('说明书的第三步画得小，我把螺丝分类摆好才顺。两个人差不多四十分钟。', ['setup'], '两个人差不多四十分钟', 'experience'),
        C('安装时有一颗螺丝孔偏紧，手拧不进去，换了工具才好。别硬顶着把表面弄花。', ['setup'], '有一颗螺丝孔偏紧', 'experience'),
        C('这张桌子晃不晃？我打字比较用力，之前小桌总跟着动。', ['stability', 'setup'], '这张桌子晃不晃', 'question', { replies: [R('靠墙正常打字没明显晃，离墙用力推有一点。装完可以再检查螺丝和脚垫。', ['stability', 'setup'], { isAuthor: true, focus: '离墙用力推有一点' })] }),
        C('地板有一点不平，我垫平一个脚以后稳了。不是所有晃动都来自桌腿。', ['stability', 'setup'], '垫平一个脚以后稳了', 'experience'),
        C('桌面多久要擦一次？浅色是不是很容易留下杯印？', ['care'], '留下杯印', 'question', { replies: [R('我垫杯垫，水滴会及时擦。边缘有接缝，尽量别长时间留水。', ['care'], { isAuthor: true })] }),
        C('100cm宽配带扶手的椅子，进出时要留旁边位置。椅子能塞进去不等于人能顺利坐下。', ['width', 'chair'], '椅子能塞进去不等于人能顺利坐下', 'experience', { constraints: { width: 100 } }),
        C('脚下收线之后清爽很多，不过插排别完全包住，留点散热和拔插空间。', ['cable'], '留点散热和拔插空间', 'experience'),
        C('想装屏幕支架，桌板能夹吗？有人试过边缘厚度吗？', ['setup', 'width'], '桌板能夹吗', 'question'),
        C('我没放很多装饰，留一块空桌面会更想坐下来用。拍照也不用每次收半天。', ['layout'], '留一块空桌面', 'experience'),
        C('9月安装时晃得明显，以为买错了。后来检查发现一边螺丝没拧到位。', ['setup', 'stability'], '一边螺丝没拧到位', 'experience', { time: '09-12', replies: [R('我10月又全部检查一遍，现在正常打字稳定了，不是换了桌子。', ['setup', 'stability'], { kind: 'experience', time: '10-08', focus: '现在正常打字稳定了' })] }),
        C('宽度100、深度55的桌面拿来缝东西也能用，不过大块布展开还是得去餐桌。', ['width', 'depth'], '宽度100、深度55', 'experience', { constraints: { width: 100, depth: 55 } }),
        C('房间宽1600毫米，摆桌子之前一定记得量门打开的位置，我差点漏掉。', ['layout'], '房间宽1600毫米', 'experience', { constraints: { roomWidth: 1600 } }),
        C('那个小台灯的位置好舒服，我也不想让桌面被各种架子占满。', ['layout'], '不想让桌面被各种架子占满', 'opinion', { replies: [R('我也试过加很多收纳架，后来拿掉一个反而更顺手，东西能直接拿到。', ['layout'], { kind: 'experience' })] }),
        C('桌子的边角圆不圆？平时走过容易碰到，我会比较在意这个。', ['safety'], '桌子的边角圆不圆', 'question')
      ],
      ambient: {
        openings: ['看到这个角落很想整理自己的桌面。', '房间小也可以慢慢布置出喜欢的样子。', '日常用的东西留在照片里很有生活感。', '这套浅色和木色搭配看着舒服。', '喜欢这种能真正坐下来用的桌面。', '最近在给自己的房间做减法。'],
        endings: ['先把不用的纸和盒子收走，已经会不一样。', '一盏灯和一本书就能让晚上安静下来。', '我也想给自己留一个固定写字的位置。', '那盆小绿植放得刚刚好，不挡视线。', '生活一点点变顺手，比一次性买齐更开心。', '不需要每个角落都像展示间。', '明天先花十分钟把充电线理一理。', '看到暖色灯光就想关掉工作消息。', '窗边的薄纱让我想起家里的下午。', '有个能放下心的小角落挺重要的。', '先从自己每天最常用的地方改起。', '想把这一点小变化也认真记录下来。']
      }
    },
    {
      id: 'travel', seed: 70, title: '霁川三天两夜｜先选住哪，再决定怎么走', author: '小岛的慢旅行', authorInitial: '岛', authorTone: '#789f9a',
      category: '出行', cover: 'assets/travel.webp', images: ['assets/travel.webp'],
      body: [
        '第一次去霁川，留了三天两夜：第一天下午到站，放下行李后逛河边老街；第二天去青岚湖，傍晚回城吃饭；第三天留给街巷和小店，午后坐车回家。没有把所有景点都塞进去，遇到喜欢的地方可以多坐一会儿。',
        '我们最后住在老城外沿，走去河边方便，但从车站来回要多留交通时间。老街里热闹、拍照好看，车站附近更适合晚到早走；带老人、行李多或睡眠浅，选择可能会完全不同。订房前我会逐项问电梯、隔音和退改。',
        '全程没有自驾，用了城内公交、湖区接驳和一段打车。我会给转车和回程多留一点时间，订房前再确认房型和到店方式。欢迎在评论里讨论路线、住宿和交通怎么取舍。本篇为虚构场景。'
      ], tags: ['三天两夜', '旅行路线', '住宿选择', '公共交通'], publishedAt: '2026-09-09T11:20:00+08:00', location: '霁川 · 河岸老城', likes: 4286, collects: 2671,
      core: [
        C('只有三天两夜，老城、青岚湖和山上的观景台都去会不会太赶？第一次来想尽量少绕路。', ['travelRoute'], '三天两夜', 'question', { replies: [R('我只留老城和湖区，观景台另一天再来。到站那天下午慢慢逛，第二天湖边，最后半天留给回程。', ['travelRoute'], { isAuthor: true, focus: '只留老城和湖区' }), R('照这个顺序走过，最后一天没跨城赶景点，回程轻松很多。', ['travelRoute'], { replyToIndex: 0, kind: 'experience' })] }),
        C('我们第一天就冲湖区，车到得晚，天黑前只走了一小段。晚到还是先留在城里更踏实。', ['travelRoute', 'travelTransit'], '晚到还是先留在城里', 'experience'),
        C('喜欢空镜的话可以反过来，第二天早一点去湖边。我去的那天上午人少，但这不是每个周末都成立。', ['travelRoute', 'travelCrowd'], '第二天早一点去湖边', 'experience'),
        C('下雨那天临时取消观景台，在老城喝茶逛书店也过了一下午。别把路线排到完全不能调整。', ['travelRoute', 'travelWeather'], '临时取消观景台', 'experience'),
        C('住老城还是车站附近比较好？两个人拖行李，晚上想逛街，但第二天还要去湖区。', ['travelStay'], '住老城还是车站附近', 'question', { replies: [R('我选老城外沿，步行到街巷方便，回酒店没那么吵；去车站和湖区要另算通勤。车站一带适合晚到早走。', ['travelStay'], { isAuthor: true, focus: '老城外沿' }), R('我们晚到，住车站附近省了当晚的转车；第二天下午才进老城，接受多跑一趟就可以。', ['travelStay'], { replyToIndex: 0, kind: 'experience', focus: '住车站附近省了当晚的转车' })] }),
        C('住老街里面，下楼就能吃东西，但我那间窗外有店铺，到晚上还听得到聊天。睡眠浅要先问房间朝向。', ['travelStay'], '晚上还听得到聊天', 'experience'),
        C('车站旁的房间整洁，拖箱子确实省事。不过每天进老城来回折腾，想一天回房休息几次的人未必合适。', ['travelStay'], '每天进老城来回折腾', 'experience'),
        C('带爸妈那次住老城外沿，有电梯、车能到门口，比住在石板巷深处舒服。看地图距离近不代表拖箱子好走。', ['travelStay', 'travelAccess'], '有电梯、车能到门口', 'experience'),
        C('老城里的酒店都有电梯吗？我带大箱子，不想上三楼搬半天。', ['travelStay', 'travelAccess'], '都有电梯吗', 'question', { replies: [R('我们看过的两家小院没有，最后换到外沿那家。要问具体楼栋和房间，不能只看酒店名字。', ['travelStay', 'travelAccess'], { kind: 'experience', focus: '两家小院没有' })] }),
        C('临出发改日期，原来那间房不能退。后来宁愿少一个景观窗，也把可取消的条件放前面。', ['travelStay', 'travelBooking'], '原来那间房不能退', 'experience'),
        C('不用自驾怎么走？从车站到老城、再去青岚湖，公共交通能不能串起来？', ['travelTransit'], '不用自驾怎么走', 'question', { replies: [R('我们的做法是车站坐城内公交到老城外沿，湖区那天到集散点换接驳，返程晚了才打车。要先核对当天末班时间。', ['travelTransit'], { isAuthor: true, focus: '到集散点换接驳' }), R('我去的时候接驳排了挺久，没预留换车时间差点错过预约时段。', ['travelTransit'], { replyToIndex: 0, kind: 'experience', focus: '接驳排了挺久' })] }),
        C('周末公交上带箱子挺挤，我们错开午后那一班才坐上。人多的时候不要把转车计划卡得太紧。', ['travelTransit', 'travelCrowd'], '带箱子挺挤', 'experience'),
        C('回程高铁在下午，午饭后直接回站，不再去另一侧的景点。最后一天只安排同一片区更稳。', ['travelRoute', 'travelTransit'], '最后一天只安排同一片区', 'experience'),
        C('带孩子的话租车还是打车？主要担心坐公交换来换去会累。', ['travelTransit', 'travelAccess'], '租车还是打车', 'question', { replies: [R('我们带孩子打车到湖区，但回来不好叫，等得比想象中久。自驾也要考虑停车，不一定每段都更省心。', ['travelTransit', 'travelAccess'], { kind: 'experience', focus: '回来不好叫' })] }),
        C('那天接驳只到湖区入口，进去还得步行，别把下车点当成最终景点门口。', ['travelTransit', 'travelAccess'], '进去还得步行', 'experience'),
        C('老城到湖边能骑共享单车吗？看着距离不远，不确定途中有没有能还车的点。', ['travelTransit'], '有没有能还车的点', 'question'),
        C('两个人想控制花费，应该先省酒店还是减少打车？不想为了赶景点多花一堆钱。', ['travelBudget'], '先省酒店还是减少打车', 'question', { replies: [R('我先缩短跨区路线，再比同一地段的房间。便宜房间如果太远，每天往返也会增加花费，先算整趟。', ['travelBudget', 'travelStay'], { isAuthor: true, focus: '先算整趟' })] }),
        C('河边餐馆风景好，不过我们点的口味偏重。同行的人吃得清淡，第二顿就换到普通小店了。', ['travelFood'], '口味偏重', 'experience'),
        C('湖区需要预约吗？当天看天气再决定会不会来不及？', ['travelBooking'], '湖区需要预约吗', 'question', { replies: [R('我们这次提前选了入园时段。取消和改期要看票上的条件，不要默认下雨就能退。', ['travelBooking'], { isAuthor: true, focus: '取消和改期要看票上的条件' })] }),
        C('周末沿河那条主街人多，绕进旁边巷子反而更好逛。怕拥挤可以少安排最热闹的时间段。', ['travelCrowd', 'travelRoute'], '旁边巷子反而更好逛', 'experience'),
        C('退房后行李寄存在哪？第三天下午的车，还想空着手再逛一会儿。', ['travelLuggage'], '行李寄存在哪', 'question', { replies: [R('我们放在住过的酒店前台，先问了取回时间和保管方式。车站有没有柜子这次没确认。', ['travelLuggage'], { isAuthor: true, focus: '放在住过的酒店前台' })] }),
        C('带老人走石板街要慢一点，雨后几处路面滑。我们宁愿少去一家店，也不一路催着走。', ['travelAccess', 'travelWeather'], '雨后几处路面滑', 'experience'),
        C('有人推轮椅去过湖区吗？从接驳下车到河岸这一段有没有连续无台阶的路？', ['travelAccess', 'travelWheelchair'], '连续无台阶的路', 'question'),
        C('最喜欢傍晚坐河边那一小时，没拍多少照片。路线空一点，才有时间真的待在一个地方。', ['travelRoute'], '路线空一点', 'opinion')
      ],
      ambient: {
        openings: ['旅行前先读大家怎么安排挺有意思。', '这张河岸的光很舒服。', '看完想给自己留一个慢一点的假期。', '小城的街巷很适合随手记录。', '喜欢这种有空白的周末。', '照片里的远处有一点雾。'],
        endings: ['出门带一本小本子，回来可以慢慢写。', '和朋友一起看风景就已经很开心。', '不一定每一张都要拍得像明信片。', '坐下来听一会儿水声也很好。', '喜欢把平常的画面认真留下来。', '看到这个颜色就想画一张小速写。', '希望下次出门能少一点赶时间。', '把相册整理好也像再过一次周末。', '先把这张发给最近想放假的朋友。', '普通的小街也有自己的样子。', '我也想试着少看一会儿手机。', '一趟出门有一个喜欢的瞬间就很满足。']
      }
    },
    {
      id: 'benefits', seed: 79, title: '禾序科技入职三个月｜福利要看细则', author: '下班后的便签', authorInitial: '签', authorTone: '#8b96ad',
      category: '职场', cover: 'assets/benefits.webp', images: ['assets/benefits.webp'],
      body: [
        '在禾序科技入职三个月，最常被朋友问的不是办公室好不好看，而是餐补、休假和加班怎么安排。把自己的体验记在这里：我所在办公室午饭用饭卡，休假通过系统提交，忙的时候需要提前和组内排期。',
        '福利清单写着有，不代表每个人的领取条件都一样。试用期、入职日期、所在办公室、岗位和直属团队，都会影响实际体验。有人觉得饭卡省事，也有人通勤太远、根本用不到；我更关心这些福利能否在自己需要的时候用上。',
        '下次面试，我会把关心的条目先列清楚，向负责招聘的人确认领取条件和申请方式，再结合自己的通勤、作息与工作习惯判断。比起福利清单有多长，我更在意自己能不能用得上。禾序科技为虚构公司。'
      ], tags: ['公司福利', '试用期', '餐补与休假', '入职体验'], publishedAt: '2026-09-12T18:20:00+08:00', location: '栖禾市 · 云杉办公区', likes: 3679, collects: 1942,
      core: [
        C('试用期有餐补吗？饭卡是第一天就发，还是转正以后才能用？', ['benefitMeal', 'benefitTrial'], '试用期有餐补吗', 'question', { replies: [R('我在云杉办公室，入职第一周开通饭卡，试用期也能吃午饭。这里是按到岗记录充到卡里，不是发现金。', ['benefitMeal', 'benefitTrial'], { isAuthor: true, focus: '试用期也能吃午饭' }), R('我在另一个办公室，权限晚了几天才开，刚入职那几顿先自费，后来按流程处理了。', ['benefitMeal', 'benefitTrial'], { replyToIndex: 0, kind: 'experience', focus: '权限晚了几天才开' })] }),
        C('试用期的饭卡能用，但我常在外勤，用不到食堂。我的团队那部分怎么申请要另问，不是人人都有一笔现金餐补。', ['benefitMeal', 'benefitTrial'], '不是人人都有一笔现金餐补', 'experience'),
        C('饭卡对我挺方便，午饭不用每天纠结点什么。只是可选菜少，我连续吃一周会腻。', ['benefitMeal'], '连续吃一周会腻', 'experience'),
        C('我们办公室没有食堂，用定点商家。周五提前下班就常常来不及用，福利好不好也和作息有关。', ['benefitMeal'], '没有食堂', 'experience'),
        C('年假和调休怎么区分？系统里有两个余额，是不是都可以随便换成一整天？', ['benefitLeave', 'benefitOvertime'], '年假和调休怎么区分', 'question', { replies: [R('我这里年假和补休分开显示，年假看个人资格与入职信息，补休要有已确认的加班记录。申请时还要看团队排期。', ['benefitLeave', 'benefitOvertime'], { isAuthor: true, focus: '年假和补休分开显示' }), R('补充我的经历：之前只有提交加班记录，没有主管确认，余额还没增加，确认后才出现。', ['benefitLeave', 'benefitOvertime'], { replyToIndex: 0, kind: 'experience', focus: '主管确认' })] }),
        C('我想把年假连着周末用，提前两周沟通后通过了。系统有余额只是第一步，还得确认交接和同事的排期。', ['benefitLeave'], '提前两周沟通后通过了', 'experience'),
        C('我们赶项目时调休连续被改期，后来分成两次才休到。清单上有补休，实际能不能顺利休还要看组内安排。', ['benefitLeave', 'benefitOvertime', 'benefitTeam'], '调休连续被改期', 'experience'),
        C('月底调休会不会过期？我手上还留着半天，找不到有效期在哪里看。', ['benefitLeave', 'benefitOvertime'], '调休会不会过期', 'question', { replies: [R('我那条记录的详情页有截止日期，不同来源显示不一样。你的余额要点开对应明细，再找人事核对。', ['benefitLeave', 'benefitOvertime'], { kind: 'experience', focus: '详情页有截止日期' })] }),
        C('试用期能申请请假吗？下个月有家事，怕一说请假就留下不好印象。', ['benefitTrial', 'benefitLeave'], '试用期能申请请假吗', 'question', { replies: [R('我试用期请过一天事假，提前说明安排、做了交接。具体假别和审批条件还是问负责你的团队。', ['benefitTrial', 'benefitLeave'], { kind: 'experience', focus: '试用期请过一天事假' })] }),
        C('试用期的体检通知到了，但我那次错过预约窗口。后来能不能补约是另一个流程，入职礼包不是拿到就都自动生效。', ['benefitTrial', 'benefitHealth'], '错过预约窗口', 'experience'),
        C('加班有餐食或打车报销吗？我更在意偶尔赶项目回家的安排。', ['benefitOvertime', 'benefitCommute'], '打车报销吗', 'question', { replies: [R('我的组需要先确认加班安排，满足本办公室的时间和凭证要求后再申请，临时晚走不一定都能报。', ['benefitOvertime', 'benefitCommute'], { isAuthor: true, focus: '临时晚走不一定都能报' }), R('我有一次凭证没留全被退回，补齐才通过。现在会先看申请页面的说明。', ['benefitOvertime', 'benefitCommute'], { replyToIndex: 0, kind: 'experience', focus: '凭证没留全被退回' })] }),
        C('我在支持团队，最近几周准点下班比较多；朋友在交付组就忙很多。问加班最好具体到团队和阶段。', ['benefitOvertime', 'benefitTeam'], '具体到团队和阶段', 'experience'),
        C('我们有弹性到岗时间，但不是自己想几点来就几点来，上午有固定协作时间段。', ['benefitFlex', 'benefitTeam'], '有固定协作时间段', 'experience'),
        C('远程办公是一周固定一天吗？还是遇到特殊情况才临时申请？', ['benefitRemote', 'benefitFlex'], '远程办公', 'question', { replies: [R('我所在岗位能提前申请，现场支持的同事安排不同，不是全公司统一每周一天。', ['benefitRemote', 'benefitFlex'], { isAuthor: true, focus: '不是全公司统一每周一天' })] }),
        C('外地通勤来回久，食堂和下午茶补不了时间成本。拿到邀请以后，我先走了一遍早晚通勤。', ['benefitCommute'], '先走了一遍早晚通勤', 'experience'),
        C('有班车吗？住得远，主要想知道早晚路线和错过之后怎么办。', ['benefitCommute'], '有班车吗', 'question', { replies: [R('云杉这边有两条班车路线，但不经过我家附近；错过那班要自己安排。住址和下班时间都要一起看。', ['benefitCommute'], { kind: 'experience', focus: '不经过我家附近' })] }),
        C('体检项目对我够用，但家人不能直接一起用这个名额。别把员工福利和家属保障当成一件事。', ['benefitHealth'], '家人不能直接一起用', 'experience'),
        C('补充保障的生效日期在哪里确认？入职时听到了这个词，没看懂个人页面。', ['benefitHealth', 'benefitCoverage'], '生效日期在哪里确认', 'question'),
        C('新人电脑是统一发还是能按岗位申请？设计软件开得多，怕只给基础配置。', ['benefitEquipment'], '按岗位申请', 'question', { replies: [R('我拿的是办公配置，设计同事另走需求申请。审批周期也要问清，不能默认当天就换好。', ['benefitEquipment'], { isAuthor: true, focus: '另走需求申请' })] }),
        C('我的显示器先用库存，申请新设备等了两周。有人更快，可能和当时库存有关。', ['benefitEquipment'], '申请新设备等了两周', 'experience'),
        C('下午茶是固定日期的活动，不是每天都有。大家一起聊十分钟挺开心，但对我来说不如稳定休假有用。', ['benefitPerks', 'benefitLeave'], '不如稳定休假有用', 'opinion'),
        C('培训预算能报外面的课吗？想学习的内容和当前岗位不完全一样。', ['benefitTraining'], '培训预算', 'question', { replies: [R('我报的是工作相关课程，先交计划再审批。跨领域的还没试过，不能保证都能报。', ['benefitTraining'], { kind: 'experience', focus: '先交计划再审批' })] }),
        C('部门氛围比我想象中轻松，负责人愿意帮忙安排交接。不过另一组朋友遇到的节奏不同，不能只看公司名字。', ['benefitTeam'], '另一组朋友遇到的节奏不同', 'experience'),
        C('面试时把领取条件、到账方式和谁来审批问明白，比只问有没有福利更有帮助。最好把自己最关心的三项先列出来。', ['benefitTrial', 'benefitTeam'], '领取条件、到账方式和谁来审批', 'opinion')
      ],
      ambient: {
        openings: ['把入职后的普通一天记下来很有参考意义。', '办公室那束光挺舒服。', '看到这篇想整理一下自己的工作便签。', '每个人在意的地方确实不一样。', '下班后读一会儿这样的记录很放松。', '喜欢你写清楚亲身遇到的细节。'],
        endings: ['先想清楚自己现在最需要什么。', '不跟着别人一句评价就做决定。', '希望忙的时候也能好好吃饭。', '桌面上的小本子和我的很像。', '和同事能好好说话很珍贵。', '把没确认的事情留在清单里也挺好。', '日常顺手的东西会让心情好一点。', '周末先给自己留一点空白。', '这种具体的记录比照片更耐看。', '想把今天想到的几件事写下来。', '有时一杯热水就能让自己缓下来。', '给准备换环境的朋友发过去看看。']
      }
    },
    {
      id: 'computer', seed: 88, title: '剪片也打游戏｜电脑配置先排需求', author: '桌面与小零件', authorInitial: '零', authorTone: '#8994a8',
      category: '数码', cover: 'assets/computer.webp', images: ['assets/computer.webp'],
      body: [
        '这次给自己的桌面列了一张配置取舍清单：平时剪短视频、修照片，周末玩游戏，还会同时开浏览器和聊天软件。没有先追着最高规格选，而是把常用软件、素材大小、屏幕需求和能接受的噪声写在同一张纸上。',
        '最纠结的是32G还是64G内存，以及显卡、电源、散热和机箱要怎样一起选。轻项目和多轨素材的需求不一样；预算有限时也要给硬盘、备份和显示器留位置，不能只把钱堆在一个部件上。',
        '我还没在同样条件下测过每一种组合，不想只靠一次体验就给所有人定答案。买之前会按具体型号核对接口、尺寸、供电和软件要求，也给以后升级留点空间。欢迎聊聊你最常用的场景。本篇为虚构场景。'
      ], tags: ['电脑配置', '视频剪辑', '内存选择', '显卡与电源'], publishedAt: '2026-09-14T15:30:00+08:00', location: '栖禾市 · 家中桌面', likes: 5197, collects: 3284,
      core: [
        C('剪视频选32G还是64G？平时剪短片，浏览器也经常开很多页，怕装完以后才发现不够。', ['computerMemory', 'computerEditing'], '32G还是64G', 'question', { replies: [R('我平时剪的轻项目先用了32G，多轨素材和同时开多个软件时才更想要64G。先看你常做的项目占用，别只按视频时长判断。', ['computerMemory', 'computerEditing'], { isAuthor: true, focus: '先看你常做的项目占用' }), R('我重特效项目那次更接近64G的需求，普通短片却没用到同样多。也要看素材、软件和后台程序。', ['computerMemory', 'computerEditing'], { replyToIndex: 0, kind: 'experience', focus: '重特效项目' })] }),
        C('我平时做轻剪辑加修图，32G先够我安排工作；以后项目变复杂，再按实际占用决定，不把这一例当普遍结论。', ['computerMemory', 'computerEditing'], '轻剪辑加修图', 'experience'),
        C('同时开剪辑、合成和很多页面，我更愿意先留64G的位置。不是说每个人都必须买大内存，只是我的多开习惯比较重。', ['computerMemory', 'computerEditing'], '多开习惯比较重', 'opinion'),
        C('我以前卡顿就怪内存，后来发现素材盘和软件设置也有影响。加到64G不代表任何卡顿都会消失。', ['computerMemory', 'computerStorage', 'computerEditing'], '不代表任何卡顿都会消失', 'experience'),
        C('主板有四个槽，先装两条以后再加两条就行吗？怕买了以后混用不稳。', ['computerMemory', 'computerCompatibility'], '以后再加两条', 'question', { replies: [R('我会先看主板说明和兼容清单，容量、代数、频率和套条组合都要核对；多插两条不等于能维持同样设置。', ['computerMemory', 'computerCompatibility'], { isAuthor: true, focus: '多插两条不等于能维持同样设置' })] }),
        C('显卡和电源怎么搭配？想升级图形性能，又不想买回去才发现接口或功率不合适。', ['computerGpu', 'computerPower'], '显卡和电源怎么搭配', 'question', { replies: [R('先核对具体显卡的供电要求、接口和整机负载，再看电源说明、线材和机箱空间；额定瓦数相同也不能替代这些检查。', ['computerGpu', 'computerPower'], { isAuthor: true, focus: '具体显卡的供电要求、接口和整机负载' }), R('我换显卡时才发现旧电源没有合适的线，最后连电源一起换了。线材要按本机型号核对，别拿别家的线凑。', ['computerGpu', 'computerPower'], { replyToIndex: 0, kind: 'experience', focus: '旧电源没有合适的线' })] }),
        C('我先给显示器和常玩的游戏定目标，再看显卡。只看显存大小，会漏掉实际游戏、分辨率和软件需求。', ['computerGpu', 'computerDisplay'], '先给显示器和常玩的游戏定目标', 'opinion'),
        C('同事主要做图形加速的效果，优先显卡；我更多是长时间导出，会先查软件对CPU和编码器的利用。两张清单不该照抄。', ['computerGpu', 'computerCpu', 'computerEditing'], '两张清单不该照抄', 'opinion'),
        C('电源要留多少余量？只把各部件标出的数字加起来，会不会漏掉负载变化？', ['computerPower'], '电源要留多少余量', 'question', { replies: [R('我会先参考具体部件和电源厂商的说明，再结合整机配置核对。这里没做实测，不能给出对所有机器有效的固定余量。', ['computerPower'], { isAuthor: true, focus: '具体部件和电源厂商的说明' })] }),
        C('旧电源用了很久，外观看着没问题，我也不会只凭能开机就默认适合新显卡。型号、年限、状态和接口都得检查。', ['computerPower', 'computerUpgrade'], '不只凭能开机', 'opinion'),
        C('剪辑软件能用独显加速，是不是CPU就可以随便选便宜的？我主要剪多机位。', ['computerCpu', 'computerEditing'], 'CPU就可以随便选', 'question', { replies: [R('我不会只看有没有独显加速，解码、特效和导出可能用到不同部件。先查你那版软件和素材格式的要求。', ['computerCpu', 'computerEditing'], { isAuthor: true, focus: '素材格式的要求' }), R('我换了一种素材格式后体验就不一样，不能把之前项目的结果直接套过去。', ['computerCpu', 'computerEditing'], { replyToIndex: 0, kind: 'experience' })] }),
        C('我上次剪的项目用代理后更顺，等最终导出再回原素材。比一遇到卡顿就换硬件更适合我目前的预算。', ['computerEditing', 'computerBudget'], '用代理后更顺', 'experience'),
        C('系统盘和素材盘需要分开吗？想留一个硬盘位以后升级。', ['computerStorage', 'computerUpgrade'], '系统盘和素材盘需要分开吗', 'question', { replies: [R('这次把项目文件单独放，整理和备份更方便；是否影响性能要看实际盘和工作负载。先核对插槽及通道分配。', ['computerStorage', 'computerUpgrade'], { isAuthor: true, focus: '插槽及通道分配' })] }),
        C('我以前只顾装大盘，没有留备份，后来丢过一次工程。容量够用也得有第二份，备份不等于在同一块盘再复制一遍。', ['computerStorage', 'computerBackup'], '没有留备份', 'experience'),
        C('小机箱能放大显卡吗？照片里的桌面不大，但不想为了好看牺牲散热。', ['computerCase', 'computerGpu', 'computerCooling'], '小机箱能放大显卡吗', 'question', { replies: [R('要看具体机箱的限长、厚度、线材弯折空间和风道。图片里看着能放，不代表实际装上还能顺利接线。', ['computerCase', 'computerGpu', 'computerCooling'], { isAuthor: true, focus: '线材弯折空间和风道' })] }),
        C('我换了更紧凑的机箱，桌面空出来了，但风扇声也更容易注意到。占地小和安静对我不是自动一起得到的。', ['computerCase', 'computerCooling'], '风扇声也更容易注意到', 'experience'),
        C('卧室用机想尽量安静，风冷还是水冷更合适？不追求灯光。', ['computerCooling'], '想尽量安静', 'question', { replies: [R('我这次用风冷，方便自己维护；另一位朋友的小机箱另选散热。先看热负载、兼容高度和噪声记录，再决定方案。', ['computerCooling'], { kind: 'experience', focus: '热负载、兼容高度和噪声记录' })] }),
        C('我把机箱放桌下后耳边安静些，但不能贴墙挡住进出风，也得留清灰的位置。布局本身也影响使用体验。', ['computerCooling', 'computerCase'], '留清灰的位置', 'experience'),
        C('预算有限，显示器和主机哪个先升级？修图时总觉得颜色和办公室看的不一样。', ['computerBudget', 'computerDisplay'], '显示器和主机哪个先升级', 'question', { replies: [R('先分清卡顿还是显示差异：后者要看显示器、色彩管理和校准条件。我会把屏幕也放进整套预算，不能只升级主机。', ['computerBudget', 'computerDisplay'], { isAuthor: true, focus: '把屏幕也放进整套预算' })] }),
        C('玩游戏和修图都要用，我宁愿少一点灯光，把钱留给能每天看到的屏幕。只是我的排序，不适合所有人。', ['computerBudget', 'computerDisplay'], '只是我的排序', 'opinion'),
        C('旧电脑的硬盘和机箱能复用吗？想一点点换，不想一次重买全部。', ['computerUpgrade', 'computerCompatibility'], '旧电脑的硬盘和机箱能复用吗', 'question', { replies: [R('我复用了数据盘，但先做备份，再核对接口、安装位置和盘的状态。机箱则要重新量新部件空间，别只看外形。', ['computerUpgrade', 'computerCompatibility'], { kind: 'experience', focus: '先做备份' })] }),
        C('装好第一次点不亮，后来发现线没有接好。验机时我会记录部件型号和接法，排查比凭感觉换件有效。', ['computerAssembly'], '记录部件型号和接法', 'experience'),
        C('这套清单能直接装某个开源系统吗？主要剪片的软件和外设驱动有没有人都测试过？', ['computerSystem'], '软件和外设驱动', 'question'),
        C('先把自己每天怎么用写下来，配置讨论才有方向。别人的最高规格很好看，也可能不是自己最需要的那一项。', ['computerBudget'], '每天怎么用', 'opinion')
      ],
      ambient: {
        openings: ['喜欢把桌面日常拍得这么干净。', '小零件摆在一起很有秩序感。', '做清单的过程本身就能想清楚很多事。', '最近也在整理自己的使用习惯。', '这张桌面照片让我想收收线。', '有时候先停下来想一下挺重要。'],
        endings: ['自己经常用到的地方最值得认真看。', '不急着一次性把所有东西换掉。', '照片里的暖光看着很舒服。', '把桌面腾出一点位置会更想坐下来。', '喜欢看到优点之外的那些小麻烦。', '能说明为什么选择，比列一排数字更好读。', '下次也想把过程慢慢记录下来。', '普通的一天也有很多可以分享的细节。', '先留存这一张，周末再整理自己的清单。', '看完想把今天没做完的事写在纸上。', '不需要每一个角落都塞满东西。', '会发给同样爱折腾桌面的朋友。']
      }
    }
  ];

  window.PLZ_DATA = {
    fictional: true,
    notes: notes.map(note => {
      const comments = note.core.map((raw, index) => makeCore(note, raw, index)).concat(makeAmbient(note, note.ambient.openings, note.ambient.endings));
      const { core, ambient, seed, ...publicNote } = note;
      return { ...publicNote, comments };
    })
  };
})();

(function(root){
  'use strict';
  const normalize=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[\u200b-\u200d\ufeff]/g,'').replace(/\s+/g,' ').trim();
  const escapeRegex=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const topicWords={
    pet:['宠物','带狗','小狗','毛孩子','四脚','狗狗','带猫','小动物'],parking:['停车','开车','自驾','车位','车库','停哪'],queue:['排队','等位','人多','拥挤','等多久'],work:['办公','工作','电脑','插座','wifi','wi-fi','网络'],access:['无障碍','洗手间'],wired:['有线','用线','线连','连接线'],budget:['预算','价格','花费','不超过'],foot:['脚背','压脚'],
    height:['身高','小个子','160','厘米'],size:['尺码','选码','多大码','s码','m码','宽脚','裤长','拖地'],fabric:['面料','透','起球','掉色','洗','皱'],math:['数学','学习方法','做题'],function:['函数','导数','单调','图像'],basics:['基础','不会做','做不出','看懂','自己做','跟不上','补起','补救'],
    parents:['爸妈','父母','老人','长辈','带娃','孩子'],stairs:['台阶','爬坡','上坡','路难走','膝盖','轮椅','平路'],distance:['距离','走多久','多远','公里','步行','累','折腾'],rain:['下雨','雨天','湿滑','天气'],
    calls:['通话','开会','会议','麦克风','收音','风噪','电话','听清'],compatibility:['兼容','连接','安卓','电脑','切换','设备'],battery:['续航','电量','充电','几小时','多久没电'],width:['宽度','尺寸','多宽','桌面','90','100'],glare:['反光','眩光','西晒','光线','晒','亮光','屏幕'],setup:['安装','装起来','组装','打孔','墙','承重'],taste:['甜','好吃','口味','咖啡','蛋糕'],environment:['环境','拍照','座位','露台','好看']
  };
  // New scenarios use their own vocabulary so broad words such as “电脑” or “工作”
  // cannot change the intent matching of the original six notes.
  const topicWordsByNote={
    travel:{
      travelRoute:['路线','行程','三天','两夜','安排','景点','观景台','先去哪','绕路'],
      travelStay:['住哪','住宿','酒店','民宿','订房','老城还是','住老城','住车站','车站附近','隔音','睡眠','房间'],
      travelTransit:['交通','公交','接驳','高铁','转车','自驾','租车','打车','怎么走','没车','没有车','单车'],
      travelAccess:['老人','爸妈','轮椅','带孩子','带娃','台阶','电梯','箱子','拖行李'],travelWheelchair:['轮椅'],
      travelWeather:['下雨','雨天','天气','湿滑'],travelCrowd:['人多','排队','拥挤','人少'],
      travelBooking:['预约','取消','退改','退房费','订票'],travelLuggage:['行李寄存','行李存放','寄存','退房后'],
      travelBudget:['预算','花费','省钱','控制花费','多少钱'],travelFood:['吃饭','口味','清淡','餐馆','吃什么']
    },
    benefits:{
      benefitMeal:['餐补','食堂','饭卡','午饭','吃饭补贴','餐食'],benefitTrial:['试用期','转正','新人','刚入职','入职福利'],
      benefitLeave:['年假','调休','补休','休假','请假','事假','假期','有效期'],benefitOvertime:['加班','晚走','赶项目'],
      benefitCommute:['通勤','打车','班车','路线','外地','住得远'],benefitFlex:['弹性','到岗','作息'],
      benefitRemote:['远程','居家办公'],benefitHealth:['体检','家属','保障','生效日期'],benefitCoverage:['补充保障','生效日期'],
      benefitEquipment:['电脑','显示器','设备','配置'],benefitPerks:['下午茶','零食','活动'],
      benefitTraining:['培训','课程','学习预算'],benefitTeam:['团队','部门','氛围','审批','面试','负责人']
    },
    computer:{
      computerMemory:['内存','32g','64g','套条','插槽','多开'],computerEditing:['剪视频','剪辑','剪片','特效','素材','合成','导出','代理','多机位'],
      computerGpu:['显卡','显存','独显','图形加速'],computerPower:['电源','供电','瓦数','线材','余量'],
      computerCpu:['cpu','处理器','编码器','解码'],computerStorage:['硬盘','系统盘','素材盘','数据盘','固态','容量'],
      computerBackup:['备份','工程丢失','丢工程'],computerCase:['机箱','限长','小机箱','占地'],
      computerCooling:['散热','风冷','水冷','风扇','安静','噪声','清灰'],computerDisplay:['显示器','屏幕','分辨率','色彩','颜色','校准'],
      computerBudget:['预算','省钱','多少钱','花费','取舍'],computerUpgrade:['升级','复用','旧电脑','以后再加'],
      computerCompatibility:['兼容','接口','混用','主板','驱动'],computerAssembly:['装机','组装','验机','点不亮','接线'],
      computerSystem:['系统','开源','软件支持']
    }
  };
  const clarifyByNote={
    cafe:[['能不能带宠物','有人带狗去过吗？'],['停车和排队','周末停车方便吗？'],['安静办公','适合带电脑办公吗？']],
    outfit:[['尺码与裤长','身高160cm应该怎么选码？'],['面料体验','面料洗后会不会变形？'],['日常搭配','通勤穿舒服吗？']],
    study:[['补基础','基础薄弱应该从哪里补？'],['独立做题','看懂答案却自己做不出怎么办？'],['函数专题','函数题怎么练？']],
    trail:[['带爸妈','带爸妈走这条路线会不会太累？'],['台阶和坡度','这条路台阶多吗？'],['雨天出行','下雨还能走吗？']],
    earbuds:[['会议通话','N7开会收音怎么样？'],['设备连接','N7连接电脑稳定吗？'],['实际续航','N7一次能用几小时？']],
    home:[['桌面尺寸','90cm宽的书桌够用吗？'],['窗边反光','靠窗会不会反光？'],['安装方式','一个人能安装吗？']],
    travel:[['路线安排','三天两夜的路线怎么安排？'],['住宿选择','住老城还是车站附近？'],['交通选择','不用自驾怎么走？']],
    benefits:[['试用期餐补','试用期有餐补吗？'],['休假与调休','年假和调休怎么区分？'],['工作安排','远程办公怎样申请？']],
    computer:[['剪辑内存','剪视频选32G还是64G？'],['显卡与电源','显卡和电源怎么搭配？'],['安静散热','卧室电脑怎样安排散热？']]
  };
  function flatten(note){
    const docs=[];
    function visit(comment,rootComment,parent){
      docs.push({comment,root:rootComment,rootId:rootComment.id,parentId:comment.replyToId||parent?.id||null,isRoot:comment.id===rootComment.id});
      (comment.replies||[]).forEach(child=>visit(child,rootComment,comment));
    }
    (note.comments||[]).forEach(comment=>visit(comment,comment,null));
    return docs;
  }
  function modelsFor(note,docs){
    const values=new Set(note.models||[]);
    for(const doc of docs){const model=doc.comment.constraints?.model;if(model)(Array.isArray(model)?model:[model]).forEach(value=>values.add(value));}
    if(note.id==='earbuds'){values.add('N7');values.add('N7 Pro');}
    return [...values].map(normalize).filter(Boolean).sort((a,b)=>b.length-a.length);
  }
  function entities(text,models){
    let remaining=normalize(text);const found=[];
    for(const model of models){
      const regex=new RegExp('(?<![a-z0-9])'+escapeRegex(model).replace(/ /g,'\\s+')+'(?![a-z0-9])','g');
      if(regex.test(remaining)){found.push(model);remaining=remaining.replace(regex,' '.repeat(model.length));}
    }
    return found;
  }
  // Metric units can attach to numbers (100cm); ordinary words and model IDs keep their full boundaries.
  const metricUnits=new Set(['mm','cm','m','km']);
  function tokenPattern(token){
    const literal=escapeRegex(token);
    if(/^[+-]?\d+(?:\.\d+)?$/.test(token))return '(?<![a-z0-9.+-])'+literal+'(?![0-9.])';
    if(metricUnits.has(token))return '(?<![a-z])'+literal+'(?![a-z0-9])';
    if(/[a-z]/.test(token)&&/\d/.test(token))return '(?<![a-z0-9])'+literal+'(?![a-z0-9])';
    if(/^[a-z]+(?:[- ][a-z]+)*$/.test(token))return '(?<![a-z0-9])'+literal+'(?![a-z0-9])';
    return literal;
  }
  function matchToken(text,token){
    return new RegExp(tokenPattern(token)).test(text);
  }
  function parseTokens(q){
    if((q.match(/"/g)||[]).length%2||q.includes('""'))return null;
    const tokens=[];const regex=/"([^"]+)"|(\S+)/g;let match;
    while((match=regex.exec(q)))tokens.push(match[1]||match[2]);
    return tokens;
  }
  function highlightRanges(body,tokens,models=[]){
    let normalized='',offset=0;const starts=[],ends=[];
    for(const char of body){
      const value=char.normalize('NFKC').toLowerCase().replace(/[\u200b-\u200d\ufeff]/g,'').replace(/\s/g,' ');
      for(const unit of value){
        if(unit===' '&&normalized.endsWith(' ')){if(ends.length)ends[ends.length-1]=offset+char.length;continue;}
        normalized+=unit;
        for(let i=0;i<unit.length;i++){starts.push(offset);ends.push(offset+char.length);}
      }
      offset+=char.length;
    }
    const ranges=[];
    for(const raw of tokens){
      const token=normalize(raw);if(!token)continue;
      const regex=new RegExp(tokenPattern(token),'g');let match;
      while((match=regex.exec(normalized))){
        const longer=models.find(model=>model!==token&&model.startsWith(token)&&normalized.slice(match.index).startsWith(model));
        if(longer)continue;
        ranges.push([starts[match.index],ends[match.index+match[0].length-1]]);
      }
    }
    ranges.sort((a,b)=>a[0]-b[0]);const merged=[];
    for(const range of ranges){const previous=merged.at(-1);if(previous&&range[0]<=previous[1])previous[1]=Math.max(previous[1],range[1]);else merged.push(range);}
    return merged;
  }
  function keywordMatch(doc,q,models){
    const text=normalize(doc.comment.body);const tokens=parseTokens(q);
    if(!tokens||!tokens.length)return false;
    if(!tokens.every(token=>matchToken(text,token)))return false;
    const requested=entities(q,models),present=entities(text,models);
    return requested.every(model=>present.includes(model));
  }
  function contextOf(doc,byId){
    const chain=[];const seen=new Set();let parent=doc;
    while(parent&&!seen.has(parent.comment.id)){seen.add(parent.comment.id);chain.unshift(parent);parent=byId.get(parent.parentId);}
    if(!chain.some(item=>item.comment.id===doc.rootId))chain.unshift(byId.get(doc.rootId));
    return chain.filter(Boolean);
  }
  function aiMatch(doc,q,topics,models,byId,note){
    const chain=contextOf(doc,byId);
    const text=normalize(chain.map(item=>item.comment.body).join(' '));
    const ownText=normalize(doc.comment.body);
    const wantedModels=entities(q,models);
    const presentModels=entities(text,models);
    if(wantedModels.length&&!wantedModels.every(model=>presentModels.includes(model)))return null;
    const height=note.id==='outfit'||/身高/.test(q)?q.match(/(?:身高\s*)?(1[3-9]\d)\s*(?:cm|厘米)/)||q.match(/(?<!\d)(1[3-9]\d)(?!\d)/):null;
    if(height&&!matchToken(text,height[1])&&!chain.some(item=>String(item.comment.constraints?.height)===height[1]))return null;
    const width=/宽|书桌|桌子|桌面/.test(q)?q.match(/(\d+(?:\.\d+)?)\s*(?:cm|厘米)/):null;
    if(width){
      const known=chain.map(item=>item.comment.constraints?.width).filter(value=>value!=null).map(Number);
      if(known.length?!known.includes(Number(width[1])):!new RegExp('(?<![\\d.])'+escapeRegex(width[1])+'\\s*(?:cm|厘米)(?![a-z])').test(text))return null;
    }
    const age=q.match(/(?<!\d)(\d{1,2})\s*岁/);
    if(age){
      const known=chain.map(item=>item.comment.constraints?.age).filter(value=>value!=null).map(Number);
      if(known.length?!known.includes(Number(age[1])):!new RegExp('(?<!\\d)'+escapeRegex(age[1])+'\\s*岁(?!\\d)').test(text))return null;
    }
    const year=q.match(/(?<!\d)(20\d{2})(?!\d)/);
    if(year&&!matchToken(text,year[1])&&!chain.some(item=>String(item.comment.constraints?.year)===year[1]))return null;
    const budget=q.match(/(?:预算|不超过|最多|上限)\D{0,5}(\d+(?:\.\d+)?)/);
    if(budget){
      const evidence=chain.map(item=>item.comment.constraints?.budget??item.comment.constraints?.price).filter(value=>value!=null).map(Number);
      if(!evidence.length||!evidence.some(value=>value<=Number(budget[1])))return null;
    }
    if(/最近|近期|现在|近三个月/.test(q)){
      const date=Date.parse(doc.comment.publishedAt);
      if(!Number.isFinite(date)||Date.parse('2026-10-11T23:59:59+08:00')-date>90*86400000)return null;
    }
    if(/无麸质|婴儿座椅|充电宝|预约婚礼|行李寄存|儿童游乐区/.test(q)&&!(note.id==='travel'&&/行李寄存/.test(q))&&!ownText.includes(q))return null;
    // Only scoped benefit examples carry evidence about probation. A general meal
    // or leave experience must not silently answer a probation-specific question.
    if(note.id==='benefits'&&/试用期/.test(q)&&!chain.some(item=>(item.comment.topics||[]).includes('benefitTrial'))&&!/试用期/.test(text))return null;
    if(/不用打孔|不打孔|免打孔|无需打孔/.test(q)&&!/不用打孔|不打孔|免打孔|无需打孔|没有打孔/.test(text))return null;
    if(/只看|只找|仅看/.test(q)&&/不能|不让|禁止|不接待/.test(q)&&!/[不没无]|禁止/.test(ownText))return null;
    let ownTopics=doc.comment.topics||[];
    if(doc.comment.kind==='answer'&&ownTopics.length===0)ownTopics=doc.root.topics||[];
    const overlap=topics.filter(topic=>ownTopics.includes(topic));
    const literal=keywordMatch(doc,q,models);
    if(!literal&&!overlap.length)return null;
    const score=(literal?8:0)+overlap.length*3+(doc.comment.kind==='answer'?2:doc.comment.kind==='experience'?1:0);
    return {score,reason:literal?'keyword':'intent',focus:doc.comment.focus||''};
  }
  function search(note,query,mode='ai',options={}){
    if(mode==='semantic')mode='ai';
    const q=normalize(query),docs=flatten(note),models=modelsFor(note,docs),byId=new Map(docs.map(doc=>[doc.comment.id,doc]));
    const base={query,normalizedQuery:q,mode,matchCount:0,discussionCount:0,groups:[],totalVisibleCount:docs.length};
    if(options.simulateError)return {...base,status:'error',matchCount:null,discussionCount:null,message:'搜索暂时不可用，请重试'};
    if(!q)return {...base,status:'idle'};
    if([...q].length>120)return {...base,status:'invalid',message:'请将问题缩短到120个字以内'};
    if(mode==='keyword'&&parseTokens(q)===null)return {...base,status:'invalid',message:'请补全双引号后再搜索'};
    if(mode==='ai'&&/^(这家|这里|这个|这篇|它)?(怎么样|好不好|靠谱吗|适合我吗|好用吗)[？?。!！]*$/.test(q))return {...base,status:'clarify',matchCount:null,discussionCount:null,clarifications:clarifyByNote[note.id]||[],message:'你更想了解哪方面？'};
    let topics=Object.entries(topicWordsByNote[note.id]||topicWords).filter(([,words])=>words.some(word=>q.includes(word))).map(([topic])=>topic);
    // Choose the concrete question over broad use cases: “试用期餐补” is a meal
    // question, “年假和调休” a leave question, and “32G还是64G剪视频” a memory question.
    if(note.id==='benefits'&&topics.includes('benefitMeal'))topics=['benefitMeal'];
    else if(note.id==='benefits'&&topics.includes('benefitLeave'))topics=['benefitLeave'];
    else if(note.id==='benefits'&&topics.includes('benefitCoverage'))topics=['benefitCoverage'];
    if(note.id==='travel'&&topics.includes('travelWheelchair'))topics=['travelWheelchair'];
    if(note.id==='computer'&&topics.includes('computerMemory'))topics=topics.filter(topic=>topic!=='computerEditing');
    // A numeric unit in outfit notes can express height; a bare unit cannot.
    if(note.id==='outfit'&&/(?<![a-z0-9.+-])1[3-9]\d\s*(?:cm|厘米)(?![a-z0-9])/.test(q)&&!topics.includes('height'))topics.push('height');
    if(topics.includes('function')||topics.includes('basics'))topics=topics.filter(topic=>topic!=='math');
    if(topics.includes('wired'))topics=['wired'];
    if(topics.includes('size'))topics=topics.filter(topic=>topic!=='height');
    const matches=[];
    for(const doc of docs){
      const relevance=mode==='keyword'?(keywordMatch(doc,q,models)?{score:1,reason:'keyword',focus:''}:null):aiMatch(doc,q,topics,models,byId,note);
      if(relevance)matches.push({...doc,...relevance});
    }
    if(!matches.length)return {...base,status:'empty'};
    const grouped=new Map();
    for(const match of matches){
      let group=grouped.get(match.rootId);
      if(!group){group={rootId:match.rootId,root:match.root,matches:[],context:[],items:[],score:0};grouped.set(match.rootId,group);}
      group.matches.push(match);group.score=Math.max(group.score,match.score);
    }
    for(const group of grouped.values()){
      const matchedIds=new Set(group.matches.map(item=>item.comment.id));const needed=new Set([group.rootId]);
      for(const match of group.matches)contextOf(match,byId).forEach(item=>needed.add(item.comment.id));
      group.items=docs.filter(doc=>doc.rootId===group.rootId&&needed.has(doc.comment.id)).map(doc=>({...doc,isMatch:matchedIds.has(doc.comment.id),match:group.matches.find(match=>match.comment.id===doc.comment.id)}));
      group.context=group.items.filter(item=>!item.isMatch);
    }
    let groups=[...grouped.values()];
    if(mode==='ai')groups.sort((a,b)=>b.score-a.score||Date.parse(b.root.publishedAt)-Date.parse(a.root.publishedAt));
    const onlyQuestions=matches.some(item=>item.comment.kind==='question')&&!matches.some(item=>['answer','experience'].includes(item.comment.kind));
    return {...base,status:onlyQuestions?'unanswered':'success',matchCount:matches.length,discussionCount:groups.length,groups};
  }
  const api={search,flatten,normalize,keywordMatch,matchToken,entities,contextOf,parseTokens,highlightRanges,modelsFor};
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PLZ_SEARCH=api;
})(typeof window==='undefined'?null:window);

(function(){
  'use strict';
  const notes=window.PLZ_DATA?.notes||[];
  const engine=window.PLZ_SEARCH;
  const appViewport=document.querySelector('.app');
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icon=name=>`<i data-lucide="${name}" aria-hidden="true"></i>`;
  const format=value=>value>=10000?(value/10000).toFixed(1).replace(/\.0$/,'')+'万':value>=1000?(value/1000).toFixed(1)+'千':String(value);
  const memory=new Map();
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const motion=reducedMotion.matches?'instant':'smooth';
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem('plz:'+key))??fallback;}catch{return memory.get(key)??fallback;}};
  const write=(key,value)=>{memory.set(key,value);try{localStorage.setItem('plz:'+key,JSON.stringify(value));}catch{}};
  const hash=value=>Array.from(String(value)).reduce((sum,char)=>sum+char.codePointAt(0),0);
  const avatar=(name,small=false)=>{if(name==='我的小日常')return `<span class="avatar self-avatar ${small?'small':''}" aria-hidden="true"></span>`;const n=hash(name)%12;return `<span class="avatar ${small?'small':''}" style="--avatar-position:${(n%4)*100/3}% ${Math.floor(n/4)*50}%" aria-hidden="true">${esc(name[0])}</span>`;};
  const icons=()=>window.lucide?.createIcons({attrs:{'stroke-width':1.7}});
  let toastTimer,lastFocus;
  function toast(text){const node=document.getElementById('toast');node.textContent=text;node.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.hidden=true,2200);}
  function sheet(title,content,footer=''){
    lastFocus=document.activeElement;
    const container=document.getElementById('sheet-root');
    container.innerHTML=`<div class="sheet-mask" data-dismiss="true"><section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-head">${esc(title)}<button class="sheet-close" aria-label="关闭" data-action="close-sheet">${icon('x')}</button></div>${content}${footer}</section></div>`;
    appViewport.style.overflow='hidden';icons();container.querySelector('textarea,input,button')?.focus();
  }
  function closeSheet(){document.getElementById('sheet-root').innerHTML='';appViewport.style.overflow='';lastFocus?.focus();lastFocus=null;}
  document.addEventListener('keydown',event=>{const container=document.getElementById('sheet-root');if(!container.firstElementChild)return;if(event.key==='Escape'){closeSheet();event.preventDefault();event.stopImmediatePropagation();return;}if(event.key==='Tab'){const targets=[...container.querySelectorAll('button:not(:disabled),input,textarea,a[href]')];const first=targets[0],last=targets.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});
  document.getElementById('sheet-root').addEventListener('click',event=>{if(event.target.dataset.dismiss==='true')closeSheet();});
  const covers={outfit:['160cm','松弛一点也很好看'],study:['看懂答案','自己做却不会？'],trail:['周末慢慢走','给自己一个绿色的下午'],earbuds:['N7 · 三周日常','通话 / 连接 / 续航'],benefits:['公司福利','餐补 / 年假 / 调休'],computer:['装机怎么取舍','内存 / 电源 / 预算']};
  function photo(note,isCover=false){const copy=isCover&&covers[note.id];return `<img src="${esc(note.cover)}" alt="${esc(note.title)}的虚构生活摄影" ${isCover?'loading="lazy"':'fetchpriority="high"'} width="1086" height="1448">${copy?`<div class="cover-copy ${note.id==='study'?'paper':''}">${esc(copy[0])}<small>${esc(copy[1])}</small></div>`:''}`;}
  if(document.body.dataset.page==='home'){
    const saved=read('home',{category:'全部',main:'发现',query:'',scroll:0});
    const state={...saved};
    if(![...document.querySelectorAll('[data-category]')].some(button=>button.dataset.category===state.category))state.category='全部';
    const feed=document.getElementById('feed');
    function renderFeed(){
      let list=notes.filter(note=>state.category==='全部'||note.category===state.category);
      if(state.query){const q=engine.normalize(state.query);list=list.filter(note=>engine.normalize([note.title,...note.body,...note.tags].join(' ')).includes(q));}
      if(state.main==='关注')list=list.filter(note=>read('follow:'+note.author,false));
      if(state.main==='本地')list=list.filter(note=>['生活','出行'].includes(note.category));
      feed.innerHTML=list.length?[0,1].map(column=>`<div class="feed-column">${list.filter((note,index)=>index%2===column).map(note=>{const liked=read('liked:'+note.id,false);return `<article class="note-card" data-note="${esc(note.id)}"><a href="note.html?id=${encodeURIComponent(note.id)}" aria-label="打开笔记：${esc(note.title)}"><div class="card-photo">${photo(note,true)}</div><div class="card-title">${esc(note.title)}</div></a><div class="card-meta"><span class="card-author">${avatar(note.author,true)}<span>${esc(note.author)}</span></span><button class="card-likes" data-card-like="${esc(note.id)}" aria-label="点赞${esc(note.title)}" aria-pressed="${liked}">${icon('heart')}<span>${String(note.likes+(liked?1:0))}</span></button></div></article>`;}).join('')}</div>`).join(''):`<div class="empty-state" style="grid-column:1/-1"><h3>${state.main==='关注'?'还没有关注的创作者':'暂时没有相关笔记'}</h3><p>${state.main==='关注'?'在笔记里关注喜欢的创作者，再回来看看。':'换一个关键词或分类试试。'}</p></div>`;
      document.querySelectorAll('[data-category]').forEach(button=>button.classList.toggle('active',button.dataset.category===state.category));
      document.querySelectorAll('[data-main-tab]').forEach(button=>button.classList.toggle('active',button.dataset.mainTab===state.main));icons();
    }
    document.querySelector('.feed-search input').addEventListener('input',event=>{state.query=event.target.value;renderFeed();write('home',state);});
    document.addEventListener('click',event=>{
      const button=event.target.closest('button');
      if(button?.dataset.category){state.category=button.dataset.category;renderFeed();write('home',state);return;}
      if(button?.dataset.mainTab){state.main=button.dataset.mainTab;renderFeed();write('home',state);return;}
      if(button?.dataset.cardLike){const id=button.dataset.cardLike;write('liked:'+id,!read('liked:'+id,false));renderFeed();return;}
      const card=event.target.closest('.note-card');
      if(card&&!button){state.scroll=appViewport.scrollTop;write('home',state);if(!event.target.closest('a'))location.href='note.html?id='+encodeURIComponent(card.dataset.note);}
      if(button?.dataset.action==='feed-search'){document.querySelector('.feed-search').hidden=false;document.querySelector('.feed-search input').focus();}
      if(button?.dataset.action==='close-feed-search'){document.querySelector('.feed-search').hidden=true;state.query='';document.querySelector('.feed-search input').value='';renderFeed();}
      if(button?.dataset.action==='home-top')appViewport.scrollTo({top:0,behavior:motion});
    });
    document.querySelector('.feed-search input').value=state.query;document.querySelector('.feed-search').hidden=!state.query;
    renderFeed();requestAnimationFrame(()=>appViewport.scrollTo({top:state.scroll||0,behavior:'instant'}));
  }else{
    const id=new URLSearchParams(location.search).get('id')||'cafe';
    const note=notes.find(item=>item.id===id);
    if(!note){document.querySelector('.app').innerHTML='<div class="empty-state"><h3>这篇笔记暂时无法查看</h3><p><a href="index.html">返回首页</a></p></div>';return;}
    document.title=note.title+' · 评里找';
    const localComments=read('comments:'+id,[]);note.comments=[...localComments,...note.comments];
    const localReplies=read('replies:'+id,[]);
    for(const reply of localReplies){const parent=engine.flatten(note).find(doc=>doc.comment.id===reply.replyToId);if(parent&&!parent.root.replies.some(item=>item.id===reply.id))parent.root.replies.push(reply);}
    const previous=read('search:'+id,{query:'',mode:'ai'});
    const state={open:false,query:previous.query||'',mode:previous.mode==='keyword'?'keyword':'ai',phase:'idle',response:null,limit:12,resultLimit:8,expanded:new Set(),fullText:new Set(),allResultReplies:new Set(),beforeSearchY:0,resultY:0,returnSnapshot:null,focused:null,serial:0,errorConsumed:false,photoIndex:0};
    const query=document.getElementById('query');
    const searchBox=document.getElementById('comment-search');
    const searchEntry=document.getElementById('search-entry');
    const inlineCommentEntry=document.getElementById('inline-comment-entry');
    const entryShell=document.getElementById('comment-entry-shell');
    const querySurface=searchBox.querySelector('.query-surface');
    const queryInput=searchBox.querySelector('.query-input');
    const querySubmit=searchBox.querySelector('.query-submit');
    let uiOpen=false,entryTimer,entryToken=0;
    // Keep one row in place; only opening/closing changes the motion state.
    // CSS transitions reverse from their current position when rapidly toggled.
    function syncSearchUI(open){
      searchEntry.setAttribute('aria-expanded',String(open));
      if(uiOpen===open)return;
      uiOpen=open;clearTimeout(entryTimer);const token=++entryToken;
      inlineCommentEntry.hidden=false;searchBox.hidden=false;
      inlineCommentEntry.inert=open;searchBox.inert=!open;
      inlineCommentEntry.setAttribute('aria-hidden',String(open));
      searchBox.setAttribute('aria-hidden',String(!open));
      const inlineStyle=getComputedStyle(inlineCommentEntry);
      const closedHeight=inlineCommentEntry.offsetHeight+parseFloat(inlineStyle.marginTop)+parseFloat(inlineStyle.marginBottom);
      if(!entryShell.style.height)entryShell.style.height=closedHeight+'px';
      const source=searchEntry.getBoundingClientRect(),field=queryInput.getBoundingClientRect();
      const center=source.left+source.width/2;
      entryShell.style.setProperty('--search-origin',(center-field.left-18)+'px');
      entryShell.style.setProperty('--search-icon-shift',(center-field.left-querySubmit.offsetLeft-querySubmit.offsetWidth/2)+'px');
      const duration=open?360:280;
      entryShell.style.setProperty('--search-duration',duration+'ms');
      // Flush the initial collapsed geometry before revealing a previously hidden row.
      void querySurface.offsetWidth;
      entryShell.classList.toggle('search-open',open);
      entryShell.style.height=(open?searchBox.offsetHeight+1:closedHeight)+'px';
      const finish=()=>{if(token!==entryToken)return;inlineCommentEntry.hidden=uiOpen;searchBox.hidden=!uiOpen;};
      if(reducedMotion.matches)finish();else entryTimer=setTimeout(finish,duration+40);
    }
    reducedMotion.addEventListener('change',event=>{if(event.matches){clearTimeout(entryTimer);inlineCommentEntry.hidden=uiOpen;searchBox.hidden=!uiOpen;}});
    const stateNode=document.getElementById('search-state');
    const list=document.getElementById('comment-list');
    document.getElementById('comment-self-avatar').innerHTML=avatar('我的小日常');
    document.getElementById('search-author-avatar').innerHTML=avatar('我的小日常');
    const flat=()=>engine.flatten(note);
    const count=()=>flat().length;
    const date=note.publishedAt.slice(5,10).replace('-','-');
    document.getElementById('note-author').innerHTML=avatar(note.author)+`<span>${esc(note.author)}</span>`;
    const images=note.images?.length?note.images:[note.cover];
    function renderPhoto(){document.getElementById('note-photo').innerHTML=`<button aria-label="放大笔记图片" data-action="zoom-photo"><img src="${esc(images[state.photoIndex])}" alt="${esc(note.title)}的虚构生活摄影" width="1086" height="1448" fetchpriority="high"></button>${images.length>1?`<span class="photo-counter">${state.photoIndex+1}/${images.length}</span><button class="photo-prev" aria-label="上一张图片" data-action="prev-photo" ${state.photoIndex===0?'disabled':''}>${icon('chevron-left')}</button><button class="photo-next" aria-label="下一张图片" data-action="next-photo" ${state.photoIndex===images.length-1?'disabled':''}>${icon('chevron-right')}</button>`:''}`;icons();}
    renderPhoto();
    let photoTouch=null;
    document.getElementById('note-photo').addEventListener('touchstart',event=>{photoTouch=event.touches[0]?[event.touches[0].clientX,event.touches[0].clientY]:null;},{passive:true});
    document.getElementById('note-photo').addEventListener('touchend',event=>{const end=event.changedTouches[0];if(!photoTouch||!end||images.length<2)return;const dx=end.clientX-photoTouch[0],dy=end.clientY-photoTouch[1];photoTouch=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3){state.photoIndex=Math.max(0,Math.min(images.length-1,state.photoIndex+(dx<0?1:-1)));renderPhoto();}},{passive:true});
    document.getElementById('note-body').innerHTML=`<h1>${esc(note.title)}</h1>${note.body.map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}<div class="note-tags">${note.tags.map(tag=>`<span>#${esc(tag)}</span>`).join('')}</div><div class="note-date"><span>${date} · ${esc(note.location)}</span><span>已编辑</span></div>`;
    query.value=state.query;
    function metrics(){document.getElementById('comment-count').textContent='共 '+count()+' 条评论';document.getElementById('bottom-comment-count').textContent=count();document.getElementById('note-likes').textContent=String(note.likes+(read('liked:'+id,false)?1:0));document.getElementById('note-saves').textContent=format(note.collects+(read('saved:'+id,false)?1:0));document.querySelector('[data-action="note-like"]').setAttribute('aria-pressed',String(read('liked:'+id,false)));document.querySelector('[data-action="note-save"]').setAttribute('aria-pressed',String(read('saved:'+id,false)));const follow=document.querySelector('[data-action="follow"]');follow.setAttribute('aria-pressed',String(read('follow:'+note.author,false)));follow.textContent=read('follow:'+note.author,false)?'已关注':'关注';searchEntry.hidden=count()<=100;}
    function markedText(comment,match){
      if(!match)return esc(comment.body);
      let phrases=state.mode==='keyword'||match.reason==='keyword'?(engine.parseTokens(engine.normalize(state.query))||[]):[comment.focus].filter(Boolean);
      const body=comment.body,slices=engine.highlightRanges(body,phrases,engine.modelsFor(note,flat()));
      let cursor=0,output='';for(const [start,end]of slices){output+=esc(body.slice(cursor,start))+'<mark>'+esc(body.slice(start,end))+'</mark>';cursor=end;}return output+esc(body.slice(cursor));
    }
    function row(comment,match,isContext=false){const liked=read('comment-like:'+comment.id,false);const parent=comment.replyToId?flat().find(doc=>doc.comment.id===comment.replyToId):null;const prefix=parent&&!parent.isRoot?`<span class="reply-to">回复 @${esc(parent.comment.author)}：</span>`:'';const long=comment.body.length>100,expanded=state.fullText.has(comment.id);return `<div class="comment-row" data-comment-id="${esc(comment.id)}">${avatar(comment.author)}<div class="comment-main"><div class="comment-name">${esc(comment.author)}${comment.isAuthor||comment.author===note.author?'<span class="author-badge">作者</span>':''}${isContext?'<span class="context-note">上下文</span>':''}</div><div class="comment-text ${long&&!expanded?'text-clamped':''}">${prefix}${markedText(comment,match)}</div>${long?`<button class="expand-text" data-full-text="${esc(comment.id)}">${expanded?'收起':'展开全文'}</button>`:''}<div class="comment-details"><span>${esc(comment.time)}</span><button data-reply="${esc(comment.id)}">回复</button></div></div><button class="comment-like" data-comment-like="${esc(comment.id)}" aria-label="点赞${esc(comment.author)}的评论" aria-pressed="${liked}">${icon('heart')}<span>${comment.likes+(liked?1:0)}</span></button></div>`;}
    function originalThread(rootComment){
      const expanded=state.expanded.has(rootComment.id);
      const replies=rootComment.replies||[];
      const visibleReplies=expanded?replies:replies.slice(0,1);
      const remaining=replies.length-1;
      const toggle=remaining>0?`<button class="expand-replies" data-expand="${esc(rootComment.id)}" aria-expanded="${expanded}">${expanded?'收起回复':'展开 '+remaining+' 条回复'} ${icon(expanded?'chevron-up':'chevron-down')}</button>`:'';
      return `<article class="comment-thread ${state.focused===rootComment.id?'focused-thread':''}" id="thread-${esc(rootComment.id)}">${row(rootComment)}${visibleReplies.length?`<div class="reply-list">${visibleReplies.map(reply=>row(reply)).join('')}</div>`:'<div class="thread-line"></div>'}${toggle}</article>`;
    }
    function resultThread(group){const all=state.allResultReplies.has(group.rootId);const docs=all?flat().filter(doc=>doc.rootId===group.rootId):group.items;const matches=new Map(group.matches.map(match=>[match.comment.id,match]));const rootDoc=docs.find(doc=>doc.isRoot);const replies=docs.filter(doc=>!doc.isRoot);return `<article class="result-card" data-root="${esc(group.rootId)}">${row(rootDoc.comment,matches.get(rootDoc.comment.id),!matches.has(rootDoc.comment.id))}${replies.length?`<div class="reply-list">${replies.map(doc=>row(doc.comment,matches.get(doc.comment.id),!matches.has(doc.comment.id))).join('')}</div>`:''}<div class="result-footer"><button data-original="${esc(group.rootId)}">查看原讨论</button>${all?`<button data-all-replies="${esc(group.rootId)}">收起其他回复</button>`:group.root.replies.length>replies.length?`<button data-all-replies="${esc(group.rootId)}">展开全部 ${group.root.replies.length} 条回复</button>`:''}</div></article>`;}
    function originals(){list.innerHTML=note.comments.slice(0,state.limit).map(originalThread).join('')+(note.comments.length>state.limit?'<button class="more-comments" data-action="more-comments">查看更多评论</button>':'<div class="more-comments">没有更多评论了</div>');}
    function render(){
      syncSearchUI(state.open);
      document.getElementById('comments-section').classList.toggle('search-active',state.open);
      document.querySelector('[data-action="clear-query"]').hidden=!state.query;
      document.querySelector('[data-action="search"]').disabled=!state.query.trim();
      document.querySelectorAll('[data-mode]').forEach(button=>{button.classList.toggle('active',button.dataset.mode===state.mode);button.setAttribute('aria-pressed',String(button.dataset.mode===state.mode));});
      if(!state.open){stateNode.innerHTML=state.returnSnapshot?'<div class="search-meta"><span>已定位原讨论</span><button data-action="return-results">返回搜索结果</button></div>':'';originals();}
      else if(state.phase==='loading'){stateNode.innerHTML='<div class="search-message" role="status">正在查找相关评论…</div>';list.innerHTML='<div class="loading-state">'+Array.from({length:3},()=>'<div class="skeleton-row"><div class="skeleton-avatar"></div><div class="skeleton-lines"><div></div><div></div><div></div></div></div>').join('')+'</div>';}
      else if(state.phase==='idle'){stateNode.innerHTML='';originals();}
      else{
        const result=state.response;
        if(result.status==='error'||result.status==='invalid'){stateNode.innerHTML='';list.innerHTML=`<div class="empty-state"><div class="empty-icon">${icon('circle-alert')}</div><h3>${esc(result.message)}</h3><p>查询内容已保留，可以修改后再试。</p><button class="primary" data-action="retry-search">重试</button><button class="secondary" data-action="exit-search">查看全部评论</button></div>`;}
        else if(result.status==='clarify'){stateNode.innerHTML='';list.innerHTML=`<div class="empty-state"><div class="empty-icon">${icon('messages-square')}</div><h3>你更想了解哪方面？</h3><div class="clarify-options">${result.clarifications.map(([label,q])=>`<button data-hint="${esc(q)}">${esc(label)}</button>`).join('')}</div><button class="secondary" data-action="exit-search">查看全部评论</button></div>`;}
        else{
          stateNode.innerHTML=`<div class="search-meta"><span>找到 <b class="count-number">${result.discussionCount}</b> 组讨论 · <b class="count-number">${result.matchCount}</b> 条${state.mode==='keyword'?'命中':'相关'}评论</span><button data-action="exit-search">查看全部评论</button></div>${result.status==='unanswered'?'<div class="search-message">找到相关提问，暂未发现明确回答。</div>':''}`;
          if(result.status==='empty')list.innerHTML=`<div class="empty-state"><div class="empty-icon">${icon('message-circle')}</div><h3>${state.mode==='keyword'?'没有找到包含这些关键词的评论':'暂未找到相关评论'}</h3><p>换个说法试试，或在评论区问问。</p><button class="primary" data-action="ask-query">编辑并发出问题</button>${state.mode==='keyword'?'<button class="secondary" data-mode="ai">试试相关评论</button>':''}</div>`;
          else list.innerHTML=result.groups.slice(0,state.resultLimit).map(resultThread).join('')+(result.groups.length>state.resultLimit?'<button class="more-comments" data-action="more-results">查看更多相关讨论</button>':'<div class="more-comments">以上为本篇笔记的匹配讨论</div>')+(result.status==='unanswered'?'<div class="empty-state" style="padding-top:12px"><button class="primary" data-action="ask-query">编辑并发出问题</button></div>':'');
        }
      }
      metrics();icons();
    }
    function search(){
      state.query=query.value.trim();if(!state.query)return;
      if(document.activeElement===query)query.blur();
      state.open=true;state.phase='loading';state.returnSnapshot=null;state.resultLimit=8;const serial=++state.serial;
      const submittedQuery=state.query,submittedMode=state.mode;render();
      setTimeout(()=>{
        if(serial!==state.serial||!state.open)return;
        const demoError=new URLSearchParams(location.search).get('demo')==='error'&&!state.errorConsumed&&submittedMode==='ai';
        state.errorConsumed=state.errorConsumed||demoError;
        state.response=engine.search(note,submittedQuery,submittedMode,{simulateError:demoError});state.phase=state.response.status;
        write('search:'+id,{query:submittedQuery,mode:submittedMode});render();document.getElementById('comments-section').scrollIntoView({block:'start',behavior:motion});
      },submittedMode==='ai'?320:100);
    }
    function exitSearch(){state.serial++;state.open=false;state.phase='idle';state.response=null;state.returnSnapshot=null;state.focused=null;render();searchEntry.focus({preventScroll:true});appViewport.scrollTo({top:state.beforeSearchY,behavior:motion});}
    function compose(text='',replyId=null){
      sheet(replyId?'回复评论':'说点什么',`<textarea id="draft" aria-label="编辑评论" maxlength="300" placeholder="分享你的想法…">${esc(text)}</textarea>`,`<div class="sheet-submit"><span>内容只保存在本原型中</span><button class="primary" id="publish-comment">发布</button></div>`);
      const draft=document.getElementById('draft'),publish=document.getElementById('publish-comment');publish.disabled=!draft.value.trim();draft.focus();draft.addEventListener('input',()=>publish.disabled=!draft.value.trim());
      publish.addEventListener('click',()=>{
        const body=draft.value.trim();if(!body)return;const comment={id:id+'-local-'+Date.now(),author:'我的小日常',avatar:'我',body,time:'刚刚',publishedAt:'2026-10-11T18:00:00+08:00',likes:0,replies:[],topics:[],focus:'',kind:body.includes('？')||body.includes('?')?'question':'opinion',constraints:{}};
        if(replyId){const doc=flat().find(item=>item.comment.id===replyId);if(doc){comment.replyToId=replyId;comment.replyToAuthor=doc.comment.author;doc.root.replies.push(comment);localReplies.push(comment);write('replies:'+id,localReplies);state.expanded.add(doc.rootId);}}
        else{note.comments.unshift(comment);localComments.unshift(comment);write('comments:'+id,localComments);}
        closeSheet();state.serial++;state.open=false;state.phase='idle';state.response=null;state.returnSnapshot=null;state.focused=replyId?flat().find(item=>item.comment.id===replyId)?.rootId:comment.id;render();toast('已添加到原型评论区');document.getElementById('thread-'+state.focused)?.scrollIntoView({behavior:motion,block:'center'});
      });
    }
    query.addEventListener('input',()=>{state.query=query.value;state.serial++;state.phase='idle';state.response=null;render();});
    query.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();search();}});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&state.open){event.preventDefault();exitSearch();}});
    document.addEventListener('click',event=>{
      const button=event.target.closest('button,a');if(!button)return;
      if(button.dataset.mode){state.mode=button.dataset.mode;if(state.phase!=='idle'&&state.query)search();else render();return;}
      if(button.dataset.hint){state.query=button.dataset.hint;query.value=state.query;search();return;}
      if(button.dataset.expand){state.expanded.has(button.dataset.expand)?state.expanded.delete(button.dataset.expand):state.expanded.add(button.dataset.expand);render();return;}
      if(button.dataset.fullText){state.fullText.has(button.dataset.fullText)?state.fullText.delete(button.dataset.fullText):state.fullText.add(button.dataset.fullText);render();return;}
      if(button.dataset.allReplies){state.allResultReplies.has(button.dataset.allReplies)?state.allResultReplies.delete(button.dataset.allReplies):state.allResultReplies.add(button.dataset.allReplies);render();return;}
      if(button.dataset.commentLike){const key='comment-like:'+button.dataset.commentLike;write(key,!read(key,false));render();return;}
      if(button.dataset.reply){const doc=flat().find(item=>item.comment.id===button.dataset.reply);compose(doc?'回复 @'+doc.comment.author+'：':'',button.dataset.reply);return;}
      if(button.dataset.original){const rootId=button.dataset.original;state.returnSnapshot={response:state.response,query:state.query,mode:state.mode,phase:state.phase,resultLimit:state.resultLimit,scroll:appViewport.scrollTop};state.open=false;state.focused=rootId;state.expanded.add(rootId);state.limit=Math.max(state.limit,note.comments.findIndex(comment=>comment.id===rootId)+1);render();document.getElementById('thread-'+rootId)?.scrollIntoView({behavior:motion,block:'start'});return;}
      switch(button.dataset.action){
        case 'open-search':if(state.open){exitSearch();}else{state.beforeSearchY=appViewport.scrollTop;state.open=true;state.phase='idle';state.returnSnapshot=null;render();query.focus({preventScroll:true});appViewport.scrollTo({top:state.beforeSearchY,behavior:'instant'});}break;
        case 'search':case 'retry-search':search();break;
        case 'voice-search':toast('语音输入为原型展示，请输入文字搜索');break;
        case 'clear-query':state.serial++;state.query='';query.value='';state.phase='idle';state.response=null;render();query.focus({preventScroll:true});break;
        case 'exit-search':exitSearch();break;
        case 'return-results':{const snapshot=state.returnSnapshot;if(!snapshot)break;Object.assign(state,snapshot,{open:true,returnSnapshot:null,focused:null});query.value=state.query;render();appViewport.scrollTo({top:snapshot.scroll,behavior:motion});break;}
        case 'more-comments':state.limit+=12;render();break;
        case 'more-results':state.resultLimit+=8;render();break;
        case 'compose':compose();break;
        case 'ask-query':compose(state.query);break;
        case 'follow':write('follow:'+note.author,!read('follow:'+note.author,false));metrics();break;
        case 'note-like':write('liked:'+id,!read('liked:'+id,false));metrics();break;
        case 'note-save':write('saved:'+id,!read('saved:'+id,false));metrics();toast(read('saved:'+id,false)?'已收藏':'已取消收藏');break;
        case 'jump-comments':document.getElementById('comments-section').scrollIntoView({behavior:motion,block:'start'});break;
        case 'share':if(navigator.clipboard)navigator.clipboard.writeText(location.href).then(()=>toast('已复制原型笔记链接')).catch(()=>toast('可以复制浏览器地址分享原型'));else toast('可以复制浏览器地址分享原型');break;
        case 'prev-photo':case 'next-photo':state.photoIndex=Math.max(0,Math.min(images.length-1,state.photoIndex+(button.dataset.action==='next-photo'?1:-1)));renderPhoto();break;
        case 'zoom-photo':lastFocus=document.activeElement;document.getElementById('sheet-root').innerHTML=`<div class="sheet-mask image-viewer" data-dismiss="true" role="dialog" aria-modal="true" aria-label="查看大图"><button class="sheet-close" data-action="close-sheet" aria-label="关闭大图">${icon('x')}</button><img src="${esc(images[state.photoIndex])}" alt="${esc(note.title)}"></div>`;appViewport.style.overflow='hidden';icons();document.querySelector('.image-viewer button')?.focus();break;
        case 'back-home':write('search:'+id,{query:state.query,mode:state.mode});break;
      }
    });
    render();
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.action==='close-sheet')closeSheet();
    if(button.dataset.action==='about')sheet('评里找', '<p>笔记、评论和封面均为虚构演示内容，自己的头像使用提供的图片。你可以从首页打开不同场景的笔记，在评论区输入关键词，或用一句话寻找相关讨论。</p><p>相关评论使用演示检索；所有点赞、收藏和发布只影响本原型。</p>','<button class="secondary" data-action="reset-demo">重置原型体验</button>');
    if(button.dataset.action==='reset-demo')sheet('重置原型体验','<p>清空这个原型里的点赞、收藏、关注、搜索记录和本地评论，恢复初始内容。</p>','<button class="primary" data-action="confirm-reset">确认重置</button>');
    if(button.dataset.action==='confirm-reset'){memory.clear();try{for(const key of Object.keys(localStorage)){if(key.startsWith('plz:'))localStorage.removeItem(key);}}catch{}location.href='index.html';}
    if(button.dataset.action==='unavailable')toast('本原型展示首页和笔记详情');
  });
  icons();
})();

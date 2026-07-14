/* ===== T1 re-render ===== */
(function(){
  const tree=$('rrTree'),status=$('rrStatus');if(!tree)return;
  const nodes=[{n:'App(父)',k:'parent'},{n:'Sidebar(兄弟)',k:'sib'},{n:'Child',k:'child'},{n:'GrandChild',k:'gc'}];
  function draw(active){
    tree.innerHTML=nodes.map(nd=>{
      const on=active.includes(nd.k);
      return `<div style="margin-left:${nd.k==='child'?22:nd.k==='gc'?44:nd.k==='sib'?22:0}px;border:1px solid ${on?'#ff7b9c':'var(--line)'};background:${on?'rgba(255,123,156,.16)':'var(--panel2)'};border-radius:8px;padding:7px 12px;margin-top:5px;font-family:var(--mono);font-size:12.5px;transition:.25s;color:${on?'var(--render)':'var(--txt2)'}">${nd.n} ${on?'🔴 重渲染':''}</div>`;
    }).join('');
  }
  draw([]);
  $('rrReset').onclick=()=>{$('rrMemo').checked=false;draw([]);status.textContent='从按钮①开始。每次点击后，红色节点表示这次执行了组件函数。';};
  $('rrState').onclick=()=>{draw(['child','gc']);status.innerHTML='<b>结果：</b>更新来自 Child 自己，Child 和 GrandChild 重新渲染；App 与 Sidebar 不受影响。<code>React.memo</code> 不能拦截组件自身的 state 更新。';};
  $('rrProps').onclick=()=>{draw(['parent','sib','child','gc']);status.innerHTML='<b>结果：</b>App 先重新渲染并传入新的 props，因此它的子组件都会执行。Child 的 props 已变化，即使启用 <code>React.memo</code> 也不能跳过。';};
  $('rrParent').onclick=()=>{const memo=$('rrMemo').checked;
    if(memo){draw(['parent','sib']);status.innerHTML='<b>启用 memo 后：</b>Child 的 props 没变，React 跳过 Child 和 GrandChild；Sidebar 没有使用 memo，所以仍随 App 重新渲染。';}
    else{draw(['parent','sib','child','gc']);status.innerHTML='<b>未启用 memo：</b>App 更新时，其子组件默认都会重新渲染，即使 Child 的 props 没变。现在勾选 <code>React.memo</code>，再点一次按钮③进行对比。';}};
  $('rrMemo').onchange=()=>{draw([]);status.innerHTML=$('rrMemo').checked?'已为 Child 启用 <code>React.memo</code>。请再次点击按钮③，与未启用时的结果对比。':'已关闭 <code>React.memo</code>。请点击按钮③观察默认行为。';};
})();

/* ===== T3 useLayoutEffect vs useEffect flicker ===== */
(function(){
  const box=$('lcBox'),status=$('lcStatus');if(!box)return;
  let busy=false,timers=[];
  function clearAll(){timers.forEach(clearTimeout);timers=[];}
  function reset(){clearAll();busy=false;box.style.transition='none';box.style.left='8%';status.textContent='请先点击①。重点观察：Tooltip 是否在 A 短暂停留后才移动到 B。';}
  reset();$('lcReset').onclick=reset;
  function T(fn,ms){const id=setTimeout(fn,ms);timers.push(id);}

  $('lcEffect').onclick=()=>{
    if(busy)return;busy=true;clearAll();
    box.style.transition='none';box.style.left='8%';         // render:放在 A
    status.innerHTML='<b>Render：</b>Tooltip 的初始位置是 A。';
    T(()=>{status.innerHTML='<b>浏览器绘制：</b>用户先看到 Tooltip 位于 A。';},500);
    T(()=>{ box.style.transition='left .25s ease';box.style.left='calc(90% - 60px)'; // useEffect 移到 B
      status.innerHTML='<b>useEffect：</b>绘制后才移动到 B，因此用户看到了从 A 到 B 的位置变化。';},1300);
    T(()=>{busy=false;},1700);
  };

  $('lcLayout').onclick=()=>{
    if(busy)return;busy=true;clearAll();
    box.style.transition='none';box.style.left='8%';          // render 概念上在 A
    status.innerHTML='<b>Render：</b>Tooltip 的初始位置仍是 A，但浏览器还没有绘制。';
    T(()=>{ box.style.transition='none';box.style.left='calc(90% - 60px)'; // 绘制前就到 B,无中间帧
      status.innerHTML='<b>useLayoutEffect：</b>在绘制前把 Tooltip 移到 B。';},250);
    T(()=>{status.innerHTML='<b>浏览器绘制：</b>第一次显示时 Tooltip 已在 B，用户看不到位置 A。';},700);
    T(()=>{busy=false;},1100);
  };
})();


/* ===== T5 double buffer (relationship-focused) ===== */
(function(){
  const svg=$('dblbuf'),status=$('swapStatus');if(!svg)return;
  // nodes in DFS order: Root, B, D, C
  const nodes=[
    {id:'Root',depth:0,y:70,parent:-1},
    {id:'B',   depth:1,y:120,parent:0},
    {id:'D',   depth:2,y:170,parent:1},
    {id:'C',   depth:1,y:220,parent:0},
  ];
  const LX=d=>70+d*52, RX=d=>478+d*52, W=88,H=30;
  let built=0, switched=false, activeIdx=-1, auto=null;
  function box(x,y,label,stroke,txt,pulse,placeholder){
    const dash=placeholder?'stroke-dasharray="4 4"':'';const op=placeholder?0.55:1;
    let s=`<rect x="${x-W/2}" y="${y-H/2}" width="${W}" height="${H}" rx="8" fill="${cssVar('--panel')}" stroke="${stroke}" stroke-width="${pulse?3:2}" ${dash} opacity="${op}"/>`;
    if(label)s+=`<text x="${x}" y="${y+4}" text-anchor="middle" fill="${txt}" font-size="12" font-family="monospace">${label}</text>`;
    return s;
  }
  function draw(){
    const A=cssVar('--accent'),F=cssVar('--fiber'),G=cssVar('--sched'),L=cssVar('--line'),D=cssVar('--dim'),T=cssVar('--txt');
    const leftColor=switched?D:A, rightColor=switched?A:F;
    let s='';
    // titles + underline under current
    s+=`<text x="${LX(0)+52}" y="26" text-anchor="middle" fill="${leftColor}" font-size="13" font-weight="700" font-family="monospace">${switched?'旧树（下次 WIP 画布）':'current 树'}</text>`;
    s+=`<text x="${RX(0)+52}" y="26" text-anchor="middle" fill="${rightColor}" font-size="13" font-weight="700" font-family="monospace">${switched?'current 树（新）':'workInProgress 树'}</text>`;
    const curCx=(switched?RX(0):LX(0))+52;
    s+=`<line x1="${curCx-78}" y1="33" x2="${curCx+78}" y2="33" stroke="${G}" stroke-width="2.5"/>`;
    s+=`<text x="${curCx}" y="46" text-anchor="middle" fill="${G}" font-size="10" font-family="monospace">▲ fiberRoot.current 指向这棵</text>`;
    // left edges
    nodes.forEach(n=>{if(n.parent<0)return;const p=nodes[n.parent];s+=`<path d="M${LX(p.depth)},${p.y+H/2} V${n.y} H${LX(n.depth)-W/2}" fill="none" stroke="${L}" stroke-width="1.5"/>`;});
    // right edges (only among built)
    nodes.forEach((n,i)=>{if(n.parent<0)return;if(!(i<built&&n.parent<built))return;const p=nodes[n.parent];s+=`<path d="M${RX(p.depth)},${p.y+H/2} V${n.y} H${RX(n.depth)-W/2}" fill="none" stroke="${switched?L:F}" stroke-width="1.5" opacity="${switched?0.5:0.85}"/>`;});
    // alternate links (built pairs)
    nodes.forEach((n,i)=>{if(!(i<built))return;const lx=LX(n.depth),rx=RX(n.depth),act=activeIdx===i;
      s+=`<line x1="${lx+W/2+2}" y1="${n.y}" x2="${rx-W/2-2}" y2="${n.y}" stroke="${G}" stroke-width="${act?2.6:1.3}" stroke-dasharray="5 4" opacity="${act?1:0.5}"/>`;
      if(act)s+=`<text x="${(lx+rx)/2}" y="${n.y-6}" text-anchor="middle" fill="${G}" font-size="9.5" font-family="monospace">alternate 互指</text>`;});
    // left nodes (always)
    nodes.forEach(n=>{s+=box(LX(n.depth),n.y,n.id,leftColor,T,false,false);});
    // right nodes
    nodes.forEach((n,i)=>{const x=RX(n.depth);if(i<built){s+=box(x,n.y,n.id+"′",rightColor,T,activeIdx===i,false);}else{s+=box(x,n.y,'',cssVar('--dim'),cssVar('--dim'),false,true);}});
    svg.innerHTML=s;
  }
  draw();redraws.push(draw);
  function stopAuto(){if(auto){clearInterval(auto);auto=null;$('swapAuto').textContent='▶ 自动播放';}}
  function next(){
    if(built<nodes.length){activeIdx=built;built++;const n=nodes[activeIdx];
      status.innerHTML=`以 current 的 <b>${n.id}</b> 为蓝本,克隆/复用出 WIP 的 <b>${n.id}′</b>,两者 <b style="color:var(--sched)">alternate 互指</b>(第 ${built}/${nodes.length} 个,深度优先)。`;
      return true;}
    if(!switched){switched=true;activeIdx=-1;draw();
      status.innerHTML='✅ WIP 构建完成 → <b>切换 fiberRoot.current 指向 WIP</b>。WIP 瞬间变成新 current(一次指针切换 = 整屏更新);原 current 退居「旧树」,留作下次更新的 WIP 画布,节点可复用。';
      return false;}
    return false;
  }
  $('swapStep').onclick=()=>{if(!next()&&switched)stopAuto();draw();};
  $('swapAuto').onclick=function(){if(auto){stopAuto();return;}this.textContent='⏸ 暂停';auto=setInterval(()=>{const cont=next();draw();if(!cont&&switched){stopAuto();}},1100);};
  $('swapReset').onclick=()=>{stopAuto();built=0;switched=false;activeIdx=-1;draw();status.textContent='初始:current 树(蓝)在屏幕上,fiberRoot.current 指向它;WIP 尚未构建。点「下一步」。';};
})();

/* ===== T6 key diff ===== */
(function(){
  const box=$('keyDemo'),status=$('keyStatus');if(!box)return;
  let items=[{id:'A',color:'#61dafb'},{id:'B',color:'#7ee787'},{id:'C',color:'#f2b84b'}];
  function draw(flash){
    box.innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap">'+items.map((it,i)=>`<div style="border:1px solid ${it.color};border-radius:8px;padding:8px 10px;min-width:120px;transition:.3s;${flash&&flash.includes(i)?'box-shadow:0 0 12px '+it.color:''}">
      <div style="font-family:monospace;font-size:12px;color:var(--dim)">key=${document.querySelector('input[name=keymode]:checked').value==='index'?i:it.id}</div>
      <div style="font-family:monospace;font-size:13px;color:var(--txt)">内容 ${it.id}</div>
      <div style="height:8px;border-radius:4px;background:${it.color};margin-top:6px" title="该项的 DOM/state 状态色"></div></div>`).join('')+'</div>';
  }
  draw();
  $('keyReset').onclick=()=>{items=[{id:'A',color:'#61dafb'},{id:'B',color:'#7ee787'},{id:'C',color:'#f2b84b'}];draw();status.textContent='每项有一个状态色。头部插入后看状态是否错位。';};
  $('keyInsert').onclick=()=>{
    const mode=document.querySelector('input[name=keymode]:checked').value;
    const nw={id:'NEW',color:'#ff7b9c'};items.unshift(nw);
    draw([0]);
    if(mode==='index'){status.innerHTML='⚠️ <b style="color:var(--warn)">index key</b>:新项插到头部,所有旧项 index 后移一位 → React 认为 key=0 还是"第一项",把新内容套在了旧 A 的 DOM/state 上,<b>状态色与内容错位</b>。真实场景里输入框内容会串位。';}
    else{status.innerHTML='✅ <b style="color:var(--recon)">稳定 id key</b>:A/B/C 的 key 不变,React 正确识别它们只是被下移,<b>复用原 DOM/state</b>,只新建 NEW。状态不错位。';}
  };
})();

/* ===== T6 lastPlacedIndex tracker ===== */
(function(){
  const oldEl=$('dtOld'),newEl=$('dtNew'),status=$('dtStatus');if(!oldEl)return;
  const OLD=['A','B','C','D'];
  let newArr=['D','A','B','C'],step=0,auto=null;
  const oldIdx=l=>{const i=OLD.indexOf(l);return i<0?null:i;};
  function compute(upto){let lp=0;const res=[];for(let i=0;i<upto;i++){const l=newArr[i],oi=oldIdx(l);let v;if(oi===null){v='new';}else if(oi<lp){v='move';}else{v='keep';lp=oi;}res.push({label:l,oldIndex:oi,verdict:v});}return {res,lp};}
  function draw(){
    const {res,lp}=compute(step);
    const dels=OLD.filter(l=>!newArr.includes(l));
    oldEl.innerHTML='<div style="font-size:12px;color:var(--dim);margin-bottom:4px">旧列表:</div><div style="display:flex;gap:8px;flex-wrap:wrap">'+OLD.map((l,i)=>{const del=dels.includes(l);return `<div style="border:1px solid ${del?'var(--warn)':'var(--line)'};background:${del?'rgba(255,107,107,.12)':'var(--panel2)'};border-radius:8px;padding:6px 12px;font-family:var(--mono);font-size:12px"><b>${l}</b> <span style="color:var(--dim)">idx=${i}</span>${del?' <span style="color:var(--warn)">删</span>':''}</div>`;}).join('')+'</div>';
    const badge={keep:['✓ 不动','var(--recon)'],move:['↔ 移动','var(--sched)'],'new':['+ 新建','var(--accent)']};
    newEl.innerHTML=`<div style="font-size:12px;color:var(--dim);margin:10px 0 4px">新列表(lastPlacedIndex = <b style="color:var(--fiber)">${lp}</b>):</div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:stretch">`+newArr.map((l,i)=>{const done=i<step;if(!done)return `<div style="border:1px dashed var(--line);border-radius:8px;padding:6px 12px;font-family:var(--mono);font-size:12px;opacity:.45"><b>${l}</b></div>`;const c=res[i];const[txt,col]=badge[c.verdict];const oi=c.oldIndex===null?'新增':('旧idx='+c.oldIndex);return `<div style="border:2px solid ${col};border-radius:8px;padding:6px 10px;font-family:var(--mono);font-size:12px;text-align:center"><b>${l}</b> <span style="color:var(--dim);font-size:10px">${oi}</span><br><span style="color:${col};font-weight:700">${txt}</span></div>`;}).join('')+'</div>';
  }
  function reset(v){if(v)newArr=v.split(',');step=0;if(auto){clearInterval(auto);auto=null;$('dtAuto').textContent='▶ 自动';}draw();status.textContent='新顺序 ['+newArr.join(',')+']。点「下一步」逐个执行 placeChild。';}
  function next(){if(step>=newArr.length)return false;step++;const {res,lp}=compute(step);const c=res[step-1];const expl={keep:`旧idx=${c.oldIndex} ≥ 基准线 → 不用动,基准线抬到 ${lp}`,move:`旧idx=${c.oldIndex} &lt; 基准线 ${lp} → 原来靠左现在靠右,标记「移动」`,'new':'旧列表里没有它 → 新建(Placement)'};status.innerHTML=`处理 <b>${c.label}</b>:${expl[c.verdict]}`;draw();if(step>=newArr.length){const mv=res.filter(r=>r.verdict==='move').length,nw=res.filter(r=>r.verdict==='new').length,dl=OLD.filter(l=>!newArr.includes(l)).length;status.innerHTML+=` &nbsp;<b>✅ 合计:${mv} 移动 · ${nw} 新建 · ${dl} 删除</b>`;return false;}return true;}
  document.querySelectorAll('[data-dt]').forEach(b=>b.onclick=()=>reset(b.dataset.dt));
  $('dtStep').onclick=()=>next();
  $('dtAuto').onclick=function(){if(auto){clearInterval(auto);auto=null;this.textContent='▶ 自动';return;}this.textContent='⏸ 暂停';const self=this;auto=setInterval(()=>{if(!next()){clearInterval(auto);auto=null;self.textContent='▶ 自动';}},1050);};
  $('dtReset').onclick=()=>reset();
  reset();
})();

/* ===== T7 hooks list ===== */
(function(){
  const box=$('hooksDemo'),status=$('hooksStatus');if(!box)return;
  let mode='ok';
  function draw(){
    const F=cssVar('--fiber'),R=cssVar('--render'),G=cssVar('--recon'),W=cssVar('--warn'),P=cssVar('--panel'),T=cssVar('--txt'),D=cssVar('--dim');
    const slots=[{t:'useState',v:'count = 0',c:F},{t:'useState',v:'name = "Zoey"',c:F},{t:'useEffect',v:'副作用 fn',c:R}];
    const callsOk=[{t:'useState',l:'useState(count)',c:F},{t:'useState',l:'useState(name)',c:F},{t:'useEffect',l:'useEffect(…)',c:R}];
    const callsBad=[{t:'useState',l:'useState(count)',c:F},{t:'useEffect',l:'useEffect(…)',c:R}];
    const calls=mode==='bad'?callsBad:callsOk;
    const rows=[72,137,202],LX=150,RX=560,BW=210,BH=46;
    let s='';
    s+=`<text x="${LX}" y="24" text-anchor="middle" fill="${T}" font-size="12" font-weight="700" font-family="monospace">本次渲染:你调用的 Hook（按顺序）</text>`;
    s+=`<text x="${RX}" y="24" text-anchor="middle" fill="${T}" font-size="12" font-weight="700" font-family="monospace">Fiber:上次存好的 hook 槽位</text>`;
    slots.forEach((sl,i)=>{const y=rows[i];const matched=i<calls.length;const st=matched?sl.c:D;const op=matched?1:.5;
      s+=`<rect x="${RX-BW/2}" y="${y-BH/2}" width="${BW}" height="${BH}" rx="9" fill="${P}" stroke="${st}" stroke-width="2" opacity="${op}"/>`;
      s+=`<text x="${RX-BW/2+12}" y="${y-5}" fill="${sl.c}" font-size="11.5" font-family="monospace" opacity="${op}">槽${i+1} · ${sl.t}</text>`;
      s+=`<text x="${RX-BW/2+12}" y="${y+13}" fill="${D}" font-size="10.5" font-family="monospace" opacity="${op}">存:${sl.v}</text>`;});
    calls.forEach((cl,i)=>{const y=rows[i];
      s+=`<rect x="${LX-BW/2}" y="${y-BH/2}" width="${BW}" height="${BH}" rx="9" fill="${P}" stroke="${cl.c}" stroke-width="2"/>`;
      s+=`<text x="${LX}" y="${y-5}" text-anchor="middle" fill="${cl.c}" font-size="11.5" font-family="monospace">第 ${i+1} 个调用</text>`;
      s+=`<text x="${LX}" y="${y+13}" text-anchor="middle" fill="${D}" font-size="10.5" font-family="monospace">${cl.l}</text>`;});
    if(mode==='bad')s+=`<text x="${LX}" y="${rows[1]+40}" text-anchor="middle" fill="${W}" font-size="10" font-family="monospace">✂ if 跳过了 useState(name) — 少调一个</text>`;
    calls.forEach((cl,i)=>{const y=rows[i];const sl=slots[i];const ok=cl.t===sl.t;const col=ok?G:W;
      s+=`<line x1="${LX+BW/2}" y1="${y}" x2="${RX-BW/2}" y2="${y}" stroke="${col}" stroke-width="2.5" ${ok?'':'stroke-dasharray="6 3"'}/>`;
      s+=`<text x="355" y="${y-8}" text-anchor="middle" fill="${col}" font-size="11" font-family="monospace">${ok?'✓ 对上':'✗ 错位!'}</text>`;
      if(!ok)s+=`<text x="355" y="${y+15}" text-anchor="middle" fill="${W}" font-size="8.5" font-family="monospace">useEffect 拿到 name 的 state</text>`;});
    if(mode==='bad'){const y=rows[2];s+=`<text x="355" y="${y-4}" text-anchor="middle" fill="${D}" font-size="9.5" font-family="monospace">槽3 无人认领</text>`;s+=`<text x="355" y="${y+10}" text-anchor="middle" fill="${W}" font-size="9.5" font-family="monospace">→ React 报错</text>`;}
    box.innerHTML=`<svg viewBox="0 0 720 250" style="width:100%;height:auto">${s}</svg>`;
  }
  draw();redraws.push(draw);
  $('hooksReset').onclick=()=>{mode='ok';draw();status.textContent='React 按「第几个」把你的调用连到对应槽位。切换下面两种情况对比。';};
  $('hooksOk').onclick=()=>{mode='ok';draw();status.innerHTML='✅ 顺序一致:第1个↔槽1(count)、第2个↔槽2(name)、第3个↔槽3(effect),类型全对得上。';};
  $('hooksBad').onclick=()=>{mode='bad';draw();status.innerHTML='⚠️ 跳过第 2 个 useState 后:第 2 个调用变成 useEffect,却被连到 <b>槽2(name 的 state)</b> → <b style="color:var(--warn)">类型错位、值张冠李戴</b>,槽3 无人认领。这就是 Hooks 不能条件调用的底层原因——它<b>只认位置,不认名字</b>。';};
})();

/* ===== T8 traverse ===== */
(function(){
  const svg=$('traverse'),status=$('travStatus');if(!svg)return;
  const nodes=[{id:0,label:'HostRoot',x:300,y:30},{id:1,label:'App',x:300,y:95},{id:2,label:'Header',x:170,y:160},{id:3,label:'Main',x:430,y:160},{id:4,label:'List',x:430,y:225},{id:5,label:'Item',x:340,y:290},{id:6,label:'Item',x:520,y:290}];
  const edges=[[0,1],[1,2],[1,3],[3,4],[4,5],[5,6]];
  const orderArr=[
    {n:0,p:'begin',m:'beginWork(HostRoot) → child'},{n:1,p:'begin',m:'beginWork(App) → child'},
    {n:2,p:'begin',m:'beginWork(Header) → 无 child'},{n:2,p:'complete',m:'completeWork(Header) → sibling(Main)'},
    {n:3,p:'begin',m:'beginWork(Main) → child'},{n:4,p:'begin',m:'beginWork(List) → child'},
    {n:5,p:'begin',m:'beginWork(Item#1) → 无 child'},{n:5,p:'complete',m:'completeWork(Item#1) → sibling(Item#2)'},
    {n:6,p:'begin',m:'beginWork(Item#2) → 无 child'},{n:6,p:'complete',m:'completeWork(Item#2) → return List'},
    {n:4,p:'complete',m:'completeWork(List) → return Main'},{n:3,p:'complete',m:'completeWork(Main) → return App'},
    {n:1,p:'complete',m:'completeWork(App) → return Root'},{n:0,p:'complete',m:'completeWork(HostRoot) → ✅ Render 结束'},
  ];
  let step=-1,auto=null;
  function draw(){const line=cssVar('--line'),panel=cssVar('--panel'),dim=cssVar('--dim');let s='';edges.forEach(([a,b])=>{const A=nodes[a],B=nodes[b];s+=`<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="${line}" stroke-width="1.5"/>`;});const cur=step>=0?orderArr[step]:null;nodes.forEach(nd=>{let fill=panel,stroke=line,tc=dim;if(cur&&cur.n===nd.id){if(cur.p==='begin'){stroke=cssVar('--recon');tc=cssVar('--recon');}else{stroke=cssVar('--render');tc=cssVar('--render');}}s+=`<rect x="${nd.x-42}" y="${nd.y-16}" width="84" height="32" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="2"/><text x="${nd.x}" y="${nd.y+4}" fill="${tc}" font-size="12" text-anchor="middle" font-family="monospace">${nd.label}</text>`;});svg.innerHTML=s;}
  draw();redraws.push(draw);
  function next(){step++;if(step>=orderArr.length){step=orderArr.length-1;if(auto){clearInterval(auto);auto=null;$('travAuto').textContent='▶ 自动';}return;}draw();const o=orderArr[step];status.innerHTML=`<b style="color:${o.p==='begin'?'#7ee787':'#ff7b9c'}">${o.p==='begin'?'🡓 begin':'🡑 complete'}</b> &nbsp;${o.m}`;}
  $('travStep').onclick=next;
  $('travReset').onclick=()=>{step=-1;if(auto){clearInterval(auto);auto=null;$('travAuto').textContent='▶ 自动';}draw();status.textContent='从 HostRoot 开始。';};
  $('travAuto').onclick=function(){if(auto){clearInterval(auto);auto=null;this.textContent='▶ 自动';return;}this.textContent='⏸ 暂停';auto=setInterval(()=>{if(step>=orderArr.length-1){clearInterval(auto);auto=null;this.textContent='▶ 自动';return;}next();},850);};
})();

/* ===== T9 updateQueue ===== */
(function(){
  const box=$('uqBox'),status=$('uqStatus');if(!box)return;
  let q=[],base=[],idc=0;
  function draw(){
    box.innerHTML='<div style="font-family:monospace;font-size:12px;color:var(--txt2)">shared.pending(环状链表,pending→最后一个):</div>'+
      '<div class="qbox" style="margin:6px 0">'+(q.length?q.map((u,i)=>`<div class="qitem" style="background:${u.low?'#a78bfa':'#61dafb'}">u${u.id}${u.low?'(低优)':''}${i===q.length-1?' ◀pending':''}</div>`).join('<span style="color:var(--dim)">→</span>')+'<span style="color:var(--dim)">↺</span>':'<span style="color:var(--dim);font-size:12px">null</span>')+'</div>'+
      '<div style="font-family:monospace;font-size:12px;color:var(--fiber);margin-top:8px">基础队列(低优待处理 + 已执行高优副本):</div>'+
      '<div class="qbox" style="margin:6px 0">'+(base.length?base.map(u=>`<div class="qitem" style="background:${u.noLane?'#4b8798':'#a78bfa'}">u${u.id} · ${u.noLane?'已执行副本(NoLane)':'低优待处理'}</div>`).join('<span style="color:var(--dim)">→</span>'):'<span style="color:var(--dim);font-size:12px">空</span>')+'</div>';
  }
  draw();
  $('uqAdd').onclick=()=>{q.push({id:idc++,low:false});draw();status.textContent='enqueue 高优 update,接到环状链表,pending 指向它。';};
  $('uqAddLow').onclick=()=>{q.push({id:idc++,low:true});draw();status.textContent='enqueue 低优 update(TransitionLane)。';};
  $('uqProcess').onclick=()=>{
    const all=base.concat(q);if(!all.length){status.textContent='队列为空。';return;}
    let skipped=false;const newBase=[],applied=[],skippedIds=[];
    all.forEach(u=>{
      if(u.low&&!u.noLane){skipped=true;skippedIds.push('u'+u.id);newBase.push({...u,noLane:false});}
      else {applied.push('u'+u.id);if(skipped)newBase.push({...u,low:false,noLane:true});}
    });
    base=newBase;q=[];draw();
    status.innerHTML='<b>高优 Render：</b>跳过 ['+(skippedIds.join(', ')||'无')+']，本次执行 ['+(applied.join(', ')||'无')+']。第一次跳过之后仍执行的高优 update，会以 NoLane 副本留在基础队列。';
  };
  $('uqProcessLow').onclick=()=>{
    const all=base.concat(q);if(!all.length){status.textContent='基础队列和 pending 都为空。';return;}
    const order=all.map(u=>'u'+u.id);base=[];q=[];draw();
    status.innerHTML='<b>低优 Render：</b>从 baseState 出发，按 ['+order.join(' → ')+'] 重放。所有 update 已处理，基础队列清空。';
  };
  $('uqReset').onclick=()=>{q=[];base=[];idc=0;draw();status.textContent='建议依次加入“高优 → 低优 → 高优”，再点击①和②。';};
})();

/* ===== T10 commit ===== */
(function(){
  const listEl=$('commitList'),screen=$('screen'),status=$('commitStatus');if(!listEl)return;
  const items=[{label:'<h1> Title',flag:'Update',flagc:'#f2b84b',text:'<h1>新标题</h1>'},{label:'<button> Old',flag:'Deletion',flagc:'#ff6b6b',text:'<button>旧按钮</button>'},{label:'<li> NewItem',flag:'Placement',flagc:'#7ee787',text:'<li>新列表项</li>'}];
  const initial=['<h1>旧标题</h1>','<button>旧按钮</button>'];
  function renderList(){listEl.innerHTML=items.map((it,i)=>`<div id="ci${i}" style="border:1px solid var(--line);border-radius:8px;padding:8px 12px;margin:6px 0;display:flex;justify-content:space-between;align-items:center;background:var(--panel2)"><span style="font-family:monospace;font-size:12px">${it.label}</span><span class="tag" style="color:${it.flagc};border:1px solid ${it.flagc}">${it.flag}</span></div>`).join('');}
  function renderScreen(arr){screen.innerHTML=arr.map(x=>`<div style="padding:2px 0;color:var(--codetxt)">${x.replace(/</g,'&lt;')}</div>`).join('');}
  function reset(){renderList();renderScreen(initial);status.textContent='等待提交。';}
  reset();$('commitReset').onclick=reset;
  $('commitRun').onclick=()=>{reset();let cur=[...initial];let i=0;status.textContent='Mutation:按 flags 逐一操作真实 DOM…';const t=setInterval(()=>{if(i>=items.length){clearInterval(t);status.textContent='✅ Commit 完成,屏幕已更新,切换 current 指针。';return;}const it=items[i];const row=$('ci'+i);if(row)row.style.opacity='.4';if(it.flag==='Update')cur[0]=it.text;else if(it.flag==='Deletion')cur=cur.filter(x=>x!=='<button>旧按钮</button>');else if(it.flag==='Placement')cur.push(it.text);renderScreen(cur);i++;},800);};
})();

/* ===== T11 commit phases ===== */
(function(){
  const bars=$('cpBars'),ptr=$('cpPointer'),dom=$('cpDom'),callback=$('cpCallback'),status=$('cpStatus');if(!bars)return;
  const phases=[
    {t:'BeforeMutation',c:'#61dafb',dom:'&lt;h1&gt;旧标题&lt;/h1&gt;',ptr:'旧树',action:'读取旧 DOM 快照；不修改 DOM，也不运行 effect。'},
    {t:'Mutation',c:'#ff7b9c',dom:'&lt;h1&gt;新标题&lt;/h1&gt;',ptr:'新树',action:'根据 Update flag 修改真实 DOM；Mutation 完成后 root.current 切到新树。'},
    {t:'Layout',c:'#f2b84b',dom:'&lt;h1&gt;新标题&lt;/h1&gt;',ptr:'新树',action:'同步运行 useLayoutEffect 保存的函数、更新 ref，并调用 DidMount/DidUpdate。'},
    {t:'Paint',c:'#7ee787',dom:'用户看到：新标题',ptr:'新树',action:'React 交还主线程，浏览器可以把新 DOM 绘制到屏幕。'},
    {t:'Passive',c:'#a78bfa',dom:'用户看到：新标题',ptr:'新树',action:'后续任务运行 useEffect 保存的 cleanup 和 create；若其中 setState，会安排下一轮更新。'},
  ];
  let index=0;
  function build(){bars.innerHTML=phases.map((p,i)=>`<div id="cp${i}" style="flex:1 1 120px;text-align:center;border:1px solid var(--line);border-radius:9px;padding:9px 4px;opacity:.35;background:var(--panel2)"><b style="font-family:var(--mono);font-size:11.5px;color:${p.c}">${i+1}. ${p.t}</b></div>`).join('');}
  function reset(){index=0;build();dom.innerHTML='&lt;h1&gt;旧标题&lt;/h1&gt;';ptr.innerHTML='fiberRoot.current → <b>旧树</b>';callback.innerHTML='<b>当前动作：</b>Commit 尚未开始。';status.textContent='从 BeforeMutation 开始，逐步前进。';$('cpRun').disabled=false;}
  $('cpReset').onclick=reset;
  $('cpRun').onclick=()=>{if(index>=phases.length)return;const p=phases[index];if(index>0)$('cp'+(index-1)).style.opacity='.55';const el=$('cp'+index);el.style.opacity='1';el.style.borderColor=p.c;dom.innerHTML=p.dom;ptr.innerHTML=`fiberRoot.current → <b style="color:${p.c}">${p.ptr}</b>`;callback.innerHTML=`<b>当前动作：</b>${p.action}`;status.textContent=`第 ${index+1}/${phases.length} 步：${p.t}`;index++;if(index===phases.length){$('cpRun').disabled=true;status.textContent='完成：DOM 在 Mutation 改变，Layout effect 随后同步运行，普通 effect 在 Passive 阶段运行。';}};
  reset();
})();

/* ===== T12 A queues ===== */
(function(){
  const timerEl=$('timerQ'),taskEl=$('taskQ'),status=$('qStatus');if(!timerEl)return;
  let now=0,idc=0,timerQueue=[],taskQueue=[];
  const PRIO={Immediate:{t:-1,c:'#ff6b6b'},User:{t:250,c:'#f2b84b'},Normal:{t:5000,c:'#61dafb'},Delay:{t:5000,c:'#a78bfa'}};
  function render(){
    timerQueue.sort((a,b)=>a.startTime-b.startTime);taskQueue.sort((a,b)=>a.expirationTime-b.expirationTime);
    timerEl.innerHTML=timerQueue.length?timerQueue.map(t=>`<div class="qitem" style="background:${t.c}">#${t.id} ${t.name}<br><span style="font-size:9px;opacity:.85">start=${t.startTime}</span></div>`).join(''):'<span style="color:var(--dim);font-size:12px">空</span>';
    taskEl.innerHTML=taskQueue.length?taskQueue.map((t,i)=>`<div class="qitem" style="background:${t.c};${i===0?'outline:2px solid #7ee787':''}">#${t.id} ${t.name}<br><span style="font-size:9px;opacity:.85">exp=${t.expirationTime}${i===0?' ◀堆顶':''}</span></div>`).join(''):'<span style="color:var(--dim);font-size:12px">空</span>';
  }
  function schedule(name,prio,delay){const p=PRIO[prio];const startTime=now+(delay||0);const task={id:idc++,name,c:p.c,startTime,expirationTime:startTime+p.t};if(startTime>now){timerQueue.push(task);status.textContent=`t=${now}:「${name}」延迟到 start=${startTime} → timerQueue。`;}else{taskQueue.push(task);status.textContent=`t=${now}:「${name}」exp=${task.expirationTime} → taskQueue(就绪)。`;}render();}
  $('qImm').onclick=()=>schedule('Immediate','Immediate',0);$('qUser').onclick=()=>schedule('UserBlock','User',0);$('qNorm').onclick=()=>schedule('Normal','Normal',0);$('qDelay').onclick=()=>schedule('Delayed','Delay',500);
  $('qTick').onclick=()=>{now+=200;let moved=0;timerQueue.sort((a,b)=>a.startTime-b.startTime);timerQueue=timerQueue.filter(t=>{if(t.startTime<=now){t.expirationTime=t.startTime+PRIO.Delay.t;taskQueue.push(t);moved++;return false;}return true;});status.textContent=`⏱ advanceTimers t=${now}:${moved?`搬 ${moved} 个到点任务→taskQueue。`:'无到点任务。'}`;render();};
  $('qFlush').onclick=()=>{if(!taskQueue.length){status.textContent='taskQueue 空。';return;}taskQueue.sort((a,b)=>a.expirationTime-b.expirationTime);const first=taskQueue[0];status.textContent=`▶ workLoop 按 exp 执行:${taskQueue.map(t=>'#'+t.id+t.name).join(' → ')}。堆顶「${first.name}」最先。`;taskQueue=[];render();};
  $('qReset').onclick=()=>{now=0;idc=0;timerQueue=[];taskQueue=[];render();status.textContent='t=0ms。调度任务试试。';};
  render();
})();

/* ===== T12 B messagechannel ===== */
(function(){
  const tl=$('mcTimeline'),status=$('mcStatus');if(!tl)return;let timer=null;const SLICES=6;
  function reset(){if(timer)clearTimeout(timer);tl.innerHTML='';status.textContent='点击开始。';}
  $('mcReset').onclick=reset;
  $('mcRun').onclick=()=>{reset();let i=0;
    function row(html){const d=document.createElement('div');d.innerHTML=html;d.style.cssText='display:flex;align-items:center;gap:8px;font-family:monospace;font-size:12px;opacity:0;transition:.3s';tl.appendChild(d);requestAnimationFrame(()=>d.style.opacity='1');}
    function stepf(){if(i>=SLICES){row('<span style="color:var(--recon)">✔ hasMoreWork=false → 停止,任务完成</span>');status.textContent='✅ 6 片跑完,片间浏览器可绘制/响应。';return;}row(`<span style="background:#7ee787;color:#04222b;border-radius:5px;padding:2px 8px">工作片 ${i+1}</span> <span style="color:var(--dim)">performWorkUntilDeadline → workLoop 干 5ms</span>`);setTimeout(()=>{row(`<span style="background:#ff7b9c;color:#fff;border-radius:5px;padding:2px 8px">🖌 绘制</span> <span style="color:var(--dim)">浏览器在宏任务间隙渲染</span>`);setTimeout(()=>{if(i<SLICES-1)row(`<span style="background:#f2b84b;color:#04222b;border-radius:5px;padding:2px 8px">postMessage</span> <span style="color:var(--dim)">hasMoreWork → 续下一片(续接函数)</span>`);i++;status.textContent=`已完成 ${i}/${SLICES} 片…`;timer=setTimeout(stepf,280);},320);},320);}
    status.textContent='大任务切片,逐帧推进…';stepf();};
  reset();
})();

/* ===== T13 lane ===== */
(function(){
  const box=$('laneBox'),status=$('laneStatus');if(!box)return;
  const LANES={Sync:1,Input:4,Default:16,Trans:128};
  const NAME={1:'SyncLane',4:'InputContinuousLane',16:'DefaultLane',128:'TransitionLane'};
  let pending=0;
  function bin(n){return (n>>>0).toString(2).padStart(12,'0');}
  function draw(){
    const highest=pending&(-pending);
    box.innerHTML=`<div style="font-family:monospace;font-size:13px;line-height:2">
      <div>root.pendingLanes = <span style="color:var(--sched)">0b${bin(pending)}</span></div>
      <div>getHighestPriorityLane = pending &amp; -pending = <span style="color:var(--recon)">0b${bin(highest)}</span> ${highest?`<span class="pill" style="color:var(--recon)">${NAME[highest]||'?'}</span>`:''}</div>
    </div>`;
  }
  draw();
  function add(v){pending|=v;draw();status.textContent=`合并:pendingLanes |= ${NAME[v]} → 位掩码累加。最高优 = 最低位的 1。`;}
  $('laneSync').onclick=()=>add(LANES.Sync);$('laneInput').onclick=()=>add(LANES.Input);$('laneDefault').onclick=()=>add(LANES.Default);$('laneTrans').onclick=()=>add(LANES.Trans);
  $('laneReset').onclick=()=>{pending=0;draw();status.textContent='加入不同 lane,看掩码和被选中的最高优 lane。';};
})();

/* ===== T14 interrupt ===== */
(function(){
  const stackBox=$('stackBox'),loopBox=$('loopBox'),status=$('intStatus');if(!stackBox)return;
  const startBtn=$('intStart'),intBtn=$('intInterrupt'),resetBtn=$('intReset');const N=6;
  let stackTimer=null,loopTimer=null,loopIdx=0,interrupted=false,running=false;
  function reset(){if(stackTimer)clearInterval(stackTimer);if(loopTimer)clearInterval(loopTimer);stackBox.innerHTML='<span style="color:var(--dim);font-size:12px">待压栈</span>';loopBox.innerHTML='<span style="color:var(--dim);font-size:12px">wip=null</span>';loopIdx=0;interrupted=false;running=false;intBtn.disabled=true;startBtn.disabled=false;status.textContent='点开始,中途点⚡看谁能立刻让位并恢复。';}
  reset();resetBtn.onclick=reset;
  startBtn.onclick=()=>{reset();running=true;startBtn.disabled=true;intBtn.disabled=false;stackBox.innerHTML='';let si=0;stackTimer=setInterval(()=>{if(si>=N){clearInterval(stackTimer);let ui=N-1;const un=setInterval(()=>{if(ui<0){clearInterval(un);return;}const f=stackBox.children[ui];if(f)f.style.opacity='.3';ui--;},240);return;}const d=document.createElement('div');d.className='stackframe';d.textContent='reconcile(unit '+(si+1)+')';d.style.marginLeft=(si*10)+'px';stackBox.appendChild(d);si++;},240);
    loopBox.innerHTML='';loopIdx=0;loopTimer=setInterval(()=>{if(interrupted)return;if(loopIdx>=N){clearInterval(loopTimer);if(running)status.textContent='两边自然处理完 6 单元。试试中途点⚡。';return;}loopBox.innerHTML='<div style="font-family:monospace;font-size:12px;color:var(--recon)">workInProgress → unit '+(loopIdx+1)+' / '+N+'</div><div style="font-family:monospace;font-size:11px;color:var(--dim);margin-top:6px">performUnitOfWork() ✓ → shouldYield()? no</div>';loopIdx++;},400);};
  intBtn.onclick=()=>{if(!running)return;interrupted=true;intBtn.disabled=true;if(loopTimer)clearInterval(loopTimer);loopBox.innerHTML='<div style="font-family:monospace;font-size:12px;color:var(--sched)">⚡ shouldYield()=true → break!</div><div style="font-family:monospace;font-size:11px;color:var(--dim);margin-top:6px">存档 workInProgress=unit '+loopIdx+',让位高优</div>';status.innerHTML='<b style="color:var(--recon)">循环</b>:下个检查点立刻 break(存档 unit '+loopIdx+') | <b style="color:var(--warn)">递归</b>:调用栈没 unwind 完,只能干等到底。';setTimeout(()=>{interrupted=false;status.innerHTML+='<br>→ 高优处理完,从存档点 unit '+loopIdx+' 继续…';loopTimer=setInterval(()=>{if(loopIdx>=N){clearInterval(loopTimer);loopBox.innerHTML='<div style="color:var(--recon);font-family:monospace;font-size:12px">✓ 从存档点续完,全部完成</div>';return;}loopBox.innerHTML='<div style="font-family:monospace;font-size:12px;color:var(--recon)">▶ 恢复:workInProgress → unit '+(loopIdx+1)+' / '+N+'</div>';loopIdx++;},400);},1400);};
})();

/* ===== T17 batching ===== */
(function(){
  const box=$('batchBox'),status=$('batchStatus');if(!box)return;
  function reset(){box.innerHTML='<div style="font-family:monospace;font-size:12px;color:var(--dim)">hook.queue.pending = null | scheduleCallback 次数:0</div>';status.textContent='点击开始。';}
  reset();$('batchReset').onclick=reset;
  $('batchRun').onclick=()=>{reset();let queue=[];let scheduled=0;let i=0;const acts=['c=>c+1','c=>c+1','c=>c+1'];const t=setInterval(()=>{if(i>=acts.length){clearInterval(t);box.innerHTML+=`<div style="font-family:monospace;font-size:12px;color:var(--recon);margin-top:8px">→ 回调结束:3 个 update 入队,scheduleCallback 只调 1 次 → 一次 render 里 reduce 出最终 state。</div>`;status.textContent='✅ 三次 setState,一次渲染。React18 里 setTimeout/Promise 里也自动批处理。';return;}queue.push(acts[i]);if(scheduled===0)scheduled=1;box.innerHTML=`<div style="font-family:monospace;font-size:12px;color:var(--codetxt)">setState #${i+1}: update{action:${acts[i]}}</div><div style="font-family:monospace;font-size:11.5px;color:var(--fiber);margin-top:4px">shared.pending: [ ${queue.map((_,j)=>'u'+(j+1)).join(' → ')} ↺ ]</div><div style="font-family:monospace;font-size:11.5px;color:var(--sched);margin-top:4px">ensureRootIsScheduled → scheduleCallback 次数: ${scheduled} ${scheduled===1&&i>0?'(去重)':''}</div>`;status.textContent=`第 ${i+1} 次 setState:入队但只安排一次渲染。`;i++;},800);};
})();

/* ===== T19 synthetic event ===== */
(function(){
  const treeEl=$('evTree'),status=$('evStatus');if(!treeEl)return;
  const nodes=[{name:'rootContainer',color:'#61dafb',listener:false},{name:'App',color:'#a78bfa',listener:true},{name:'Main',color:'#7ee787',listener:true},{name:'List',color:'#f2b84b',listener:false},{name:'button (target)',color:'#ff7b9c',listener:true}];
  function draw(active,phase){treeEl.innerHTML=nodes.map((n,i)=>{const on=active===i;let bg='var(--panel2)',bd='var(--line)',extra='';if(on&&phase==='capture'){bg='rgba(97,218,251,.18)';bd='#61dafb';extra='onClickCapture ↓';}if(on&&phase==='bubble'){bg='rgba(255,123,156,.18)';bd='#ff7b9c';extra='onClick ↑';}if(on&&phase==='target'){bg='rgba(126,231,135,.2)';bd='#7ee787';extra='🎯 target';}if(on&&phase==='stop'){bg='rgba(255,107,107,.2)';bd='#ff6b6b';extra='✋ stopPropagation';}return `<div style="margin-left:${i*22}px;border:1px solid ${bd};background:${bg};border-radius:8px;padding:7px 12px;margin-top:5px;font-family:monospace;font-size:12.5px;display:flex;justify-content:space-between;transition:.25s"><span style="color:${n.color}">${n.name} ${n.listener?'<span style="color:var(--dim);font-size:11px">[onClick]</span>':''}</span><span style="color:#ffcf5c;font-size:11px">${extra}</span></div>`;}).join('');}
  function reset(){draw(-1,'');status.textContent='点击按钮开始派发。';}
  reset();$('evReset').onclick=reset;
  $('evClick').onclick=()=>{const stop=$('evStop').checked;const seq=[];for(let i=0;i<nodes.length;i++)if(nodes[i].listener||i===0)seq.push({i,phase:i===nodes.length-1?'target':'capture'});for(let i=nodes.length-1;i>=0;i--){if(nodes[i].listener){seq.push({i,phase:'bubble'});if(stop&&nodes[i].name==='Main'){seq.push({i,phase:'stop'});break;}}}let k=0;status.textContent='派发开始:根容器监听器接管,沿 fiber 树模拟捕获→冒泡。';const t=setInterval(()=>{if(k>=seq.length){clearInterval(t);status.innerHTML='✅ 派发结束。'+(stop?'Main 调 stopPropagation,冒泡终止,App/onClick 不再触发。':'');return;}const s=seq[k];draw(s.i,s.phase);const label={capture:'捕获 ↓ onClickCapture',target:'到达 target 🎯',bubble:'冒泡 ↑ onClick',stop:'✋ stopPropagation 终止'}[s.phase];status.textContent=`${label} @ ${nodes[s.i].name}`;k++;},650);};
})();

/* ===== MAIN LINE ===== */
(function(){
  const el=$('mainline');if(!el)return;
  const steps=[
    '生成 Update + 分配 Lane','Update 进 shared.pending 环状链表','Lane 冒泡,root 收集 pendingLanes',
    'Scheduler 据 Lane 建任务入最小堆','MessageChannel 时间切片(可中断/抢占)','beginWork:Hooks/算 state/Diff/生成 WIP',
    'completeWork:打 Effect 标记、收集副作用','若被抢占→丢弃 WIP,未执行 Update 进 baseQueue','任务恢复,整棵树算完','Commit:DOM 落地+副作用+切 current'];
  const cols=['#61dafb','#61dafb','#a78bfa','#f2b84b','#f2b84b','#7ee787','#7ee787','#ff6b6b','#7ee787','#ff7b9c'];
  el.innerHTML=steps.map((s,i)=>`<div style="display:flex;gap:10px;align-items:center;padding:9px 12px;margin:5px 0;border:1px solid var(--line);border-left:3px solid ${cols[i]};border-radius:9px;background:var(--panel2)"><div style="width:24px;height:24px;border-radius:50%;flex:0 0 auto;border:2px solid ${cols[i]};color:${cols[i]};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:monospace">${i+1}</div><div style="font-size:13.5px;color:var(--txt2)">${s}</div></div>`).join('');
})();

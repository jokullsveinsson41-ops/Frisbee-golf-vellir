document.addEventListener('DOMContentLoaded',()=>{
  const root=document.querySelector('[data-frisbi-ai]'); if(!root)return;
  const log=root.querySelector('[data-ai-log]'), form=root.querySelector('[data-ai-form]');
  const input=root.querySelector('[data-ai-input]'), send=form.querySelector('[type=submit]');
  const stop=root.querySelector('[data-ai-stop]'), reset=root.querySelector('[data-ai-reset]');
  const state=root.querySelector('[data-ai-state]'), note=root.querySelector('[data-ai-note]');
  const suggestions=[...root.querySelectorAll('[data-ai-suggest]')];
  let history=[], pending=null, lastFailed='', connectionReady=false;
  const scroll=()=>log.scrollTo({top:log.scrollHeight,behavior:'smooth'});
  const safeUrl=raw=>{
    try {
      if(/^[a-z0-9-]+\.html(?:#[\w-]+)?$/i.test(raw))return raw;
      const url=new URL(raw);return ['https:','http:'].includes(url.protocol)?url.href:null;
    }catch{return null;}
  };
  const inline=(node,text)=>{
    // Construct DOM nodes; model output is never interpreted as HTML.
    const pattern=/\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*\n]+)\*\*|`([^`\n]+)`/g;
    let start=0,match;
    while((match=pattern.exec(text))){
      node.append(document.createTextNode(text.slice(start,match.index)));
      if(match[1]){
        const href=safeUrl(match[2]);
        if(href){const a=document.createElement('a');a.href=href;a.textContent=match[1];if(/^https?:/.test(href)){a.target='_blank';a.rel='noopener noreferrer';}node.append(a);}
        else node.append(document.createTextNode(match[1]));
      }else {const el=document.createElement(match[3]?'strong':'code');el.textContent=match[3]||match[4];node.append(el);}
      start=pattern.lastIndex;
    }
    node.append(document.createTextNode(text.slice(start)));
  };
  const render=(node,text)=>{
    let list=null,kind='';
    for(const line of text.replace(/[^]*/g,'').split('\n')){
      if(!line.trim()){list=null;continue;}
      const item=line.match(/^\s*(?:([-*])|\d+\.)\s+(.+)$/);
      if(item){const next=item[1]?'ul':'ol';if(!list||next!==kind){list=document.createElement(next);kind=next;node.append(list);}const li=document.createElement('li');inline(li,item[2]);list.append(li);}
      else {list=null;const p=document.createElement('p');inline(p,line.replace(/^#{1,6}\s+/,''));node.append(p);}
    }
  };
  const message=(who,text)=>{
    const el=document.createElement('div');el.className='frisbi-msg '+who;
    const label=document.createElement('span');label.className='frisbi-msg-label';label.textContent=who==='user'?'ÞÚ':'FRISBÍ AI';
    const body=document.createElement('div');body.className='frisbi-answer';
    if(who==='user'){const p=document.createElement('p');p.textContent=text;body.append(p);}else render(body,text);
    el.append(label,body);log.append(el);scroll();return el;
  };
  const busy=value=>{
    send.disabled=value;input.disabled=value;stop.hidden=!value;reset.disabled=value;
    suggestions.forEach(b=>b.disabled=value);log.setAttribute('aria-busy',String(value));
    state.textContent=value?'Hugsa…':connectionReady?'Tilbúið':'Ekki tengt';
  };
  const trim=messages=>{
    while(messages.length>19 || messages.reduce((n,m)=>n+m.content.length,0)>24000)messages.splice(0,2);
    return messages;
  };
  const ask=async(question,{retry=false}={})=>{
    const text=String(question||'').trim();if(!text||pending)return;
    if(text.length>4000){state.textContent='Spurningin má vera allt að 4.000 stafir.';return;}
    if(!retry)message('user',text);
    input.value='';lastFailed='';root.querySelectorAll('[data-ai-retry]').forEach(b=>b.remove());
    const waiting=message('bot','Ég skoða spurninguna þína…');waiting.classList.add('typing');
    const controller=new AbortController();pending=controller;busy(true);
    let timedOut=false;const timer=setTimeout(()=>{timedOut=true;controller.abort();},65000);
    const messages=trim([...history,{role:'user',content:text}]);
    try{
      const response=await fetch('/api/frisbi-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages}),signal:controller.signal});
      let data;try{data=await response.json();}catch{throw new Error('unavailable');}
      if(!response.ok)throw new Error(data.error||'unavailable');
      if(typeof data.text!=='string'||!data.text.trim())throw new Error('unavailable');
      connectionReady=true;
      waiting.remove();const output=message('bot',data.text);
      if(Array.isArray(data.sources)&&data.sources.length){
        const sources=document.createElement('div');sources.className='frisbi-sources';
        const title=document.createElement('strong');title.textContent='Heimildir';sources.append(title);
        for(const source of data.sources.slice(0,12)){const href=safeUrl(source.url);if(!href)continue;const a=document.createElement('a');a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=source.title||new URL(href,location.href).hostname;sources.append(a);}
        output.append(sources);
      }
      history=[...messages,{role:'assistant',content:data.text.slice(0,6000)}];scroll();
    }catch(error){
      waiting.remove();lastFailed=text;
      const errorText=controller.signal.aborted ? (timedOut?'Svarið tók of langan tíma. Reyndu aftur.':'Svar stöðvað. Þú getur reynt aftur eða spurt annarrar spurningar.') : error.message==='not_configured'?'Frisbí AI er ekki tengt enn. Þú getur skoðað vellina á síðunni á meðan.': ['rate_limited','upstream_rate_limit'].includes(error.message)?'Of margar spurningar í einu. Bíddu aðeins og reyndu aftur.':'Ekki náðist samband við Frisbí AI. Spurningin þín er hér enn; reyndu aftur.';
      const failed=message('bot',errorText);failed.classList.add('frisbi-error');
      const retryButton=document.createElement('button');retryButton.type='button';retryButton.dataset.aiRetry='';retryButton.textContent='Reyna aftur';retryButton.addEventListener('click',()=>{const q=lastFailed;failed.remove();ask(q,{retry:true});});failed.append(retryButton);
    }finally{clearTimeout(timer);pending=null;busy(false);input.focus();}
  };
  form.addEventListener('submit',e=>{e.preventDefault();ask(input.value);});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();form.requestSubmit();}});
  suggestions.forEach(b=>b.addEventListener('click',()=>ask(b.dataset.aiSuggest)));
  stop.addEventListener('click',()=>pending?.abort());
  reset.addEventListener('click',()=>{history=[];lastFailed='';log.replaceChildren();message('bot','Nýtt samtal. Hvað viltu bæta í leiknum eða hvaða völl viltu skoða?');input.focus();});
  fetch('/api/frisbi-ai/health',{signal:AbortSignal.timeout(8000)}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{
    if(pending)return;
    connectionReady=!!data.ready;state.textContent=connectionReady?'Tilbúið':'Ekki tengt';
    note.textContent=data.ready?(data.webSearch?'Heldur þræði í samtalinu og getur leitað að nýjum upplýsingum. Svör geta verið röng; staðfestu aðstæður áður en þú ferð.':'Heldur þræði í samtalinu og notar upplýsingar af síðunni. Nýjustu aðstæður eru ekki staðfestar í rauntíma.'):'Frisbí AI verður tiltækt þegar AI-tengingin hefur verið virkjuð.';
  }).catch(()=>{if(!pending)state.textContent='Ekki tengt';note.textContent='Frisbí AI er ekki tengt enn.';});
});

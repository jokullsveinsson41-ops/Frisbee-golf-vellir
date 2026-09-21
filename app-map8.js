document.addEventListener("DOMContentLoaded",()=>{
  const header=document.querySelector(".site-header");
  const onScroll=()=>header?.classList.toggle("scrolled",window.scrollY>18);
  onScroll(); addEventListener("scroll",onScroll,{passive:true});

  const reveals=[...document.querySelectorAll("[data-reveal]")];
  if(reveals.length){
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add("in")}),{threshold:.12});
    reveals.forEach(e=>io.observe(e));
  }

  const search=document.querySelector("#courseSearch");
  if(search){
    const cards=[...document.querySelectorAll(".course-card,.reyk-card")];
    search.addEventListener("input",()=>{
      const q=search.value.toLowerCase().trim();
      cards.forEach(c=>c.style.display=c.textContent.toLowerCase().includes(q)?"":"none");
    });
  }

  document.querySelectorAll("[data-modal-open]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const dialog=document.getElementById(btn.dataset.modalOpen);
      if(dialog) dialog.showModal();
    });
  });

  document.querySelectorAll("[data-modal-close]").forEach(btn=>{
    btn.addEventListener("click",()=>btn.closest("dialog")?.close());
  });

  document.querySelectorAll("dialog.course-modal").forEach(dialog=>{
    dialog.addEventListener("click",e=>{
      const box=dialog.querySelector(".modal-shell");
      if(!box)return;
      const r=box.getBoundingClientRect();
      if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) dialog.close();
    });
  });

  document.querySelectorAll(".lux-card").forEach(card=>{
    card.addEventListener("pointermove",e=>{
      if(matchMedia("(pointer:coarse)").matches)return;
      const r=card.getBoundingClientRect();
      card.style.setProperty("--mx",((e.clientX-r.left)/r.width*100)+"%");
      card.style.setProperty("--my",((e.clientY-r.top)/r.height*100)+"%");
    });
  });

  const share=document.querySelector("[data-share]");
  if(share){
    share.addEventListener("click",async()=>{
      const data={title:document.title,text:"Frisbígolf á Íslandi",url:location.href};
      try{
        if(navigator.share) await navigator.share(data);
        else{
          await navigator.clipboard.writeText(location.href);
          const old=share.textContent;
          share.textContent="Afritað ✓";
          setTimeout(()=>share.textContent=old,1600);
        }
      }catch(e){}
    });
  }

  const top=document.querySelector("[data-top]");
  if(top) top.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));
});

/* motion system */
document.addEventListener("DOMContentLoaded",()=>{
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce)return;

  document.documentElement.classList.add("motion-ready");

  const staged=[...document.querySelectorAll(
    ".atlas-copy > *, .quick-panel > *, .atlas-section-head > *, .atlas-card, .featured-atlas-card > *, .reyk-card, .graf-command-head > *, .graf-action, .graf-stats > span, .future-grid article, .nearby-course > *"
  )];

  const revealObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const el=entry.target;
      el.classList.add("motion-in");
      revealObserver.unobserve(el);
    });
  },{threshold:.12,rootMargin:"0px 0px -4% 0px"});

  staged.forEach((el,i)=>{
    el.classList.add("motion-item");
    el.style.setProperty("--delay",Math.min((i%8)*55,330)+"ms");
    revealObserver.observe(el);
  });

  const hero=document.querySelector(".atlas-hero-image,.graf-hero>img,.atlas-city-hero>img");
  if(hero){
    let ticking=false;
    const move=()=>{
      const y=Math.min(scrollY,700);
      hero.style.transform=`translate3d(0,${y*.055}px,0) scale(1.035)`;
      ticking=false;
    };
    addEventListener("scroll",()=>{
      if(!ticking){requestAnimationFrame(move);ticking=true}
    },{passive:true});
  }

  document.querySelectorAll(".graf-action,.atlas-card,.reyk-card,.quick-panel>a").forEach(el=>{
    el.addEventListener("pointerdown",()=>el.classList.add("tap-pop"));
    ["pointerup","pointercancel","pointerleave"].forEach(ev=>el.addEventListener(ev,()=>el.classList.remove("tap-pop")));
  });

  document.querySelectorAll("dialog.course-modal").forEach(dialog=>{
    dialog.addEventListener("close",()=>dialog.classList.remove("modal-live"));
  });
  document.querySelectorAll("[data-modal-open]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const d=document.getElementById(btn.dataset.modalOpen);
      requestAnimationFrame(()=>d?.classList.add("modal-live"));
    });
  });
});


/* AI cinematic pointer depth */
document.addEventListener("DOMContentLoaded",()=>{
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce)return;
  const heroes=document.querySelectorAll(".atlas-hero,.atlas-city-hero,.graf-hero,.metro-hero");
  heroes.forEach(hero=>{
    const img=hero.querySelector("img");
    hero.addEventListener("pointermove",e=>{
      const r=hero.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5;
      const y=(e.clientY-r.top)/r.height-.5;
      hero.style.setProperty("--px",(x*10).toFixed(2)+"px");
      hero.style.setProperty("--py",(y*8).toFixed(2)+"px");
      if(img && !hero.classList.contains("atlas-hero")){
        img.style.transform=`scale(1.055) translate3d(${x*-8}px,${y*-6}px,0)`;
      }
    },{passive:true});
    hero.addEventListener("pointerleave",()=>{
      hero.style.setProperty("--px","0px");
      hero.style.setProperty("--py","0px");
      if(img && !hero.classList.contains("atlas-hero")) img.style.transform="";
    });
  });
});


/* ===== FRISBI AI — lightweight on-site disc golf assistant ===== */
document.addEventListener("DOMContentLoaded",()=>{
  const root=document.querySelector("[data-frisbi-ai]");
  if(!root)return;

  const log=root.querySelector("[data-ai-log]");
  const form=root.querySelector("[data-ai-form]");
  const input=root.querySelector("[data-ai-input]");
  const suggestions=[...root.querySelectorAll("[data-ai-suggest]")];

  const normalize=s=>String(s||"")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[ðþ]/g,m=>m==="ð"?"d":"th")
    .replace(/[^a-z0-9æöáéíóúý\s-]/gi," ")
    .replace(/\s+/g," ")
    .trim();

  const answers=[
    {
      keys:["byrjanda disk","byrjenda disk","fyrsti disk","beginner disc","new disc","hvaða disk","hvada disk"],
      answer:"Fyrir byrjanda er oft best að byrja á beinum putter eða midrange-diski sem er auðvelt að stjórna. Ekki byrja á mjög hraðri distance-driver — lærðu fyrst hreint kast og beina fluglínu."
    },
    {
      keys:["hvað er par","hvad er par","par i frisbi","what is par"],
      answer:"Par er fjöldi kasta sem gert er ráð fyrir að reyndur leikmaður þurfi á brautinni. Par 3 þýðir því að þrjú köst eru viðmiðið. Færri köst eru undir pari, fleiri yfir pari."
    },
    {
      keys:["byrjendavoll","byrjenda voll","góður fyrir byrjanda","godur fyrir byrjanda","beginner course","easy course"],
      answer:"Á síðunni eru Klambratún og Laugardalur góðir staðir til að skoða fyrir einfaldari byrjun. Klambratún er flatur og aðgengilegur, og Laugardalur er léttur garðvöllur. Opnaðu Reykjavík og veldu völl til að sjá nánar."
    },
    {
      keys:["kasta lengra","lengra kast","distance","throw farther","throw further","meiri lengd"],
      answer:"Til að kasta lengra skaltu einbeita þér að tímasetningu frekar en að nota meiri kraft. Haltu disknum nálægt líkamanum, snúðu mjöðmum og öxlum í réttri röð og slepptu disknum hreint. Slétt nefstaða á disknum skiptir líka miklu."
    },
    {
      keys:["backhand","bakhand","bakhandkast"],
      answer:"Í backhand-kasti skaltu byrja rólega, halda disknum nálægt brjóstinu og láta mjaðmirnar hefja snúninginn. Krafturinn kemur úr samfelldri hreyfingu fóta, mjaðma, axla og handleggs — ekki bara úr handleggnum."
    },
    {
      keys:["forehand","sidearm","forhand"],
      answer:"Í forehand-kasti skiptir hreinn úlnliðssmellur miklu. Haltu olnboganum nálægt líkamanum, disknum tiltölulega flötum og einbeittu þér fyrst að stjórn áður en þú bætir við meiri krafti."
    },
    {
      keys:["vindur","wind","motvindur","medvindur"],
      answer:"Í mótvindi verður diskurinn yfirleitt óstöðugri og vill snúa meira, svo stöðugri diskur getur hjálpað. Í meðvindi gerist hið gagnstæða og minna stöðugur diskur getur haldið fluginu betur. Haltu kastinu lágu þegar mikið blæs."
    },
    {
      keys:["putter","pútt","putt"],
      answer:"Putter er ekki bara fyrir körfuna. Hann er frábær til að læra hreina kasttækni, stutt aðköst og beina fluglínu. Fyrir pútt skaltu halda einfaldri rútínu og reyna að endurtaka sömu hreyfingu í hvert sinn."
    },
    {
      keys:["midrange","mid range","miðlungs disk","mid disk"],
      answer:"Midrange-diskur er hægari og auðveldari í stjórn en driver. Hann hentar vel fyrir beinar brautir, styttri teigköst og þegar nákvæmni skiptir meira máli en hámarksvegalengd."
    },
    {
      keys:["driver","distance driver","fairway"],
      answer:"Fairway-driver er oft næsta skref eftir putter og midrange. Distance-driver þarf meiri hraða og góða tækni til að fljúga eins og hann á að gera, þannig að hann er ekki alltaf besti kosturinn fyrir nýjan leikmann."
    },
    {
      keys:["reglur","rules","hvernig spilar","how to play"],
      answer:"Markmiðið er að klára hverja braut í sem fæstum köstum. Þú kastar næst frá staðnum þar sem fyrri diskurinn stöðvaðist og brautin klárast þegar diskurinn situr í körfunni. Lægsta heildarskorið vinnur."
    },
    {
      keys:["ob","out of bounds","utan vallar"],
      answer:"OB þýðir out of bounds — svæði sem telst utan brautar. Ef diskurinn endar OB bætist yfirleitt vítakast við og næsta kast er tekið frá leyfilegum stað samkvæmt reglum brautarinnar."
    },
    {
      keys:["mando","mandatory"],
      answer:"Mando er skylduleið sem diskurinn þarf að fara framhjá á tiltekinni hlið. Markmiðið er oft að verja fólk, stýra spilalínu eða gera brautina áhugaverðari."
    },
    {
      keys:["grafarholt"],
      answer:"Grafarholt er 18 holu, hæðóttur og tæknilegur völlur. Á síðunni hans geturðu skoðað brautir, upplýsingar, sögu og opnað leiðbeiningar."
    },
    {
      keys:["klambratun","klambratún"],
      answer:"Klambratún er 14 holu borgarvöllur, par 42, og er flatur og aðgengilegur. Hann hentar vel fyrir styttra spil og byrjendur."
    },
    {
      keys:["laugardalur"],
      answer:"Laugardalur er 10 holu, par 30 garðvöllur. Hann er léttur, flatur og þægilegur í spilun með bæði stuttum og meðal-löngum brautum."
    },
    {
      keys:["kjalarnes"],
      answer:"Kjalarnes er 9 holu, par 27 völlur með opnu landslagi. Hann er flatur, auðveldur að nálgast og með meira borgarjaðar- og fjallavibe."
    },
    {
      keys:["seljahverfi"],
      answer:"Seljahverfi er 9 holu, par 27 hverfisvöllur. Hann er stuttur, fljótur í spilun og einfaldur að nálgast."
    },
    {
      keys:["fella","holahverfi","hólahverfi","breidholt","breiðholt"],
      answer:"Fella- og Hólahverfi er 9 holu, par 28 völlur í Breiðholti. Hann er aðeins tæknilegri og með lengri brautir en sumir hinna styttri hverfisvalla."
    },
    {
      keys:["reykjavik","reykjavík","vellir i reykjavik","courses in reykjavik"],
      answer:"Á Reykjavík-síðunni eru níu vellir sýndir, þar á meðal Grafarholt, Gufunes/Grafarvogur, Klambratún, Laugardalur, Fossvogsdalur, Kjalarnes, Fella- og Hólahverfi og Seljahverfi."
    },
    {
      keys:["score","skor","skorun","birdie","bogey","eagle"],
      answer:"Skor er talið miðað við par. Birdie er einu kasti undir pari, bogey einu yfir og eagle tveimur undir. Heildarskorið er summa allra kasta á hringnum."
    }
  ];

  const fallback="Ég get hjálpað með frisbígolf — til dæmis diska, reglur, kasttækni, vind, skor eða vellina á síðunni. Prófaðu að spyrja aðeins nánar um eitt af því.";

  const getAnswer=q=>{
    const n=normalize(q);
    let best=null;
    let score=0;
    answers.forEach(item=>{
      item.keys.forEach(k=>{
        const nk=normalize(k);
        if(n.includes(nk) && nk.length>score){
          best=item.answer;
          score=nk.length;
        }
      });
    });
    return best||fallback;
  };

  const addMsg=(who,textValue)=>{
    const el=document.createElement("div");
    el.className="frisbi-msg "+who;
    const label=document.createElement("span");
    label.className="frisbi-msg-label";
    label.textContent=who==="bot"?"FRISBÍ AI":"ÞÚ";
    const p=document.createElement("p");
    p.textContent=textValue;
    el.append(label,p);
    log.appendChild(el);
    log.scrollTo({top:log.scrollHeight,behavior:"smooth"});
    return el;
  };

  const ask=q=>{
    const textValue=String(q||"").trim();
    if(!textValue)return;
    addMsg("user",textValue);
    input.value="";
    suggestions.forEach(b=>b.blur());

    const typing=document.createElement("div");
    typing.className="frisbi-msg bot typing";
    typing.innerHTML='<span class="frisbi-msg-label">FRISBÍ AI</span><div class="typing-dots"><i></i><i></i><i></i></div>';
    log.appendChild(typing);
    log.scrollTo({top:log.scrollHeight,behavior:"smooth"});

    const delay=Math.min(720,330+textValue.length*6);
    setTimeout(()=>{
      typing.remove();
      addMsg("bot",getAnswer(textValue));
    },delay);
  };

  form?.addEventListener("submit",e=>{
    e.preventDefault();
    ask(input.value);
  });

  suggestions.forEach(btn=>{
    btn.addEventListener("click",()=>ask(btn.dataset.aiSuggest));
  });
});











/* ===== SATELLITE COURSE MAP V8 — preload whole Iceland + stable geographic pins ===== */
document.addEventListener("DOMContentLoaded",()=>{
  const dialog=document.getElementById("atlasMapDialog");
  const openBtn=document.querySelector("[data-map-open]");
  const closeBtn=document.querySelector("[data-map-close]");
  const regionBtns=[...document.querySelectorAll("[data-map-region]")];
  const mapEl=document.querySelector("[data-atlas-map]");
  const baseEl=document.querySelector("[data-map-base]");
  const tilesEl=document.querySelector("[data-map-tiles]");
  const markersEl=document.querySelector("[data-map-markers]");
  const coordsEl=document.querySelector("[data-map-coords]");
  const zoomIn=document.querySelector("[data-map-zoom-in]");
  const zoomOut=document.querySelector("[data-map-zoom-out]");
  const resetBtn=document.querySelector("[data-map-reset]");
  if(!dialog||!openBtn||!mapEl||!baseEl||!tilesEl||!markersEl)return;

  const TILE=256, BASE_Z=6, MIN_Z=5, MAX_Z=15;
  const LIMITS={west:-30,east:-8,south:61.4,north:68.7};
  let state={lat:64.92,lon:-18.55,z:6};
  let activeRegion="iceland";
  let dragging=false, dragStart=null, dragWorld=null, dragDX=0, dragDY=0, raf=0;
  let lastMove=null, velocity={x:0,y:0};

  const regions={
    iceland:{lat:64.92,lon:-18.55,z:6},
    reykjavik:{lat:64.13,lon:-21.88,z:12},
    akureyri:{lat:65.685,lon:-18.12,z:12},
    egilsstadir:{lat:65.245,lon:-14.48,z:11}
  };

  const courses={
    reykjavik:[
      ["Grafarholt",64.12268495446106,-21.750312857329845,"grafarholt.html"],
      ["Grafarholt púttvöllur",64.12318,-21.75145,"grafarholt-putt.html"],
      ["Grafarvogur / Gufunes",64.143354,-21.809444,"gufunes.html"],
      ["Klambratún",64.138521,-21.915918,"klambratun.html"],
      ["Laugardalur",64.139246,-21.865271,"laugardalur.html"],
      ["Fossvogsdalur",64.11675098474049,-21.885569080704233,"fossvogsdalur.html"],
      ["Kjalarnes",64.2374064881233,-21.828555881514774,"kjalarnes.html"],
      ["Fella- og Hólahverfi",64.10284,-21.809904,"fellahverfi.html"],
      ["Seljahverfi",64.099381,-21.845597,"seljahverfi.html"],
      ["Guðmundarlundur",64.07421433851206,-21.826335246506932,"gudmundaras.html"]
    ],
    akureyri:[
      ["Hamrar",65.64882895286553,-18.104909669205227,"hamrar.html"],
      ["Háskólavöllurinn",65.68085681564799,-18.126469105482105,"haskoli-akureyri.html"],
      ["Hamarkotstún",65.679919,-18.101591,"hamarkotstun.html"],
      ["Eiðsvöllur",65.68636223847858,-18.08999852293488,"eidsvollur.html"],
      ["Frisbígolfvöllur VMA",65.67075143682564,-18.10320721730264,"vma.html"],
      ["Hrísey",65.981328,-18.375902,"hrisey.html"],
      ["Grímsey Disc Golf",66.54054268849171,-18.01758348941803,"grimsey.html"]
    ],
    egilsstadir:[
      ["Selskógur",65.26398004596984,-14.379841165648998,"selskogur.html"],
      ["Tjarnargarður",65.263038,-14.396607,"tjarnargardur.html"],
      ["Hallormsstaðaskógur",65.08610795565457,-14.769204784337767,"hallormsstadur.html"]
    ]
  };

  const cities=[
    ["Reykjavík",64.1466,-21.9426,"reykjavik"],
    ["Akureyri",65.6885,-18.1262,"akureyri"],
    ["Egilsstaðir",65.2669,-14.3948,"egilsstadir"]
  ];

  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const size=z=>TILE*Math.pow(2,z);
  const project=(lat,lon,z)=>{
    const s=size(z), x=(lon+180)/360*s, sin=Math.sin(lat*Math.PI/180);
    const y=(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*s;
    return {x,y};
  };
  const unproject=(x,y,z)=>{
    const s=size(z), lon=x/s*360-180, n=Math.PI-2*Math.PI*y/s;
    return {lat:180/Math.PI*Math.atan(.5*(Math.exp(n)-Math.exp(-n))),lon};
  };
  const clampState=()=>{
    state.lat=clamp(state.lat,LIMITS.south,LIMITS.north);
    state.lon=clamp(state.lon,LIMITS.west,LIMITS.east);
  };
  const tileUrl=(z,y,x)=>"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/"+z+"/"+y+"/"+x;

  const buildBase=()=>{
    if(baseEl.dataset.ready==="1")return;
    const nw=project(LIMITS.north,LIMITS.west,BASE_Z);
    const se=project(LIMITS.south,LIMITS.east,BASE_Z);
    const minX=Math.floor(nw.x/TILE)-1, maxX=Math.floor(se.x/TILE)+1;
    const minY=Math.floor(nw.y/TILE)-1, maxY=Math.floor(se.y/TILE)+1;
    const world=Math.pow(2,BASE_Z), frag=document.createDocumentFragment();
    for(let y=minY;y<=maxY;y++){
      if(y<0||y>=world)continue;
      for(let x=minX;x<=maxX;x++){
        const wrapped=((x%world)+world)%world;
        const img=document.createElement("img");
        img.className="atlas-map-base-tile";
        img.alt="";
        img.draggable=false;
        img.decoding="async";
        img.loading="eager";
        img.fetchPriority="high";
        img.src=tileUrl(BASE_Z,y,wrapped);
        img.style.left=(x*TILE)+"px";
        img.style.top=(y*TILE)+"px";
        frag.appendChild(img);
      }
    }
    baseEl.replaceChildren(frag);
    baseEl.dataset.ready="1";
  };

  const setActiveRegion=name=>{
    activeRegion=name;
    regionBtns.forEach(btn=>btn.classList.toggle("active",btn.dataset.mapRegion===name));
  };

  const sceneMetrics=()=>{
    const rect=mapEl.getBoundingClientRect();
    const w=Math.max(rect.width,320), h=Math.max(rect.height,410);
    return {w,h,center:project(state.lat,state.lon,state.z)};
  };

  const positionBase=(dx=0,dy=0)=>{
    const {w,h}=sceneMetrics();
    const baseCenter=project(state.lat,state.lon,BASE_Z);
    const scale=Math.pow(2,state.z-BASE_Z);
    const tx=dx+w/2-baseCenter.x*scale;
    const ty=dy+h/2-baseCenter.y*scale;
    baseEl.style.transform="translate3d("+tx+"px,"+ty+"px,0) scale("+scale+")";
  };

  const renderHighRes=()=>{
    const {w,h,center}=sceneMetrics();
    const left=center.x-w/2, top=center.y-h/2, pad=1, max=Math.pow(2,state.z);
    const sx=Math.floor(left/TILE)-pad, ex=Math.floor((left+w)/TILE)+pad;
    const sy=Math.floor(top/TILE)-pad, ey=Math.floor((top+h)/TILE)+pad;
    const frag=document.createDocumentFragment();
    for(let y=sy;y<=ey;y++){
      if(y<0||y>=max)continue;
      for(let x=sx;x<=ex;x++){
        const wrapped=((x%max)+max)%max;
        const img=document.createElement("img");
        img.className="atlas-map-tile";
        img.alt="";
        img.draggable=false;
        img.decoding="async";
        img.loading="eager";
        img.src=tileUrl(state.z,y,wrapped);
        img.style.left=(x*TILE-left)+"px";
        img.style.top=(y*TILE-top)+"px";
        frag.appendChild(img);
      }
    }
    tilesEl.replaceChildren(frag);
    renderMarkers(left,top,w,h);
    positionBase();
    tilesEl.style.transform="";
    markersEl.style.transform="";
    if(coordsEl)coordsEl.textContent=Math.abs(state.lat).toFixed(2)+"°"+(state.lat>=0?"N":"S")+" • "+Math.abs(state.lon).toFixed(2)+"°"+(state.lon>=0?"E":"W");
  };

  const makeMarker=(label,x,y,kind,action)=>{
    const el=document.createElement(kind==="course"?"a":"button");
    el.className=kind==="course"?"atlas-geo-course":"atlas-geo-city";
    el.style.left=x+"px"; el.style.top=y+"px";
    if(kind==="course"){
      el.href=action;
      el.innerHTML='<span class="atlas-geo-pulse"></span><span class="atlas-geo-dot"></span><b>'+label+'</b>';
      el.setAttribute("aria-label","Opna "+label);
    }else{
      el.type="button";
      el.innerHTML='<span class="atlas-city-radar"></span><i></i><b>'+label+'</b>';
      el.addEventListener("click",()=>goRegion(action));
    }
    return el;
  };

  const renderMarkers=(left,top,w,h)=>{
    const entries=activeRegion==="iceland"
      ? cities.map(c=>({label:c[0],lat:c[1],lon:c[2],kind:"city",action:c[3]}))
      : (courses[activeRegion]||[]).map(c=>({label:c[0],lat:c[1],lon:c[2],kind:"course",action:c[3]}));
    const frag=document.createDocumentFragment();
    entries.forEach(m=>{
      const p=project(m.lat,m.lon,state.z), x=p.x-left, y=p.y-top;
      if(x<-140||x>w+140||y<-140||y>h+140)return;
      frag.appendChild(makeMarker(m.label,x,y,m.kind,m.action));
    });
    markersEl.replaceChildren(frag);
  };

  const render=()=>{clampState();renderHighRes();};

  const goRegion=name=>{
    const r=regions[name]; if(!r)return;
    setActiveRegion(name); state={...r}; render();
  };

  const setZoom=z=>{
    state.z=clamp(Math.round(z),MIN_Z,MAX_Z);
    render();
  };

  const applyDragFrame=()=>{
    raf=0;
    const t="translate3d("+dragDX+"px,"+dragDY+"px,0)";
    tilesEl.style.transform=t;
    markersEl.style.transform=t;
    positionBase(dragDX,dragDY);
  };

  const commitDrag=(extraX=0,extraY=0)=>{
    const totalX=dragDX+extraX, totalY=dragDY+extraY;
    const next=unproject(dragWorld.x-totalX,dragWorld.y-totalY,state.z);
    state.lat=next.lat; state.lon=next.lon; clampState();
    dragDX=0; dragDY=0; render();
  };

  const warmRegion=name=>{
    const r=regions[name]; if(!r)return;
    const p=project(r.lat,r.lon,r.z), cx=Math.floor(p.x/TILE), cy=Math.floor(p.y/TILE), max=Math.pow(2,r.z);
    for(let y=cy-1;y<=cy+1;y++){
      if(y<0||y>=max)continue;
      for(let x=cx-1;x<=cx+1;x++){
        const wrapped=((x%max)+max)%max, img=new Image();
        img.decoding="async"; img.fetchPriority="low"; img.src=tileUrl(r.z,y,wrapped);
      }
    }
  };

  buildBase();
  if("requestIdleCallback" in window){
    requestIdleCallback(()=>{warmRegion("reykjavik");warmRegion("akureyri");warmRegion("egilsstadir")},{timeout:1200});
  }else{
    setTimeout(()=>{warmRegion("reykjavik");warmRegion("akureyri");warmRegion("egilsstadir")},300);
  }

  openBtn.addEventListener("click",()=>{
    dialog.showModal();
    requestAnimationFrame(()=>{setActiveRegion("iceland");state={...regions.iceland};render()});
  });
  closeBtn?.addEventListener("click",()=>dialog.close());
  resetBtn?.addEventListener("click",()=>goRegion("iceland"));
  zoomIn?.addEventListener("click",()=>setZoom(state.z+1));
  zoomOut?.addEventListener("click",()=>setZoom(state.z-1));
  regionBtns.forEach(btn=>btn.addEventListener("click",()=>goRegion(btn.dataset.mapRegion)));

  mapEl.addEventListener("pointerdown",e=>{
    if(e.target.closest("a,button"))return;
    dragging=true; dragStart={x:e.clientX,y:e.clientY}; dragWorld=project(state.lat,state.lon,state.z);
    dragDX=0; dragDY=0; velocity={x:0,y:0}; lastMove={x:e.clientX,y:e.clientY,t:performance.now()};
    mapEl.setPointerCapture?.(e.pointerId); mapEl.classList.add("dragging");
  });
  mapEl.addEventListener("pointermove",e=>{
    if(!dragging)return;
    dragDX=e.clientX-dragStart.x; dragDY=e.clientY-dragStart.y;
    const now=performance.now(), dt=Math.max(8,now-lastMove.t);
    velocity.x=(e.clientX-lastMove.x)/dt; velocity.y=(e.clientY-lastMove.y)/dt;
    lastMove={x:e.clientX,y:e.clientY,t:now};
    if(!raf)raf=requestAnimationFrame(applyDragFrame);
  });
  const stopDrag=e=>{
    if(!dragging)return;
    dragging=false; mapEl.releasePointerCapture?.(e.pointerId); mapEl.classList.remove("dragging");
    const speed=Math.hypot(velocity.x,velocity.y), inertia=speed>.12?Math.min(150,speed*80):0;
    if(inertia>0){
      const ex=velocity.x*inertia, ey=velocity.y*inertia;
      const tx=dragDX+ex, ty=dragDY+ey, dur=Math.min(240,120+inertia*.5);
      const transition="transform "+dur+"ms cubic-bezier(.18,.72,.2,1)";
      tilesEl.style.transition=transition; markersEl.style.transition=transition; baseEl.style.transition=transition;
      tilesEl.style.transform="translate3d("+tx+"px,"+ty+"px,0)";
      markersEl.style.transform="translate3d("+tx+"px,"+ty+"px,0)";
      positionBase(tx,ty);
      setTimeout(()=>{
        tilesEl.style.transition=""; markersEl.style.transition=""; baseEl.style.transition="";
        commitDrag(ex,ey);
      },dur+12);
    }else commitDrag();
  };
  mapEl.addEventListener("pointerup",stopDrag);
  mapEl.addEventListener("pointercancel",stopDrag);

  let wheelTimer=0;
  mapEl.addEventListener("wheel",e=>{
    e.preventDefault(); clearTimeout(wheelTimer);
    wheelTimer=setTimeout(()=>setZoom(state.z+(e.deltaY<0?1:-1)),24);
  },{passive:false});

  mapEl.addEventListener("keydown",e=>{
    const step=80, p=project(state.lat,state.lon,state.z);
    let dx=0,dy=0;
    if(e.key==="ArrowLeft")dx=step;
    if(e.key==="ArrowRight")dx=-step;
    if(e.key==="ArrowUp")dy=step;
    if(e.key==="ArrowDown")dy=-step;
    if(dx||dy){
      e.preventDefault(); const n=unproject(p.x-dx,p.y-dy,state.z); state.lat=n.lat;state.lon=n.lon;render();
    }
    if(e.key==="+"||e.key==="="){e.preventDefault();setZoom(state.z+1)}
    if(e.key==="-"){e.preventDefault();setZoom(state.z-1)}
  });

  window.addEventListener("resize",()=>{if(dialog.open)render()});
  dialog.addEventListener("click",e=>{
    const shell=dialog.querySelector(".atlas-map-shell"); if(!shell)return;
    const r=shell.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();
  });
});

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

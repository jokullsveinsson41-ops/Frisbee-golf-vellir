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
    ".atlas-copy > *, .quick-panel > *, .atlas-section-head > *, .atlas-card, .featured-atlas-card > *, .reyk-card, .graf-command-head > *, .graf-action, .graf-stats > span, .future-grid article, .nearby-course > *, .ed-hero-copy > *, .ed-intro > *, .ed-section-head > *, .ed-project, .ed-feature-copy > *, .reyk-editorial-copy > *, .reyk-row, .graf-ed-copy > *, .graf-ed-intro > *, .graf-ed-action"
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

  const hero=document.querySelector(".atlas-hero-image,.graf-hero>img,.atlas-city-hero>img,.ed-hero>img,.graf-ed-hero>img,.reyk-editorial-image>img");
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

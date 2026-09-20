document.addEventListener("DOMContentLoaded",()=>{
  const reveals=[...document.querySelectorAll("[data-reveal]")];
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add("in")}),{threshold:.12});
  reveals.forEach(e=>io.observe(e));

  const search=document.querySelector("#courseSearch");
  if(search){
    const cards=[...document.querySelectorAll(".course-card")];
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
      if(box){
        const r=box.getBoundingClientRect();
        const outside=e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;
        if(outside) dialog.close();
      }
    });
  });

  const share=document.querySelector("[data-share]");
  if(share){
    share.addEventListener("click",async()=>{
      const data={title:document.title,text:"Grafarholt frisbígolfvöllur",url:location.href};
      try{
        if(navigator.share) await navigator.share(data);
        else{
          await navigator.clipboard.writeText(location.href);
          share.textContent="Afritað ✓";
          setTimeout(()=>share.textContent="Deila velli",1600);
        }
      }catch(e){}
    });
  }

  const top=document.querySelector("[data-top]");
  if(top) top.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));
});
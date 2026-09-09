(() => {
 const mobile=matchMedia('(max-width:700px), (max-height:500px) and (pointer:coarse)');
 const horizon=()=>{const scene=document.getElementById('scene');return scene.getBoundingClientRect().bottom;};
 let frame=0;
 function sync(){frame=0;if(mobile.matches)document.body.style.setProperty('--reading-top',(scrollY+horizon())+'px');}
 function schedule(){if(!frame)frame=requestAnimationFrame(sync);}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);mobile.addEventListener('change',schedule);sync();
 const exit=document.createElement('button');exit.id='mobile-exit';exit.textContent='Back to voyage';exit.addEventListener('click',()=>window.dispatchEvent(new Event('voyage-navigate')));document.body.append(exit);
 const zoom=document.createElement('button');zoom.id='artifact-zoom';zoom.type='button';zoom.textContent='Zoom screenshot';zoom.setAttribute('aria-pressed','false');
 const visual=document.getElementById('artifact-visual');document.querySelector('.artifact-pagination').append(zoom);
 function reset(){visual.classList.remove('artifact-zoomed');zoom.textContent='Zoom screenshot';zoom.setAttribute('aria-pressed','false');}
 zoom.addEventListener('click',()=>{const active=visual.classList.toggle('artifact-zoomed');zoom.textContent=active?'Fit screenshot':'Zoom screenshot';zoom.setAttribute('aria-pressed',String(active));});
 new MutationObserver(()=>{reset();zoom.hidden=!visual.querySelector('img');}).observe(visual,{childList:true});
 document.getElementById('artifact-view').addEventListener('close',reset);
 // Align destination headings below the diorama instead of hiding them behind it.
 const sail=window.sailTo;
 window.sailTo=id=>{if(!mobile.matches||document.body.classList.contains('reading-view'))return sail(id);window.dispatchEvent(new Event('voyage-navigate'));const dialog=document.getElementById('map-dialog');if(dialog.open)dialog.close();const target=document.getElementById(id);if(!target)return;history.replaceState(null,'','#'+id);const heading=target.querySelector('.world-copy');scrollTo({top:Math.max(0,heading.getBoundingClientRect().top+scrollY-horizon()-24),behavior:'instant'});schedule();};
 document.querySelector('main').addEventListener('focusin',e=>{if(!mobile.matches||!e.target.matches(':focus-visible')||document.body.classList.contains('reading-view'))return;const top=e.target.getBoundingClientRect().top;if(top<horizon()+12)scrollBy(0,top-horizon()-24);});
})();
// Direct destination links use the same visible heading alignment as chart navigation.
addEventListener('load',()=>{const id=location.hash.slice(1);if(matchMedia('(max-width:700px), (max-height:500px) and (pointer:coarse)').matches && document.getElementById(id)?.classList.contains('chapter'))window.sailTo(id);},{once:true});

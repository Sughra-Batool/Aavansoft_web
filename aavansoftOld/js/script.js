
(()=>{
    document.documentElement.classList.add('js');
    const toggle=document.querySelector('.menu-toggle');
    const links=document.querySelector('.nav-links');
    const closeMenu=()=>{links.classList.remove('is-open');document.body.classList.remove('menu-open');toggle.setAttribute('aria-expanded','false');toggle.innerHTML='Menu <span aria-hidden="true">＋</span>'};
    toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));links.classList.toggle('is-open',open);document.body.classList.toggle('menu-open',open);toggle.innerHTML=open?'Close <span aria-hidden="true">×</span>':'Menu <span aria-hidden="true">＋</span>'});
    links.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
    const items=document.querySelectorAll('.reveal');
    if('IntersectionObserver' in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.12});items.forEach(item=>observer.observe(item))}else{items.forEach(item=>item.classList.add('is-visible'))}
    const dot=document.querySelector('.cursor-dot');
    if(window.matchMedia('(pointer:fine)').matches&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){window.addEventListener('pointermove',e=>{dot.style.left=e.clientX+'px';dot.style.top=e.clientY+'px'});document.querySelectorAll('a,button').forEach(el=>{el.addEventListener('pointerenter',()=>dot.classList.add('is-active'));el.addEventListener('pointerleave',()=>dot.classList.remove('is-active'))})}
})();

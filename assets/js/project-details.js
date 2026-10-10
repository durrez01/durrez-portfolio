
    /* Short, cancellable entrances; no additional animation clock. */
window.renderStudyTitle=function(heading,title,reduced){
 heading.getAnimations({subtree:true}).forEach(a=>a.cancel());
 heading.replaceChildren();heading.setAttribute('aria-label',title);
 title.split(' ').forEach((word,i)=>{
  const mask=document.createElement('span'),ink=document.createElement('span');
  mask.className='project-title-mask';mask.setAttribute('aria-hidden','true');ink.textContent=word;mask.append(ink);heading.append(mask,document.createTextNode(' '));
  if(!reduced)ink.animate([{transform:'translateY(105%)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:620,delay:60+i*55,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
 });
};
window.renderStudyNotes=function(host,p){
 host.replaceChildren();
 const label=document.createElement('h3');label.className='micro';label.textContent=p.label;host.append(label);
 const items=document.createElement(p.layout==='quote'?'blockquote':'div');items.className='study-fragments';
 p.fragments.forEach((text,i)=>{
  const item=document.createElement('div');item.className='study-fragment';
  if(text.includes(' / ')){const [key,...rest]=text.split(' / '),small=document.createElement('span'),value=document.createElement('strong');small.textContent=key;value.textContent=rest.join(' / ');item.append(small,value);}
  else{item.textContent=text;}
  item.style.setProperty('--fragment-index',i);items.append(item);
 });host.append(items);
};

  
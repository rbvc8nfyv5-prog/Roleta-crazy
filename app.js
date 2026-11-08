/* Vitória Master · JavaScript completo · 33 casas da roda europeia. */
(() => {
"use strict";
const VIEW = "<style>\n:host{color-scheme:dark;--bg:#101418;--panel:#1b2229;--border:#34424b;--text:#eef5f3;--muted:#bdc9cb;--accent:#8ff0b8}\n*{box-sizing:border-box}:host{display:block;position:fixed;inset:0;z-index:2147483647;overflow:auto;margin:0;background:var(--bg);color:var(--text);font:16px/1.5 system-ui,sans-serif}main{max-width:760px;margin:auto;padding:20px 14px 40px}h1,h2,p{margin:0 0 10px}h1{font-size:2rem;line-height:1.1}h2{font-size:1.15rem}header{margin-bottom:18px}.muted,small{color:var(--muted)}section{background:var(--panel);border:1px solid var(--border);border-radius:12px;margin:12px 0;padding:14px}label{display:block;margin-bottom:4px}textarea,button,select,input{font:inherit;color:inherit;border:1px solid var(--border);border-radius:7px;background:#111a20;padding:8px}textarea{display:block;width:100%;resize:vertical;min-height:65px}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}button{min-height:44px;cursor:pointer}button.primary{background:var(--accent);color:#10231a;border-color:transparent;font-weight:650}button:disabled{opacity:.5;cursor:default}button:focus-visible,textarea:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0}.stats div{border-top:1px solid var(--border);padding-top:7px}.stats strong{display:block;font-size:1.4rem}.number-list{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0}.chip{display:inline-flex;min-width:30px;padding:2px 4px;justify-content:center;border-radius:5px;border:1px solid var(--border);font-variant-numeric:tabular-nums}.red{background:#702a36}.black{background:#10151b}.zero{background:#26543f}.omitted{outline:2px solid #ffc897;outline-offset:-2px}.groups{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}.groups span{background:#111a20;border-radius:6px;padding:4px 7px}.keys{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:5px}.keys button{padding:3px}.good{color:var(--accent)}.bad{color:#ffc897}#status{min-height:1.5em}.audit{list-style:none;padding:0;margin:8px 0 0}.audit li{padding:5px 0;border-top:1px solid var(--border)}@media(max-width:480px){.keys{grid-template-columns:repeat(7,minmax(0,1fr))}}\n\n#close{float:right;margin-left:8px}</style>\n<main>\n<header><button id=\"close\" type=\"button\" aria-label=\"Fechar Vitória Master\">Fechar</button><h1>Vitória Master</h1><p class=\"muted\">Roleta europeia · 33 casas · acertos de primeira</p></header>\n<section aria-labelledby=\"import-heading\">\n<h2 id=\"import-heading\">Histórico inicial</h2>\n<label for=\"history\">Cole os números de 0 a 36</label>\n<textarea id=\"history\" rows=\"2\" placeholder=\"26 20 27 4 32\"></textarea>\n<div class=\"row\"><label for=\"order\" class=\"muted\">Ordem do histórico</label><select id=\"order\"><option value=\"oldest\">Mais antigo primeiro</option><option value=\"newest\">Mais recente primeiro</option></select><button class=\"primary\" id=\"import\">Importar</button></div>\n<div id=\"status\" role=\"status\" aria-live=\"polite\"></div>\n</section>\n<section aria-labelledby=\"coverage-heading\">\n<h2 id=\"coverage-heading\">Cobertura para o próximo giro</h2>\n<div class=\"groups\" id=\"groups\"></div>\n<p id=\"outside\" class=\"muted\"></p>\n<div class=\"number-list\" id=\"wheel\" aria-label=\"Números na ordem da roda\"></div>\n<div class=\"stats\" aria-label=\"Placar das primeiras entradas\">\n<div><strong id=\"hits\">0</strong><small>Acertos</small></div>\n<div><strong id=\"misses\">0</strong><small>LOSS</small></div>\n<div><strong id=\"total\">0</strong><small>Giros lançados</small></div>\n</div>\n<p class=\"muted\" id=\"goal\">Meta de referência · 105 acertos em 110 giros</p>\n<div id=\"latest\" role=\"status\" aria-live=\"polite\"></div>\n</section>\n<section aria-labelledby=\"entry-heading\">\n<h2 id=\"entry-heading\">Lançar resultado</h2>\n<div class=\"keys\" id=\"keys\"></div>\n<div class=\"row\"><button id=\"undo\">Desfazer último giro</button></div>\n<ol id=\"audit\" class=\"audit\" aria-label=\"Últimos resultados\"></ol>\n</section>\n<section aria-labelledby=\"replay-heading\">\n<h2 id=\"replay-heading\">Simular sequência</h2>\n<label for=\"replay\">Resultados de teste, do mais antigo ao mais recente</label>\n<textarea id=\"replay\" rows=\"2\" placeholder=\"Cole os giros que vieram depois da importação\"></textarea>\n<div class=\"row\"><button id=\"simulate\">Simular com histórico inicial</button></div>\n<p id=\"simulation\" role=\"status\" aria-live=\"polite\"></p>\n</section>\n</main>";
const WHEEL=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const POSITION=new Map(WHEEL.map((n,i)=>[n,i]));
const mod=i=>(i+37)%37;
const valid=n=>Number.isInteger(n)&&n>=0&&n<=36;
const CLASS=WHEEL.map(n=>n===0?0:1+2*Number(n>=19)+Number(RED.has(n)));
const CLASS_SIZE=[0,0,0,0,0];
for(const c of CLASS) CLASS_SIZE[c]++;

function layouts(){
  const result=[],seen=new Set();
  function place(gaps,left){
    if(gaps.length<6){
      for(let gap=0;gap<=left;gap++) place([...gaps,gap],left-gap);
      return;
    }
    const spaces=[...gaps,left];
    for(let start=0;start<37;start++){
      const centers=[],outside=[];
      let cursor=start;
      for(let block=0;block<7;block++){
        const radius=block===0?1:2;
        centers.push(mod(cursor+radius));
        cursor+=2*radius+1;
        for(let i=0;i<spaces[block];i++) outside.push(mod(cursor++));
      }
      const key=[...outside].sort((a,b)=>a-b).join(',');
      if(seen.has(key))continue;
      seen.add(key);
      result.push({centers,outside});
    }
  }
  place([],4);
  return result;
}
const LAYOUTS=layouts();

function bestLayout(weights,tieStart){
  let best,cost=Infinity;
  for(let k=0;k<LAYOUTS.length;k++){
    const option=LAYOUTS[(k+tieStart)%LAYOUTS.length];
    const [a,b,c,d]=option.outside;
    const loss=weights[a]+weights[b]+weights[c]+weights[d];
    if(loss<cost-1e-12){best=option;cost=loss;}
  }
  return best;
}

function normalized(values,prior){
  const sum=values.reduce((a,b)=>a+b,0)+37*prior;
  return values.map(value=>(value+prior)/sum);
}

class VitoriaMaster {
  constructor(seed=[]){
    this.history=[];
    this.skill=[0,0,0,0,0,0,0];
    this.rows=[];
    this.total=0;
    this.hits=0;
    this.hash=1;
    this.pending=null;
    for(const number of seed)this.observe(number,false);
  }

  forecasts(){
    const h=this.history,last=h.at(-1);
    const freq=Array(37).fill(0),sectors=Array(37).fill(0),jumps=Array(37).fill(0),classes=[0,0,0,0,0];
    for(let i=0;i<h.length;i++){
      const pos=h[i],age=h.length-1-i,decay=Math.pow(.97,age);
      freq[pos]+=decay;
      classes[CLASS[pos]]+=decay;
      for(let d=-2;d<=2;d++)sectors[mod(pos+d)]+=decay*(3-Math.abs(d))/9;
      if(i>0&&last!==undefined){
        const delta=mod(pos-h[i-1]);
        const gap=Math.abs(h[i-1]-last);
        const distance=Math.min(gap,37-gap);
        jumps[mod(last+delta)]+=decay*Math.exp(-distance/4);
      }
    }
    const group=WHEEL.map((_,i)=>classes[CLASS[i]]/CLASS_SIZE[CLASS[i]]);
    const successor=Array(37).fill(0), context=Array(37).fill(0), pattern=Array(37).fill(0);
    // Cada posição i tem um sucessor já conhecido em i+1.
    // A última posição conhecida fornece o contexto a procurar, nunca o desfecho.
    for(let i=0;i<h.length-1;i++){
      const age=h.length-2-i,weight=Math.pow(.985,age);
      const matches=h[i]===last;
      const sameClass=CLASS[h[i]]===CLASS[last];
      if(matches)successor[h[i+1]]+=weight;
      if(sameClass){
        const previous=h.at(-2);
        const previousMatches=i>0&&previous!==undefined&&CLASS[h[i-1]]===CLASS[previous];
        context[h[i+1]]+=weight*(previousMatches?1:.25);
      }
      if(i>=2&&h.length>=3){
        const previous=h.at(-2), older=h.at(-3);
        const a=mod(h[i]-h[i-1]),b=mod(h[i-1]-h[i-2]);
        const x=mod(last-previous),y=mod(previous-older);
        const distance=(p,q)=>Math.min(Math.abs(p-q),37-Math.abs(p-q));
        const error=distance(a,x)+distance(b,y);
        if(error<=4)pattern[mod(last+mod(h[i+1]-h[i]))]+=weight*Math.exp(-error);
      }
    }
    return [normalized(freq,1),normalized(sectors,1),normalized(jumps,1),normalized(group,1),
      normalized(successor,.20),normalized(context,.45),normalized(pattern,.20)];
  }

  next(){
    if(this.pending)return this.pending;
    const forecasts=this.forecasts();
    const trust=this.skill.map((score,i)=>{
      if(i>=4&&score<=2)return 0;
      const adjusted=i>=4?score-2:score;
      return Math.exp(Math.max(-3,Math.min(3,adjusted)));
    });
    const mass=3+trust.reduce((a,b)=>a+b,0);
    const weights=WHEEL.map((_,i)=>(3/37+forecasts.reduce((sum,row,j)=>sum+trust[j]*row[i],0))/mass);
    const layout=bestLayout(weights,this.hash%LAYOUTS.length);
    const groups=layout.centers.map((pos,i)=>{
      const radius=i===0?1:2;
      return {center:WHEEL[pos],radius,numbers:Array.from({length:2*radius+1},(_,j)=>WHEEL[mod(pos+j-radius)])};
    });
    const outside=layout.outside.map(i=>WHEEL[i]);
    const covered=groups.flatMap(group=>group.numbers);
    this.pending={covered,outside,groups,forecasts};
    return this.pending;
  }

  observe(number,record=true){
    if(!valid(number))throw new RangeError('Use um número inteiro de 0 a 36.');
    const prediction=this.next(),pos=POSITION.get(number);
    for(let i=0;i<this.skill.length;i++){
      this.skill[i]=.95*this.skill[i]+Math.log(37*prediction.forecasts[i][pos]);
    }
    const hit=!prediction.outside.includes(number);
    if(record){
      this.total++;
      this.hits+=Number(hit);
      this.rows.push({number,hit,turn:this.total,outside:[...prediction.outside]});
      if(this.rows.length>110)this.rows.shift();
    }
    this.history.push(pos);
    if(this.history.length>120)this.history.shift();
    this.hash=(Math.imul(this.hash,16777619)^number)>>>0;
    this.pending=null;
    return hit;
  }
}

function parseNumbers(text){
  const tokens=text.trim().split(/[\s,;|]+/).filter(Boolean);
  if(!tokens.length||tokens.some(token=>!/^\d{1,2}$/.test(token)||!valid(Number(token)))){
    throw new Error('Use números inteiros de 0 a 36, separados por espaço ou vírgula.');
  }
  if(tokens.length>5000)throw new Error('Use até 5.000 números por vez.');
  return tokens.map(Number);
}

function startUI(root){
  const $=id=>root.getElementById(id);
  const key='vitoria-master-js-1';
  let seed=[],manual=[],motor;
  try{
    const saved=JSON.parse(localStorage.getItem(key)||'null');
    if(Array.isArray(saved?.seed)&&saved.seed.every(valid)&&Array.isArray(saved?.manual)&&saved.manual.every(valid)){
      seed=saved.seed;manual=saved.manual;
    }
  }catch{}
  function rebuild(){
    motor=new VitoriaMaster(seed);
    for(const number of manual)motor.observe(number);
  }
  function save(){
    try{localStorage.setItem(key,JSON.stringify({seed,manual}));}
    catch{$('status').textContent='O navegador bloqueou o salvamento desta sessão.';}
  }
  const color=n=>n===0?'zero':RED.has(n)?'red':'black';
  function render(){
    const play=motor.next(),outside=new Set(play.outside);
    $('wheel').innerHTML=WHEEL.map(n=>'<span class="chip '+color(n)+(outside.has(n)?' omitted':'')+'">'+n+'</span>').join('');
    $('outside').textContent='Quatro de fora · '+play.outside.join(' · ');
    $('groups').innerHTML=play.groups.map(g=>'<span>'+g.center+' ± '+g.radius+'</span>').join('');
    $('hits').textContent=motor.hits;
    $('misses').textContent=motor.total-motor.hits;
    $('total').textContent=motor.total;
    $('undo').disabled=!manual.length;
    const last=motor.rows.at(-1);
    $('latest').textContent=last?'Último giro · '+last.number+' · '+(last.hit?'ACERTO':'LOSS'):'';
    $('latest').className=last?(last.hit?'good':'bad'):'';
    $('audit').innerHTML=motor.rows.slice(-8).reverse().map(r=>'<li>Giro '+r.turn+' · '+r.number+' · <strong class="'+(r.hit?'good':'bad')+'">'+(r.hit?'ACERTO':'LOSS')+'</strong> · fora: '+r.outside.join(' · ')+'</li>').join('');
  }
  rebuild();
  for(let n=0;n<=36;n++){
    const button=document.createElement('button');
    button.type='button';button.className=color(n);button.textContent=n;
    button.addEventListener('click',()=>{motor.observe(n);manual.push(n);render();save();});
    $('keys').appendChild(button);
  }
  $('import').addEventListener('click',()=>{
    try{
      const next=parseNumbers($('history').value);
      if($('order').value==='newest')next.reverse();
      seed=next;manual=[];rebuild();
      $('status').textContent=seed.length+' números importados.';
      $('simulation').textContent='';
      render();save();
    }catch(error){$('status').textContent=error.message;}
  });
  $('undo').addEventListener('click',()=>{
    if(manual.length){manual.pop();rebuild();render();save();}
  });
  $('simulate').addEventListener('click',()=>{
    try{
      const numbers=parseNumbers($('replay').value), test=new VitoriaMaster(seed);
      for(const number of numbers)test.observe(number);
      $('simulation').textContent=test.hits+' / '+test.total+' acertos · '+(test.total-test.hits)+' LOSS'+(test.total===110?' · '+(test.hits>=105?'meta de 105 atingida':'abaixo da meta de 105'):'')+'.';
    }catch(error){$('simulation').textContent=error.message;}
  });
  render();
}
if(typeof module==='object'&&module.exports)module.exports={VitoriaMaster,WHEEL,LAYOUTS,bestLayout,parseNumbers};
if(typeof document!=='undefined'){
  const install=()=>{
    const id='vitoria-master-host';
    const existing=document.getElementById(id);
    if(existing){existing.focus();return;}
    const host=document.createElement('div');
    host.id=id;
    host.tabIndex=-1;
    const root=host.attachShadow({mode:'open'});
    root.innerHTML=VIEW;
    document.body.appendChild(host);
    root.getElementById('close').addEventListener('click',()=>host.remove());
    startUI(root);
  };
  if(document.body)install();
  else document.addEventListener('DOMContentLoaded',install,{once:true});
}
})();

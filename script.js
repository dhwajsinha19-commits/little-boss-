const ITEMS=[
 {id:'combo',price:69,hot:true},
 {id:'biryani',price:60},
 {id:'chips',price:15},
 {id:'soda',price:15},
];
const T={
 en:{only:'WE ONLY SELL IN UDAIPUR RIGHT NOW',locPh:'Type your address or area in Udaipur',tag:'Chhota Boss. Bada Taste!',by:'by Dhwaj',navPre:'Pre-order',navList:'Order list',cta:'Pre-order now',
  preTitle:'Pre-order',preSub:'Order up to 2 days ahead. Open 8 AM to 10 PM, delivering in Udaipur.',
  sDate:'Pick a date',sTime:'Pick a time (8 AM – 10 PM)',sLoc:'Your location in Udaipur',sFood:'What do you want to eat?',sName:'Your name',
  namePh:'e.g. Rahul',total:'Total',go:'Pre-order',today:'Today',tomorrow:'Tomorrow',
  chooseTime:'Choose a time',chooseLoc:'Choose a location',
  combo:'Biryani Combo',comboD:'300 g biryani + chips + soda',biryani:'Biryani',biryaniD:'300 g biryani',chips:'Chips',chipsD:'Crunchy chips, on their own',soda:'Soda',sodaD:'Cold soda, on its own',
  listTitle:'Order list',listSub:'Everyone can see who ordered, when and where. Updates by itself.',empty:'No orders yet. Be the first!',
  placing:'Placing your order…',done:n=>`Thank you ${n}! Your pre-order is in.`,
  e_name:'Please enter your name.',e_loc:'Please type your location in Udaipur.',e_items:'Pick at least one item.',e_past:'That time has already passed, pick a later one.',e_fail:'Could not place the order. Try again.',
  foot:'Little Boss Biryani · Udaipur, India',x:'×',
  loading:'Pick your language'},
 hi:{only:'अभी हम सिर्फ उदयपुर में ही बेचते हैं',locPh:'उदयपुर में अपना पता या इलाका लिखें',tag:'छोटा बॉस, बड़ा टेस्ट!',by:'धवज द्वारा',navPre:'प्री-ऑर्डर',navList:'ऑर्डर सूची',cta:'अभी प्री-ऑर्डर करें',
  preTitle:'प्री-ऑर्डर',preSub:'2 दिन पहले तक ऑर्डर करें। सुबह 8 से रात 10 बजे तक, उदयपुर में।',
  sDate:'तारीख चुनें',sTime:'समय चुनें (सुबह 8 – रात 10)',sLoc:'उदयपुर में आपकी जगह',sFood:'क्या खाना है?',sName:'आपका नाम',
  namePh:'जैसे: राहुल',total:'कुल',go:'प्री-ऑर्डर करें',today:'आज',tomorrow:'कल',
  chooseTime:'समय चुनें',chooseLoc:'जगह चुनें',
  combo:'बिरयानी कॉम्बो',comboD:'300 ग्राम बिरयानी + चिप्स + सोडा',biryani:'बिरयानी',biryaniD:'300 ग्राम बिरयानी',chips:'चिप्स',chipsD:'कुरकुरे चिप्स, अकेले',soda:'सोडा',sodaD:'ठंडा सोडा, अकेला',
  listTitle:'ऑर्डर सूची',listSub:'कौन, कब और कहाँ से ऑर्डर कर रहा है, सब देख सकते हैं। अपने आप अपडेट होती है।',empty:'अभी कोई ऑर्डर नहीं। पहले आप बनें!',
  placing:'ऑर्डर हो रहा है…',done:n=>`धन्यवाद ${n}! आपका प्री-ऑर्डर हो गया।`,
  e_name:'कृपया अपना नाम लिखें।',e_loc:'कृपया उदयपुर में अपनी जगह लिखें।',e_items:'कम से कम एक चीज़ चुनें।',e_past:'यह समय निकल चुका है, आगे का समय चुनें।',e_fail:'ऑर्डर नहीं हो पाया। फिर कोशिश करें।',
  foot:'लिटिल बॉस बिरयानी · उदयपुर, भारत',x:'×',
  loading:'भाषा चुनें'}
};
let lang=(()=>{try{return localStorage.getItem('lbb-lang')}catch(e){}})()||'en';
const $=s=>document.querySelector(s);
const qty={combo:0,biryani:0,chips:0,soda:0};
let state={orders:[],now:null,locations:[]};
let selDate=null;

// IST helpers (everything is Udaipur time)
const fmtIST=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function nowIST(){const p=Object.fromEntries(fmtIST.formatToParts(new Date()).map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,min:+p.hour*60+ +p.minute}}
function addDays(iso,n){const d=new Date(iso+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function dayLabel(iso,long){const d=new Date(iso+'T00:00:00Z');return d.toLocaleDateString(lang==='hi'?'hi-IN':'en-IN',{weekday:long?'long':'short',day:'numeric',month:'short',timeZone:'UTC'})}
function t12(hhmm){const [h,m]=hhmm.split(':').map(Number);const ap=h>=12?(lang==='hi'?'बजे':'PM'):(lang==='hi'?'बजे':'AM');const hh=h%12||12;return lang==='hi'?`${h<12?'सुबह':h<17?'दोपहर':h<20?'शाम':'रात'} ${hh}:${String(m).padStart(2,'0')}`:`${hh}:${String(m).padStart(2,'0')} ${ap}`}

function applyLang(){
  document.documentElement.lang=lang;const t=T[lang];
  document.querySelectorAll('[data-t]').forEach(e=>{const v=t[e.dataset.t];if(typeof v==='string')e.textContent=v});
  $('#langBtn').textContent=lang==='en'?'हिन्दी':'English';
  $('#name').placeholder=t.namePh;$('#loc').placeholder=t.locPh;$('#sTag').textContent=t.tag;
  renderDates();renderTimes();renderMenu();renderOrders();updateTotal();
}
function renderDates(){
  const n=nowIST().date;const t=T[lang];
  $('#dates').innerHTML='';
  [0,1,2].forEach(i=>{const iso=addDays(n,i);
    const l=document.createElement('label');
    l.innerHTML=`<input type="radio" name="date" value="${iso}"><span></span>`;
    l.querySelector('span').innerHTML=`${i===0?t.today:i===1?t.tomorrow:dayLabel(iso,true)}<small>${dayLabel(iso)}</small>`;
    const inp=l.querySelector('input');
    if(selDate? selDate===iso : i===0){inp.checked=true;selDate=iso}
    inp.onchange=()=>{selDate=iso;renderTimes()};
    $('#dates').append(l)});
}
function renderTimes(){
  const sel=$('#time'),prev=sel.value,n=nowIST(),t=T[lang];
  sel.innerHTML=`<option value="">${t.chooseTime}</option>`;
  for(let m=8*60;m<=22*60;m+=30){
    if(selDate===n.date&&m<=n.min)continue;
    const v=`${String(m/60|0).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
    sel.add(new Option(t12(v),v));
  }
  if([...sel.options].some(o=>o.value===prev))sel.value=prev;
}
function renderMenu(){
  const t=T[lang];$('#menu').innerHTML='';
  ITEMS.forEach(it=>{
    const d=document.createElement('div');d.className='item'+(it.hot?' hot':'');
    d.innerHTML=`<h3>${t[it.id]}</h3><p>${t[it.id+'D']}</p><div class="row"><span class="price">₹${it.price}</span>
      <div class="qty"><button type="button" aria-label="−">−</button><output>${qty[it.id]}</output><button type="button" aria-label="+">+</button></div></div>`;
    const [minus,plus]=d.querySelectorAll('button'),out=d.querySelector('output');
    minus.onclick=()=>{qty[it.id]=Math.max(0,qty[it.id]-1);out.textContent=qty[it.id];updateTotal()};
    plus.onclick=()=>{qty[it.id]=Math.min(20,qty[it.id]+1);out.textContent=qty[it.id];updateTotal()};
    $('#menu').append(d)});
}
const totalOf=q=>ITEMS.reduce((s,i)=>s+i.price*q[i.id],0);
function updateTotal(){$('#total').textContent='₹'+totalOf(qty)}

function itemsText(items){const t=T[lang];return Object.entries(items).map(([k,v])=>`${v}${t.x} ${t[k]}`).join(', ')}
function renderOrders(){
  const box=$('#orders');box.innerHTML='';
  if(!state.orders.some(o=>o.date>=nowIST().date)){box.innerHTML=`<div class="empty">${T[lang].empty}</div>`;return}
  const today=nowIST().date;
  const list=state.orders.filter(o=>o.date>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  let cur='';
  list.forEach(o=>{
    if(o.date!==cur){cur=o.date;const h=document.createElement('div');h.className='day';h.textContent=dayLabel(o.date,true);box.append(h)}
    const d=document.createElement('div');d.className='order';
    const mk=(c,tx)=>{const e=document.createElement('div');e.className=c;e.textContent=tx;return e};
    d.append(mk('t',t12(o.time)),mk('who',o.name),mk('amt','₹'+o.total),mk('what',itemsText(o.items)),mk('where','📍 '+o.location));
    box.append(d)});
}
async function refresh(){
  try{const r=await fetch('/api/orders');const j=await r.json();state=j;renderOrders()}catch(e){}
}
$('#form').addEventListener('submit',async e=>{
  e.preventDefault();const t=T[lang],msg=$('#msg');msg.className='msg';
  const name=$('#name').value.trim();
  if(!$('#loc').value.trim()){msg.textContent=t.e_loc;msg.classList.add('err');return}
  const items=Object.fromEntries(Object.entries(qty).filter(([,v])=>v>0));
  if(!name){msg.textContent=t.e_name;msg.classList.add('err');return}
  if(!items.combo&&!Object.keys(items).length){msg.textContent=t.e_items;msg.classList.add('err');return}
  $('#go').disabled=true;msg.textContent=t.placing;
  try{
    const r=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name,date:selDate,time:$('#time').value,location:$('#loc').value.trim(),items})});
    const j=await r.json();
    if(!r.ok){msg.textContent=j.error==='past'?t.e_past:j.error==='name'?t.e_name:j.error==='location'?t.e_loc:j.error==='items'?t.e_items:t.e_fail;msg.classList.add('err')}
    else{msg.textContent=t.done(name);msg.classList.add('ok');
      Object.keys(qty).forEach(k=>qty[k]=0);$('#name').value='';renderMenu();updateTotal();refresh();
      $('#list').scrollIntoView({behavior:'smooth'})}
  }catch(err){msg.textContent=t.e_fail;msg.classList.add('err')}
  $('#go').disabled=false;
});
$('#langBtn').onclick=()=>setLang(lang==='en'?'hi':'en');
function setLang(l){lang=l;try{localStorage.setItem('lbb-lang',l)}catch(e){}applyLang()}

// loading screen: bar fills, then the language choice appears
setTimeout(()=>{$('#bar').style.display='none';$('#langs').classList.add('show');$('#sTag').textContent=T.en.loading+' · '+T.hi.loading},1700);
document.querySelectorAll('#langs button').forEach(b=>b.onclick=()=>{setLang(b.dataset.l);$('#splash').classList.add('gone')});

applyLang();refresh();setInterval(refresh,10000);

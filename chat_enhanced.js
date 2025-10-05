const SETTINGS = {
  contactName: "Alex",
  avatar: "assets/avatar.jpg",
  checkoutURL: "https://www.revealpoker.top",

  preName: [
    { type:"text",  text:"Hey! I noticed you're interested in poker. Can I ask you something real quick?" },
    { type:"quick", options:["Sure, what's up?", "I'm busy right now"], side:"right", asUser:true, wait:"name" }
  ],

  afterName: [
    { type:"text",  text:"Perfect! So tell me, {name} - what's your biggest frustration when playing online poker?" },
    { type:"quick", options:["Bad beats from fish", "Never knowing what they have", "Feels like pure luck"], side:"right", asUser:true },

    { type:"text",  text:"I totally get that. It's maddening when you make the 'right' play and still lose, right?" },
    { type:"text",  text:"But what if I told you there's a way to eliminate that uncertainty completely?" },
    { type:"quick", options:["I'm listening...", "Sounds impossible"], side:"right", asUser:true },

    { type:"text",  text:"It's called Reveal App, and it literally shows you your opponents' hole cards before you make any decision." },
    { type:"text",  text:"Imagine never having to guess again. Every fold, every call, every bluff - you'll know exactly what they're holding." },
    { type:"image", src:"assets/poker_hand.jpg", alt:"Poker Hand Revealed" },
    { type:"quick", options:["How is that possible?", "Is this legal?"], side:"right", asUser:true },

    { type:"text",  text:"It works by intercepting the game's data packets in real-time and decrypting them using advanced algorithms." },
    { type:"text",  text:"And yes, it's completely safe. It doesn't modify any game files, so it's 100% undetectable." },
    { type:"text",  text:"Want to see the concept in action?" },
    { type:"quick", options:["Show me!", "I'm still skeptical"], side:"right", asUser:true },

    { type:"text",  text:"Check this out - this explains the advantage you'll have:" },
    { type:"video", src:"https://www.youtube.com/embed/20vdGC-_Qms" },
    { type:"text",  text:"Pretty powerful, right? But don't just take my word for it..." },
    
    { type:"text",  text:"Here's a real user sharing how Reveal App completely transformed his poker game:" },
    { type:"localvideo", src:"assets/testimonial.mp4" },
    
    { type:"text",  text:"That could be you, {name}. Imagine turning your poker sessions from stressful gambling into consistent profit." },
    { type:"text",  text:"Over 2,900 players are already using this to dominate tables on PokerStars, GGPoker, UPOKER, and 12+ other platforms." },
    { type:"quick", options:["How much does it cost?", "I want to try it"], side:"right", asUser:true },

    { type:"text",  text:"The investment is surprisingly affordable for what you get. And remember - this pays for itself in just one session." },
    { type:"text",  text:"Ready to stop guessing and start winning consistently?" },

    { type:"cta",   text:"Join 2,900+ winning players and get your unfair advantage now", buttonText:"Get Reveal App Now" }
  ]
};

// ===== Timings =====
const TIMINGS = {
  baseGap: 1200,
  typingPerCharMin: 35,
  typingPerCharMax: 65,
  typingMin: 1200,
  typingMax: 6000,
  afterUserGap: 2500,
  recordingExtraMin: 2000,
  recordingExtraMax: 3500
};

// ===== Elements =====
const $messages = document.getElementById("messages");
const $form = document.getElementById("chat-form");
const $input = document.getElementById("chat-input");
const $status = document.getElementById("status");

const ICONS = {
  play: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
  pause: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/></svg>'
};

document.getElementById("contact-name").textContent = SETTINGS.contactName;
document.getElementById("avatar").src = SETTINGS.avatar;

// ===== Estado =====
let leadName = "";
let waiting = null;
let resumeFn = null;

// ===== Sound =====
let __userInteracted = false;
window.addEventListener("pointerdown", ()=>{ __userInteracted = true; }, {once:true});
window.addEventListener("keydown", ()=>{ __userInteracted = true; }, {once:true});

const botDing = (() => {
  try{
    const a = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT");
    a.volume = 0.3;
    return () => {
      if (!__userInteracted) return;
      try{ a.currentTime = 0; a.play().catch(()=>{}); }catch{}
    };
  }catch{
    return () => {};
  }
})();

// ===== Helpers =====
const THUMB_SIZE = 36;
const now = () => new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
const rand = (min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const scroll = () => { $messages.scrollTop = $messages.scrollHeight; };
const fmt = s => { if(!isFinite(s)) return "0:00"; const m=Math.floor(s/60); const ss=Math.floor(s%60).toString().padStart(2,"0"); return `${m}:${ss}`; };

function setInputVisible(show, placeholder="Write a message"){
  if (show){
    $form.classList.remove("hidden");
    $form.style.display = "flex";
    if (placeholder) $input.placeholder = placeholder;
    $input.disabled = false;
  }else{
    $form.classList.add("hidden");
    $form.style.display = "none";
    $input.disabled = true;
    $input.blur();
  }
}
setInputVisible(false);

// ===== UI helpers =====
function row(side){
  const r = document.createElement("div");
  r.className = `row ${side}`;
  if (side === "left"){
    const t = document.createElement("div");
    t.className = "thumb";
    t.innerHTML = `<img src="${SETTINGS.avatar}" alt="avatar">`;
    r.appendChild(t);
  }else{
    const s=document.createElement("div");
    s.style.width = THUMB_SIZE + "px";
    r.appendChild(s);
  }
  return r;
}

function bubble(inner){ 
  const b=document.createElement("div"); 
  b.className="bubble enter"; 
  b.innerHTML=inner; 
  return b; 
}

function meta(){
  const m=document.createElement("div");
  m.className="meta";
  m.innerHTML=`<span class="time">${now()}</span><span class="checks">✓✓</span>`;
  return m;
}

function markSeenLater(el){ 
  setTimeout(()=>{ if(el) el.classList.add("seen"); }, rand(1500,3500)); 
}

function addText(side,text){
  const r=row(side);
  const b=bubble(`<div>${text}</div>`);
  const m=meta(); b.appendChild(m); r.appendChild(b);
  $messages.appendChild(r); scroll(); markSeenLater(m.querySelector('.checks'));
  if (side === "left") botDing();
}

function addImage(side,src,alt){
  const r=row(side);
  const b=bubble(`<img src="${src}" alt="${alt||""}" style="max-width:320px;border-radius:6px;display:block">`);
  const m=meta(); b.appendChild(m); r.appendChild(b);
  $messages.appendChild(r); scroll(); markSeenLater(m.querySelector('.checks'));
  if (side === "left") botDing();
}

function addVideo(side,src){
  const r=row(side);
  const b=bubble(`<div class="video-container"><iframe src="${src}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`);
  const m=meta(); b.appendChild(m); r.appendChild(b);
  $messages.appendChild(r); scroll(); markSeenLater(m.querySelector('.checks'));
  if (side === "left") botDing();
}

function addLocalVideo(side,src){
  const r=row(side);
  const b=bubble(`<video controls style="max-width:320px;border-radius:6px;display:block"><source src="${src}" type="video/mp4">Your browser does not support the video tag.</video>`);
  const m=meta(); b.appendChild(m); r.appendChild(b);
  $messages.appendChild(r); scroll(); markSeenLater(m.querySelector('.checks'));
  if (side === "left") botDing();
}

function addCTA(text,btn,name){
  const r=row("left");
  const url=new URL(SETTINGS.checkoutURL);
  new URLSearchParams(location.search).forEach((v,k)=>url.searchParams.set(k,v));
  url.searchParams.set("name", name||"");
  const b=bubble(`<div>${text}</div><div class="cta"><a href="${url}" target="_blank" rel="noopener">${btn}</a></div>`);
  const m=meta(); b.appendChild(m); r.appendChild(b);
  $messages.appendChild(r); scroll(); markSeenLater(m.querySelector('.checks'));
  botDing();
}

function addTyping(side="left"){
  const r = row(side);
  r.classList.add("typing-wrap");
  const bb = document.createElement("div");
  bb.className = "bubble";
  bb.innerHTML = `<div class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
  r.appendChild(bb);
  $messages.appendChild(r);
  scroll();
  return r;
}

function addChips(options, side="left", asUser=false, onPick=()=>{}){
  setInputVisible(false);
  const r=row(side);
  const b=bubble(`<div class="chips">${options.map(o=>`<span class="chip">${o}</span>`).join("")}</div>`);
  const m=meta(); b.appendChild(m); r.appendChild(b); $messages.appendChild(r); scroll(); markSeenLater(m.querySelector('.checks'));
  b.querySelectorAll(".chip").forEach(ch=>{
    ch.addEventListener("click",()=>{ 
      r.remove(); 
      addText("right", ch.textContent); 
      setTimeout(()=>onPick(), TIMINGS.afterUserGap); 
    });
  });
}

function typingTimeFor(msg){
  const text = (msg.text || "");
  let n = text.length || 8;
  const perChar = rand(TIMINGS.typingPerCharMin, TIMINGS.typingPerCharMax);
  let base = n * perChar;
  
  const commas = (text.match(/[\,;]/g) || []).length;
  const stops = (text.match(/[\.!\?]/g) || []).length;
  const breaks = (text.match(/\n/g) || []).length;

  base += commas * 200;
  base += stops * 350;
  base += breaks * 250;

  if (n > 120) base += 800;
  if (n > 220) base += 1200;

  base = base * (rand(85,115) / 100);
  return clamp(base, TIMINGS.typingMin, TIMINGS.typingMax);
}

// ===== Main Flow =====
let currentMessages = [];
let currentStep = 0;

function doNextStep(){
  if (currentStep >= currentMessages.length) {
    setInputVisible(true);
    return;
  }

  const msg = currentMessages[currentStep];
  currentStep++;

  const typing = addTyping();
  const delay = typingTimeFor(msg);

  setTimeout(()=>{
    typing.remove();
    switch(msg.type){
      case "text":
        addText("left", msg.text.replace("{name}", leadName));
        setTimeout(doNextStep, TIMINGS.baseGap);
        break;
      case "image":
        addImage("left", msg.src, msg.alt);
        setTimeout(doNextStep, TIMINGS.baseGap);
        break;
      case "video":
        addVideo("left", msg.src);
        setTimeout(doNextStep, TIMINGS.baseGap);
        break;
      case "localvideo":
        addLocalVideo("left", msg.src);
        setTimeout(doNextStep, TIMINGS.baseGap);
        break;
      case "quick":
        addChips(msg.options, "left", msg.asUser, ()=>{
          if (msg.wait === "name") {
            waiting = "name";
            setInputVisible(true, "What's your name?");
          } else {
            doNextStep();
          }
        });
        break;
      case "cta":
        addCTA(msg.text, msg.buttonText, leadName);
        break;
    }
  }, delay);
}

$form.addEventListener("submit", (e)=>{
  e.preventDefault();
  const text = $input.value.trim();
  if (!text) return;

  addText("right", text);
  $input.value = "";

  if (waiting === "name"){
    leadName = text;
    waiting = null;
    setInputVisible(false);
    currentMessages = SETTINGS.afterName;
    currentStep = 0;
    setTimeout(doNextStep, TIMINGS.afterUserGap);
  }
});

// Start conversation
currentMessages = SETTINGS.preName;
currentStep = 0;
setTimeout(doNextStep, 1000);

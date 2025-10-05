const SETTINGS = {
  contactName: "Alex",
  avatar: "assets/avatar.jpg",
  checkoutURL: "https://www.revealpoker.top",

  preName: [
    { type:"text",  text:"Hey there! I see you're interested in poker. Mind if I ask you a quick question?" },
    { type:"quick", options:["Sure, go ahead.", "Not right now."], side:"right", asUser:true, wait:"name" }
  ],

  afterName: [
    { type:"text",  text:"Great. Tell me, what's your biggest frustration when playing online poker?" },
    { type:"quick", options:["Losing to bad players", "Not knowing what they have", "It's all just luck"], side:"right", asUser:true },

    { type:"text",  text:"I hear you. It can be incredibly frustrating. What if I told you there's a way to shift the odds in your favor?" },
    { type:"text",  text:"A way to stop gambling and start making strategic, winning decisions." },
    { type:"quick", options:["I'm listening...", "Sounds too good to be true."], side:"right", asUser:true },

    { type:"text",  text:"It's real. It's called Reveal App. It gives you a definitive strategic advantage by showing you what your opponents are holding." },
    
    { type:"text",  text:"Imagine knowing their cards before you even make your move. Every. Single. Time." },
    { type:"quick", options:["How does it work?", "Is it safe?"], side:"right", asUser:true },

    { type:"text",  text:"It works by intercepting and decrypting the game's data packets in real-time. And yes, it's 100% safe and undetectable because it doesn't modify any game files." },
    { type:"text",  text:"Want to see it in action?" },
    { type:"quick", options:["Show me the video!", "I'm still skeptical."], side:"right", asUser:true },

    { type:"video", src:"https://www.youtube.com/embed/BmPblmvwROk" },
    { type:"text",  text:"That's just a glimpse of the power you'll have. But don't just take my word for it..." },
    { type:"text",  text:"Here's what one of our users has to say about how Reveal App transformed his game:" },
    { type:"localvideo", src:"assets/testimonial.mp4" },
    { type:"text", text:"Ready to stop guessing and start winning like him?" },

    { type:"text",  text:"Many of our users are reporting daily earnings of over $3,000! Join them and transform your poker game." },
    { type:"cta",   text:"Join the winners and get your unbeatable advantage now.", buttonText:"Take Me to Reveal Poker" }
  ]
};

// ===== Timings (mais realistas) =====
const TIMINGS = {
  baseGap: 750,               // espaçamento entre mensagens do bot
  typingPerCharMin: 28,       // ms por caractere (mín)
  typingPerCharMax: 55,       // ms por caractere (máx)
  typingMin: 900,             // mínimo para qualquer texto
  typingMax: 5500,            // máximo (textos grandes ficam mais “humanos”)
  afterUserGap: 2000,         // pausa após resposta do lead
  recordingExtraMin: 1700,    // delay extra mostrando "gravando áudio..."
  recordingExtraMax: 2600
};

// ===== Elements =====
const $messages = document.getElementById("messages");
const $form = document.getElementById("chat-form");
const $input = document.getElementById("chat-input");
const $status = document.getElementById("status");
// Ícones em SVG (brancos via currentColor)
const ICONS = {
  play:
    '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
  pause:
    '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/></svg>'
};


document.getElementById("contact-name").textContent = SETTINGS.contactName;
document.getElementById("avatar").src = SETTINGS.avatar;

// ===== Estado =====
let leadName = "";
let waiting  = null;   // "name" | "freeText"
let resumeFn = null;

// ===== Som ao receber (bot) =====
let __userInteracted = false;
window.addEventListener("pointerdown", ()=>{ __userInteracted = true; }, {once:true});
window.addEventListener("keydown",     ()=>{ __userInteracted = true; }, {once:true});

const botDing = (() => {
  try{
    const a = new Audio("assets/sounds/receive.mp3");
    a.preload = "auto";
    a.volume  = 0.9;
    return () => {
      if (!__userInteracted) return;   // precisa de interação antes (autoplay policy)
      try{ a.currentTime = 0; a.play().catch(()=>{}); }catch{}
    };
  }catch{
    return () => {};
  }
})();

// ===== Helpers =====
const THUMB_SIZE = 36; // deve bater com o CSS (.row .thumb)
const now   = () => new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
const rand  = (min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const scroll= () => { $messages.scrollTop = $messages.scrollHeight; };
const fmt   = s => { if(!isFinite(s)) return "0:00"; const m=Math.floor(s/60); const ss=Math.floor(s%60).toString().padStart(2,"0"); return `${m}:${ss}`; };

/* input visibilidade */
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
    s.style.width = THUMB_SIZE + "px"; // espaçador do lado direito
    r.appendChild(s);
  }
  return r;
}
function bubble(inner){ const b=document.createElement("div"); b.className="bubble enter"; b.innerHTML=inner; return b; }
function meta(){
  const m=document.createElement("div");
  m.className="meta";
  m.innerHTML=`<span class="time">${now()}</span><span class="checks">✓✓</span>`;
  return m;
}
function markSeenLater(el){ setTimeout(()=>{ if(el) el.classList.add("seen"); }, rand(1200,2800)); }

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

/* “gravando áudio…” — mic grande e simples */
function addRecordingBadge(){
  const r = row("left");
  r.classList.add("recording-wrap");

  const b = document.createElement("div");
  b.className = "bubble";

  b.innerHTML = `
    <div class="recording pro" role="status" aria-live="polite">
      <span class="mic" aria-hidden="true">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <!-- mic simples -->
          <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Z"/>
          <path d="M7 11a5 5 0 0 0 10 0" fill="none" stroke="#075e54" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M12 15v3" fill="none" stroke="#075e54" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </span>
      <span class="label">recording audio…</span>
    </div>
  `;

  r.appendChild(b);
  $messages.appendChild(r);
  scroll();
  return r;
}




/* áudio (com ▶/⏸) */
/* áudio (com ▶/⏸) — garante que onEnded rode apenas 1 vez */
/* áudio (com ▶/⏸ via SVG branco) — onEnded só 1x + reset no fim */
function addAudio(src,dur, onEnded){
  const r=row("left"); const id="a"+Math.random().toString(36).slice(2);
  const b=bubble(`
    <div class="audio">
      <button class="play" data-id="${id}" aria-label="Play audio"></button>
      <div class="tline"><i></i></div>
      <div class="aud-time">0:00 / ${dur||"0:00"}</div>
      <audio id="${id}" preload="auto" src="${src}"></audio>
    </div>`); 
  const m=meta(); b.appendChild(m); r.appendChild(b);
  $messages.appendChild(r); scroll(); markSeenLater(m.querySelector('.checks'));

  botDing(); // som quando a bolha de áudio chega

  const audio   = b.querySelector("audio");
  const btn     = b.querySelector(".play");
  const progBar = b.querySelector(".tline i");
  const timeEl  = b.querySelector(".aud-time");

  // ícone inicial: play
  btn.innerHTML = ICONS.play;

  // flag para continuar o fluxo só uma vez
  let continued = false;

  audio.addEventListener("loadedmetadata", ()=>{
    timeEl.textContent = `0:00 / ${fmt(audio.duration)}`;
  });
  audio.addEventListener("timeupdate", ()=>{
    if(!audio.duration) return;
    progBar.style.width = (audio.currentTime / audio.duration * 100) + "%";
    timeEl.textContent  = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
  });
  audio.addEventListener("play",  ()=>{
    btn.innerHTML = ICONS.pause;
    btn.setAttribute("aria-label","Pause audio");
  });
  audio.addEventListener("pause", ()=>{
    btn.innerHTML = ICONS.play;
    btn.setAttribute("aria-label","Play audio");
  });
  audio.addEventListener("ended", ()=>{
    // reset total do player ao terminar
    try { audio.currentTime = 0; } catch {}
    progBar.style.width = "0%";
    timeEl.textContent  = `0:00 / ${fmt(audio.duration)}`;
    btn.innerHTML = ICONS.play;
    btn.setAttribute("aria-label","Play audio");

    // continua o fluxo só na primeira vez
    if (!continued) {
      continued = true;
      if (typeof onEnded === "function") {
        setTimeout(onEnded, TIMINGS.baseGap);
      }
    }
  });

  // extra: se o usuário arrastar pro início, mantemos visual resetado
  audio.addEventListener("seeked", ()=>{
    if (audio.currentTime === 0 && audio.paused) {
      progBar.style.width = "0%";
      timeEl.textContent  = `0:00 / ${fmt(audio.duration)}`;
      btn.innerHTML = ICONS.play;
      btn.setAttribute("aria-label","Play audio");
    }
  });

  btn.addEventListener("click", ()=>{
    if (audio.paused) audio.play(); else audio.pause();
  });
}



/* “digitando…” */
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

/* chips (quick replies) — esconde a barra enquanto há opções */
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

/* delays de “digitando” / “gravando” */
function typingTimeFor(msg){
  // áudio: mantém “gravando…” com delay extra realista
  if (msg.type === "audio"){
    let base = rand(TIMINGS.typingMin, TIMINGS.typingMin + 400);
    base += rand(TIMINGS.recordingExtraMin, TIMINGS.recordingExtraMax);
    return base;
  }

  const text = (msg.text || "");
  let n = text.length || 8;

  // tempo base por caractere (varia aleatoriamente num intervalo)
  const perChar = rand(TIMINGS.typingPerCharMin, TIMINGS.typingPerCharMax);
  let base = n * perChar;

  // pausas por pontuação — simulando respirações
  const commas = (text.match(/[\,;]/g) || []).length;     // vírgulas/; => pausa curta
  const stops  = (text.match(/[\.!\?]/g) || []).length;   // . ! ? => pausa um pouco maior
  const breaks = (text.match(/\n/g) || []).length;        // quebras de linha

  base += commas * 180;
  base += stops  * 280;
  base += breaks * 220;

  // textos muito longos ganham um tempo extra
  if (n > 120) base += 600;
  if (n > 220) base += 800;

  // jitter final (±15%)
  base = base * (rand(85,115) / 100);

  return clamp(base, TIMINGS.typingMin, TIMINGS.typingMax);
}

// ===== Fluxo Principal =====
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
        doNextStep();
        break;
      case "image":
        addImage("left", msg.src, msg.alt);
        doNextStep();
        break;
      case "video":
        addVideo("left", msg.src);
        doNextStep();
        break;
      case "localvideo":
        addLocalVideo("left", msg.src);
        doNextStep();
        break;
      case "audio":
        addAudio(msg.src, null, ()=>{
          if (msg.wait === "name") {
            waiting = "name";
            setInputVisible(true, "What's your name?");
          } else {
            doNextStep();
          }
        });
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

// Inicia a conversa
currentMessages = SETTINGS.preName;
currentStep = 0;
doNextStep();


const $ = id => document.getElementById(id);
let bank = [], session = [], current = 0, mode = "practice", answers = {}, marked = new Set(), timerId = null, secondsLeft = 0, sessionStart = 0;
let stats = JSON.parse(localStorage.getItem("happinessPracticeStats") || "{}");

async function init(){
  try{
    const res = await fetch("questions.json");
    if(!res.ok) throw new Error("Could not load questions.json");
    bank = await res.json();
    $("bankCount").textContent = `${bank.length} questions loaded • 8 weeks • progress saves on this device`;
  }catch(e){
    $("bankCount").textContent = "Could not load questions.json. Keep index.html, app.js, style.css and questions.json in the same folder, then open using a local server.";
  }
}
function saveStats(){ localStorage.setItem("happinessPracticeStats", JSON.stringify(stats)); }
function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; }
function correctOption(q){return q.options.find(o=>o.correct);}
function buildSession(){
  const pick=$("weekSelect").value;
  let pool=[...bank];
  if(pick==="wrong") pool=pool.filter(q=>stats[q.id]?.lastCorrect===false);
  else if(pick==="unseen") pool=pool.filter(q=>stats[q.id]?.lastCorrect!==true);
  else if(pick!=="all") pool=pool.filter(q=>q.week===Number(pick));
  if(!pool.length){alert("There are no questions in this set yet. Finish a practice round first, or choose another set.");return;}
  mode=$("modeSelect").value;
  if($("orderSelect").value==="shuffle") pool=shuffle(pool);
  session=pool.map(q=>({...q, options:$("orderSelect").value==="shuffle"?shuffle(q.options):[...q.options]}));
  answers={}; marked=new Set(); current=0; sessionStart=Date.now();
  $("setup").classList.add("hidden");$("results").classList.add("hidden");$("quiz").classList.remove("hidden");
  $("sessionLabel").textContent=mode==="practice"?"PRACTICE SESSION":"MOCK EXAM";
  const val=$("weekSelect").value;
  $("weekHeading").textContent=val==="all"?"All weeks":val==="wrong"?"Wrong answers":val==="unseen"?"Not yet mastered":`Week ${val}`;
  const mins=Number($("timerSelect").value);
  secondsLeft=mins*60;
  $("timerBox").classList.toggle("hidden",mins===0);
  if(timerId)clearInterval(timerId);
  if(mins>0){updateTimer();timerId=setInterval(()=>{secondsLeft--;updateTimer();if(secondsLeft<=0){clearInterval(timerId);finishSession(true);}},1000);}
  renderQuestion();
}
function updateTimer(){const m=Math.floor(Math.max(0,secondsLeft)/60),s=Math.max(0,secondsLeft)%60;$("timer").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;if(secondsLeft<=60)$("timerBox").style.background="#ffe6e7";}
function renderQuestion(){
  const q=session[current];if(!q)return;
  $("progressText").textContent=`Question ${current+1} of ${session.length}`;
  const correctCount=Object.entries(answers).filter(([id,a])=>a.correct).length;
  $("scoreText").textContent=`Correct so far: ${correctCount}`;
  $("progressFill").style.width=`${((current+1)/session.length)*100}%`;
  $("weekBadge").textContent=`WEEK ${q.week}`;$("lectureBadge").textContent=`LECTURE ${q.lecture}`;
  $("questionText").textContent=q.question;
  $("markBtn").textContent=marked.has(q.id)?"★ Marked for review":"☆ Mark for review";
  $("markBtn").classList.toggle("marked",marked.has(q.id));
  const prior=answers[q.id];
  const options=$("options");options.innerHTML="";
  q.options.forEach((o,i)=>{
    const b=document.createElement("button");b.className="option";
    if(prior && prior.label===o.label)b.classList.add("selected");
    if(prior && (mode==="practice" || mode==="exam")){
      if(o.correct)b.classList.add("correct");
      else if(prior.label===o.label)b.classList.add("incorrect");
      b.disabled=true;
    }
    const letter=document.createElement("span");letter.className="option-letter";letter.textContent=String.fromCharCode(65+i);
    const txt=document.createElement("span");txt.textContent=o.text;b.append(letter,txt);
    b.addEventListener("click",()=>chooseOption(q,o));options.appendChild(b);
  });
  const fb=$("feedback");fb.className="feedback hidden";fb.innerHTML="";
  if(prior && mode==="practice") showFeedback(q,prior);
  $("prevBtn").disabled=current===0;
  $("nextBtn").textContent=current===session.length-1?"Finish session ✓":"Next question →";
}
function chooseOption(q,o){
  if(answers[q.id] && mode==="practice")return;
  if(answers[q.id] && mode==="exam" && answers[q.id].locked)return;
  const result={label:o.label,correct:!!o.correct,locked:mode==="exam"};
  answers[q.id]=result;
  stats[q.id]={lastCorrect:result.correct,lastAnswer:o.label,week:q.week,number:q.number};
  saveStats();
  if(mode==="practice"){
    renderQuestion();
    const fb=$("feedback");
    showFeedback(q,result);
  }else{
    // In mock mode, keep the selection visible without revealing correctness.
    renderQuestion();
    $("feedback").className="feedback";
    $("feedback").textContent="Answer saved. Correct answers will be revealed after you finish the mock exam.";
    [...$("options").children].forEach(btn=>btn.disabled=true);
  }
}
function showFeedback(q,result){
  const fb=$("feedback"),co=correctOption(q);
  fb.className=`feedback ${result.correct?"good":"bad"}`;
  fb.innerHTML=`<strong>${result.correct?"Correct — well done!":"Not quite. Keep learning."}</strong><span>Suggested answer: ${escapeHtml(co?.text||"See lecture notes")}.</span><br><span>Source: Week ${q.week} PDF, Lecture ${q.lecture}. The PDF points to the lecture and does not provide a written explanation.</span>`;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function next(){if(current<session.length-1){current++;renderQuestion();}else finishSession(false);}
function previous(){if(current>0){current--;renderQuestion();}}
function finishSession(timeUp=false){
  if(timerId)clearInterval(timerId);
  $("quiz").classList.add("hidden");$("results").classList.remove("hidden");
  const attempted=Object.keys(answers).length, correct=Object.values(answers).filter(a=>a.correct).length, percent=attempted?Math.round(correct/attempted*100):0;
  $("resultTitle").textContent=timeUp?"Time is up — review and rebuild.":"Every question is another step forward.";
  $("resultSummary").textContent=`You completed ${session.length} questions in ${Math.round((Date.now()-sessionStart)/60000)} minute(s).`;
  $("resultCorrect").textContent=correct;$("resultAttempted").textContent=`${attempted}/${session.length}`;$("resultPercent").textContent=`${percent}%`;
  const review=$("reviewList");review.innerHTML="";
  const wrong=session.filter(q=>answers[q.id]&&!answers[q.id].correct);
  if(mode==="exam"){
    const unanswered=session.filter(q=>!answers[q.id]);
    [...wrong,...unanswered].forEach(q=>{
      const item=document.createElement("div");item.className="review-item";
      const co=correctOption(q);const user=answers[q.id];
      item.innerHTML=`<strong>Week ${q.week}, Q${q.number}: ${escapeHtml(q.question)}</strong><p>Your answer: ${user?escapeHtml(q.options.find(o=>o.label===user.label)?.text||"Selected"):"Not answered"}<br>Suggested answer: ${escapeHtml(co?.text||"See lecture notes")}</p>`;
      review.appendChild(item);
    });
  }else{
    wrong.forEach(q=>{const item=document.createElement("div");item.className="review-item";item.innerHTML=`<strong>Week ${q.week}, Q${q.number}: ${escapeHtml(q.question)}</strong><p>Suggested answer: ${escapeHtml(correctOption(q)?.text||"See lecture notes")}</p>`;review.appendChild(item);});
  }
  if(!review.children.length)review.innerHTML='<p class="muted">No wrong answers in this session. Lovely work — keep revising to make it stick.</p>';
  $("retryWrongBtn").classList.toggle("hidden",wrong.length===0);
  window.lastWrong=wrong.map(q=>q.id);
}
function reviewWrong(){
  const ids=new Set(window.lastWrong||[]);const selected=bank.filter(q=>ids.has(q.id));
  if(!selected.length)return;
  session=shuffle(selected).map(q=>({...q,options:shuffle(q.options)}));answers={};marked=new Set();current=0;mode="practice";sessionStart=Date.now();
  $("results").classList.add("hidden");$("quiz").classList.remove("hidden");$("sessionLabel").textContent="WRONG ANSWERS PRACTICE";$("weekHeading").textContent="Review and retry";$("timerBox").classList.add("hidden");
  if(timerId)clearInterval(timerId);renderQuestion();
}
$("startBtn").addEventListener("click",buildSession);
$("nextBtn").addEventListener("click",next);
$("prevBtn").addEventListener("click",previous);
$("markBtn").addEventListener("click",()=>{const id=session[current].id;marked.has(id)?marked.delete(id):marked.add(id);renderQuestion();});
$("exitBtn").addEventListener("click",()=>{if(confirm("Exit this session? Your answered-question history is saved.")){if(timerId)clearInterval(timerId);$("quiz").classList.add("hidden");$("setup").classList.remove("hidden");}});
$("homeBtn").addEventListener("click",()=>{$("results").classList.add("hidden");$("setup").classList.remove("hidden");});
$("retryWrongBtn").addEventListener("click",reviewWrong);
init();
export function shuffle(a,r=Math.random){a=[...a];for(let i=a.length-1;i;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function createDeck(pairs=6,r=Math.random){return shuffle(Array.from({length:pairs},(_,i)=>[i,i]).flat(),r)}
export function newGame(pairs=6,r=Math.random){return{cards:createDeck(pairs,r),open:[],matched:[],moves:0,over:false}}
export function flip(s,i){if(s.over||s.open.length===2||s.open.includes(i)||s.matched.includes(i))return{state:s,event:"invalid"};const n={...s,open:[...s.open,i],matched:[...s.matched]};if(n.open.length===1)return{state:n,event:"first"};n.moves++;const[a,b]=n.open;if(n.cards[a]===n.cards[b]){n.matched.push(a,b);n.open=[];n.over=n.matched.length===n.cards.length;return{state:n,event:"match"}}return{state:n,event:"miss"}}
export function collapse(s){return{...s,open:[]}}
export function score(s){return s.over?Math.max(0,1000-s.moves*10):null}

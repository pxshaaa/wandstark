'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');require('../data/materials.js');require('../modules/ped.js');
const m=AD.modules.find(m=>m.id==='ped'),H=AD.h;
const base={equipment:'vessel',state:'gas',fluid:'2',p:10,V:100,DN:50,T:20};
// Independently read from the OJ Annex II diagrams, pp. 215–219.
// Tuples: table, PS, V/DN, expected category. Products calculated here,
// never from module internals. Equalities belong to the lower category (§4).
const cases=[
 [1,10,2.5,0],[1,10,5,1],[1,10,5.01,2],[1,10,20,2],[1,10,20.01,3],[1,10,100,3],[1,10,100.1,4],
 [1,200,1,0],[1,201,1,3],[1,1000,0.1,3],[1,1001,0.1,4],
 [2,10,5,0],[2,10,20,1],[2,10,100,2],[2,10,300,3],[2,10,300.1,4],
 [2,4,100000,3],[2,4.001,100000,4],[2,1000,1,0],[2,1001,1,3],[2,3000,0.1,3],[2,3001,0.1,4],
 [3,10,20,0],[3,10,21,1],[3,10.01,21,2],[3,500,1,0],[3,501,1,2],[3,501,1.01,3],
 [4,10,100000,0],[4,20,500,0],[4,20,501,1],[4,500,21,1],[4,501,21,2],[4,1001,10,1],[4,1001,10.01,2],
 [5,100,2,0],[5,10,5,1],[5,10,20,2],[5,10,300,3],[5,10,300.01,4],[5,32,3,2],[5,32.01,3,4],[5,1,1000,3],[5,1,1000.1,4],
 [6,10000,25,0],[6,10,100,1],[6,10.01,100,2],[6,1,100.1,2],[6,10,350,2],[6,10.01,350,3],[6,1,350.1,3],
 [7,10000,32,0],[7,10,100,0],[7,10.01,100,1],[7,10000,100,1],[7,10,350,1],[7,10,350.01,2],[7,20,250,2],[7,20,250.01,3],
 [8,10000,25,0],[8,10,200,0],[8,10,201,1],[8,10.01,201,2],[8,500,26,2],[8,500.01,26,3],
 [9,10,10000,0],[9,10000,200,0],[9,20,250,0],[9,20,250.1,1],[9,500,201,1],[9,500.01,201,2]
];
let passed=0,total=cases.length+7;
for(const [t,p,x,c] of cases){
 const pipe=t>=6,g={...base,p,V:x,DN:x,equipment:t===5?'steam':pipe?'piping':'vessel',state:[3,4,8,9].includes(t)?'liquid':'gas',fluid:[2,4,7,9].includes(t)?'2':'1'};
 const r=m.calc(g,H),want=c?'Kat. '+['','I','II','III','IV'][c]:'Art. 4 Abs. 3';
 assert.equal(r.headline.text,want,`Tabelle ${t}: PS=${p}, x=${x}, Produkt=${p*x}`);
 assert.equal(r.rows[2][2],p*x);assert.equal(r.noUtil,true);assert.equal(r.util,0);assert.equal(r.fail,false);assert(Number.isNaN(r.pmax));assert.equal(r.test,null);assert(r.notes.length);assert(r.formula);passed++;
}
// Out-of-scope PS must not be misrepresented as sound engineering practice.
assert.equal(m.calc({...base,p:0.5},H).headline.text,'Außerhalb PED');passed++;
// Invalid/failing input must not produce a category or a false structural failure.
for(const patch of [{V:NaN},{p:-1},{equipment:'unknown'},{p:Number.MAX_VALUE,V:2}]){
 const r=m.calc({...base,...patch},H);assert.equal(r.headline.text,'Eingaben prüfen');assert.equal(r.fail,true);assert.equal(r.notes[0][0],'e');passed++;
}
assert.equal(m.calc({...base,equipment:'piping',p:20,DN:250,T:350},H).headline.text,'Kat. II');passed++;
assert.equal(m.calc({...base,equipment:'piping',p:20,DN:250,T:350.01},H).headline.text,'Kat. III');passed++;
console.log(`PASS ${passed}/${total}`);

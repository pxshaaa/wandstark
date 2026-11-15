'use strict';
const assert=require('node:assert/strict');
const AD=require('../src/ad.js');require('../data/materials.js');require('../data/profiles.js');
let passed=0,total=0;function test(name,fn){total++;try{fn();passed++;}catch(e){console.error('FAIL '+name,e.message);}}
for(const [type,list] of Object.entries(AD.profiles)) test(type+' monotonic dimensions and units',()=>{
 assert.ok(list.length>=8);assert.equal(new Set(list.map(p=>p.name)).size,list.length);
 list.forEach((p,i)=>{assert.ok(p.h>0&&p.b>0&&p.A>0);assert.ok(p.A<=p.h*p.b);if(i)assert.ok(p.h>=list[i-1].h);if(p.Iy)assert.ok(p.Iy>0);});
});
// Independently transcribed manufacturer/standard table values, cm²->mm², cm⁴->mm⁴.
for(const [type,name,values] of [
 ['IPE','IPE 80',{h:80,b:46,tw:3.8,tf:5.2,A:7.6*100,Iy:80.13*10000}],
 ['IPE','IPE 300',{A:53.8*100,Iy:8356*10000}],
 ['HEA','HEA 100',{h:96,A:21.2*100}],['HEA','HEA 300',{h:290,A:112.5*100}],
 ['HEB','HEB 300',{h:300,b:300,A:149.1*100}],
 ['UPN','UPN 50',{h:50,b:38,A:7.1*100,Iy:26.4*10000}],['UPN','UPN 300',{A:58.8*100}],
 ['L','L 40x4',{h:40,b:40,t:4,r:6,A:3.08*100}],['L','L 50x5',{A:4.8*100}],['L','L 150x15',{A:43*100}],
 ['T','T 30',{tw:4,tf:4,A:2.26*100}],['T','T 140',{h:140,A:39.9*100}],
 ['FL','FL 80x12',{h:80,b:12,A:80*12}],['RHS','RHS 40x20x2',{A:2.14*100}],['RHS','RHS 200x100x4',{A:22.9*100}]
]) test(name+' spot values',()=>{const p=AD.profiles[type].find(p=>p.name===name);assert.ok(p);for(const [k,v] of Object.entries(values))assert.ok(Math.abs(p[k]-v)<1e-7,name+' '+k);});
console.log(`PASS ${passed}/${total}`);if(passed!==total)process.exitCode=1;

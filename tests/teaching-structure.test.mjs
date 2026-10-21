import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chapter01 } from '../teaching-viz/chapter-01.js';
import { chapter02 } from '../teaching-viz/chapter-02.js';
import { chapter03 } from '../teaching-viz/chapter-03.js';
import { chapter04 } from '../teaching-viz/chapter-04.js';
import { chapter05 } from '../teaching-viz/chapter-05.js';

test('all 27 sections retain three panels and have unique, bounded code focuses',()=>{
 const factories=[chapter01,chapter02,chapter03,chapter04,chapter05],counts=[5,4,8,5,5];
 const definitions=factories.flatMap(factory=>factory({}));assert.equal(definitions.length,27);
 assert.equal(new Set(definitions.map(d=>d.sectionId)).size,27);
 factories.forEach((factory,index)=>{
  const html=readFileSync(new URL(`../lesson-0${index+1}/index.html`,import.meta.url),'utf8');
  assert.equal(factory({}).length,counts[index]);
  for(const definition of factory({})){
   const id='ch-'+definition.sectionId.replace('.','-');
   const article=html.match(new RegExp(`<article[^>]*id="${id}"[\\s\\S]*?<\/article>`))[0];
   for(const panel of ['explain','code','demo'])assert.ok(article.includes(`data-panel="${panel}"`));
   assert.ok(definition.steps.length>=3);assert.equal(new Set(definition.steps.map(s=>s.id)).size,definition.steps.length);
   const codePanel=article.match(/<div[^>]*data-panel="code"[\s\S]*?(?=<div[^>]*data-panel="demo")/)[0];
   const blocks=[...codePanel.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g)].map(m=>m[1].replace(/<\/?[a-zA-Z][^>]*>/g,'').split('\n'));
   for(const step of definition.steps)for(const range of step.codeTargets??[]){
    assert.ok(blocks[range.block],`${id} ${step.id}: original block`);
    assert.ok(range.from>=1&&(range.to??range.from)<=blocks[range.block].length,`${id} ${step.id}: original lines`);
   }
  }
 });
});

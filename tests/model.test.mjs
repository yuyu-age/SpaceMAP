import assert from 'node:assert/strict';
import {normalizeId,boothPart,markerBounds,validURL,validateLink,boundsFromCorners,findTextCandidates,parseBackup} from '../src/model.js';
assert.equal(normalizeId('Ａ１２'),'A12');assert.equal(validURL(''),'');for(const u of ['javascript:alert(1)','data:text/html,hi','ftp://x','https://u:p@example.test'])assert.equal(validURL(u),null);
const link={booth:'A12',circle:'Test Circle',url:'https://example.test/',color:'#ef4674',items:[{name:'Book',price:800}],page:1,x:20,y:30,w:10,h:8};assert.equal(validateLink(link,2).items[0].price,800);assert.throws(()=>validateLink({...link,page:2},2));assert.throws(()=>validateLink({...link,items:[{name:'Book',price:-1}]},2));assert.deepEqual(boundsFromCorners({x:25,y:40},{x:10,y:20}),{x:10,y:20,w:15,h:20});assert.equal(findTextCandidates([{texts:[{text:'A12',x:1,y:2,w:3,h:4}]}],'Ａ１２').length,1);assert.equal(findTextCandidates([{texts:[{text:'A',x:1},{text:'12',x:3}]}],'A12').length,0);assert.throws(()=>parseBackup({version:1}));console.log('PASS: IDs, safe URLs, fields/prices, page/bounds, manual rectangle, exact-only text matching, backup format');

const cell={...link,cell:true,notes:'買う本\n受取は午後',booth:'あ20a'};
assert.deepEqual(boothPart('あ２０ｂ'),{base:'あ20'.toUpperCase(),part:'b'});
assert.deepEqual(markerBounds(cell),{x:20,y:30,w:5,h:8});
assert.deepEqual(markerBounds({...cell,booth:'あ20b'}),{x:25,y:30,w:5,h:8});
for(const booth of ['あ20ab','あ20'])assert.deepEqual(markerBounds({...cell,booth}),{x:20,y:30,w:10,h:8});
assert.deepEqual(markerBounds({...cell,direction:'a-top'}),{x:20,y:30,w:10,h:4});
assert.deepEqual(markerBounds({...cell,direction:'a-bottom'}),{x:20,y:34,w:10,h:4});
assert.deepEqual(markerBounds({...cell,direction:'a-right'}),{x:25,y:30,w:5,h:8});
assert.deepEqual(markerBounds({...cell,cell:false}),{x:20,y:30,w:10,h:8});
assert.equal(validateLink(cell,2).notes,cell.notes);
assert.equal(validateLink(link,2).notes,'');assert.equal(validateLink(link,2).cell,false);
assert.throws(()=>validateLink({...cell,notes:'x'.repeat(2001)},2));
assert.throws(()=>validateLink({...cell,notes:123},2));
assert.throws(()=>validateLink({...cell,direction:'unknown'},2));
const splitTexts=[{text:'A',x:10,y:20,w:2,h:3},{text:'12',x:12.2,y:20,w:3,h:3}];
assert.equal(findTextCandidates([{texts:splitTexts}],'A12b').length,1);
assert.equal(findTextCandidates([{texts:[splitTexts[0],{...splitTexts[1],x:30}]}],'A12b').length,0);
assert.equal(findTextCandidates([{texts:[splitTexts[0],{...splitTexts[1],y:25}]}],'A12b').length,0);
assert.equal(findTextCandidates([{texts:[{...splitTexts[0],text:'A12'},{...splitTexts[1],text:'A12'}]}],'A12a').length,2);
console.log('PASS: half/full cells, direction, legacy records, notes validation and adjacent text fragments');

assert.equal(findTextCandidates([{texts:[{text:'A12ab',x:10,y:20,w:4,h:3}]}],'A12a').length,1);
assert.equal(findTextCandidates([{texts:[{text:'A12ab',x:10,y:20,w:4,h:3}]}],'A12').length,1);

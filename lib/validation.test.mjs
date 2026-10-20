import test from 'node:test';import assert from 'node:assert/strict';import {validateReport,inArea,validAction} from './validation.mjs';
const valid={lat:11.94,lng:79.81,status:'orange',street:' Mission Street ',note:' Near the junction '};
test('accepts location and status without optional text',()=>{const r=validateReport({lat:11.94,lng:79.81,status:'green'});assert.match(r.street,/Pinned spot/);assert.equal(r.note,'')});
test('trims text and preserves coordinates',()=>{assert.deepEqual(validateReport(valid),{...valid,street:'Mission Street',note:'Near the junction'})});
test('rejects out of coverage and malformed locations',()=>{for(const pair of [[0,0],[12.1,79.81],[11.94,80],[NaN,79.81],['11.94',79.81],[Infinity,79.81]]){assert.equal(inArea(...pair),false);assert.throws(()=>validateReport({...valid,lat:pair[0],lng:pair[1]}))}});
test('enforces status and text limits',()=>{for(const value of [{status:'safe'},{street:'a'.repeat(71)},{note:'a'.repeat(181)}])assert.throws(()=>validateReport({...valid,...value}))});
test('allows only supported update actions',()=>{assert.ok(validAction('clear'));assert.ok(validAction('confirm'));assert.ok(validAction('flag'));assert.equal(validAction('delete'),false)});

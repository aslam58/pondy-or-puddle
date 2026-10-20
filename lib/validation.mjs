export const AREA={south:11.88,north:12.04,west:79.73,east:79.87};
export const TTL=6*60*60*1000;
export function inArea(lat,lng){return typeof lat==='number'&&typeof lng==='number'&&Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=AREA.south&&lat<=AREA.north&&lng>=AREA.west&&lng<=AREA.east}
export function validateReport(data){
 if(!data||typeof data!=='object'||!inArea(data.lat,data.lng))throw new Error('Choose a point inside the Pondicherry coverage boundary.');
 if(!['red','orange','green'].includes(data.status))throw new Error('Choose a flood level.');
 const street=typeof data.street==='string'?data.street.trim():'';
 const note=typeof data.note==='string'?data.note.trim():'';
 if(street.length>70||note.length>180)throw new Error('Keep street names under 70 characters and notes under 180.');
 if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(street+note))throw new Error('Please use plain text.');
 return{lat:data.lat,lng:data.lng,status:data.status,street:street||`Pinned spot (${data.lat.toFixed(4)}, ${data.lng.toFixed(4)})`,note};
}
export function validAction(value){return value==='confirm'||value==='clear'||value==='flag'}

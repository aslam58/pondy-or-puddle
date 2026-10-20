export const dynamic='force-dynamic';
export async function GET(){
 try{const url='https://api.open-meteo.com/v1/forecast?latitude=11.9416&longitude=79.8083&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&hourly=precipitation_probability,rain,weather_code&forecast_days=2&timezone=Asia%2FKolkata';
 const response=await fetch(url,{signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error(`Weather upstream status ${response.status}`);const data=await response.json() as {current?:Record<string,unknown>;hourly?:Record<string,unknown>};
 if(!data.current||!data.hourly)throw new Error();return Response.json({...data,fetchedAt:Date.now()},{headers:{'Cache-Control':'public, max-age=300'}});
 }catch(error){console.warn('Weather upstream unavailable',error instanceof Error?error.message:'Unknown error');return Response.json({error:'Weather is taking a rain check. Try again shortly.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const email=String(req.body?.email||'').trim().toLowerCase();
  if(!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({error:'Please enter a valid email.'});
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) return res.status(503).json({error:'Email storage is not connected yet.'});
  const r=await fetch(`${url}/rest/v1/jay_noir_subscribers`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({email,source:'website'})});
  if(!r.ok){const t=await r.text();return res.status(500).json({error:'Could not save email.',detail:t})}
  return res.status(200).json({message:"You're in ♡"});
}

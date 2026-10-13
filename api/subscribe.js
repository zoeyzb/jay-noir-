export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  res.setHeader('Cache-Control','no-store');
  const contentType=String(req.headers?.['content-type']||'');
  if(!contentType.startsWith('application/json')) return res.status(415).json({error:'Send signup details as JSON.'});
  if(!req.body || typeof req.body!=='object' || Array.isArray(req.body)) return res.status(400).json({error:'Invalid signup request.'});
  if(typeof req.body.email!=='string' || req.body.email.length>254 || typeof req.body.website==='string' && req.body.website.length>500) return res.status(400).json({error:'Invalid signup details.'});
  const email=req.body.email.trim().toLowerCase();
  const consent=req.body?.consent===true;
  const website=String(req.body?.website||'').trim();
  if(website) return res.status(200).json({message:"You're in ♡"});
  if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254) return res.status(400).json({error:'Please enter a valid email.'});
  if(!consent) return res.status(400).json({error:'Please agree before joining.'});
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) return res.status(503).json({error:'Email storage is not connected yet.'});
  try{
    const r=await fetch(`${url.replace(/\/$/,'')}/rest/v1/jay_noir_subscribers?on_conflict=email`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},signal:AbortSignal.timeout(10000),body:JSON.stringify({email,source:'website',consented_at:new Date().toISOString()})});
    if(!r.ok) return res.status(502).json({error:'Could not save email. Please try again.'});
    return res.status(200).json({message:"You're in ♡"});
  }catch{return res.status(503).json({error:'Email storage is not available. Please try again.'})}
}

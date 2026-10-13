import { parseUnsubscribeToken } from '../lib/unsubscribe-token.js';

const page = (body) => '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Jay Noir · Email preferences</title><body style="background:#100d12;color:#fff4ef;font:16px system-ui;max-width:520px;margin:12vh auto;padding:24px"><main><h1>Jay Noir · Email preferences</h1>'+body+'</main></body></html>';
const escapeAttribute = (text) => String(text).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(!['GET','POST'].includes(req.method)) return res.status(405).send('Method not allowed');
  const token=req.method==='GET'?req.query?.token:req.body?.token;
  let email;
  try { email=parseUnsubscribeToken(token); }
  catch { return res.status(503).send(page('<p>Email preference service is temporarily unavailable.</p>')); }
  if(!email) return res.status(400).send(page('<p>This unsubscribe link is invalid or expired. Please contact the sender for an updated link.</p>'));
  if(req.method==='GET') {
    res.setHeader('Content-Type','text/html; charset=utf-8');
    return res.status(200).send(page('<p>Stop receiving Jay Noir email updates?</p><form method="POST"><input type="hidden" name="token" value="'+escapeAttribute(token)+'"><button style="padding:12px 20px;cursor:pointer" type="submit">Unsubscribe</button></form>'));
  }
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) return res.status(503).send(page('<p>Email preferences are temporarily unavailable. Please try again.</p>'));
  try {
    const endpoint=url.replace(/\/$/,'')+'/rest/v1/jay_noir_subscribers?email=eq.'+encodeURIComponent(email);
    const response=await fetch(endpoint,{method:'DELETE',headers:{apikey:key,Authorization:'Bearer '+key,Prefer:'return=minimal'},signal:AbortSignal.timeout(10000)});
    if(!response.ok) throw new Error('storage failure');
    return res.status(200).send(page('<p>Your email has been removed from Jay Noir updates.</p>'));
  } catch {
    return res.status(503).send(page('<p>We could not update your preference. Please try again.</p>'));
  }
}

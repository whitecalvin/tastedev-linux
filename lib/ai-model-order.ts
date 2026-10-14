export type AiModel = {id: string;label?: string;line?: string;created?: number};
// Display priority for log analysis, not a cross-model benchmark score.
// Known model generations and vendor product tiers are ordered before unclassified models.
function priority(model: AiModel){
 const id=model.id.toLowerCase();
 if(/(?:^|[-_/])(embedding|tts|whisper|moderation|audio|realtime|live|image|video|transcribe|sora|veo|lyria|nano-banana)(?:[-_/]|$)/.test(id))return [-1,0,0,0];
 let major=0,minor=0,tier=0,match;
 if((match=id.match(/^gpt-(\d+)(?:\.(\d+))?/))){
  major=Number(match[1]);minor=Number(match[2]||0);
  tier=/(?:^|-)(astra|pro)(?:-|$)/.test(id)?6:/(?:^|-)(nano|luna)(?:-|$)/.test(id)?1:/(?:^|-)(mini)(?:-|$)/.test(id)?2:/(?:^|-)(terra)(?:-|$)/.test(id)?3:4;
 }else if((match=id.match(/^o(\d+)(?:-|$)/))){
  major=Number(match[1])+1;tier=/(?:^|-)(pro)(?:-|$)/.test(id)?6:/(?:^|-)(mini)(?:-|$)/.test(id)?2:4;
 }else if(id.startsWith('claude-')||['fable','opus','sonnet','haiku'].includes(model.line??'')){
  const line=model.line||id.match(/(?:^|-)(fable|opus|sonnet|haiku)(?:-|$)/)?.[1];
  const tiers: Record<string,number>={fable:6,opus:5,sonnet:3,haiku:1};tier=tiers[line??'']||0;
  match=id.match(/(?:^|-)(\d+)(?:[.-](\d+))?(?:-|$)/);major=Number(match?.[1]||0);minor=Number(match?.[2]||0);
 }else if((match=id.match(/^gemini-(\d+)(?:\.(\d+))?/))){
  major=Number(match[1]);minor=Number(match[2]||0);tier=/(?:^|-)pro(?:-|$)/.test(id)?5:/flash-lite/.test(id)?1:/(?:^|-)flash(?:-|$)/.test(id)?3:0;
 }
 return [tier?1:0,major,tier,minor];
}
export function orderAiModels<T extends AiModel>(models: readonly T[]): T[]{
 return [...models].sort((a,b)=>{
  const left=priority(a),right=priority(b);
  for(let index=0;index<left.length;index++){if(left[index]!==right[index])return right[index]-left[index];}
  const previewA=/(?:^|-)(preview|exp)(?:-|$)/.test(a.id),previewB=/(?:^|-)(preview|exp)(?:-|$)/.test(b.id);
  if(previewA!==previewB)return Number(previewA)-Number(previewB);
  if(a.created!==b.created)return (b.created||0)-(a.created||0);
  return a.id<b.id?-1:a.id>b.id?1:0;
 });
}

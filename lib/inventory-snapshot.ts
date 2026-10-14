// Inventory is shared public host metadata. Explicit refresh replaces the
// snapshot; navigation reuses it. Older completions cannot replace newer data.
export function inventorySnapshot<T>(load: ()=>T | Promise<T>){
 let value: T | undefined,pending: Promise<T> | null = null,revision=0;
 return async function read({refresh=false}={}){
  if(!refresh&&value!==undefined)return structuredClone(value);
  if(!refresh&&pending)return structuredClone(await pending);
  const current=++revision;
  const task=Promise.resolve().then(load).then(result=>{
   if(current===revision)value=structuredClone(result);
   return result;
  }).finally(()=>{if(pending===task)pending=null;});
  pending=task;
  return structuredClone(await task);
 };
}

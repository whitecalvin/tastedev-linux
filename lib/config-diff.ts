export function configDiff(before: string,after: string){
 const left=before.split('\n'),right=after.split('\n');let prefix=0,suffix=0;
 while(prefix<left.length&&prefix<right.length&&left[prefix]===right[prefix])prefix++;
 while(suffix<left.length-prefix&&suffix<right.length-prefix&&left[left.length-1-suffix]===right[right.length-1-suffix])suffix++;
 return {changed:before!==after,startLine:prefix+1,before:left.slice(prefix,left.length-suffix),after:right.slice(prefix,right.length-suffix)};
}

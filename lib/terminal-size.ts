function dimension(value: unknown,min: number,max: number): number {
 if(typeof value!=='number'||!Number.isInteger(value)||value<min||value>max)throw Object.assign(new Error('터미널 크기 범위를 확인하세요.'),{status:400});
 return value;
}
export function terminalSize(cols: unknown,rows: unknown): {cols: number; rows: number} {
 return {cols:dimension(cols,20,400),rows:dimension(rows,5,200)};
}

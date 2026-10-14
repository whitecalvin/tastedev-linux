// UI-only xterm options; never changes the account shell or launches a job.
export type TerminalAppearance = {fontSize: number; cursorStyle: 'block' | 'bar' | 'underline'; cursorBlink: boolean; scrollback: number};
export function terminalAppearance(value?: unknown): TerminalAppearance {
 const input=value!=null ? Object(value) as Record<string, unknown> : {};
 return {fontSize:typeof input.fontSize==='number'&&[11,12,13,14,16,18,20].includes(input.fontSize)?input.fontSize:13,cursorStyle:input.cursorStyle==='block'||input.cursorStyle==='bar'||input.cursorStyle==='underline'?input.cursorStyle:'block',cursorBlink:input.cursorBlink===true,scrollback:typeof input.scrollback==='number'&&[1000,3000,5000,10000].includes(input.scrollback)?input.scrollback:3000};
}

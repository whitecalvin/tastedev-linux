export type TerminalKeyEvent = {key: string; keyCode?: number};
// Leave input-method switching to the OS/browser. Returning false from xterm's
// custom handler skips terminal key processing without cancelling native events.
// Keep keyCode 229/Process and composition Enter in xterm's composition helper:
// it accounts for Hangul final consonants moving to the next syllable.
const nativeKeys=new Set(['HangulMode','Hangul','HanjaMode','Hanja','KanaMode','KanjiMode','Convert','NonConvert','ModeChange']);
export function terminalKeyEvent(event: TerminalKeyEvent): boolean{return !nativeKeys.has(event.key)&&event.keyCode!==21&&event.keyCode!==25;}

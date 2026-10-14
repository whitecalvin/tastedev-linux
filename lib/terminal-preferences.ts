import {terminalAppearance,type TerminalAppearance} from './terminal-appearance.ts';
export const terminalPreferencesKey='tastedev-linux.terminal-preferences.v1';
export type TerminalPreferences = {terminalAppearance: TerminalAppearance; terminalTabTimeout: number};
export function terminalPreferences(value: unknown): TerminalPreferences{
 const input=value&&typeof value==='object'?value as Record<string, unknown>:{};
 return {terminalAppearance:terminalAppearance(input.terminalAppearance),terminalTabTimeout:typeof input.terminalTabTimeout==='number'&&[120,300,900,3600].includes(input.terminalTabTimeout)?input.terminalTabTimeout:3600};
}
// Persist display preferences only: never commands, account data, jobs or editor buffers.
export function mergeTerminalPreferences<T extends Record<string, unknown>>(drafts: T,saved: unknown): T & Partial<Omit<TerminalPreferences,keyof T>>{
 const preferences=terminalPreferences(saved);
 // Only missing own keys are added; current draft properties retain their original types.
 return {...drafts,...Object.fromEntries(Object.entries(preferences).filter(([key])=>!Object.hasOwn(drafts,key)))} as T & Partial<Omit<TerminalPreferences,keyof T>>;
}

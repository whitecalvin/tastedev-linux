'use client';
import {useLanguage} from '../language-provider';
import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; loading?: boolean; icon?: boolean };
export type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string };
export type SelectOption = { value: string | number; label: string; disabled?: boolean };
export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: readonly SelectOption[] };
import './controls.css';
const classes = (...values: (string | false | null | undefined)[]) => values.filter(Boolean).join(' ');
export function Button({ variant = 'primary', loading = false, icon = false, className, children, disabled, type = 'button', ...props }: ButtonProps) {
  const {t}=useLanguage();
  const iconOnly=icon||/(?:^|\s)(?:nginx-icon-button|nginx-tree-icon|nginx-setting-action(?:--delete)?|terminal-icon)(?:\s|$)/.test(className||'');
  return <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={classes('ui-button', `ui-button--${variant}`, iconOnly&&'ui-icon-button', className)}>{loading && <span className="ui-spinner" aria-hidden="true"/>}{typeof children==='string'?t(children):children}</button>;
}
export function IconButton(props: ButtonProps){return <Button {...props} icon/>;}
export function Checkbox({ label, className, id, ...props }: InputProps) {
  const {t}=useLanguage();
  const generated = useId();
  return <label htmlFor={id || generated} className={classes('ui-choice', 'ui-checkbox', className)}><input {...props} id={id || generated} type="checkbox"/><span className="ui-choice__control" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-8"/></svg></span><span className="ui-choice__label">{t(label)}</span></label>;
}
export function Radio({ label, className, id, ...props }: InputProps) {
  const {t}=useLanguage();
  const generated = useId();
  return <label htmlFor={id || generated} className={classes('ui-choice', 'ui-radio', className)}><input {...props} id={id || generated} type="radio"/><span className="ui-choice__control" aria-hidden="true"/><span className="ui-choice__label">{t(label)}</span></label>;
}
export function Switch({ label, className, id, ...props }: InputProps) {
  const {t}=useLanguage();
  const generated = useId();
  return <label htmlFor={id || generated} className={classes('ui-choice', 'ui-switch', className)}><input {...props} id={id || generated} type="checkbox" role="switch"/><span className="ui-switch__track" aria-hidden="true"><span/></span><span className="ui-choice__label">{t(label)}</span></label>;
}
export function NativeSelect({ label, options, id, className, ...props }: SelectProps) {
  const {t}=useLanguage();
  const generated = useId();
  return <div className={classes('ui-field', className)}><label htmlFor={id || generated}>{t(label)}</label><div className="ui-dropdown"><select {...props} id={id || generated}>{options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{t(option.label)}</option>)}</select><span className="ui-select-chevron" aria-hidden="true"><svg viewBox="0 0 16 16" focusable="false"><path d="m4 6 4 4 4-4"/></svg></span></div></div>;
}
export function TextInput({ label, id, className, ...props }: InputProps) {
  const {t}=useLanguage();
  const generated = useId();
  return <div className={classes('ui-field', className)}><label htmlFor={id || generated}>{t(label)}</label><input {...props} id={id || generated} className="ui-input"/></div>;
}
export function Badge({ children, tone = 'neutral' }: { children?: ReactNode; tone?: string }) {
  const {t}=useLanguage(); return <span className={`ui-badge ui-badge--${tone}`}>{typeof children==='string'?t(children):children}</span>; }
export function Progress({ value, label = '진행 상태' }: { value?: number; label?: string }) {
  const {t}=useLanguage();
  const determinate = typeof value === 'number' && Number.isFinite(value);
  const percent = determinate ? Math.max(0, Math.min(100, value)) : undefined;
  return <div className="ui-progress"><div className="ui-progress__label"><span>{t(label)}</span><span>{determinate ? `${Math.round(percent ?? 0)}%` : t('진행 중')}</span></div><div className={classes('ui-progress__track', !determinate && 'ui-progress--indeterminate')} role="progressbar" aria-label={t(label)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={!determinate ? t('진행 중 · 전체 진행률 미확인') : undefined}><span style={determinate ? {width:`${percent}%`} : undefined}/></div></div>;
}

export const Dropdown=NativeSelect;
export {CustomSelect} from './custom-select';

'use client';
import { useState } from 'react';
import { Button, Checkbox, Radio, Switch, NativeSelect, CustomSelect, Progress } from '../../components/ui/controls';
import ThemePicker from '../../components/theme-picker';
import {useLanguage} from '../../components/language-provider';
export default function Components() {
  const {t}=useLanguage();
  const [checked,setChecked] = useState(false);
  const [enabled,setEnabled] = useState(false);
  const [value,setValue] = useState('nginx');
  const [mode,setMode] = useState('read');
  return <main className="component-demo"><a href="/">{t('← 서버 콘솔')}</a><ThemePicker/><h1>{t('사용자 컴포넌트')}</h1><p className="intro">{t('화면에 사용하는 공통 UI입니다. 이 화면의 조작은 장비 설정이나 패키지를 변경하지 않습니다.')}</p>
    <section><h2>{t('버튼')}</h2><div className="demo-row"><Button>{t('기본 버튼')}</Button><Button variant="secondary">{t('보조 버튼')}</Button><Button disabled>{t('비활성')}</Button><Button loading>{t('처리 중')}</Button></div></section>
    <section><h2>{t('체크박스')}</h2><Checkbox label={t('설치 대상에 추가')} checked={checked} onChange={e=>setChecked(e.target.checked)}/><Checkbox label={t('이미 설치된 패키지')} disabled checked readOnly/><Checkbox label={t('여러 줄로 표시되는 긴 라벨도 체크박스와 같은 중심선을 유지하며 클릭 영역 전체에서 선택할 수 있습니다.')} checked={checked} onChange={e=>setChecked(e.target.checked)}/></section>
    <section><h2>{t('드롭다운')}</h2><div className="demo-row"><NativeSelect label="Native select" value={value} onChange={e=>setValue(e.target.value)} options={[{value:'nginx',label:'nginx'},{value:'certbot',label:'Certbot'},{value:'nodejs',label:'Node.js'},{value:'unavailable',label:t('비활성 옵션'),disabled:true}]}/><CustomSelect label="Custom select" value={value} onChange={e=>setValue(e.target.value)} options={[{value:'nginx',label:'nginx'},{value:'certbot',label:'Certbot'},{value:'nodejs',label:'Node.js'},{value:'unavailable',label:t('비활성 옵션'),disabled:true}]}/><CustomSelect label={t('비활성 옵션')} value={value} disabled options={[{value:'nginx',label:'nginx'},{value:'certbot',label:'Certbot'},{value:'nodejs',label:'Node.js'}]}/></div></section>
    <section><h2>{t('라디오')}</h2><fieldset><legend>{t('보기 모드 예시')}</legend><div className="demo-row"><Radio name="mode" value="read" label={t('조회')} checked={mode==='read'} onChange={e=>setMode(e.target.value)}/><Radio name="mode" value="detail" label={t('상세')} checked={mode==='detail'} onChange={e=>setMode(e.target.value)}/></div></fieldset></section>
    <section><h2>{t('스위치')}</h2><Switch label={t('예시 옵션')} checked={enabled} onChange={e=>setEnabled(e.target.checked)}/><Switch label={t('비활성 옵션')} disabled/></section>
    <section><h2>{t('진행률')}</h2><Progress label={t('진행률 예시')} value={65}/><Progress label={t('진행률을 알 수 없는 작업')}/></section>
  </main>;
}

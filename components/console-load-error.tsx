'use client';
import {usePathname} from 'next/navigation';
import {useLanguage} from './language-provider';
import {Button} from './ui/controls';
export default function ConsoleLoadError({retry}: {retry?: () => void}){
 const {t}=useLanguage();
 const pathname=usePathname();
 const standalone=pathname==='/packages'||pathname==='/terminal';
 return <main className={'admin-content management-page'+(standalone?' without-sidebar':'')}><div className="management-body"><section role="alert"><h2>{t('서버 정보를 불러오지 못했습니다.')}</h2><p>{t('잠시 후 다시 시도하세요. 로그인 상태와 저장된 설정은 유지됩니다.')}</p><Button variant="secondary" onClick={()=>retry?retry():window.location.reload()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1"/></svg>{t('다시 시도')}</Button></section></div></main>;
}

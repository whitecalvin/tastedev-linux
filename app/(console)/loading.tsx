'use client';
import {usePathname} from 'next/navigation';
import {useLanguage} from '../../components/language-provider';
export default function Loading(){
 const {t}=useLanguage();
 const pathname=usePathname();
 const standalone=pathname==='/packages'||pathname==='/terminal';
 return <main className={'admin-content management-page'+(standalone?' without-sidebar':'')} aria-busy="true"><div className="management-body"><p role="status">{t('불러오는 중')}</p></div></main>;
}

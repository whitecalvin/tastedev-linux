'use client';
import type {RedisResourceInventory} from './console-types';
import {useLanguage} from './language-provider';
import {Badge} from './ui/controls';
const labels: Record<string,string>={module:'모듈',replication:'복제 연결','external-file':'외부 파일',cluster:'클러스터',network:'네트워크',persistence:'지속성','data-directory':'데이터 폴더',output:'출력 파일',socket:'소켓'};
export default function RedisResourceReview({review}: {review?: RedisResourceInventory | null}){
 const {t}=useLanguage();if(!review)return null;
 return <details className="live-site"><summary>{t('Redis 리소스 검토')}</summary><Badge tone="warning">{t('별도 검증 필요')}</Badge><p className="hint">{t(review.scope==='selected-file-only'?'선택한 파일의 검토 목록입니다. 전체 include와 실행 환경은 별도로 검사해야 합니다.':'후보 파일의 검토 목록입니다. 실행 안전성 검증 결과는 아닙니다.')}</p>{review.path&&<p><code>{review.path}</code></p>}<table className="admin-table"><thead><tr><th>{t('줄')}</th><th>{t('설정')}</th><th>{t('종류')}</th></tr></thead><tbody>{review.resources.map((item,index)=><tr key={index}><td>{item.line}</td><td><code>{item.directive}</code></td><td>{t(labels[item.category]||'검토 필요')}</td></tr>)}</tbody></table>{!review.resources.length&&<p>{t('검토 목록에 식별된 항목이 없습니다. 실행 안전성을 보증하지 않습니다.')}</p>}{review.truncated&&<p role="status">{t('표시하지 않은 항목')}: {review.totalResources-review.resources.length}</p>}{review.unsupportedSyntax>0&&<p role="status">{t('추가 문법 검토 필요')}: {review.unsupportedSyntax}</p>}</details>;
}

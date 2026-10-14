'use client';
import {useRef,useState} from 'react';
import {ToastNotice,useFeedback} from '../../components/ui/toast-provider';
import type {ToastKind} from '../../components/ui/toast';

// Public synthetic UI fixture: no requests, credentials or operating actions.
export default function ToastFixture(){
 const [message,setMessage,kind,eventId]=useFeedback<string>('');
 const [popupMessage,setPopupMessage,popupKind,popupEvent]=useFeedback<string>('');
 const [page,setPage]=useState(true),dialog=useRef<HTMLDialogElement>(null);
 return <div className="console-shell"><aside className="admin-sidebar"><div className="sidebar-title">설치된 패키지</div><nav><button type="button" className="active" title="nodejs 22.22.1+dfsg+~cs22.19.15-1ubuntu1">Node.js<small> · 22.22.1+dfsg+~cs22.19.15-1ubuntu1</small></button></nav></aside><main style={{padding:40,marginLeft:280}}>
  <h1>공통 토스트 검수</h1>
  {(['success','info','warning','error'] as ToastKind[]).map(type=><button type="button" key={type} onClick={()=>{setPage(true);setMessage(type==='success'?'보안 옵션 저장 완료':type+' · 공통 토스트 검수',type);}}>{type}</button>)}
  <button type="button" onClick={()=>dialog.current?.showModal()}>팝업 열기</button>
  <button type="button" onClick={()=>setPage(false)}>페이지 제거</button>
  {page&&<ToastNotice title="검수 안내" message={message} kind={kind} eventId={eventId}/>}
  <dialog ref={dialog}><p>팝업 검수</p><button type="button" onClick={()=>setPopupMessage('팝업 작업 오류', 'error')}>팝업 오류</button><button type="button" onClick={()=>dialog.current?.close()}>팝업 닫기</button><ToastNotice message={popupMessage} kind={popupKind} eventId={popupEvent}/></dialog>
 </main><div className="admin-statusbar"><span>검수 상태표시줄</span></div></div>;
}

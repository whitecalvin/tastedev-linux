// UI harnesses keep their existing React state driver while the real provider
// is exercised separately. Operation handlers are never replaced here.
import React from 'react';
function ToastNoticeStub({message,kind='info'}) {
 return message ? React.createElement('div',{role:kind==='error'?'alert':'status','data-toast-kind':kind},message) : null;
}
export function toastTestChildren(node) {
 return node?.type===ToastNoticeStub ? ToastNoticeStub(node.props) : node?.props?.children;
}
export function toastTestModule(require) {
 return toastTestModuleWithReact(require('react'));
}
export function toastTestModuleWithReact(hooks,trackKind=false) {
 return {
  ToastNotice: ToastNoticeStub,
  useFeedback: initial => {const [value,set]=hooks.useState(initial);if(!trackKind)return [value,set,'info',0];const feedback=hooks.useRef({kind:'info',revision:0});return [value,(next,kind='info')=>{feedback.current={kind,revision:feedback.current.revision+1};set(next);},feedback.current.kind,feedback.current.revision];},
  ToastProvider: ({children}) => children,
 };
}

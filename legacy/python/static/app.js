const $ = id => document.getElementById(id);
let token = '', status = null, selected = [], busy = false, polling = false;
const boxes = [...document.querySelectorAll('.select input')];
function message(text) { $('message').textContent = text; }
async function api(path, data) {
  const response = await fetch(path, {method: data ? 'POST' : 'GET', headers: {'Authorization': `Bearer ${token}`, ...(data ? {'Content-Type': 'application/json'} : {})}, ...(data ? {body: JSON.stringify(data)} : {})});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '서버 요청 실패');
  return result;
}
function updateSelection() {
  selected = boxes.filter(b => b.checked).map(b => b.value);
  $('count').textContent = `${selected.length}개 패키지 선택`;
  $('preview').disabled = !selected.length || busy;
}
function renderJob(job) {
  busy = job?.status === 'running';
  $('jobstatus').textContent = ({running:'설치 진행 중',success:'설치 명령 완료',failed:'설치 실패'})[job?.status] || '대기 중';
  $('logs').textContent = job ? ['$ ' + job.command.join(' '), ...job.logs].join('\n') : '설치 작업이 없습니다.';
  boxes.forEach(b => { b.disabled = !status || busy || status.packages.find(p => p.id === b.value)?.installed; });
  updateSelection();
}
async function refresh() {
  try {
    status = await api('/api/status');
    $('hostname').textContent = status.hostname;
    $('connection').textContent = '● 서버 연결됨';
    $('mode').textContent = status.canInstall ? '설치 모드 활성' : status.supported ? '조회 모드 · 관리자 설치 모드 필요' : '지원하지 않는 OS · Ubuntu/Debian 필요';
    $('refresh').disabled = false;
    for (const p of status.packages) {
      $('state-' + p.id).textContent = p.installed ? '설치됨' : '설치 필요';
      $('version-' + p.id).textContent = p.packages.map(s => `${s.name}: ${s.version || '미설치'}`).join(' / ');
      $('version-' + p.id).title = p.sha256 ? `실행 바이너리: ${p.binary}\nSHA-256: ${p.sha256}` : '실행 바이너리 없음';
      if (p.installed) boxes.find(b => b.value === p.id).checked = false;
    }
    renderJob(status.job);
    $('install').disabled = !$('confirm').checked || !status.canInstall || busy;
    message('');
  } catch (error) { message(error.message); }
}
$('connect').onclick = async () => { token = $('token').value.trim(); await refresh(); if(status) { $('token').value = ''; $('login').hidden = true; } };
$('token').onkeydown = e => { if(e.key === 'Enter') $('connect').click(); };
$('refresh').onclick = refresh;
boxes.forEach(b => b.onchange = updateSelection);
$('preview').onclick = async () => {
  try { const plan = await api('/api/plan', {packages:selected}); $('target').textContent = status.hostname; $('command').textContent = plan.command.join(' '); $('confirm').checked = false; $('install').disabled = true; $('review').showModal(); } catch(e) { message(e.message); }
};
$('confirm').onchange = () => { $('install').disabled = !$('confirm').checked || !status?.canInstall || busy; };
$('cancel').onclick = () => $('review').close();
$('install').onclick = async () => {
  $('install').disabled = true;
  try { const result = await api('/api/install', {packages:selected, confirm:true}); $('review').close(); renderJob(result.job); message('설치를 시작했습니다. 작업 로그를 확인하세요.'); } catch(e) { $('review').close(); message(e.message); }
};
setInterval(async () => { if(!busy || polling) return; polling = true; try { const result = await api('/api/job'); renderJob(result.job); if(!busy) await refresh(); } catch(e) { message(e.message); } finally { polling = false; } }, 1500);

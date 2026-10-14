type AnalysisInput = {text?: unknown;source?: unknown;confirm?: unknown;configVersion?: unknown};
const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {aiConfiguration,aiSettings} from './ai-settings.ts';
import {aiRequest,aiOutput} from './ai-provider.ts';
const fail = (message: string, status = 400) => Object.assign(new Error(message), { status });
let pending = false,
  lastRequest = 0;
export function aiStatus(){return aiSettings();}
export function redactLog(text: string) {
  return text
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g, '[PRIVATE KEY REDACTED]')
    .replace(/\bsk-[\w-]+/g, '[API KEY REDACTED]')
    .replace(/(authorization\s*[:=]\s*(?:bearer\s+)?)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/((?:password|passwd|token|secret|api[_-]?key)\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, '$1[REDACTED]')
    .replace(/(\w+:\/\/[^\s:@/]+:)[^\s@/]+@/g, '$1[REDACTED]@');
}
export function validateAnalysis(input: AnalysisInput) {
  if (!input || typeof input.text !== 'string' || !input.text.trim() || Buffer.byteLength(input.text) > 16000)
    throw fail('분석 로그는 16KB 이하로 입력하세요.');
  if (typeof input.source !== 'string' || input.source.length > 100) throw fail('로그 소스를 확인하세요.');
  return { text: redactLog(input.text), source: redactLog(input.source) };
}
export async function analyzeLog(input: AnalysisInput, fetcher: typeof fetch = fetch) {
  const internal=aiConfiguration();
  const config = {...internal,...aiSettings(internal)};
  if (!config.enabled || !config.configured) throw fail('서버에서 AI 분석 허용과 API 키를 설정해야 합니다.', 403);
  const data = validateAnalysis(input);
  if(input.configVersion!==undefined&&input.configVersion!==config.version)throw fail('AI 업체 설정이 변경됐습니다. 연결 상태와 전송 대상을 다시 확인하세요.',409);
  if (input.confirm !== true) throw fail(`검토한 로그의 ${config.provider} 전송에 동의하세요.`);
  if (pending || Date.now() - lastRequest < 5000)
    throw fail('분석 중이거나 요청 간격이 너무 짧습니다. 잠시 후 다시 시도하세요.', 429);
  pending = true;
  lastRequest = Date.now();
  try {
    const request=aiRequest(config,data);
    const response=await fetcher(request.url,request.options);
    if (!response.ok) {
      let providerCode: string|undefined;
      if (response.status === 429) {
        try {
          const errorBody: unknown = await response.json();
          if (object(errorBody)&&object(errorBody.error)&&typeof errorBody.error.code==='string'&&['insufficient_quota', 'rate_limit_exceeded'].includes(errorBody.error.code))
            providerCode = errorBody.error.code;
        } catch {}
      }
      const messages: Record<number,string> = {
        400: 'AI 업체·모델·API 설정 · 설정값을 확인하세요.',
        404: `${config.provider} API 주소와 모델 ID를 확인하세요.`,
        401: `${config.provider} API 키 인증에 실패했습니다.`,
        403: `${config.provider} 프로젝트 또는 모델 접근 권한을 확인하세요.`,
        429: `${config.provider} 사용 한도·크레딧 또는 요청 제한을 확인하세요.`,
      };
      const message = providerCode === 'insufficient_quota'
        ? `${config.provider} API 크레딧 또는 사용 한도가 부족합니다. 결제와 사용 한도를 확인하세요.`
        : providerCode === 'rate_limit_exceeded'
          ? `${config.provider} 요청 제한에 도달했습니다. 잠시 후 다시 시도하세요.`
          : messages[response.status] || 'AI 서비스 요청이 실패했습니다. 잠시 후 다시 시도하세요.';
      throw Object.assign(fail(message, 502), { providerCode, providerStatus: response.status });
    }
    const body = await response.json();
    const {text,incomplete}=aiOutput(config.protocol,body);
    if (typeof text!=='string'||!text.trim()) throw fail('AI 응답에 분석 결과가 없습니다.', 502);
    return {
      analysis: redactLog(text),
      model: config.model,
      at: new Date().toISOString(),
      incomplete,
      provider:config.provider,
    };
  } catch (e) {
    if (object(e)&&e.status) throw e;
    throw fail((object(e)&&e.name === 'TimeoutError') ? 'AI 분석 시간이 초과됐습니다.' : 'AI 서비스에 연결할 수 없습니다.', 502);
  } finally {
    pending = false;
  }
}

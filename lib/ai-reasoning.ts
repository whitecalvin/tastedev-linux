// Explicit capability mapping: other models keep the provider's default.
export function reasoningLevels(config: {provider?: unknown;protocol?: unknown;model?: unknown}): string[]{
 if(config.provider==='OpenAI'&&typeof config.protocol==='string'&&['responses','chat-completions'].includes(config.protocol)&&/^gpt-6\.1-sol(?:-|$)/.test(typeof config.model==='string'?config.model:''))return ['auto','low','medium','high','xhigh','max'];
 return ['auto'];
}
export const reasoningLabels: Record<string,string>={auto:'자동',low:'Low',medium:'Medium',high:'High',xhigh:'Extra High',max:'Max'};

import {auditEvent} from '../../../lib/security.ts';
import { handle, authorized } from '../../../lib/api.ts';
import {isAuthStorageError,authStorageMessage} from '../../../lib/auth-storage-error.ts';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, { params }: {params: Promise<{action: string}>}) { return handle(request, (await params).action); }
export async function POST(request: Request, { params }: {params: Promise<{action: string}>}) {
  const {action}=await params;
  let authenticated;try{authenticated=await authorized(request);}catch(error){if(isAuthStorageError(error))return Response.json({error:authStorageMessage,storageUnavailable:true},{status:503,headers:{'Cache-Control':'no-store'}});throw error;}
  const response=await handle(request,action);
  // Operational actions record their outcomes in handle() or their worker.
  // A successful job submission must not become an early completion event.
  if(authenticated && ['node-apps','node-app-remove','node-app-env','node-app-env-restore','node-env-restore','node-env','terminal-input','config-save','folder','ai-analyze','file','nginx'].includes(action)){
    try{await auditEvent(action,response.ok?'completed':response.status===403?'blocked':'failed');}catch{console.error('[LINUX] Audit record write failed');}
  }
  return response;
}

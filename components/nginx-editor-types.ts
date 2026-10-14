export type {PendingInput,PendingSnapshot,PendingCache} from '../lib/nginx-pending-inputs.ts';
import type {CodeBuffer} from '../lib/nginx-code-recovery.ts';
export type {CodeBuffer,CodeBuffers,EditorTarget,RecoveryEntry,RecoveryConfirmation} from '../lib/nginx-code-recovery.ts';
export type {ConfigDraft} from '../lib/config-history.ts';
import type {NginxFile} from './console-types';
export type NginxSettingNode = {id: string; label: string; kind?: string; line?: number; start?: number; end?: number; children?: NginxSettingNode[]};
import type {NginxAstNode} from '../lib/nginx-node-key.ts';
export type {NginxAstNode} from '../lib/nginx-node-key.ts';
export type EditorFile = NginxFile & {nodes: NginxAstNode[]};


export type CodeViewState = {text: string; start: number; end: number; direction: 'forward' | 'backward' | 'none'; top: number; left: number};



export type {NginxDirectiveField as DirectiveField} from '../lib/nginx-fields.ts';

export type {NginxTreeFile as TreeFile} from '../lib/nginx-tree.ts';
import type {NginxTreeFile as TreeFile} from '../lib/nginx-tree.ts';
export type TreeSelection = {file: TreeFile; node: NginxAstNode | null};

export type TransferOrigin = {path: string; source: string; key: string; text: string};
export type TransferRequest = {path: string; source: string; key: string | null; text: string; origin?: TransferOrigin};
export type TreeContext = TreeSelection & {siteLink: string | null; x: number; y: number; trigger: HTMLElement};
export type TreeConfirmation = {kind: 'delete-block' | 'discard' | 'use-live'; path: string; source: string; baseline?: string; nodeKey: string | null; nodeLabel?: string; liveSource: string | null};

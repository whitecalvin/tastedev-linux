// Shared browser/helper policy. Filesystem ownership, graph membership and native
// validation remain mandatory server checks; this predicate is not authorization.
export function isNginxEditablePath(target: unknown): target is string{
 return typeof target==='string'&&/^\/etc\/nginx\/(?:mime\.types|fastcgi_params|uwsgi_params|scgi_params|[a-zA-Z0-9][a-zA-Z0-9_.-]*\.conf|(?:conf\.d|sites-available|snippets)\/[a-zA-Z0-9][a-zA-Z0-9_.-]*)$/.test(target);
}

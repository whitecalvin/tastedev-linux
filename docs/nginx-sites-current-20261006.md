# nginx site link inventory — 2026-10-06

`nginx-context` now includes `sites` metadata from the trusted helper runtime.
The inventory distinguishes linked, broken, external and unsafe entries, lists
aliases for each available file and flags same-name conflicts. `included` is
derived from a complete include graph; incomplete graphs return `null`, never an
assumed active state. No raw configuration or external link destination is returned.

Directories must be plain trusted-owner directories without group/world writes.
Regular files are opened without following symlinks and checked before/after
reading. Link targets remain inside the nginx root. Each inventory is read twice
and compared; source/alias identity and content versions participate in the result
version. Limits are 100 entries and 1 MiB of regular file content per directory.
Missing directories and unsafe inventories are reported explicitly. Lookup never
creates directories, links, backups or service changes.

Validation: focused filesystem fixtures and context/runtime closure checks passed.
This document describes the initial inventory change. The subsequent transaction
and GUI implementation is recorded in `nginx-site-operation-current-20261006.md`. No installed package,
service or DEB verification was performed.

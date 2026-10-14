import pathlib, re, hashlib, tarfile, io, subprocess, json, datetime, sys

root = pathlib.Path.cwd()
stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
tag = "tastedev-linux-qa:pg-" + stamp.lower()
names = re.findall(
    r"'([^']+\.mjs)'", (root / "scripts/admin/runtime-files.mjs").read_text()
)
assert len(names) == len(set(names))
files = {}
manifest = {}
for name in names:
    assert re.fullmatch(r"[a-z0-9-]+\.mjs", name)
    content = (root / "lib" / name).read_bytes()
    files["runtime/" + name] = content
    manifest[name] = hashlib.sha256(content).hexdigest()
helper = (root / "scripts/admin/linux-admin").read_bytes()
files["linux-admin"] = helper
files["runtime/manifest.json"] = json.dumps(manifest).encode()
files[
    "Dockerfile"
] = b"""FROM node@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c AS node
FROM postgres@sha256:5a5a84b19854a9ffaa54082c166ff4ec27473a361e496e5ea167f298f2da9722
USER root
RUN apt-get update && apt-get install -y --no-install-recommends bubblewrap util-linux && rm -rf /var/lib/apt/lists/*
COPY --from=node /usr/local/bin/node /usr/bin/node
COPY linux-admin /usr/lib/tastedev-linux/scripts/admin/linux-admin
COPY runtime/ /usr/lib/tastedev-linux/scripts/admin/runtime/
RUN chmod 0755 /usr/lib/tastedev-linux /usr/lib/tastedev-linux/scripts /usr/lib/tastedev-linux/scripts/admin /usr/lib/tastedev-linux/scripts/admin/runtime /usr/lib/tastedev-linux/scripts/admin/linux-admin && chmod 0644 /usr/lib/tastedev-linux/scripts/admin/runtime/* && /usr/bin/node --version && /usr/bin/bwrap --version
ENTRYPOINT ["/bin/sh"]
"""
stream = io.BytesIO()
with tarfile.open(fileobj=stream, mode="w") as archive:
    for name, content in files.items():
        info = tarfile.TarInfo(name)
        info.size = len(content)
        info.mode = 0o644
        info.uid = info.gid = 0
        archive.addfile(info, io.BytesIO(content))
evidence = root / ".runtime/verification" / ("remote-postgresql-image-" + stamp)
evidence.mkdir(parents=True)
plan = {
    "status": "PREPARED",
    "image": tag,
    "remoteHost": "192.168.0.103",
    "runtimeModules": len(manifest),
    "runtimeManifest": manifest,
    "helperSha256": hashlib.sha256(helper).hexdigest(),
    "archiveSha256": hashlib.sha256(stream.getvalue()).hexdigest(),
    "archiveBytes": len(stream.getvalue()),
    "hostSettingsChanged": False,
    "remoteSourceTransferred": False,
    "helperExecuted": False,
    "debVerified": False,
}
(evidence / "plan.json").write_text(json.dumps(plan, indent=2) + "\n")
(evidence / "Dockerfile").write_bytes(files["Dockerfile"])
if "--execute" not in sys.argv:
    print(
        json.dumps(
            {
                key: value
                for key, value in dict(
                    plan, evidence=str(evidence / "plan.json")
                ).items()
                if key != "runtimeManifest"
            }
        )
    )
    raise SystemExit(0)
ssh = [
    "ssh",
    "-o",
    "BatchMode=yes",
    "-o",
    "ConnectTimeout=8",
    "-o",
    "StrictHostKeyChecking=yes",
    "-i",
    "/home/whitecalvin/.ssh/id_ed25519",
    "whitecalvin@192.168.0.103",
]
print(json.dumps({"status": "RUNNING", "image": tag}), flush=True)
check = subprocess.run(
    ssh + ["docker build --pull=false -t " + tag + " -"],
    input=stream.getvalue(),
    capture_output=True,
    timeout=240,
)
(evidence / "build.log").write_bytes(check.stdout + check.stderr)
image_id = None
if check.returncode == 0:
    image_id = subprocess.run(
        ssh + ["docker image inspect " + tag + ' --format "{{.Id}}"'],
        capture_output=True,
        text=True,
        check=True,
        timeout=20,
    ).stdout.strip()
unchanged = (
    all(
        hashlib.sha256((root / "lib" / name).read_bytes()).hexdigest() == digest
        for name, digest in manifest.items()
    )
    and (root / "scripts/admin/linux-admin").read_bytes() == helper
)
result = dict(
    plan,
    status="PASS" if check.returncode == 0 and unchanged else "FAIL",
    scope="isolated image preparation only",
    imageId=image_id,
    sourceUnchanged=unchanged,
    buildExitCode=check.returncode,
    remoteSourceTransferred=True,
)
(evidence / "result.json").write_text(json.dumps(result, indent=2) + "\n")
print(
    json.dumps(
        {
            key: value
            for key, value in dict(
                result, evidence=str(evidence / "result.json")
            ).items()
            if key != "runtimeManifest"
        }
    )
)
if result["status"] != "PASS":
    print((check.stdout + check.stderr).decode(errors="replace")[-3000:])
    raise SystemExit(1)

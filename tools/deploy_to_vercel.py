import subprocess
import sys

print("==================================================")
print("[START] DEPLOYING TO VERCEL PRODUCTION (anomalybox.com)")
print("==================================================")

cmd = ["npx.cmd", "--yes", "vercel", "deploy", "--prod", "--yes"]

process = subprocess.Popen(
    cmd,
    stdin=subprocess.DEVNULL,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1
)

for line in process.stdout:
    print(line, end="")

process.wait()
print(f"\nExit code: {process.returncode}")
if process.returncode == 0:
    print("[SUCCESS] VERCEL PRODUCTION DEPLOYMENT SUCCESSFUL!")
else:
    print("[FAILED] DEPLOYMENT FAILED.")
    sys.exit(process.returncode)

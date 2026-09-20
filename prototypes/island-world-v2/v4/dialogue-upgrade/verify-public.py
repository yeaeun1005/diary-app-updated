"""Verify public static bytes only; never execute the app or contact its DB."""
from pathlib import Path
import subprocess, json, hashlib, concurrent.futures, datetime, sys
ROOT=Path(__file__).resolve().parents[4]
OUT=ROOT/'renders/releases/mind-dialogue-20260920'
manifest=json.loads((OUT/'manifest.json').read_text())
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
base='https://'+(ROOT/'CNAME').read_text().strip()+'/'
api='https://api.github.com/repos/yeaeun1005/diary-app-updated/actions/runs'
def get(url):
    return subprocess.run(['curl','--fail','--silent','--show-error','--location','--proto','=https','--connect-timeout','15','--max-time','60','--retry','2','--retry-delay','1',url],capture_output=True,check=True).stdout
runs=json.loads(get(api+'?per_page=10&head_sha='+commit))['workflow_runs']
matches=[r for r in runs if r['head_sha']==commit and r['name']=='pages build and deployment']
if not matches:
    print(json.dumps({'commit':commit,'status':'awaiting-pages-job'}));sys.exit(2)
run=max(matches,key=lambda r:r['id'])
if run['status']!='completed' or run['conclusion']!='success':
    print(json.dumps({'commit':commit,'runId':run['id'],'status':run['status'],'conclusion':run['conclusion']}));sys.exit(2 if run['status']!='completed' else 3)
def verify(item):
    name,expected=item
    data=get(base+('' if name=='index.html' else name))
    actual=hashlib.sha256(data).hexdigest()
    return {'path':name,'bytes':len(data),'sha256':actual,'matches':actual==expected}
progress=OUT/'public-verification-progress.json'
cached=json.loads(progress.read_text()) if progress.exists() else {}
passed={f['path']:f for f in cached.get('files',[]) if cached.get('commit')==commit and f.get('matches') and manifest['files'].get(f['path'])==f.get('sha256')}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    pending={pool.submit(verify,item):item[0] for item in manifest['files'].items() if item[0] not in passed}
    for future in concurrent.futures.as_completed(pending):
        result=future.result();passed[result['path']]=result
        progress.write_text(json.dumps({'commit':commit,'files':list(passed.values())},indent=2)+'\n')
files=[passed[name] for name in manifest['files']]
receipt={'checkedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'commit':commit,'version':manifest['version'],'site':base,
         'workflow':{'id':run['id'],'status':run['status'],'conclusion':run['conclusion'],'url':run['html_url']},
         'productionScriptExecuted':False,'productionDatabaseAccessed':False,'files':files,'allMatch':all(f['matches'] for f in files)}
(OUT/'deployment-result.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'site':base,'commit':commit,'workflow':run['conclusion'],'runId':run['id'],'verifiedFiles':len(files),'allMatch':receipt['allMatch'],
                  'mismatches':[f['path'] for f in files if not f['matches']]},indent=2))
if not receipt['allMatch']:sys.exit(4)

"""Preserve six user GLBs; create embedded 1K runtime copies without geometry edits."""
from pathlib import Path
import sys, importlib.util, json, hashlib, subprocess, tempfile, base64
sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
V4 = HERE.parent
def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    obj = importlib.util.module_from_spec(spec); spec.loader.exec_module(obj)
    return obj
glb = module('glb_six', V4.parent/'tripo/optimize.py')
inspect = module('inspect_six', V4.parent/'tripo/intake/2026-09-18/inspect.py')
SOURCES = {'talk-shell':'pastel shell chair','practice-compass':'compass','journal-chest':'treasure chest',
           'decor-swing':'wooden swing','decor-lighthouse':'lighthouse','decor-flowerBoat':'wooden boat planter'}
def main():
    records=[]
    for asset, name in SOURCES.items():
        source=Path('/Users/kim/Downloads')/(name+' 3d model.glb')
        original=source.read_bytes(); original_report=inspect.inspect(original)
        preserved=HERE/'source'/(asset+'.glb'); preserved.parent.mkdir(parents=True,exist_ok=True)
        if preserved.exists(): assert preserved.read_bytes()==original
        else: preserved.write_bytes(original)
        doc,binary=glb.unpack_glb(original)
        parts=[binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']] for v in doc['bufferViews']]
        with tempfile.TemporaryDirectory(prefix='island-six-models-') as tmp:
            for i,img in enumerate(doc['images']):
                ext='.png' if img['mimeType']=='image/png' else '.jpg'
                src,dst=Path(tmp)/(str(i)+ext),Path(tmp)/('small-'+str(i)+ext)
                src.write_bytes(parts[img['bufferView']])
                subprocess.run(['/usr/bin/sips','-Z','1024',str(src),'--out',str(dst)],check=True,stdout=subprocess.DEVNULL)
                parts[img['bufferView']]=dst.read_bytes()
        joined=bytearray()
        for view,part in zip(doc['bufferViews'],parts):
            joined.extend(b'\0'*(-len(joined)%4)); view.update(byteOffset=len(joined),byteLength=len(part)); joined.extend(part)
        doc['buffers'][0]['byteLength']=len(joined); data=glb.pack_glb(doc,bytes(joined))
        a,ab=glb.unpack_glb(original); b,bb=glb.unpack_glb(data)
        assert all(inspect.values(a,ab,x)==inspect.values(b,bb,y) for x,y in zip(a['accessors'],b['accessors']))
        assert a['nodes']==b['nodes'] and a['materials']==b['materials']
        dest=HERE/'runtime'/(asset+'.glb'); dest.parent.mkdir(parents=True,exist_ok=True); dest.write_bytes(data)
        script=V4/'assets/models'/(asset+'-data.js')
        script.write_text('window.V4_BYTES=window.V4_BYTES||{};window.V4_BYTES['+json.dumps(asset)+']='+json.dumps(base64.b64encode(data).decode())+';\n')
        records.append({'assetId':asset,'originalPath':str(source),'receivedDate':'2026-09-20',
                        'sourceSha256':hashlib.sha256(original).hexdigest(),'sourceBytes':len(original),
                        'runtimeSha256':hashlib.sha256(data).hexdigest(),'deliveryBytes':script.stat().st_size,
                        'changes':'Embedded texture resize to 1024 only; all geometry/accessor values, nodes and materials preserved',
                        'maximumInstances':1,**inspect.inspect(data)})
        assert source.read_bytes()==original
    (HERE/'manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps([{'id':r['assetId'],'source':r['sourceBytes'],'runtime':r['bytes'],'triangles':r['triangles']} for r in records],indent=2))
if __name__=='__main__': main()

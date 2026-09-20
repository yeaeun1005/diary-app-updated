"""Embedded GLB validation and packing shared by the model intake. No network."""
import hashlib,json,math,struct

def unpack_glb(data):
    magic, version, length = struct.unpack_from('<4sII', data)
    assert (magic, version, length) == (b'glTF', 2, len(data))
    pos, doc, binary = 12, None, None
    while pos < length:
        size, kind = struct.unpack_from('<II', data, pos)
        part = data[pos + 8:pos + 8 + size]
        assert len(part) == size
        if kind == 0x4e4f534a: doc = json.loads(part)
        if kind == 0x004e4942: binary = part
        pos += 8 + size
    assert doc and binary is not None
    return doc, binary

def pack_glb(doc, binary):
    text = json.dumps(doc, separators=(',', ':'), ensure_ascii=False).encode()
    text += b' ' * (-len(text) % 4)
    binary += b'\0' * (-len(binary) % 4)
    return struct.pack('<4sII', b'glTF', 2, 28 + len(text) + len(binary)) + struct.pack('<II', len(text), 0x4e4f534a) + text + struct.pack('<II', len(binary), 0x004e4942) + binary


unpack=unpack_glb

def values(doc, binary, accessor):
    assert 'sparse' not in accessor
    view = doc['bufferViews'][accessor['bufferView']]
    assert view.get('buffer', 0) == 0
    count = {'SCALAR':1, 'VEC2':2, 'VEC3':3, 'VEC4':4, 'MAT4':16}[accessor['type']]
    fmt = '<' + {5120:'b',5121:'B',5122:'h',5123:'H',5125:'I',5126:'f'}[accessor['componentType']] * count
    size = struct.calcsize(fmt); stride = view.get('byteStride', size)
    start = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
    assert start + (accessor['count']-1)*stride + size <= view.get('byteOffset', 0)+view['byteLength']
    result = [struct.unpack_from(fmt, binary, start+i*stride) for i in range(accessor['count'])]
    assert all(math.isfinite(v) for row in result for v in row)
    return result

def image_size(data):
    if data[:8] == b'\x89PNG\r\n\x1a\n': return list(struct.unpack_from('>II', data, 16))
    assert data[:2] == b'\xff\xd8', 'Unexpected image encoding'
    pos = 2
    while pos < len(data):
        if data[pos] != 255: pos += 1; continue
        while data[pos] == 255: pos += 1
        marker = data[pos]; pos += 1
        if marker in (216,217,1) or 208 <= marker <= 215: continue
        size = struct.unpack_from('>H', data, pos)[0]
        if marker in (192,193,194,195,197,198,199,201,202,203,205,206,207):
            h,w = struct.unpack_from('>HH', data, pos+3); return [w,h]
        pos += size
    raise AssertionError('Image dimensions missing')

def inspect(data):
    doc, binary = unpack(data)
    assert doc['asset']['version'] == '2.0'
    assert len(doc['buffers']) == 1 and 'uri' not in doc['buffers'][0]
    assert 0 <= len(binary)-doc['buffers'][0]['byteLength'] <= 3
    assert not doc.get('extensionsRequired'), 'Decoder requirements need separate review'
    for view in doc['bufferViews']:
        assert view.get('buffer',0) == 0 and view.get('byteOffset',0)+view['byteLength'] <= len(binary)
    access = [values(doc,binary,a) for a in doc['accessors']]
    triangles = 0; vertices = 0; mins = [float('inf')]*3; maxs = [-float('inf')]*3
    for mesh in doc['meshes']:
        for p in mesh['primitives']:
            assert p.get('mode',4) == 4
            positions = access[p['attributes']['POSITION']]; vertices += len(positions)
            for pos in positions:
                for axis in range(3): mins[axis] = min(mins[axis],pos[axis]); maxs[axis] = max(maxs[axis],pos[axis])
            indices = [i[0] for i in access[p['indices']]] if 'indices' in p else list(range(len(positions)))
            assert len(indices)%3 == 0 and min(indices)>=0 and max(indices)<len(positions)
            triangles += len(indices)//3
            assert 'NORMAL' in p['attributes'] and 'TEXCOORD_0' in p['attributes']
            assert len(access[p['attributes']['NORMAL']]) == len(positions)
            assert len(access[p['attributes']['TEXCOORD_0']]) == len(positions)
    images = []
    for i,img in enumerate(doc.get('images',[])):
        assert 'uri' not in img
        view = doc['bufferViews'][img['bufferView']]; start = view.get('byteOffset',0)
        embedded = binary[start:start+view['byteLength']]
        images.append({'index':i,'mimeType':img['mimeType'],'size':image_size(embedded),'bytes':len(embedded)})
    return dict(bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),triangles=triangles,vertices=vertices,
                meshes=len(doc['meshes']),primitives=sum(len(m['primitives']) for m in doc['meshes']),
                materials=len(doc.get('materials',[])),textures=len(doc.get('textures',[])),images=images,
                meshLocalBounds={'min':mins,'max':maxs,'size':[b-a for a,b in zip(mins,maxs)]},
                nodes=[{k:v for k,v in n.items() if k in ('mesh','matrix','rotation','scale','translation')} for n in doc['nodes']],
                materialSettings=doc.get('materials',[]),animations=len(doc.get('animations',[])),skins=len(doc.get('skins',[])),
                externalURIs=[],checks=['GLB chunk bounds','embedded images','finite accessor values','index range','normals and UVs present'])

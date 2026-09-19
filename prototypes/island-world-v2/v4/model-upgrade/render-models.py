"""Offline renders of the actual supplied GLBs, for orientation and material review."""
from pathlib import Path
import bpy, math
from mathutils import Vector
HERE=Path(__file__).resolve().parent
OUT=HERE.parents[3]/'renders/six-models-20260920'
OUT.mkdir(parents=True,exist_ok=True)
for asset in ['talk-shell','practice-compass','journal-chest','decor-swing','decor-lighthouse','decor-flowerBoat']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.device='CPU'; scene.cycles.samples=20
    scene.render.threads_mode='FIXED';scene.render.threads=6
    scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
    scene.view_settings.view_transform='Standard';scene.view_settings.look='Medium High Contrast' if 'Medium High Contrast' in [x.identifier for x in scene.view_settings.bl_rna.properties['look'].enum_items] else 'None'
    scene.world=bpy.data.worlds.new('Cream studio');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.79,.87,.85,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.65
    bpy.ops.import_scene.gltf(filepath=str(HERE/'runtime'/(asset+'.glb')))
    meshes=[o for o in scene.objects if o.type=='MESH']
    coords=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
    lo=Vector(tuple(min(p[i] for p in coords) for i in range(3)));hi=Vector(tuple(max(p[i] for p in coords) for i in range(3)))
    center=(lo+hi)/2; size=max(hi-lo)
    bpy.ops.object.camera_add(location=center+Vector((1.6,-3.7,2.15))*size)
    cam=bpy.context.object;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=size*1.53;scene.camera=cam
    for loc,power,scale in [((-3,-4,6),450,4),((3,-1,4),160,3)]:
        bpy.ops.object.light_add(type='AREA',location=Vector(loc)*size+center);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=scale*size;light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,lo.z-.007))
    mat=bpy.data.materials.new('Mint floor');mat.diffuse_color=(.79,.87,.85,1);bpy.context.object.data.materials.append(mat)
    scene.render.filepath=str(OUT/(asset+'.png'));bpy.ops.render.render(write_still=True)
    print('REVIEW_RENDER',asset,flush=True)

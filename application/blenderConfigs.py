import bpy
import math

for scene in bpy.data.scenes:
    scale = 1
    scene.render.engine = 'CYCLES'
    scene.cycles.use_denoising = True
    scene.cycles.samples = 32
    if (scene.render.resolution_x > 4096):
        scale = 4096 / scene.render.resolution_x
    if (scene.render.resolution_y > 4096):
        scale = math.min(4096 / scene.render.resolution_y, scale)

    scene.render.resolution_x = scale * scene.render.resolution_x
    scene.render.resolution_y = scale * scene.render.resolution_y
    #scene.render.tile_x = 2048
    #scene.render.tile_y = 2048
    scene.render.image_settings.file_format = 'PNG'

    print(f"""FPS_{scene.render.fps}_""")
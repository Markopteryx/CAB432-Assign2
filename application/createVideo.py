import bpy
from pathlib import Path

# glob all movie files from
dir_path = "/images"
img_dir = Path(dir_path)
glob = "*.png"
frame_duration = 5
files = sorted(list(img_dir.glob(glob)))

# get sequence editor
scene = bpy.context.scene
#scene.sequence_editor_clear()
sed = scene.sequence_editor_create()
seq = sed.sequences

# add movie strips
for i, fp in enumerate(files):
    ms = seq.new_image(
            name=fp.name,
            filepath=str(fp),
            channel=i + 1,
            frame_start= i * frame_duration + 1 ,
            
            )
    ms.frame_final_duration = frame_duration
    # print some details
    print("%s ch: %d fs: %3.1f len: %d" % (fp.name, i + 1, ms.frame_start, ms.frame_final_duration))
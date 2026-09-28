"""Build the web-ready urinary-system GLB for the Wilms tumor exhibit.

Source meshes: BodyParts3D (c) The Database Center for Life Science, CC BY-SA 2.1 JP.
Pipeline per part: import element OBJs -> join -> orient (Z-up, anterior = -Y, metres) -> trim
-> voxel remesh (fuses element seams) -> Laplacian smooth -> decimate -> smooth shading.
Then: AO bake to a vertex-colour attribute (Cycles) and GLB export with anchor empties.

Run:  BP3D_DIR=<bodyparts3d dir> blender -b --factory-startup --python scripts/build_urinary.py -- <outdir> [preview]
"""
import bpy, bmesh, os, sys, collections, math, time
from mathutils import Vector, Matrix

ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
HERE = os.path.dirname(os.path.abspath(__file__))
# <outdir>: where urinary_raw.glb goes; BP3D_DIR: the unzipped BodyParts3D "partof" download
OUTDIR = ARGS[0] if ARGS else os.path.join(HERE, "..", "..", "wilms-asset-work", "out")
PREVIEW = "preview" in ARGS
os.makedirs(OUTDIR, exist_ok=True)

BASE = os.environ.get("BP3D_DIR", os.path.join(HERE, "..", "..", "wilms-asset-work", "bp3d"))
OBJDIR = BASE + "/partof/partof_BP3D_4.0_obj_99"
ORIENT = Matrix.Scale(0.001, 4)

# shared helpers (import/join, remesh, AO bake, anchors, export, preview)
exec(open(os.path.join(os.path.dirname(__file__), "_helpers.py"), encoding="utf-8").read())
CLOSE_MM = {"LeftKidney": 0.8, "RightKidney": 0.8, "Bladder": 0.8}

rows = [l.rstrip("\n").split("\t") for l in open(BASE + "/partof_element_parts.txt", encoding="utf-8")][1:]
BY = collections.defaultdict(list)
for r in rows:
    if len(r) >= 3:
        BY[r[1]].append(r[2])

# name, element ids, voxel(mm), smooth iters, target tris, pre-subdivide levels
PARTS = [
    ("LeftKidney", BY["left kidney"], 1.0, 5, 12000, 1),
    ("RightKidney", BY["right kidney"], 1.0, 5, 12000, 1),
    ("Ureters", BY["left ureter"] + BY["right ureter"], 0.55, 3, 5000, 1),
    ("Bladder", BY["urinary bladder"], 1.0, 5, 8000, 1),
    ("Adrenals", BY["left adrenal gland"] + BY["right adrenal gland"], 0.6, 4, 4000, 1),
    ("Arteries", BY["abdominal aorta"] + BY["left renal artery"] + BY["right renal artery"], 0.7, 3, 12000, 0),
    ("Veins", BY["inferior vena cava"], 0.8, 3, 8000, 0),
]

reset()
parts = {}
for name, fjs, vox, sm, tris, sub in PARTS:
    parts[name] = import_join(name, fjs)

# the big vessels run up to the heart: keep them from just above the adrenal glands downwards
ad_top = max(v.co.z for v in parts["Adrenals"].data.vertices)
bl_bot = min(v.co.z for v in parts["Bladder"].data.vertices)
for name in ("Arteries", "Veins"):
    keep_z_window(parts[name], bl_bot - 0.01, ad_top + 0.025)
log("window z", round(bl_bot, 3), round(ad_top, 3))

for name, fjs, vox, sm, tris, sub in PARTS:
    process(parts[name], vox, sm, tris, sub)

objs = list(parts.values())
mins, maxs = bbox(objs)
center = (mins + maxs) / 2
recenter(objs, center)
mins, maxs = bbox(objs)
log("urinary bbox (m)", tuple(round(x, 4) for x in mins), tuple(round(x, 4) for x in maxs))

bake_ao(objs, distance=0.03)

anchors = []
for label, org in parts.items():
    mn, mx = bbox([org])
    c = (mn + mx) / 2
    hit = None
    for k in range(60):
        a = k * 2.4
        rr = 0.003 * k
        hit = front_hit(org, objs, c.x + rr * math.cos(a), c.z + rr * math.sin(a))
        if hit:
            break
    if hit is None:
        hit = (c, Vector((0, -1, 0)))
    anchors.append(add_anchor(f"label_{label}", hit[0], hit[1]))

# the tumor grows from the lower pole of the left kidney (patient's left = +X)
lk = parts["LeftKidney"]
kmn, kmx = bbox([lk])
kc = (kmn + kmx) / 2
anchors.append(add_anchor("anchor_kidney_center", kc))
tumor = None
for k in range(80):
    a = k * 2.4
    rr = 0.002 * k
    x = kc.x + 0.22 * (kmx.x - kmn.x) + rr * math.cos(a)
    z = kmn.z + 0.3 * (kmx.z - kmn.z) + rr * math.sin(a)
    tumor = front_hit(lk, objs, x, z)
    if tumor:
        break
if tumor:
    anchors.append(add_anchor("anchor_tumor", tumor[0], tumor[1]))
else:
    log("no hit for tumor anchor")
# fly-in target: the front of the left kidney near its middle
enter = None
for k in range(80):
    a = k * 2.4
    rr = 0.002 * k
    enter = front_hit(lk, objs, kc.x + rr * math.cos(a), kc.z + 0.12 * (kmx.z - kmn.z) + rr * math.sin(a))
    if enter:
        break
if enter:
    anchors.append(add_anchor("anchor_enter", enter[0], enter[1]))
else:
    log("no hit for enter anchor")

for o in objs:
    mat = bpy.data.materials.new("mat_" + o.name)
    o.data.materials.clear()
    o.data.materials.append(mat)

export_glb(os.path.join(OUTDIR, "urinary_raw.glb"), objs + anchors)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUTDIR, "urinary_built.blend"))
if PREVIEW:
    render_preview(objs, os.path.join(OUTDIR, "urinary_front.png"), "front")
    render_preview(objs, os.path.join(OUTDIR, "urinary_side.png"), "side")
log("done")

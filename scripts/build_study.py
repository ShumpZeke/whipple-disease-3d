"""Build the study for the history part: Max Wilms at his writing desk in 1899.

Everything is modelled here from simple shapes (no outside assets): a pedestal desk, a chair, an oil
lamp, an inkwell, books, a microscope, a sheet of paper and the man himself (a skin-modifier
figure in a dark suit, with a head sculpted from fused shapes after his portrait). The open book on its stand is built in the browser, so its pages can carry
live text. Ambient occlusion is baked into vertex colours, then the scene is exported as GLB.

Blender is Z-up in metres; the man sits at y < 0 facing +Y (the desk). glTF turns this into
three.js Y-up with the man facing -Z.

Run:  blender -b --factory-startup --python scripts/build_study.py -- <outdir> [preview]
"""
import bpy, bmesh, os, sys, math, time
from mathutils import Vector, Matrix, Euler

ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.abspath(ARGS[0] if ARGS else os.path.join(HERE, "..", "..", "wilms-asset-work", "out"))
PREVIEW = "preview" in ARGS
os.makedirs(OUTDIR, exist_ok=True)
OBJDIR = ""
exec(open(os.path.join(HERE, "_helpers.py"), encoding="utf-8").read())

reset()
scene = bpy.context.scene
OBJS = []


def mat(name, color, rough=0.6, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    m.diffuse_color = (*color, 1.0)
    return m


def srgb(hexs):
    h = hexs.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


MATS = {
    "Wood": ("#4b2d1d", 0.5, 0.0),
    "WoodDark": ("#2e1b12", 0.55, 0.0),
    "Jacket": ("#2a2725", 0.85, 0.0),
    "Trousers": ("#1e1c1b", 0.85, 0.0),
    "Skin": ("#d8ae9c", 0.55, 0.0),
    "Hair": ("#8a857e", 0.8, 0.0),
    "Moustache": ("#7a6f66", 0.8, 0.0),
    "Eye": ("#ffffff", 0.4, 0.0),
    "Tie": ("#121113", 0.4, 0.0),
    "Shirt": ("#f1eee7", 0.6, 0.0),
    "Collar": ("#ece8de", 0.45, 0.0),
    "Shoe": ("#141212", 0.35, 0.0),
    "Brass": ("#b48b3d", 0.32, 0.9),
    "Iron": ("#1c1c1e", 0.4, 0.6),
    "Glass": ("#e8eef0", 0.05, 0.0),
    "Flame": ("#ffd27a", 0.5, 0.0),
    "Leather": ("#5b2a1f", 0.55, 0.0),
    "LeatherGreen": ("#28382c", 0.55, 0.0),
    "Paper": ("#efe6d2", 0.8, 0.0),
    "Ink": ("#0b0b0e", 0.2, 0.0),
    "Floor": ("#1c140f", 0.7, 0.0),
}
M = {k: mat(k, srgb(v[0]), v[1], v[2]) for k, v in MATS.items()}


def finish(o, material, smooth=True, bevel=0.0, subsurf=0):
    if bevel:
        m = o.modifiers.new("bev", "BEVEL")
        m.width = bevel
        m.segments = 2
        m.limit_method = "ANGLE"
        apply_mod(o, m)
    if subsurf:
        m = o.modifiers.new("sub", "SUBSURF")
        m.levels = subsurf
        m.render_levels = subsurf
        apply_mod(o, m)
    o.data.materials.clear()
    o.data.materials.append(M[material])
    for p in o.data.polygons:
        p.use_smooth = smooth
    o["mat"] = material
    OBJS.append(o)
    return o


def box(name, size, loc, material, bevel=0.004, rot=(0, 0, 0), dense=0):
    """A bevelled box; `dense` > 0 subdivides it first so baked shading has vertices to live on."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if dense:
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.subdivide(number_cuts=dense)
        bpy.ops.object.mode_set(mode="OBJECT")
        o["ao"] = True
        return finish(o, material, smooth=False)
    return finish(o, material, smooth=False, bevel=bevel)


def cyl(name, r, depth, loc, material, rot=(0, 0, 0), verts=24, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.active_object
    o.name = name
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return finish(o, material, smooth=True, bevel=bevel)


def sphere(name, radii, loc, material, rot=(0, 0, 0), seg=32, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = radii
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return finish(o, material)


def lathe(name, profile, loc, material, steps=40):
    """Revolve a (radius, z) profile around the Z axis."""
    bm = bmesh.new()
    rings = []
    for i in range(steps):
        a = 2 * math.pi * i / steps
        ring = [bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for r, z in profile]
        rings.append(ring)
    for i in range(steps):
        a, b = rings[i], rings[(i + 1) % steps]
        for j in range(len(profile) - 1):
            bm.faces.new((a[j], b[j], b[j + 1], a[j + 1]))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    o.location = loc
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return finish(o, material)


def skin_figure(name, verts, edges, radii, material, root=0, subsurf=2):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, edges, [])
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    sk = o.modifiers.new("skin", "SKIN")
    sk.use_smooth_shade = True
    sk.branch_smoothing = 0.6
    layer = me.skin_vertices[""].data
    for i, r in enumerate(radii):
        layer[i].radius = r
    layer[root].use_root = True
    apply_mod(o, sk)
    return finish(o, material, subsurf=subsurf)


t0 = time.time()

# ---------------------------------------------------------------- room: a floor fading into the dark
bpy.ops.mesh.primitive_grid_add(x_subdivisions=72, y_subdivisions=72, size=4.2, location=(0, 0.1, 0))
floor = bpy.context.active_object
floor.name = "Floor"
floor["ao"] = True
finish(floor, "Floor", smooth=False)

# ---------------------------------------------------------------- desk (top at z = 0.76)
TOP = 0.76
box("DeskTop", (1.42, 0.74, 0.035), (0, 0.0, TOP - 0.0175), "Wood", dense=28)
for sx in (-1, 1):
    x = sx * 0.49
    box(f"Pedestal{sx}", (0.42, 0.64, 0.7), (x, 0.02, 0.37), "Wood", dense=12)
    for k in range(3):
        z = 0.14 + k * 0.215
        box(f"Drawer{sx}{k}", (0.36, 0.012, 0.18), (x, -0.305, z), "WoodDark", bevel=0.003)
        sphere(f"Knob{sx}{k}", (0.011, 0.011, 0.011), (x, -0.316, z), "Brass", seg=16, rings=8)
box("DeskBack", (0.56, 0.02, 0.5), (0, 0.33, 0.47), "Wood", dense=10)
box("DeskPlinth", (1.4, 0.7, 0.03), (0, 0.02, 0.015), "WoodDark", bevel=0.003)
# a sheet of writing paper and a green desk pad
box("Pad", (0.62, 0.42, 0.004), (0.0, -0.08, TOP + 0.002), "LeatherGreen", dense=12)
box("Sheet", (0.2, 0.27, 0.0012), (0.05, -0.2, TOP + 0.0046), "Paper", rot=(0, 0, math.radians(-6)), dense=8)

# ---------------------------------------------------------------- the book stand and the book's cover
# (the two pages themselves are made in the browser). Positions follow the page frame used there:
# centre of the drawing Pc, the page leaning back 32°, 0.1 m per unit of the organ scene.
TILT = math.radians(32)
PC = Vector((0.09, 0.14, 0.93))  # (three.js (0.09, 0.93, -0.14) in Blender axes)
FX = Vector((1, 0, 0))
FY = Vector((0, math.sin(TILT), math.cos(TILT)))
FZ = Vector((0, -math.cos(TILT), math.sin(TILT)))
FRAME = Matrix((FX.to_4d(), FY.to_4d(), FZ.to_4d(), (0, 0, 0, 1))).transposed()
FRAME.translation = PC


def page_box(name, x0, x1, y0, y1, z0, z1, material, dense=0):
    """A box given in the organ scene's units on the page (x across, y up the page, z out of it)."""
    o = box(name, (1, 1, 1), (0, 0, 0), material, bevel=0.0 if dense else 0.02, dense=dense)
    o.data.transform(Matrix.Diagonal(((x1 - x0) * 0.1, (y1 - y0) * 0.1, (z1 - z0) * 0.1, 1)))
    o.data.transform(Matrix.Translation(Vector(((x0 + x1) / 2 * 0.1, (y0 + y1) / 2 * 0.1, (z0 + z1) / 2 * 0.1))))
    o.data.transform(FRAME)
    return o


page_box("StandBoard", -2.85, 1.1, -1.34, 1.5, -0.66, -0.6, "Wood", dense=10)["ao"] = True
page_box("StandLedge", -2.85, 1.1, -1.42, -1.3, -0.66, 0.12, "WoodDark")
page_box("BookCover", -2.72, 0.98, -1.29, 1.34, -0.6, -0.34, "Leather")


def page_block(name, x0, x1, y0, y1, z0, top, material, n=64):
    """A block on the page whose top follows top(x): the profile (x, z) swept up the page."""
    prof = [(x0, z0), (x1, z0)] + [(x1 + (x0 - x1) * i / n, top(x1 + (x0 - x1) * i / n)) for i in range(n + 1)]
    bm = bmesh.new()
    lo = [bm.verts.new((x * 0.1, y0 * 0.1, z * 0.1)) for x, z in prof]
    hi = [bm.verts.new((x * 0.1, y1 * 0.1, z * 0.1)) for x, z in prof]
    k = len(prof)
    for i in range(k):
        j = (i + 1) % k
        bm.faces.new((lo[i], lo[j], hi[j], hi[i]))
    bm.faces.new(lo)
    bm.faces.new(list(reversed(hi)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    o.data.transform(FRAME)
    return finish(o, material, smooth=False)


# the stack of pages dips into the spine exactly as the two pages made in the browser do
# (pages.ts: 0.09 deep over the 22% of each page nearest the gutter, just under them)
GUTTER, PAGE_W, PAGE_Z = -0.87, 1.74, -0.23


def block_top(x):
    k = max(0.0, 1 - abs(x - GUTTER) / (PAGE_W * 0.22))
    return PAGE_Z - 0.006 - 0.09 * k * k


page_block("BookBlock", -2.66, 0.93, -1.24, 1.29, -0.57, block_top, "Paper")
foot = PC + FY * -0.142 + FZ * -0.07
box("StandFoot", (0.4, 0.09, abs(foot.z - TOP) + 0.01), (0.09 - 0.087, foot.y + 0.01, (foot.z + TOP) / 2), "WoodDark")
box("StandStrut", (0.05, 0.02, 0.2), (0.0, PC.y + 0.1, TOP + 0.09), "WoodDark", rot=(math.radians(-32), 0, 0))

# ---------------------------------------------------------------- chair
SEAT = 0.46
box("ChairSeat", (0.46, 0.44, 0.04), (0, -0.66, SEAT), "Wood", dense=10)
for sx in (-1, 1):
    for sy in (-1, 1):
        cyl(f"ChairLeg{sx}{sy}", 0.018, SEAT, (sx * 0.19, -0.66 + sy * 0.18, SEAT / 2), "WoodDark", verts=12)
for sx in (-1, 1):
    cyl(f"ChairPost{sx}", 0.018, 0.46, (sx * 0.19, -0.86, SEAT + 0.23), "WoodDark", verts=12)
box("ChairRail", (0.42, 0.03, 0.07), (0, -0.86, SEAT + 0.42), "Wood", bevel=0.008)

# ---------------------------------------------------------------- lamp (oil lamp with a glass chimney)
LX, LY = -0.46, 0.12
lathe(
    "LampBase",
    [(0.0, 0.0), (0.085, 0.0), (0.09, 0.012), (0.07, 0.03), (0.03, 0.05), (0.022, 0.12), (0.03, 0.16), (0.0, 0.16)],
    (LX, LY, TOP),
    "Brass",
)
sphere("LampFont", (0.075, 0.075, 0.06), (LX, LY, TOP + 0.2), "Brass")
lathe(
    "LampBurner",
    [(0.0, 0.0), (0.032, 0.0), (0.036, 0.02), (0.028, 0.035), (0.0, 0.035)],
    (LX, LY, TOP + 0.255),
    "Brass",
    steps=24,
)
lathe(
    "LampChimney",
    [(0.03, 0.0), (0.045, 0.03), (0.05, 0.07), (0.034, 0.12), (0.024, 0.2), (0.024, 0.24)],
    (LX, LY, TOP + 0.29),
    "Glass",
)
sphere("LampFlame", (0.011, 0.011, 0.026), (LX, LY, TOP + 0.33), "Flame", seg=16, rings=10)

# ---------------------------------------------------------------- inkwell, pen tray, books, microscope
box("Inkwell", (0.06, 0.06, 0.05), (0.36, -0.12, TOP + 0.025), "Glass", bevel=0.008)
cyl("InkLid", 0.018, 0.012, (0.36, -0.12, TOP + 0.056), "Brass", verts=16)
cyl("InkInside", 0.024, 0.03, (0.36, -0.12, TOP + 0.018), "Ink", verts=16)
books = [
    ("Leather", (0.3, 0.22, 0.05)),
    ("LeatherGreen", (0.27, 0.2, 0.045)),
    ("Leather", (0.25, 0.19, 0.04)),
]
z = TOP
for i, (m, (w, d, h)) in enumerate(books):
    box(f"BookStack{i}", (w, d, h), (-0.3 + i * 0.01, 0.24 - i * 0.005, z + h / 2), m, rot=(0, 0, math.radians(8 - 7 * i)), dense=6)
    z += h
# brass microscope
MX, MY = 0.5, 0.18
lathe("ScopeFoot", [(0.0, 0.0), (0.07, 0.0), (0.07, 0.015), (0.05, 0.025), (0.0, 0.025)], (MX, MY, TOP), "Iron", steps=32)
cyl("ScopePillar", 0.012, 0.14, (MX, MY + 0.03, TOP + 0.095), "Brass", verts=16)
box("ScopeStage", (0.09, 0.08, 0.008), (MX, MY - 0.01, TOP + 0.12), "Iron", bevel=0.002)
cyl("ScopeTube", 0.018, 0.16, (MX, MY - 0.01, TOP + 0.21), "Brass", rot=(math.radians(-12), 0, 0), verts=24)
cyl("ScopeEyepiece", 0.012, 0.04, (MX, MY - 0.03, TOP + 0.305), "Iron", rot=(math.radians(-12), 0, 0), verts=16)
cyl("ScopeArm", 0.008, 0.16, (MX, MY + 0.03, TOP + 0.2), "Brass", rot=(math.radians(-12), 0, 0), verts=12)

# ---------------------------------------------------------------- the man, seated, leaning towards the desk
# body and suit: a skin-modifier figure (pelvis → spine → neck; arms; legs)
P = {
    "pelvis": (0.0, -0.64, SEAT + 0.1),
    "lumbar": (0.0, -0.61, SEAT + 0.26),
    "chest": (0.0, -0.55, SEAT + 0.46),
    "shoulders": (0.0, -0.5, SEAT + 0.6),
    "neck": (0.0, -0.46, SEAT + 0.68),
    "r_sh": (0.205, -0.5, SEAT + 0.6),
    "r_el": (0.27, -0.34, SEAT + 0.4),
    "r_wr": (0.14, -0.2, TOP + 0.045),
    "l_sh": (-0.205, -0.5, SEAT + 0.6),
    "l_el": (-0.27, -0.35, SEAT + 0.4),
    "l_wr": (-0.15, -0.2, TOP + 0.045),
    "r_hip": (0.1, -0.62, SEAT + 0.07),
    "r_kn": (0.12, -0.2, SEAT + 0.08),
    "r_an": (0.13, -0.18, 0.09),
    "l_hip": (-0.1, -0.62, SEAT + 0.07),
    "l_kn": (-0.13, -0.21, SEAT + 0.08),
    "l_an": (-0.15, -0.24, 0.09),
}
names = list(P.keys())
V = [P[n] for n in names]
I = {n: i for i, n in enumerate(names)}
E = [
    ("pelvis", "lumbar"), ("lumbar", "chest"), ("chest", "shoulders"), ("shoulders", "neck"),
    ("shoulders", "r_sh"), ("r_sh", "r_el"), ("r_el", "r_wr"),
    ("shoulders", "l_sh"), ("l_sh", "l_el"), ("l_el", "l_wr"),
    ("pelvis", "r_hip"), ("r_hip", "r_kn"), ("r_kn", "r_an"),
    ("pelvis", "l_hip"), ("l_hip", "l_kn"), ("l_kn", "l_an"),
]
R = {
    "pelvis": (0.165, 0.125), "lumbar": (0.158, 0.112), "chest": (0.19, 0.125), "shoulders": (0.215, 0.12), "neck": (0.05, 0.05),
    "r_sh": (0.078, 0.078), "r_el": (0.057, 0.057), "r_wr": (0.043, 0.043),
    "l_sh": (0.078, 0.078), "l_el": (0.057, 0.057), "l_wr": (0.043, 0.043),
    "r_hip": (0.085, 0.085), "r_kn": (0.065, 0.065), "r_an": (0.045, 0.045),
    "l_hip": (0.085, 0.085), "l_kn": (0.065, 0.065), "l_an": (0.045, 0.045),
}
suit = skin_figure("Suit", V, [(I[a], I[b]) for a, b in E], [R[n] for n in names], "Jacket", root=I["pelvis"])
suit["ao"] = True
# white shirt cuffs at the wrists
for side, el, wr in (("R", "r_el", "r_wr"), ("L", "l_el", "l_wr")):
    a, b = Vector(P[el]), Vector(P[wr])
    dirv = (b - a).normalized()
    cyl(f"Cuff{side}", 0.041, 0.022, b - dirv * 0.012, "Collar", rot=dirv.to_track_quat("Z", "Y").to_euler(), verts=20)

# shoes
for side, an in (("R", "r_an"), ("L", "l_an")):
    x, y, _ = P[an]
    sphere(f"Shoe{side}", (0.05, 0.13, 0.045), (x, y + 0.07, 0.045), "Shoe")

# hands: small skin figures (wrist → palm → knuckles, with a thumb)
for side, wr, sgn in (("R", "r_wr", 1), ("L", "l_wr", -1)):
    x, y, z = P[wr]
    hv = [(x, y, z), (x - 0.02 * sgn, y + 0.07, z - 0.012), (x - 0.03 * sgn, y + 0.12, z - 0.02), (x - 0.045 * sgn, y + 0.06, z)]
    he = [(0, 1), (1, 2), (1, 3)]
    hr = [(0.034, 0.028), (0.042, 0.02), (0.03, 0.016), (0.014, 0.014)]
    skin_figure(f"Hand{side}", hv, he, hr, "Skin", subsurf=2)["ao"] = True
# the pen in his right hand, touching the sheet
px, py, pz = P["r_wr"]
pen_tip = Vector((px - 0.035, py + 0.15, TOP + 0.006))
pen_top = pen_tip + Vector((0.05, -0.06, 0.12))
mid = (pen_tip + pen_top) / 2
d = pen_top - pen_tip
rot = d.to_track_quat("Z", "Y").to_euler()
cyl("Pen", 0.0045, d.length, mid, "Ink", rot=rot, verts=10)
cyl("Nib", 0.003, 0.016, pen_tip + d.normalized() * 0.008, "Brass", rot=rot, verts=8)

# ---------------------------------------------------------------- his head: Max Wilms as in his portraits
# A long, lean face with a straight nose, high cheekbones and a strong chin; a brush moustache; large
# ears; grey hair cropped very short and receding from a high forehead; a tall stiff white collar
# with a small black bow tie, and the lapels of a dark suit. The head is modelled from simple shapes
# fused into one surface (voxel remesh) and smoothed, like a quick clay sculpture. It is a likeness
# drawn from the portrait, not a scan.
HEAD_C = Vector((0.0, -0.415, SEAT + 0.855))
HEAD_R = Matrix.Rotation(math.radians(-3), 3, "X")  # head up; his eyes look down at the book
HEAD_M = Matrix.Translation(HEAD_C) @ HEAD_R.to_4x4()
HEAD_LOCAL = HEAD_M.inverted()


def blob(name, c, r, rot=(0, 0, 0), seg=40, rings=24):
    """An ellipsoid in the head's own frame (x to his left ear... right, y towards his face, z up)."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=1, location=(0, 0, 0))
    o = bpy.context.active_object
    o.name = name
    o.data.transform(Matrix.LocRotScale(Vector(c), Euler(rot), Vector(r)))
    return o


def join(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = name
    return o


def modify(o, kind, **props):
    m = o.modifiers.new(kind.lower(), kind)
    for k, v in props.items():
        setattr(m, k, v)
    apply_mod(o, m)


deg = math.radians
parts = [
    blob("h_cranium", (0, -0.012, 0.024), (0.071, 0.096, 0.088)),
    blob("h_occiput", (0, -0.058, 0.012), (0.058, 0.048, 0.062)),
    blob("h_face", (0, 0.03, -0.028), (0.06, 0.072, 0.066)),
    blob("h_jaw", (0, 0.042, -0.07), (0.047, 0.056, 0.036)),
    blob("h_chin", (0, 0.074, -0.093), (0.02, 0.017, 0.018)),
    blob("h_brow", (0, 0.079, 0.021), (0.05, 0.014, 0.011)),
    blob("h_bridge", (0, 0.105, -0.011), (0.0085, 0.012, 0.027), rot=(deg(30), 0, 0)),
    blob("h_tip", (0, 0.119, -0.033), (0.0105, 0.011, 0.0095)),
    blob("h_alaL", (-0.0125, 0.108, -0.036), (0.0085, 0.009, 0.0072)),
    blob("h_alaR", (0.0125, 0.108, -0.036), (0.0085, 0.009, 0.0072)),
    blob("h_lip", (0, 0.094, -0.05), (0.022, 0.012, 0.011)),
    blob("h_lowerlip", (0, 0.092, -0.064), (0.016, 0.007, 0.0055)),
    # large ears, leaning back and standing out a little
    blob("h_earL", (-0.07, -0.01, -0.006), (0.0105, 0.021, 0.034), rot=(deg(15), 0, deg(-14))),
    blob("h_earR", (0.07, -0.01, -0.006), (0.0105, 0.021, 0.034), rot=(deg(15), 0, deg(14))),
]
head = join(parts, "Head")
modify(head, "REMESH", mode="VOXEL", voxel_size=0.0022)
# eye sockets under the brow
sockets = join([blob("sock", (sx * 0.03, 0.083, 0.001), (0.017, 0.016, 0.0145)) for sx in (-1, 1)], "Sockets")
bpy.context.view_layer.objects.active = head
modify(head, "BOOLEAN", operation="DIFFERENCE", solver="EXACT", object=sockets)
bpy.data.objects.remove(sockets)
modify(head, "REMESH", mode="VOXEL", voxel_size=0.0022)
modify(head, "SMOOTH", factor=0.6, iterations=8)
n_tris = sum(len(p.vertices) - 2 for p in head.data.polygons)
modify(head, "DECIMATE", ratio=min(1.0, 11000 / max(1, n_tris)))
head.data.transform(HEAD_M)
finish(head, "Skin")
head["ao"] = True


def at_head(o):
    o.data.transform(HEAD_M)
    return o


# eyes (looking down at the book, 34° below straight ahead) under heavy lids
GAZE = Vector((0, math.cos(deg(-34)), math.sin(deg(-34))))
UP_G = Vector((0, -GAZE.z, GAZE.y))  # up, across the eye as it looks


def eye_colour(q):
    """The eyeball is painted: lid-coloured skin, with an almond-shaped opening around the gaze
    (iris and pupil in it) and a dark line of lashes along its top edge. q = point on the eyeball."""
    n = q.normalized()
    k = n.dot(GAZE)
    h, w = q.x / 0.0104, q.dot(UP_G) / 0.0041
    r = h * h + w * w if k > 0 else 9.0
    lid = tuple(0.84 * v for v in (0.686, 0.423, 0.332))
    if r < 1.0:
        return (0.02, 0.02, 0.025) if k > 0.975 else (0.24, 0.3, 0.36) if k > 0.8 else (0.45, 0.42, 0.39)
    if r < 1.3 and w > 0:
        return (0.07, 0.045, 0.035)
    return lid


for side, sx in (("L", -1), ("R", 1)):
    c = Vector((sx * 0.03, 0.0712, -0.001))
    eye = at_head(finish(blob(f"Eye{side}", c, (0.0118, 0.0118, 0.0118), seg=64, rings=40), "Eye"))
    ca = eye.data.color_attributes.new(name="AO", type="BYTE_COLOR", domain="POINT")
    eye.data.color_attributes.active_color = ca
    for i, v in enumerate(eye.data.vertices):
        ca.data[i].color = (*eye_colour((HEAD_LOCAL @ v.co) - c), 1.0)

# the moustache: a short brush over the upper lip, the ends turned a little down
mo = skin_figure(
    "Moustache",
    [(-0.029, 0.093, -0.054), (-0.017, 0.103, -0.047), (0.0, 0.107, -0.045), (0.017, 0.103, -0.047), (0.029, 0.093, -0.054)],
    [(0, 1), (1, 2), (2, 3), (3, 4)],
    [(0.0055, 0.0055), (0.0105, 0.0105), (0.0115, 0.0115), (0.0105, 0.0105), (0.0055, 0.0055)],
    "Moustache",
    root=2,
)
at_head(mo)["ao"] = True
for side, sx in (("L", -1), ("R", 1)):
    at_head(skin_figure(
        f"Brow{side}",
        [(sx * 0.012, 0.097, 0.016), (sx * 0.03, 0.0965, 0.021), (sx * 0.047, 0.085, 0.018)],
        [(0, 1), (1, 2)],
        [(0.0036, 0.0026), (0.0036, 0.0026), (0.002, 0.0018)],
        "Moustache",
        root=0,
    ))

# neck, the tall stiff collar, and the back of the jacket's collar
NECK_TILT = deg(-15)
cyl("Neck", 0.043, 0.125, (0.0, -0.448, SEAT + 0.75), "Skin", rot=(NECK_TILT, 0, 0), verts=28)
COLLAR_C = Vector((0.0, -0.458, SEAT + 0.722))
cyl("Collar", 0.056, 0.052, COLLAR_C, "Collar", rot=(deg(-10), 0, 0), verts=40)["ao"] = True


def lathe_arc(name, profile, a0, a1, material, steps=32):
    """Part of a lathe (angles in radians, 0 = his front): the jacket collar round the back."""
    bm = bmesh.new()
    rings = []
    for i in range(steps + 1):
        a = a0 + (a1 - a0) * i / steps
        rings.append([bm.verts.new((r * math.sin(a), r * math.cos(a), z)) for r, z in profile])
    for i in range(steps):
        for j in range(len(profile) - 1):
            bm.faces.new((rings[i][j], rings[i + 1][j], rings[i + 1][j + 1], rings[i][j + 1]))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    return finish(o, material)


jc = lathe_arc("JacketCollar", [(0.1, -0.035), (0.08, -0.005), (0.064, 0.022), (0.06, 0.03)], deg(55), deg(305), "Jacket")
jc.data.transform(Matrix.Translation((0.0, -0.462, SEAT + 0.69)) @ Matrix.Rotation(NECK_TILT, 4, "X"))
jc["ao"] = True

# the bow tie at the front of the collar
TIE_M = Matrix.Translation(COLLAR_C) @ Matrix.Rotation(deg(-10), 4, "X") @ Matrix.Translation((0.0, 0.06, -0.027))
bm = bmesh.new()
for sx in (-1, 1):
    # each wing widens from the knot to its end, like a bow
    ring = []
    for x, hh, ht in ((0.004, 0.0045, 0.003), (0.03, 0.0125, 0.0036)):
        ring.append([bm.verts.new((sx * x, y, z)) for y, z in ((-ht, -hh), (ht, -hh), (ht, hh), (-ht, hh))])
    a, b = ring
    faces = [(a[0], a[1], a[2], a[3]), (b[3], b[2], b[1], b[0])] + [(a[i], b[i], b[(i + 1) % 4], a[(i + 1) % 4]) for i in range(4)]
    for f in faces:
        bm.faces.new(f if sx > 0 else tuple(reversed(f)))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
me = bpy.data.meshes.new("BowTie")
bm.to_mesh(me)
bm.free()
tie = bpy.data.objects.new("BowTie", me)
scene.collection.objects.link(tie)
modify(tie, "SUBSURF", levels=2, render_levels=2)
knot = blob("tieKnot", (0.0, 0.0015, 0.0), (0.0062, 0.0048, 0.0072), seg=16, rings=10)
tie = join([tie, knot], "BowTie")
tie.data.transform(TIE_M)
finish(tie, "Tie")
tie["ao"] = True


def decal(name, grid, material, lift):
    """A thin panel laid on the front of the suit: grid[row][col] = (x, z), cast onto the chest."""
    rows, cols = len(grid), len(grid[0])
    bm = bmesh.new()
    vs = []
    for row in grid:
        line = []
        for x, z in row:
            ok, loc, nor, _ = suit.ray_cast(Vector((x, 0.4, z)), Vector((0, -1, 0)))
            p = loc + nor * lift if ok else Vector((x, -0.4, z))
            line.append(bm.verts.new(p))
        vs.append(line)
    for i in range(rows - 1):
        for j in range(cols - 1):
            bm.faces.new((vs[i][j], vs[i][j + 1], vs[i + 1][j + 1], vs[i + 1][j]))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    return finish(o, material)


# a narrow V of white shirt front under the tie, framed by the jacket's lapels
V_TOP, V_BOT = SEAT + 0.695, SEAT + 0.53
vw = lambda k: 0.004 + 0.03 * (1 - k)  # half-width of the V, k = 0 at the top
shirt = decal("ShirtFront", [[(vw(i / 10) * (j / 4 - 1), V_TOP + (V_BOT - V_TOP) * i / 10) for j in range(9)] for i in range(11)], "Shirt", 0.003)
shirt["ao"] = True
for side, sx in (("L", -1), ("R", 1)):
    lw = lambda k: 0.012 + 0.024 * (1 - k)  # lapel width
    grid = [[(sx * (vw(i / 12) + lw(i / 12) * j / 3), V_TOP - 0.006 + (V_BOT - 0.03 - V_TOP) * i / 12) for j in range(4)] for i in range(13)]
    if sx < 0:
        grid = [list(reversed(r)) for r in grid]
    decal(f"Lapel{side}", grid, "Jacket", 0.005)["ao"] = True

log(f"modelled {len(OBJS)} objects in {time.time()-t0:.1f}s")

# ---------------------------------------------------------------- bake ambient occlusion into vertex colours
# (bake_ao swaps in temporary materials, so remember and restore each object's material)
keep = {o.name: o["mat"] for o in OBJS}
bake_ao([o for o in OBJS if o.get("ao")], distance=0.25)
for o in OBJS:
    o.data.materials.clear()
    o.data.materials.append(M[keep[o.name]])
    if o.name == "Head":
        # painted into the vertex colours on top of the baked shading: grey hair cropped very short
        # (thin on the sides), receding from a high forehead; a little colour in the cheeks and nose
        hair, skin = M["Hair"].diffuse_color, M["Skin"].diffuse_color

        def ss(a, b, x):
            k = min(1.0, max(0.0, (x - a) / (b - a)))
            return k * k * (3 - 2 * k)

        # height of the hairline (u, head-heights of 0.1 m) all round the head (azimuth in degrees, 0 = face)
        LINE = [(0, 0.66), (22, 0.7), (42, 0.8), (62, 0.45), (80, 0.2), (100, 0.12), (130, -0.25), (180, -0.36)]

        def hairline(a):
            a = abs(a)
            for (a0, h0), (a1, h1) in zip(LINE, LINE[1:]):
                if a <= a1:
                    return h0 + (h1 - h0) * (a - a0) / (a1 - a0)
            return LINE[-1][1]

        col = o.data.color_attributes["AO"].data
        for i, v in enumerate(o.data.vertices):
            q = HEAD_LOCAL @ v.co
            u = q.z / 0.1
            a = math.degrees(math.atan2(q.x, q.y))
            h = hairline(a) + 0.02 * math.sin(math.radians(a) * 11)
            cover = ss(h - 0.04, h + 0.05, u) * (0.55 + 0.35 * ss(0.3, 0.75, u))  # thin on the sides
            if abs(q.x) > 0.062 and -0.05 < q.z < 0.04 and -0.04 < q.y < 0.025:
                cover = 0.0  # the ears
            flush = math.exp(-((q - Vector((0, 0.115, -0.03))).length / 0.02) ** 2) * 0.6
            flush += sum(math.exp(-((q - Vector((sx * 0.045, 0.07, -0.02))).length / 0.022) ** 2) for sx in (-1, 1)) * 0.35
            c = col[i].color
            out = []
            for j in range(3):
                t = 1 + (hair[j] / skin[j] - 1) * cover
                t *= 1 - flush * (0, 0.12, 0.16)[j]
                out.append(c[j] * t)
            col[i].color = (*out, 1.0)
tris = sum(tri_count(o) for o in OBJS)
log("triangles", tris)

def shot(path, eye, target, lens=32, color="MATERIAL", size=(1280, 720)):
    """Quick solid-colour render from a three.js study viewpoint (x, y, z) -> Blender (x, -z, y)."""
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_WORKBENCH"
    sc.display.shading.light = "STUDIO"
    sc.display.shading.color_type = color
    sc.display.shading.show_shadows = True
    sc.display.shading.show_cavity = True
    sc.render.resolution_x, sc.render.resolution_y = size
    cd = bpy.data.cameras.new("shot")
    cd.lens = lens
    cam = bpy.data.objects.new("shot", cd)
    sc.collection.objects.link(cam)
    sc.camera = cam
    b = lambda v: Vector((v[0], -v[2], v[1]))
    cam.location = b(eye)
    cam.rotation_euler = (b(target) - b(eye)).to_track_quat("-Z", "Y").to_euler()
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam)


if PREVIEW:
    # the open book (built in the browser) as a stand-in, to judge the framing
    import math as _m
    t = _m.radians(32)
    Pc = Vector((0.09, 0.93, -0.14))
    X3, Y3 = Vector((1, 0, 0)), Vector((0, _m.cos(t), -_m.sin(t)))
    for nm, x0, x1 in (("PL", -2.61, -0.87), ("PR", -0.87, 0.87)):
        corners = [Pc + X3 * (x * 0.1) + Y3 * (y * 0.1) for x, y in ((x0, -1.2), (x1, -1.2), (x1, 1.25), (x0, 1.25))]
        me = bpy.data.meshes.new(nm)
        me.from_pydata([(c.x, -c.z, c.y) for c in corners], [], [(0, 1, 2, 3)])
        ob = bpy.data.objects.new(nm, me)
        ob.data.materials.append(M["Paper"])
        bpy.context.scene.collection.objects.link(ob)
    # his head close up, from the front, three-quarters, the side and behind (three.js axes)
    hc = HEAD_C
    H3 = Vector((hc.x, hc.z, -hc.y))
    for nm, off in (("front", (0.0, -0.05, -0.55)), ("q", (0.42, 0.0, -0.36)), ("side", (0.55, 0.02, 0.0)), ("back", (0.3, 0.1, 0.5))):
        eye = H3 + Vector(off)
        shot(os.path.join(OUTDIR, f"head_{nm}.png"), tuple(eye), tuple(H3 + Vector((0, -0.04, 0))), 85, size=(640, 640))
        shot(os.path.join(OUTDIR, f"head_{nm}_vc.png"), tuple(eye), tuple(H3 + Vector((0, -0.04, 0))), 85, color="VERTEX", size=(640, 640))
    # candidate views of him for "Dr. Max Wilms"
    for nm, eye, tgt in (("doctor", (0.55, 1.42, -0.4), (0.0, 1.24, 0.4)),):
        shot(os.path.join(OUTDIR, f"view_{nm}.png"), eye, tgt, 38, size=(960, 540))
    shot(os.path.join(OUTDIR, "study_title.png"), (2.05, 1.8, 2.75), (-0.02, 1.0, 0.08), 38)
    shot(os.path.join(OUTDIR, "study_book.png"), (0.62, 1.72, 1.2), (0.0, 0.95, -0.13), 44)

export_glb(os.path.join(OUTDIR, "study_raw.glb"), OBJS)

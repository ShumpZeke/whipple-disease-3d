"""Build the study for the history part: Max Wilms at his writing desk in 1899, seen from behind.

Everything is modelled here from simple shapes (no outside assets): a pedestal desk, a chair, an oil
lamp, an inkwell, books, a microscope, a sheet of paper and the man himself (a skin-modifier
figure in a dark suit). The open book on its stand is built in the browser, so its pages can carry
live text. Ambient occlusion is baked into vertex colours, then the scene is exported as GLB.

Blender is Z-up in metres; the man sits at y < 0 facing +Y (the desk). glTF turns this into
three.js Y-up with the man facing -Z.

Run:  blender -b --factory-startup --python scripts/build_study.py -- <outdir> [preview]
"""
import bpy, bmesh, os, sys, math, time
from mathutils import Vector, Matrix, Euler

ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = ARGS[0] if ARGS else os.path.join(HERE, "..", "..", "wilms-asset-work", "out")
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
    "Jacket": ("#242120", 0.85, 0.0),
    "Trousers": ("#1e1c1b", 0.85, 0.0),
    "Skin": ("#d4a086", 0.55, 0.0),
    "Hair": ("#5d5046", 0.7, 0.0),
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
    "neck": (0.0, -0.46, SEAT + 0.7),
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
    "pelvis": (0.165, 0.125), "lumbar": (0.158, 0.112), "chest": (0.19, 0.125), "shoulders": (0.215, 0.12), "neck": (0.056, 0.056),
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

# head, tilted forward to look at the book
HX, HY, HZ = 0.0, -0.43, SEAT + 0.86
tilt = math.radians(22)
HEAD_C = Vector((HX, HY, HZ))
HEAD_R = Matrix.Rotation(tilt, 3, "X")
HEAD_F = HEAD_R @ Vector((0, 1, 0))  # towards his face
HEAD_U = HEAD_R @ Vector((0, 0, 1))  # up through the crown
head = sphere("Head", (0.074, 0.098, 0.105), (HX, HY, HZ), "Skin", rot=(tilt, 0, 0), seg=64, rings=40)
# not a ball: narrower towards the jaw, the back of the skull a little fuller
# (the mesh is centred on the object's origin at HEAD_C, so vertex positions are relative to it)
for v in head.data.vertices:
    s, f, u = v.co.x, v.co.dot(HEAD_F), v.co.dot(HEAD_U)
    un = u / 0.105
    if un < 0:
        s *= 1 - 0.2 * min(1.0, -un) ** 1.3
    if f < 0:
        f *= 1 + 0.07 * max(0.0, 1 - abs(un - 0.15) / 0.65)
    v.co = Vector((s, 0, 0)) + HEAD_F * f + HEAD_U * u
head["ao"] = True
for sx in (-1, 1):
    # ears stand out a little from the head, turned slightly forward
    sphere(f"Ear{sx}", (0.011, 0.019, 0.029), (HX + sx * 0.071, HY - 0.006, HZ - 0.014), "Skin", rot=(tilt, 0, sx * math.radians(22)), seg=16, rings=10)["ao"] = True
# the neck above the collar
cyl("Neck", 0.047, 0.11, (HX, HY - 0.02, SEAT + 0.765), "Skin", rot=(math.radians(16), 0, 0), verts=24)
# a stiff white collar showing just above the jacket's collar
cyl("Collar", 0.058, 0.034, (HX, HY - 0.028, SEAT + 0.716), "Collar", rot=(math.radians(14), 0, 0), verts=32)
jc = lathe("JacketCollar", [(0.1, -0.035), (0.08, -0.005), (0.066, 0.02), (0.061, 0.03)], (0, 0, 0), "Jacket", steps=40)
jc.data.transform(Matrix.Rotation(math.radians(14), 4, "X"))
jc.data.transform(Matrix.Translation((HX, HY - 0.04, SEAT + 0.69)))

log(f"modelled {len(OBJS)} objects in {time.time()-t0:.1f}s")

# ---------------------------------------------------------------- bake ambient occlusion into vertex colours
# (bake_ao swaps in temporary materials, so remember and restore each object's material)
keep = {o.name: o["mat"] for o in OBJS}
bake_ao([o for o in OBJS if o.get("ao")], distance=0.25)
for o in OBJS:
    o.data.materials.clear()
    o.data.materials.append(M[keep[o.name]])
    if o.name == "Head":
        # short hair over the back, sides and top; a bare neck below the hairline and a high,
        # receding forehead (as in his portraits). It is painted into the vertex colours on top of
        # the baked shading, so the hairline is soft rather than following the polygons.
        hair, skin = M["Hair"].diffuse_color, M["Skin"].diffuse_color
        tint = [hair[j] / skin[j] for j in range(3)]

        def ss(a, b, x):
            k = min(1.0, max(0.0, (x - a) / (b - a)))
            return k * k * (3 - 2 * k)

        col = o.data.color_attributes["AO"].data
        for i, v in enumerate(o.data.vertices):
            f = v.co.dot(HEAD_F) / 0.098  # (relative to the head's origin)
            u = v.co.dot(HEAD_U) / 0.105
            a = math.atan2(v.co.x, v.co.dot(HEAD_F))
            low = -0.38 + 0.9 * max(0.0, f + 0.35) + 0.03 * math.sin(9 * a) + 0.015 * math.sin(23 * a)
            front = 0.4 - 0.3 * max(0.0, u - 0.4)
            m = ss(low - 0.05, low + 0.05, u) * (1 - ss(front - 0.05, front + 0.05, f))
            c = col[i].color
            col[i].color = tuple(c[j] * (1 + (tint[j] - 1) * m) for j in range(3)) + (1.0,)
tris = sum(tri_count(o) for o in OBJS)
log("triangles", tris)

def shot(path, eye, target, lens=32):
    """Quick solid-colour render from a three.js study viewpoint (x, y, z) -> Blender (x, -z, y)."""
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_WORKBENCH"
    sc.display.shading.light = "STUDIO"
    sc.display.shading.color_type = "MATERIAL"
    sc.display.shading.show_shadows = True
    sc.display.shading.show_cavity = True
    sc.render.resolution_x = 1280
    sc.render.resolution_y = 720
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
    shot(os.path.join(OUTDIR, "study_title.png"), (2.05, 1.8, 2.75), (-0.02, 1.0, 0.08), 38)
    shot(os.path.join(OUTDIR, "study_doctor.png"), (1.3, 1.52, 1.5), (0.06, 1.08, 0.28), 40)
    shot(os.path.join(OUTDIR, "study_book.png"), (0.62, 1.72, 1.2), (0.0, 0.95, -0.13), 44)

export_glb(os.path.join(OUTDIR, "study_raw.glb"), OBJS)

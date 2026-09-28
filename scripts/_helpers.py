def log(*a):
    print("[build]", *a, flush=True)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_join(name, fjs):
    objs = []
    for fj in fjs:
        p = f"{OBJDIR}/{fj}.obj"
        if not os.path.exists(p):
            log("missing", name, fj)
            continue
        before = set(bpy.data.objects)
        bpy.ops.wm.obj_import(filepath=p)
        objs += [o for o in bpy.data.objects if o not in before]
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = name
    o.data.name = name
    o.data.transform(ORIENT)
    o.matrix_world = Matrix.Identity(4)
    for m in o.data.materials:
        pass
    o.data.materials.clear()
    return o


def apply_mod(o, mod):
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=mod.name)


def tri_count(o):
    return sum(len(p.vertices) - 2 for p in o.data.polygons)


def clean_islands(o, keep_ratio=0.02):
    """Delete tiny disconnected islands left over by remeshing."""
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bm.verts.ensure_lookup_table()
    seen = set()
    islands = []
    for v in bm.verts:
        if v.index in seen:
            continue
        stack = [v]
        isl = []
        seen.add(v.index)
        while stack:
            cur = stack.pop()
            isl.append(cur)
            for e in cur.link_edges:
                w = e.other_vert(cur)
                if w.index not in seen:
                    seen.add(w.index)
                    stack.append(w)
        islands.append(isl)
    biggest = max(len(i) for i in islands)
    kill = [v for isl in islands if len(isl) < biggest * keep_ratio for v in isl]
    if kill:
        bmesh.ops.delete(bm, geom=kill, context="VERTS")
    bm.to_mesh(o.data)
    bm.free()
    return len(islands), len(kill)


def fill_open_holes(o):
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    edges = [e for e in bm.edges if e.is_boundary]
    if edges:
        bmesh.ops.holes_fill(bm, edges=edges, sides=0)
    bm.to_mesh(o.data)
    bm.free()
    return len(edges)


CLOSE_MM = {"Liver": 1.6, "Stomach": 1.2, "Heart": 1.2, "Brain": 1.0}


def displace(o, amount_m):
    m = o.modifiers.new("dsp", "DISPLACE")
    m.direction = "NORMAL"
    m.mid_level = 0.0
    m.strength = amount_m
    apply_mod(o, m)


def process(o, voxel_mm, smooth_iters, target_tris, subdiv):
    t0 = time.time()
    holes = fill_open_holes(o)
    if holes:
        log(f"{o.name}: filled {holes} boundary edges")
    close = CLOSE_MM.get(o.name, 0.0) * 0.001
    if subdiv:
        m = o.modifiers.new("sub", "SUBSURF")
        m.levels = subdiv
        m.render_levels = subdiv
        apply_mod(o, m)
    if close:
        # morphological closing: inflate, fuse with a voxel remesh, deflate -> removes element seams/cracks
        m = o.modifiers.new("rm0", "REMESH")
        m.mode = "VOXEL"
        m.voxel_size = voxel_mm * 0.001
        apply_mod(o, m)
        displace(o, close)
    m = o.modifiers.new("rm", "REMESH")
    m.mode = "VOXEL"
    m.voxel_size = voxel_mm * 0.001
    m.adaptivity = 0.0
    apply_mod(o, m)
    if close:
        displace(o, -close)
    n_isl, n_kill = clean_islands(o)
    m = o.modifiers.new("ls", "LAPLACIANSMOOTH")
    m.lambda_factor = 0.8
    m.iterations = smooth_iters
    m.use_volume_preserve = True
    m.use_normalized = True
    apply_mod(o, m)
    before = tri_count(o)
    if before > target_tris:
        m = o.modifiers.new("dc", "DECIMATE")
        m.decimate_type = "COLLAPSE"
        m.ratio = target_tris / before
        m.use_collapse_triangulate = True
        apply_mod(o, m)
    for p in o.data.polygons:
        p.use_smooth = True
    log(f"{o.name}: islands={n_isl} removed_verts={n_kill} tris {before} -> {tri_count(o)} in {time.time()-t0:.1f}s")


def trim_esophagus(eso, stomach):
    top = max((stomach.matrix_world @ v.co).z for v in stomach.data.vertices)
    cut = top + 0.045
    bm = bmesh.new()
    bm.from_mesh(eso.data)
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    res = bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, cut), plane_no=(0, 0, 1), clear_outer=True)
    edges = [e for e in res["geom_cut"] if isinstance(e, bmesh.types.BMEdge)]
    if edges:
        bmesh.ops.holes_fill(bm, edges=edges, sides=0)
    bm.to_mesh(eso.data)
    bm.free()


def trim_knee(knee):
    # keep a 15 cm window centred on the joint line (patella centre height)
    zs = [v.co.z for v in knee.data.vertices]
    # patella is the element nearest the joint; approximate the joint as the densest region between femur and tibia
    zmin, zmax = min(zs), max(zs)
    return zmin, zmax


def keep_z_window(o, zlo, zhi):
    bm = bmesh.new()
    bm.from_mesh(o.data)
    for co, no in ((zhi, (0, 0, 1)), (zlo, (0, 0, -1))):
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        res = bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, co), plane_no=no, clear_outer=True)
        edges = [e for e in res["geom_cut"] if isinstance(e, bmesh.types.BMEdge)]
        if edges:
            bmesh.ops.holes_fill(bm, edges=edges, sides=0)
    bm.to_mesh(o.data)
    bm.free()


def bbox(objs):
    mins = Vector((1e9, 1e9, 1e9))
    maxs = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            mins = Vector(map(min, mins, w))
            maxs = Vector(map(max, maxs, w))
    return mins, maxs


def recenter(objs, center):
    T = Matrix.Translation(-center)
    for o in objs:
        o.data.transform(T)


def setup_cycles():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for dev_type in ("OPTIX", "CUDA"):
        try:
            prefs.compute_device_type = dev_type
            prefs.get_devices()
            gpus = [d for d in prefs.devices if d.type == dev_type]
            if gpus:
                for d in prefs.devices:
                    d.use = d.type == dev_type
                scene.cycles.device = "GPU"
                log("cycles device", dev_type, [d.name for d in gpus])
                break
        except Exception as e:  # noqa
            log("no", dev_type, e)
    scene.cycles.samples = 96
    if scene.world is None:
        scene.world = bpy.data.worlds.new("World")


def bake_ao(objs, distance):
    setup_cycles()
    scene = bpy.context.scene
    scene.world.light_settings.distance = distance
    for o in objs:
        mat = bpy.data.materials.new("bake_" + o.name)
        o.data.materials.clear()
        o.data.materials.append(mat)
        if "AO" in o.data.color_attributes:
            o.data.color_attributes.remove(o.data.color_attributes["AO"])
        ca = o.data.color_attributes.new(name="AO", type="BYTE_COLOR", domain="POINT")
        o.data.color_attributes.active_color = ca
        try:
            o.data.color_attributes.render_color_index = o.data.color_attributes.active_color_index
        except Exception:
            pass
    for o in objs:
        bpy.ops.object.select_all(action="DESELECT")
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        t0 = time.time()
        bpy.ops.object.bake(type="AO", target="VERTEX_COLORS")
        vals = [d.color[0] for d in o.data.color_attributes["AO"].data]
        vals.sort()
        log(f"AO baked {o.name} {time.time()-t0:.1f}s  p5={vals[len(vals)//20]:.2f} p50={vals[len(vals)//2]:.2f} min={vals[0]:.2f}")


def front_hit(target, others, x, z, y_from=-1.0):
    """Ray from the front (−Y) towards +Y at (x, z); return first hit on `target`."""
    origin = Vector((x, y_from, z))
    direction = Vector((0, 1, 0))
    inv = target.matrix_world.inverted()
    ok, loc, nor, idx = target.ray_cast(inv @ origin, (inv.to_3x3() @ direction).normalized())
    if not ok:
        return None
    return target.matrix_world @ loc, (target.matrix_world.to_3x3() @ nor).normalized()


def add_anchor(name, loc, normal=None):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.01
    e.location = loc
    if normal is not None:
        # store the surface normal as the empty's local +Z (glTF export keeps rotation)
        e.rotation_mode = "QUATERNION"
        e.rotation_quaternion = normal.to_track_quat("Z", "Y")
    bpy.context.scene.collection.objects.link(e)
    return e


def export_glb(path, objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_normals=True,
        export_tangents=False,
        export_vertex_color="ACTIVE",
        export_all_vertex_colors=False,
        export_materials="EXPORT",
        export_extras=True,
        export_animations=False,
    )
    log("exported", path, os.path.getsize(path))


def render_preview(objs, path, view="front"):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "VERTEX"
    scene.display.shading.show_cavity = False
    scene.render.resolution_x = 1100
    scene.render.resolution_y = 1100
    mins, maxs = bbox(objs)
    ctr = (mins + maxs) / 2
    size = (maxs - mins).length
    cam_data = bpy.data.cameras.new("pcam")
    cam = bpy.data.objects.new("pcam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = size * 0.75
    cam_data.clip_start = 0.001
    cam_data.clip_end = 100
    d = {"front": Vector((0, -1, 0)), "side": Vector((1, 0, 0)), "back": Vector((0, 1, 0))}[view]
    cam.location = ctr + d * size * 2
    cam.rotation_euler = (ctr - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam)


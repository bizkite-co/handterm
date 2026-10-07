import zlib, struct, os

SRC = '/home/mstouffer/repos/handterm-proj/handterm/public/images/Lucia/Sprites/Gemini_Generated_Image_72ffes72ffes72ff.png'
OUT = '/home/mstouffer/repos/handterm-proj/handterm/public/images/Lucia/Individual Sprites'
BG = (251, 243, 233)
M = 12

def decode_png(path):
    with open(path, 'rb') as f: data = f.read()
    pos = 8; width = height = 0; idat = b''; color_type = None
    while pos < len(data):
        ln = struct.unpack('>I', data[pos:pos+4])[0]; typ = data[pos+4:pos+8]; chunk = data[pos+8:pos+8+ln]
        if typ == b'IHDR':
            width, height = struct.unpack('>II', chunk[:8]); color_type = chunk[9]
        elif typ == b'IDAT': idat += chunk
        pos += 12 + ln
    raw = zlib.decompress(idat)
    bpp = {0:1, 2:3, 3:1, 4:2, 6:4}[color_type]
    stride = width * bpp
    img = bytearray(width * height * bpp); prev = bytearray(stride); ri = 0; p = 0
    for y in range(height):
        f = raw[p]; p += 1
        line = bytearray(raw[p:p+stride]); p += stride
        if f == 1:
            for i in range(bpp, stride): line[i] = (line[i] + line[i-bpp]) & 0xff
        elif f == 2:
            for i in range(stride): line[i] = (line[i] + prev[i]) & 0xff
        elif f == 3:
            for i in range(stride):
                a = line[i-bpp] if i >= bpp else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 0xff
        elif f == 4:
            for i in range(stride):
                a = line[i-bpp] if i >= bpp else 0; b = prev[i]; c = prev[i-bpp] if i >= bpp else 0
                pp = a + b - c; pa = abs(pp-a); pb = abs(pp-b); pc = abs(pp-c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 0xff
        img[ri:ri+stride] = line; prev = line; ri += stride
    return width, height, bpp, img

w, h, bpp, img = decode_png(SRC)

def is_content(x, y):
    i = (y*w + x) * bpp
    r, g, b, a = img[i], img[i+1], img[i+2], img[i+3]
    if a < 128: return False
    return abs(r-BG[0]) + abs(g-BG[1]) + abs(b-BG[2]) > 200

# Pose ink boxes (full-res, from earlier analysis)
POSE_BOX = {
    'T1': (273, 633, 144, 867),   # Front view
    'T2': (837, 1188, 145, 856),  # Back view
    'T3': (1353, 1637, 144, 856), # Side profile (right)
    'B1': (88, 646, 984, 1655),   # Walking
    'B2': (753, 1217, 993, 1636), # Running
    'B3': (1359, 1766, 984, 1571),# Jumping / hopping
    'B4': (1880, 2390, 993, 1646),# Climbing
}

def ink_bbox(x0, x1, y0, y1):
    xs = [x for x in range(x0, x1) for y in range(y0, y1, 2) if is_content(x, y)]
    ys = [y for y in range(y0, y1) for x in range(x0, x1, 2) if is_content(x, y)]
    return min(xs), max(xs), min(ys), max(ys)

boxes = {n: ink_bbox(*b) for n, b in POSE_BOX.items()}
maxw = max(b[1] - b[0] for b in boxes.values()) + 1
maxh = max(b[3] - b[2] for b in boxes.values()) + 1
Wc = maxw + 2 * M
Hc = maxh + 2 * M
print(f'cell {Wc}x{Hc}')

def frame_rgba(pose, dx=0, dy=0):
    ax0, ax1, ay0, ay1 = boxes[pose]
    pw, ph = ax1 - ax0 + 1, ay1 - ay0 + 1
    ox = (Wc - pw) // 2 + dx
    oy = Hc - M - ph + dy    # feet aligned at Hc - M, plus per-frame offset
    buf = bytearray(Wc * Hc * 4)
    for yy in range(ay0, ay1 + 1):
        for xx in range(ax0, ax1 + 1):
            i = (yy * w + xx) * bpp
            r, g, b, a = img[i], img[i+1], img[i+2], img[i+3]
            if a < 128: continue
            d = max(abs(r-BG[0]), abs(g-BG[1]), abs(b-BG[2]))
            if d <= 4: continue
            alpha = 255 if d >= 24 else max(0, round((d - 4) * 13))
            oxx, oyy = ox + (xx - ax0), oy + (yy - ay0)
            if 0 <= oxx < Wc and 0 <= oyy < Hc:
                j = (oyy * Wc + oxx) * 4
                buf[j], buf[j+1], buf[j+2], buf[j+3] = r, g, b, alpha
    return buf

def write_png(path, rgba, W, H):
    def chunk(typ, data):
        c = struct.pack('>I', len(data)) + typ + data
        return c + struct.pack('>I', zlib.crc32(typ + data) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', W, H, 8, 6, 0, 0, 0)
    raw = b''.join(b'\x00' + bytes(rgba[y*W*4:(y+1)*W*4]) for y in range(H))
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) +
                chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

os.makedirs(OUT, exist_ok=True)

# game action -> (pose, [(dx, dy), ...] per frame)
ACTIONS = {
    'Idle':        ('T1', [(0,0),(0,2),(0,0),(0,2)]),
    'Walk':        ('B1', [(0,0),(2,0),(4,0),(2,0),(0,0),(4,0)]),
    'Run':         ('B2', [(0,2),(3,0),(5,0),(3,0),(0,2),(4,0)]),
    'Jump':        ('B3', [(0,0),(0,-2),(0,-4)]),
    'Attack':      ('T3', [(0,0),(2,0),(3,0),(2,0)]),
    'Hurt':        ('B3', [(0,0),(-2,1),(0,0)]),
    'Death':       ('T2', [(0,0),(1,2),(2,4),(3,7),(4,9),(5,10)]),
    'Summersault': ('B4', [(0,0),(2,0),(4,-1),(6,-2)]),
}

counts = {}
for action, (pose, offsets) in ACTIONS.items():
    counts[action] = len(offsets)
    for i, (dx, dy) in enumerate(offsets):
        name = f'lucia-{action.lower()}-{i:02d}.png'
        write_png(os.path.join(OUT, name), frame_rgba(pose, dx, dy), Wc, Hc)
    print(f'{action}: pose={pose} frames={len(offsets)}')

print('frame counts:', counts)
print('cell:', Wc, Hc)
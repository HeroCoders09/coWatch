// Isometric hero scene: a shared screen, three viewers, and a glowing cube.
// Pure SVG, drawn from a tiny projection helper so every shape stays on the grid.

const C = 0.866; // cos 30°
const S = 0.5; // sin 30°
const OX = 270;
const OY = 130;

const iso = (x, y, z) => [OX + (x - y) * C, OY + (x + y) * S - z];
const pts = (list) =>
  list.map((p) => iso(...p).map((n) => n.toFixed(1)).join(",")).join(" ");

// Box faces: `left` is the y-max face, `right` is the x-max face, `top` is z-max.
function Box({ x, y, z, w, d, h, top, left, right }) {
  return (
    <g stroke="rgba(131,148,173,0.18)" strokeWidth="1" strokeLinejoin="round">
      <polygon
        points={pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])}
        fill={right}
      />
      <polygon
        points={pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])}
        fill={left}
      />
      <polygon
        points={pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])}
        fill={top}
      />
    </g>
  );
}

function Viewer({ x, y, z, head, ring }) {
  const [cx, cy] = iso(x + 13, y + 13, z + 8 + 13);
  return (
    <g>
      <Box x={x} y={y} z={z} w={26} d={26} h={8} top="#162b4d" left="#0f2039" right="#0b1829" />
      <circle
        cx={cx}
        cy={cy}
        r="13"
        fill={head}
        stroke={ring ? "#3dd9e6" : "rgba(8,17,31,0.6)"}
        strokeWidth={ring ? 2 : 1}
      />
    </g>
  );
}

const PLATFORM_Z = 16;
const SCREEN = { x: 40, y: 60, z: PLATFORM_Z, w: 220, d: 12, h: 140 };
const FACE_Y = SCREEN.y + SCREEN.d; // the face the viewer sees

export default function HeroIllustration({ className = "" }) {
  const accent = "#3dd9e6";

  // play glyph on the screen face
  const cz = SCREEN.z + 78;
  const cx = SCREEN.x + SCREEN.w / 2;
  const play = pts([
    [cx - 14, FACE_Y + 0.5, cz - 22],
    [cx - 14, FACE_Y + 0.5, cz + 22],
    [cx + 24, FACE_Y + 0.5, cz],
  ]);

  // progress bar on the screen face
  const barZ = SCREEN.z + 20;
  const barStart = iso(SCREEN.x + 22, FACE_Y + 0.5, barZ);
  const barEnd = iso(SCREEN.x + SCREEN.w - 22, FACE_Y + 0.5, barZ);
  const barNow = iso(SCREEN.x + 22 + 0.42 * (SCREEN.w - 44), FACE_Y + 0.5, barZ);

  const target = iso(cx, FACE_Y, cz); // where sync lines land
  const viewers = [
    { x: 40, y: 170, head: "#8394ad", ring: true },
    { x: 90, y: 215, head: "#4f6a94" },
    { x: 150, y: 235, head: "#2c4468" },
  ];

  // faint grid on the platform top
  const grid = [];
  for (let k = 50; k < 300; k += 50) {
    grid.push(
      <line key={`gx${k}`} x1={iso(0, k, PLATFORM_Z)[0]} y1={iso(0, k, PLATFORM_Z)[1]} x2={iso(300, k, PLATFORM_Z)[0]} y2={iso(300, k, PLATFORM_Z)[1]} />,
      <line key={`gy${k}`} x1={iso(k, 0, PLATFORM_Z)[0]} y1={iso(k, 0, PLATFORM_Z)[1]} x2={iso(k, 300, PLATFORM_Z)[0]} y2={iso(k, 300, PLATFORM_Z)[1]} />
    );
  }

  const [gx, gy] = iso(222, 197, 50);

  return (
    <svg
      viewBox="0 0 540 460"
      className={className}
      role="img"
      aria-label="Illustration of three viewers watching one shared screen"
    >
      <style>{`
        .cw-sync { stroke-dasharray: 3 7; animation: cw-flow 1.8s linear infinite; }
        .cw-glow { animation: cw-pulse 3.2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes cw-flow { to { stroke-dashoffset: -20; } }
        @keyframes cw-pulse { 0%,100% { opacity: .55; } 50% { opacity: .9; } }
        @media (prefers-reduced-motion: reduce) {
          .cw-sync, .cw-glow { animation: none; }
        }
      `}</style>

      <defs>
        <radialGradient id="cw-glow-grad">
          <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* platform */}
      <Box x={0} y={0} z={0} w={300} d={300} h={PLATFORM_Z} top="#0f1f38" left="#0b182c" right="#08121f" />
      <g stroke="rgba(131,148,173,0.10)" strokeWidth="1">{grid}</g>

      {/* screen */}
      <Box {...SCREEN} top="#1d365c" left="#122443" right="#0c1a31" />
      <polygon points={play} fill={accent} />
      <line x1={barStart[0]} y1={barStart[1]} x2={barEnd[0]} y2={barEnd[1]} stroke="rgba(131,148,173,0.35)" strokeWidth="3" strokeLinecap="round" />
      <line x1={barStart[0]} y1={barStart[1]} x2={barNow[0]} y2={barNow[1]} stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <circle cx={barNow[0]} cy={barNow[1]} r="4.5" fill="#f4f6fa" />

      {/* sync lines: each viewer is tied to the same moment on the screen */}
      <g stroke={accent} strokeOpacity="0.4" strokeWidth="1.5" fill="none" strokeLinecap="round">
        {viewers.map((v) => {
          const [hx, hy] = iso(v.x + 13, v.y + 13, PLATFORM_Z + 8 + 13);
          return <line key={v.x} className="cw-sync" x1={hx} y1={hy} x2={target[0]} y2={target[1]} />;
        })}
      </g>

      {/* viewers */}
      {viewers.map((v) => (
        <Viewer key={v.x} x={v.x} y={v.y} z={PLATFORM_Z} head={v.head} ring={v.ring} />
      ))}

      {/* glowing cube */}
      <circle className="cw-glow" cx={gx} cy={gy} r="78" fill="url(#cw-glow-grad)" />
      <Box x={205} y={180} z={PLATFORM_Z} w={34} d={34} h={34} top="#8ff1f8" left="#2bb8c6" right="#1a8e9b" />
    </svg>
  );
}

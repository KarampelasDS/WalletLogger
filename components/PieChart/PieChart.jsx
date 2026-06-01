import { View, StyleSheet } from "react-native";

/**
 * Pure-View donut / pie chart — no SVG, no external charting library.
 *
 * Technique: each slice is a wedge built from up to two ≤180° "half-wedges".
 * A half-wedge of `sweep` degrees (≤180), starting at 12 o'clock going clockwise,
 * is rendered as a colored LEFT semicircle rotated clockwise by `sweep`, then
 * clipped to the RIGHT half of the circle. Algebraically this reveals exactly the
 * arc [0°, sweep°]:
 *
 *   left semicircle covers [180°,360°] ≡ [-180°,0°]
 *   rotated clockwise by sweep → covers [sweep-180°, sweep°]
 *   clipped to right half [0°,180°] → visible [max(sweep-180,0), min(sweep,180)] = [0, sweep]
 *
 * Each slice sits on its own absolutely-positioned full-size layer rotated to its
 * start angle, so slices never interfere with each other.
 */

// A colored LEFT semicircle on a full-size layer, rotated `rotate`° about the pie centre.
const HalfDisk = ({ size, color, rotate }) => (
  <View
    style={{
      position: "absolute",
      width: size,
      height: size,
      transform: [{ rotate: `${rotate}deg` }],
    }}
  >
    {/* clip to the LEFT half of the pie */}
    <View style={{ position: "absolute", left: 0, top: 0, width: size / 2, height: size, overflow: "hidden" }}>
      {/* full disk whose centre is the pie centre → visible part is the left semicircle */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    </View>
  </View>
);

const Wedge = ({ size, color, start, sweep }) => {
  // Split the sweep into ≤180° chunks (a single half-disk can only cover up to 180°).
  const chunks = [];
  let remaining = sweep;
  let base = 0;
  while (remaining > 0.001) {
    const part = Math.min(remaining, 180);
    chunks.push({ localStart: base, part });
    base += part;
    remaining -= part;
  }

  return (
    <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${start}deg` }] }]}>
      {chunks.map((c, i) => (
        <View key={i} style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${c.localStart}deg` }] }]}>
          {/* reveal only the RIGHT half */}
          <View style={{ position: "absolute", left: size / 2, top: 0, width: size / 2, height: size, overflow: "hidden" }}>
            {/* restore full-pie coordinate space inside the right-half clip */}
            <View style={{ position: "absolute", left: -size / 2, top: 0, width: size, height: size }}>
              <HalfDisk size={size} color={color} rotate={c.part} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

export default function PieChart({
  data = [],
  size = 180,
  holeRatio = 0.62,
  holeColor = "#2C2E42",
  emptyColor = "#3a3a4a",
  children,
}) {
  const total = data.reduce((a, b) => a + (b.value > 0 ? b.value : 0), 0);
  let acc = 0;

  return (
    <View style={{ width: size, height: size }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden" }}>
        {total <= 0 ? (
          <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: emptyColor }} />
        ) : (
          data.map((d, i) => {
            const v = d.value > 0 ? d.value : 0;
            if (v <= 0) return null;
            const start = (acc / total) * 360;
            const sweep = (v / total) * 360;
            acc += v;
            return <Wedge key={i} size={size} color={d.color} start={start} sweep={sweep} />;
          })
        )}
      </View>

      {holeRatio > 0 && (
        <View
          style={{
            position: "absolute",
            left: (size * (1 - holeRatio)) / 2,
            top: (size * (1 - holeRatio)) / 2,
            width: size * holeRatio,
            height: size * holeRatio,
            borderRadius: (size * holeRatio) / 2,
            backgroundColor: holeColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
}

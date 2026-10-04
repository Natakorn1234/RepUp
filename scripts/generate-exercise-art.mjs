// Original vector artwork authored for RepUp. No third-party exercise art inputs.
// Coordinates describe simplified start/end poses, not personalized form advice.
import { mkdir, writeFile } from "node:fs/promises";
const stroke = (points, color = "#667466", width = 6) =>
  `<polyline points="${points.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const line = (a, b, color, width) => stroke([a, b], color, width);
const circle = (x, y, r, fill) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const rect = (x, y, w, h, fill = "#3b493e") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}"/>`;
const dumbbell = ([x, y], vertical = false) =>
  `<g transform="translate(${x} ${y})${vertical ? " rotate(90)" : ""}">${line([-12, 0], [12, 0], "#c8f36a", 4)}${rect(-17, -9, 7, 18, "#c8f36a")}${rect(10, -9, 7, 18, "#c8f36a")}</g>`;
const bar = (x, y) =>
  line([x - 47, y], [x + 47, y], "#b5c3a8", 4) +
  rect(x - 45, y - 17, 9, 34, "#c8f36a") +
  rect(x + 36, y - 17, 9, 34, "#c8f36a");
function person({
  head = [110, 61],
  shoulder = [110, 91],
  hip = [110, 150],
  arms = [
    [
      [96, 94],
      [83, 123],
      [82, 151],
    ],
    [
      [124, 94],
      [138, 123],
      [138, 151],
    ],
  ],
  legs = [
    [
      [103, 150],
      [95, 189],
      [92, 225],
    ],
    [
      [117, 150],
      [126, 189],
      [130, 225],
    ],
  ],
  side = false,
}) {
  const [sx, sy] = shoulder,
    [hx, hy] = hip;
  return (
    legs
      .map(
        (l, i) =>
          stroke(l, i ? "#8d9c89" : "#65765f", 13) +
          line(l[2], [l[2][0] + 12, l[2][1] + 1], "#d1d9c9", 7),
      )
      .join("") +
    `<path d="M${sx - 14},${sy} Q${sx},${sy - 9} ${sx + 14},${sy} L${hx + 11},${hy} Q${hx},${hy + 7} ${hx - 11},${hy} Z" fill="#a9c98a"/>` +
    line([sx, sy - 2], [head[0], head[1] + 10], "#aebba5", 10) +
    arms
      .map(
        (a, i) =>
          stroke(a, i ? "#d0dcc5" : "#a5b59b", 9) +
          circle(...a[2], 5, "#dce5d4"),
      )
      .join("") +
    circle(...head, 13, "#d5dfcb") +
    `<path d="M${head[0] - 12},${head[1] - 3} Q${head[0] - 10},${head[1] - 19} ${head[0] + 7},${head[1] - 12} L${head[0] + 11},${head[1] - 5}" fill="#677b5e"/>` +
    (side ? circle(head[0] + 8, head[1], 1.4, "#35432d") : "") +
    line([hx - 10, hy], [hx + 10, hy], "#5e7253", 10)
  );
}
const standing = {};
const seat = () =>
  rect(80, 153, 64, 9) +
  line([110, 162], [110, 232]) +
  line([82, 233], [143, 233]);
const tower = () =>
  line([178, 234], [178, 31]) +
  line([178, 31], [108, 31]) +
  circle(108, 35, 6, "#74846e") +
  rect(160, 150, 30, 70) +
  [0, 1, 2, 3, 4]
    .map((i) => line([164, 162 + i * 10], [186, 162 + i * 10], "#7b8b6e", 2))
    .join("");
const cable = (hand, high = true) =>
  line(high ? [108, 35] : [177, 208], hand, "#9dab94", 2);
const seatedLegs = [
  [
    [104, 153],
    [142, 177],
    [141, 226],
  ],
  [
    [116, 153],
    [158, 177],
    [163, 226],
  ],
];
function press(incline, end) {
  const shoulder = incline ? [91, 113] : [72, 152],
    hip = [133, 168],
    head = incline ? [78, 86] : [44, 149];
  const hands = end
    ? [
        [91, 52],
        [126, 57],
      ]
    : [
        [64, 119],
        [125, 119],
      ];
  return {
    bg:
      stroke(
        incline
          ? [
              [72, 105],
              [116, 168],
              [152, 168],
            ]
          : [
              [45, 172],
              [160, 172],
            ],
        "#54684a",
        12,
      ) +
      line([100, 174], [84, 232]) +
      line([143, 174], [166, 232]),
    body: {
      head,
      shoulder,
      hip,
      arms: [
        [shoulder, end ? [84, 82] : [57, 148], hands[0]],
        [
          [shoulder[0] + 15, shoulder[1] + 5],
          end ? [121, 90] : [139, 151],
          hands[1],
        ],
      ],
      legs: [
        [
          [130, 168],
          [165, 184],
          [176, 228],
        ],
        [
          [138, 170],
          [174, 178],
          [196, 227],
        ],
      ],
      side: true,
    },
    gear: hands.map((p) => dumbbell(p)).join(""),
  };
}
function frontPress(end) {
  const hands = end
    ? [
        [79, 29],
        [141, 29],
      ]
    : [
        [69, 85],
        [151, 85],
      ];
  return {
    bg: seat() + rect(94, 87, 32, 63),
    body: {
      hip: [110, 150],
      legs: seatedLegs,
      arms: [
        [[95, 93], end ? [79, 64] : [61, 113], hands[0]],
        [[125, 93], end ? [141, 64] : [159, 113], hands[1]],
      ],
    },
    gear: hands.map((p) => dumbbell(p)).join(""),
  };
}
function fly(end, reverse = false) {
  const closed = reverse ? !end : end;
  const hands = closed
    ? [
        [101, 109],
        [119, 109],
      ]
    : [
        [42, 95],
        [178, 95],
      ];
  return {
    bg:
      seat() +
      line([33, 155], [33, 54]) +
      line([187, 155], [187, 54]) +
      line([33, 54], [187, 54]) +
      line([33, 74], hands[0]) +
      line([187, 74], hands[1]),
    body: {
      hip: [110, 151],
      legs: seatedLegs,
      arms: [
        [[95, 94], closed ? [82, 111] : [66, 98], hands[0]],
        [[125, 94], closed ? [138, 111] : [154, 98], hands[1]],
      ],
    },
    gear:
      hands.map((p) => circle(...p, 5, "#c8f36a")).join("") +
      (reverse ? rect(94, 110, 32, 38, "#4d6041") : ""),
  };
}
function curl(end, hammer) {
  const hands = end
    ? [
        [85, 103],
        [135, 103],
      ]
    : [
        [82, 164],
        [138, 164],
      ];
  return {
    body: {
      arms: [
        [[95, 93], [82, 130], hands[0]],
        [[125, 93], [138, 130], hands[1]],
      ],
    },
    gear: hands.map((p) => dumbbell(p, hammer)).join(""),
  };
}
function pulldown(end, neutral) {
  const hands = end
    ? [
        [70, 100],
        [150, 100],
      ]
    : neutral
      ? [
          [96, 35],
          [124, 35],
        ]
      : [
          [63, 35],
          [157, 35],
        ];
  return {
    bg: tower() + seat() + rect(100, 171, 46, 8),
    body: {
      hip: [110, 153],
      legs: seatedLegs,
      arms: [
        [[95, 94], end ? [58, 128] : [78, 62], hands[0]],
        [[125, 94], end ? [162, 128] : [142, 62], hands[1]],
      ],
    },
    gear:
      cable([110, hands[0][1]]) +
      (neutral
        ? line(hands[0], hands[1], "#c8f36a", 6)
        : stroke(
            [
              [hands[0][0] - 9, hands[0][1] + 7],
              hands[0],
              [110, hands[0][1] - 4],
              hands[1],
              [hands[1][0] + 9, hands[1][1] + 7],
            ],
            "#c8f36a",
            5,
          )),
  };
}
function legpress(end, calf = false) {
  const extended = calf || end;
  const footX = extended ? 151 : 115,
    footY = extended ? 97 : 140;
  return {
    bg:
      stroke(
        [
          [36, 126],
          [69, 179],
          [99, 184],
        ],
        "#54684a",
        12,
      ) +
      stroke(
        [
          [38, 232],
          [194, 54],
        ],
        "#586850",
        6,
      ) +
      line([footX - 15, footY - 23], [footX + 22, footY + 14], "#b0c19c", 12),
    body: {
      head: [40, 92],
      shoulder: [52, 118],
      hip: [83, 170],
      arms: [
        [
          [48, 121],
          [48, 153],
          [71, 178],
        ],
        [
          [60, 121],
          [80, 146],
          [95, 170],
        ],
      ],
      legs: [
        [
          [79, 169],
          extended ? [119, 133] : [91, 126],
          [footX, footY + (calf && end ? -7 : 0)],
        ],
        [
          [89, 177],
          extended ? [135, 147] : [117, 167],
          [footX + 12, footY + 14 + (calf && end ? -7 : 0)],
        ],
      ],
      side: true,
    },
    gear: circle(177, 79, 17, "#718263") + circle(177, 79, 5, "#c8f36a"),
  };
}
function hinge(end, isCable) {
  const hands = end
    ? [
        [93, 148],
        [117, 148],
      ]
    : [
        [154, 176],
        [169, 170],
      ];
  return {
    bg: isCable ? line([191, 231], [191, 78]) + rect(177, 181, 27, 47) : "",
    body: end
      ? {
          arms: [
            [[95, 91], [92, 120], hands[0]],
            [[125, 91], [120, 120], hands[1]],
          ],
        }
      : {
          head: [152, 114],
          shoulder: [139, 135],
          hip: [85, 153],
          arms: [
            [[139, 135], [148, 155], hands[0]],
            [[146, 139], [158, 155], hands[1]],
          ],
          legs: [
            [
              [80, 155],
              [97, 189],
              [97, 230],
            ],
            [
              [92, 155],
              [119, 191],
              [125, 230],
            ],
          ],
          side: true,
        },
    gear: isCable
      ? cable(hands[1], false) + line(hands[0], hands[1], "#c8f36a", 6)
      : bar((hands[0][0] + hands[1][0]) / 2, hands[0][1]),
  };
}
function bridge(end, bench) {
  return {
    bg: bench
      ? rect(27, 151, 48, 12) +
        line([36, 163], [36, 230]) +
        line([67, 163], [67, 230])
      : "",
    body: {
      head: [40, bench ? 127 : 204],
      shoulder: [65, bench ? 150 : 215],
      hip: [122, end ? (bench ? 153 : 174) : 213],
      arms: [
        [
          [65, bench ? 150 : 215],
          [83, 205],
          [101, 224],
        ],
        [
          [72, bench ? 152 : 215],
          [104, 205],
          [125, 219],
        ],
      ],
      legs: [
        [
          [122, end ? (bench ? 153 : 174) : 213],
          [164, 174],
          [185, 228],
        ],
        [
          [129, end ? (bench ? 159 : 179) : 217],
          [181, 182],
          [206, 228],
        ],
      ],
      side: true,
    },
    gear: bench ? bar(122, end ? 149 : 210) : "",
  };
}
const poses = {
  "incline-press": (e) => press(true, e),
  "flat-bench-press": (e) => press(false, e),
  "shoulder-press": frontPress,
  "pec-deck": (e) => fly(e),
  "reverse-pec-deck": (e) => fly(e, true),
  "lateral-raise": (e) => {
    const hands = e
      ? [
          [35, 99],
          [185, 99],
        ]
      : [
          [79, 165],
          [141, 165],
        ];
    return {
      body: {
        arms: [
          [[95, 94], e ? [64, 93] : [83, 131], hands[0]],
          [[125, 94], e ? [156, 93] : [137, 131], hands[1]],
        ],
      },
      gear: hands.map((p) => dumbbell(p, true)).join(""),
    };
  },
  "biceps-curl": (e) => curl(e, false),
  "hammer-curl": (e) => curl(e, true),
  "wide-grip-lat-pulldown": (e) => pulldown(e, false),
  "neutral-grip-pulldown": (e) => pulldown(e, true),
  "triceps-pushdown": (e) => {
    const hands = e
      ? [
          [130, 167],
          [143, 167],
        ]
      : [
          [156, 114],
          [165, 117],
        ];
    return {
      bg: tower(),
      body: {
        head: [102, 65],
        shoulder: [108, 94],
        hip: [105, 157],
        arms: [
          [[106, 94], [125, 127], hands[0]],
          [[116, 97], [139, 131], hands[1]],
        ],
        side: true,
      },
      gear: cable(hands[1]) + line(hands[0], hands[1], "#c8f36a", 6),
    };
  },
  "overhead-triceps-extension": (e) => ({
    body: {
      arms: [
        [[95, 94], [79, 59], e ? [104, 19] : [109, 72]],
        [[125, 94], [141, 59], e ? [116, 19] : [119, 72]],
      ],
    },
    gear: dumbbell(e ? [110, 15] : [114, 75], true),
  }),
  "seated-row": (e) => ({
    bg:
      rect(53, 165, 57, 10) +
      line([74, 175], [74, 230]) +
      line([172, 207], [191, 160]) +
      rect(181, 112, 27, 88),
    body: {
      head: [73, 81],
      shoulder: [82, 107],
      hip: [91, 161],
      arms: [
        [[80, 108], e ? [67, 139] : [118, 118], e ? [107, 137] : [155, 124]],
        [[91, 111], e ? [84, 147] : [128, 132], e ? [115, 144] : [164, 135]],
      ],
      legs: [
        [
          [88, 161],
          [137, 180],
          [173, 190],
        ],
        [
          [97, 169],
          [146, 189],
          [187, 201],
        ],
      ],
      side: true,
    },
    gear:
      line([192, 156], e ? [111, 141] : [160, 130], "#9dab94", 2) +
      line(
        e ? [107, 137] : [155, 124],
        e ? [115, 144] : [164, 135],
        "#c8f36a",
        7,
      ),
  }),
  "leg-press": (e) => legpress(e),
  "calf-raise-on-leg-press": (e) => legpress(e, true),
  "romanian-deadlift": (e) => hinge(e, false),
  "cable-sldl": (e) => hinge(e, true),
  "lying-leg-curl": (e) => ({
    bg:
      stroke(
        [
          [33, 151],
          [95, 142],
          [147, 157],
        ],
        "#55694b",
        12,
      ) +
      line([49, 157], [49, 231]) +
      line([130, 162], [150, 231]),
    body: {
      head: [32, 122],
      shoulder: [51, 135],
      hip: [110, 136],
      arms: [
        [
          [48, 138],
          [43, 169],
          [28, 172],
        ],
        [
          [55, 143],
          [66, 173],
          [40, 177],
        ],
      ],
      legs: [
        [[110, 136], [154, 152], e ? [167, 103] : [194, 169]],
        [[112, 143], [155, 159], e ? [178, 114] : [195, 180]],
      ],
      side: true,
    },
    gear: line(
      e ? [162, 109] : [181, 168],
      e ? [186, 115] : [198, 178],
      "#c8f36a",
      13,
    ),
  }),
  "leg-extension": (e) => ({
    bg: seat() + rect(75, 95, 9, 69) + line([145, 170], [161, 209]),
    body: {
      head: [98, 69],
      shoulder: [105, 96],
      hip: [110, 153],
      arms: [
        [
          [95, 99],
          [77, 125],
          [81, 153],
        ],
        [
          [119, 99],
          [134, 126],
          [135, 153],
        ],
      ],
      legs: [
        [[105, 151], [146, 164], e ? [191, 162] : [149, 215]],
        [[116, 158], [155, 173], e ? [199, 178] : [160, 224]],
      ],
      side: true,
    },
    gear: line(
      e ? [185, 164] : [145, 211],
      e ? [198, 178] : [162, 220],
      "#c8f36a",
      13,
    ),
  }),
  "calf-raise": (e) => ({
    bg: rect(74, 225, 77, 12) + line([170, 232], [170, 82]),
    body: {
      head: [110, e ? 51 : 61],
      shoulder: [110, e ? 81 : 91],
      hip: [110, e ? 140 : 150],
      arms: [
        [
          [95, e ? 84 : 94],
          [83, 120],
          [79, 156],
        ],
        [
          [125, e ? 84 : 94],
          [150, 109],
          [169, 103],
        ],
      ],
      legs: [
        [
          [103, e ? 140 : 150],
          [96, 184],
          [e ? 97 : 89, e ? 214 : 229],
        ],
        [
          [117, e ? 140 : 150],
          [124, 183],
          [e ? 128 : 132, e ? 214 : 229],
        ],
      ],
    },
    gear:
      line([95, 224], [111, 224], "#c8f36a", 6) +
      line([127, 224], [142, 224], "#c8f36a", 6),
  }),
  "cable-crunch": (e) => ({
    bg: tower(),
    body: {
      head: e ? [130, 156] : [111, 103],
      shoulder: e ? [109, 161] : [108, 128],
      hip: [87, 186],
      arms: [
        [
          [106, e ? 161 : 128],
          [138, e ? 181 : 147],
          [e ? 134 : 119, e ? 144 : 95],
        ],
        [
          [112, e ? 166 : 131],
          [149, e ? 180 : 143],
          [e ? 143 : 127, e ? 150 : 103],
        ],
      ],
      legs: [
        [
          [85, 186],
          [127, 221],
          [80, 231],
        ],
        [
          [95, 190],
          [142, 224],
          [97, 234],
        ],
      ],
      side: true,
    },
    gear:
      cable(e ? [135, 148] : [122, 100]) +
      line(
        e ? [134, 144] : [119, 95],
        e ? [143, 150] : [127, 103],
        "#c8f36a",
        5,
      ),
  }),
  plank: () => ({
    body: {
      head: [56, 160],
      shoulder: [77, 174],
      hip: [133, 190],
      arms: [
        [
          [77, 174],
          [66, 226],
          [34, 226],
        ],
        [
          [85, 179],
          [83, 232],
          [48, 232],
        ],
      ],
      legs: [
        [
          [132, 190],
          [162, 203],
          [192, 230],
        ],
        [
          [138, 194],
          [172, 213],
          [202, 232],
        ],
      ],
      side: true,
    },
  }),
  "hip-thrust": (e) => bridge(e, true),
  "glute-bridge": (e) => bridge(e, false),
};
await mkdir("public/exercises", { recursive: true });
for (const [id, draw] of Object.entries(poses)) {
  const render = (end, x) => {
    const p = draw(end);
    return `<g transform="translate(${x} 0)">${line([20, 239], [209, 239], "#344036", 2)}${p.bg || ""}${person(p.body || standing)}${p.gear || ""}</g>`;
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270"><rect width="480" height="270" rx="16" fill="#1b231d"/>${render(false, 0)}${render(true, 260)}<path d="M229 133h20m-6-6 7 6-7 6" fill="none" stroke="#8ba372" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  await writeFile(`public/exercises/${id}.svg`, svg);
}
console.log(
  `Created ${Object.keys(poses).length} original two-pose exercise illustrations.`,
);

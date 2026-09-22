export const BOARD_FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

export const MOVE_PATTERNS = {
  rookRider: {
    key: "rookRider",
    kind: "rider",
    label: "green = rook lines",
    targetLabel: "Rook",
    color: "#2f7a4f",
    directions: [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]
  },
  knightLeap: {
    key: "knightLeap",
    kind: "leaper",
    label: "blue = knight jumps",
    targetLabel: "Knight",
    dotLabel: "N",
    color: "#2f5fbb",
    deltas: [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1]
    ]
  },
  zebraLeap: {
    key: "zebraLeap",
    kind: "leaper",
    label: "red = zebra jumps",
    targetLabel: "Zebra",
    dotLabel: "Z",
    color: "#a8423b",
    deltas: [
      [-3, -2],
      [-3, 2],
      [-2, -3],
      [-2, 3],
      [2, -3],
      [2, 3],
      [3, -2],
      [3, 2]
    ]
  }
};

export const PIECE_CARDS = {
  chancellor: {
    id: "Cn",
    slug: "chancellor",
    title: "CHANCELLOR",
    subtitle: "War Ledger Chess: Rook + Knight",
    originSquare: "d4",
    emblem: {
      title: "Cn",
      line1: "rook tower",
      line2: "knight leap"
    },
    movement: [MOVE_PATTERNS.rookRider, MOVE_PATTERNS.knightLeap],
    identity: [
      ["ID", "Cn"],
      ["MOVE", "R + N"],
      ["VALUE", "10"],
      ["LICENSE", "10 bank"]
    ],
    names: ["Chancellor", "Empress", "Marshall", "Champion"],
    history: [
      "Carrera's Chess, 1617: Champion",
      "Capablanca Chess family: Chancellor / Marshall"
    ],
    overload: [
      "Not the standard Dragon name",
      "Dragon is overloaded across variants"
    ],
    game: "War Ledger Chess",
    exactTargets: {
      rookRider: ["a4", "b4", "c4", "d1", "d2", "d3", "d5", "d6", "d7", "d8", "e4", "f4", "g4", "h4"],
      knightLeap: ["b3", "b5", "c2", "c6", "e2", "e6", "f3", "f5"]
    }
  },
  zebra: {
    id: "Z",
    slug: "zebra",
    title: "ZEBRA",
    subtitle: "War Ledger Chess: 3-by-2 Leaper",
    originSquare: "d4",
    emblem: {
      title: "Z",
      line1: "long knight",
      line2: "3 by 2"
    },
    movement: [MOVE_PATTERNS.zebraLeap],
    identity: [
      ["ID", "Z"],
      ["MOVE", "(3,2) leap"],
      ["VALUE", "5"],
      ["LICENSE", "5 bank"]
    ],
    names: ["Zebra", "(2,3)-leaper", "(3,2)-leaper", "stretched knight"],
    history: [
      "Fairy chess problem tradition",
      "Common Piececlopedia leaper taxonomy"
    ],
    overload: [
      "Related but different: Camel = (3,1)",
      "Zebrarider repeats Zebra leaps in a line"
    ],
    game: "War Ledger Chess",
    exactTargets: {
      zebraLeap: ["a2", "a6", "b1", "b7", "f1", "f7", "g2", "g6"]
    }
  }
};

PIECE_CARDS.dragon = PIECE_CARDS.chancellor;

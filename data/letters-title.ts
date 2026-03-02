export const LETTERS = [
    { char: "W", color: "#e5e5e7" },
    { char: "O", color: "#e5e5e7" },
    { char: "R", color: "#e5e5e7" },
    { char: "D", color: "#538d4e" },
    { char: "L", color: "#538d4e" },
    { char: "E", color: "#538d4e" },
];

export const MINI_BOARD = [
    [
        { letter: "G", state: "absent" },
        { letter: "A", state: "absent" },
        { letter: "T", state: "present" },
        { letter: "O", state: "correct" },
        { letter: "S", state: "absent" },
    ],
    [
        { letter: "P", state: "absent" },
        { letter: "L", state: "correct" },
        { letter: "A", state: "absent" },
        { letter: "T", state: "present" },
        { letter: "O", state: "correct" },
    ],
    [
        { letter: "", state: "empty" },
        { letter: "", state: "empty" },
        { letter: "", state: "empty" },
        { letter: "", state: "empty" },
        { letter: "", state: "empty" },
    ],
];

export const DAILY_BOARD = [
    [
        { letter: "H", state: "correct" },
        { letter: "O", state: "correct" },
        { letter: "G", state: "correct" },
        { letter: "A", state: "correct" },
        { letter: "R", state: "correct" },
    ],
    [
        { letter: "", state: "empty" },
        { letter: "", state: "empty" },
        { letter: "", state: "empty" },
        { letter: "", state: "empty" },
        { letter: "", state: "empty" },
    ],
];
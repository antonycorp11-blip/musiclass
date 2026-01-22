
export interface ChordShape {
    frets: (number | null)[];
    fingers: (number | null)[];
    barre?: number;
}

export const GUITAR_CHORD_LIBRARY: Record<string, ChordShape> = {
    // MAJORS
    'Cmaj': { frets: [null, 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null] },
    'C#maj': { frets: [null, 4, 6, 6, 6, 4], fingers: [null, 1, 2, 3, 4, 1], barre: 4 },
    'Dbmaj': { frets: [null, 4, 6, 6, 6, 4], fingers: [null, 1, 2, 3, 4, 1], barre: 4 },
    'Dmaj': { frets: [null, null, 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2] },
    'D#maj': { frets: [null, 6, 8, 8, 8, 6], fingers: [null, 1, 2, 3, 4, 1], barre: 6 },
    'Ebmaj': { frets: [null, 6, 8, 8, 8, 6], fingers: [null, 1, 2, 3, 4, 1], barre: 6 },
    'Emaj': { frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null] },
    'Fmaj': { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: 1 },
    'F#maj': { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], barre: 2 },
    'Gbmaj': { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], barre: 2 },
    'Gmaj': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, null, null, null, 3] },
    'G#maj': { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], barre: 4 },
    'Abmaj': { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], barre: 4 },
    'Amaj': { frets: [null, 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null] },
    'A#maj': { frets: [null, 1, 3, 3, 3, 1], fingers: [null, 1, 2, 3, 4, 1], barre: 1 },
    'Bbmaj': { frets: [null, 1, 3, 3, 3, 1], fingers: [null, 1, 2, 3, 4, 1], barre: 1 },
    'Bmaj': { frets: [null, 2, 4, 4, 4, 2], fingers: [null, 1, 3, 4, 2, 1], barre: 2 },

    // MINORS
    'Cmin': { frets: [null, 3, 5, 5, 4, 3], fingers: [null, 1, 3, 4, 2, 1], barre: 3 },
    'C#min': { frets: [null, 4, 6, 6, 5, 4], fingers: [null, 1, 3, 4, 2, 1], barre: 4 },
    'Dbmin': { frets: [null, 4, 6, 6, 5, 4], fingers: [null, 1, 3, 4, 2, 1], barre: 4 },
    'Dmin': { frets: [null, null, 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1] },
    'D#min': { frets: [null, 6, 8, 8, 7, 6], fingers: [null, 1, 3, 4, 2, 1], barre: 6 },
    'Ebmin': { frets: [null, 6, 8, 8, 7, 6], fingers: [null, 1, 3, 4, 2, 1], barre: 6 },
    'Emin': { frets: [0, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null] },
    'Fmin': { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barre: 1 },
    'F#min': { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barre: 2 },
    'Gbmin': { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barre: 2 },
    'Gmin': { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barre: 3 },
    'G#min': { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], barre: 4 },
    'Abmin': { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], barre: 4 },
    'Amin': { frets: [null, 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null] },
    'A#min': { frets: [null, 1, 3, 3, 2, 1], fingers: [null, 1, 3, 4, 2, 1], barre: 1 },
    'Bbmin': { frets: [null, 1, 3, 3, 2, 1], fingers: [null, 1, 3, 4, 2, 1], barre: 1 },
    'Bmin': { frets: [null, 2, 4, 4, 3, 2], fingers: [null, 1, 3, 4, 2, 1], barre: 2 },

    // SEVENTHS
    'C7': { frets: [null, 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, null] },
    'D7': { frets: [null, null, 0, 2, 1, 2], fingers: [null, null, null, 2, 1, 3] },
    'E7': { frets: [0, 2, 0, 1, 0, 0], fingers: [null, 2, null, 1, null, null] },
    'F7': { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], barre: 1 },
    'G7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, null, null, null, 1] },
    'A7': { frets: [null, 0, 2, 0, 2, 0], fingers: [null, null, 2, null, 3, null] },
    'B7': { frets: [null, 2, 1, 2, 0, 2], fingers: [null, 2, 1, 3, null, 4] },
};

export const getGuitarShape = (root: string, type: string, ext: string): ChordShape => {
    const fullKey = `${root}${type}${ext !== 'none' ? ext : ''}`;
    if (GUITAR_CHORD_LIBRARY[fullKey]) return GUITAR_CHORD_LIBRARY[fullKey];

    const simpleKey = `${root}${type}`;
    if (GUITAR_CHORD_LIBRARY[simpleKey]) return GUITAR_CHORD_LIBRARY[simpleKey];

    // Basic fallback
    return GUITAR_CHORD_LIBRARY['Cmaj'];
};

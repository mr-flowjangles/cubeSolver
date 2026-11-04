# 04 — Camera scan

**Status:** decided by Claude under Rob's standing go-ahead, 2026-11-04. Rob to review.

## Flow

- Solve my cube → **Scan with camera**.
- Scan 6 faces in order: top, front, right, back, left, bottom.
- Each face goes inside a 3×3 guide; the middle cell is ringed in the color it should be.
- After 6 faces, the flat cube map opens with a "compare and fix" note.
- **Check & solve** then works the same as tapping colors in.

## How colors are read

- Each sticker is read from the middle of its cell, using the median to ignore glare.
- The six center stickers show what each color looks like under the player's own light.
- Every other sticker gets the closest center color (CIE Lab color space, lightness counted half).
- Each color is then re-averaged from all its stickers, and stickers re-assigned.
- At most 9 stickers get each color.
- If a piece comes out impossible, the least-certain stickers are swapped until every piece is real.

## Privacy

- Camera frames are read in the page and never uploaded or saved.

## Tested here

- Color reading: 50 random cubes each under daylight, warm bulb, cool LED and dim-room light; at most 1 wrong sticker per light.
- Camera flow: a fake camera feed in headless Chrome; sampled colors matched the feed within 1 unit.

## Not tested here

- Real phone cameras (iPhone, Android) with a real cube.

# Score Announcement Audio Files

**IMPORTANT: These are currently empty placeholder files. You MUST replace them with actual audio recordings for sound to work.**

The app now uses the Web Audio API to load and play these files, which provides better mobile compatibility than the previous HTML5 Audio approach.

## Required Files:
- `ten.mp3` - "Ten" (score 10)
- `nine.mp3` - "Nine" (score 9)
- `eight.mp3` - "Eight" (score 8)
- `seven.mp3` - "Seven" (score 7)
- `six.mp3` - "Six" (score 6)
- `five.mp3` - "Five" (score 5)
- `four.mp3` - "Four" (score 4)
- `three.mp3` - "Three" (score 3)
- `two.mp3` - "Two" (score 2)
- `one.mp3` - "One" (score 1)
- `miss.mp3` - "Miss" (score 0)

## How to Create Audio Files:

1. **Use Text-to-Speech Services:**
   - Visit: https://ttsmp3.com/
   - Input the word (e.g., "Ten", "Nine", etc.)
   - Download as MP3

2. **Or Record Your Own Voice:**
   - Use any recording app
   - Say each word clearly
   - Export as MP3 (44.1kHz, 128kbps recommended)

3. **File Requirements:**
   - Format: MP3
   - Sample Rate: 44.1kHz
   - Bitrate: 128kbps or higher
   - Length: 1-2 seconds per file
   - Volume: Consistent across all files

## Testing:

After replacing the files, test on both desktop and mobile. The Web Audio API approach should work better on mobile devices than the previous method.
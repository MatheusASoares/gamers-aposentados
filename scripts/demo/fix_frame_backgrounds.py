import os
import glob
import math
from PIL import Image

def process_frame(filepath):
    img = Image.open(filepath).convert("RGBA")
    width, height = img.size
    cx, cy = width / 2.0, height / 2.0
    pixels = img.load()

    # Corner background sampling to find exact background color
    corner_colors = [
        pixels[5, 5],
        pixels[width - 5, 5],
        pixels[5, height - 5],
        pixels[width - 5, height - 5]
    ]
    avg_bg_r = sum(c[0] for c in corner_colors) / 4.0
    avg_bg_g = sum(c[1] for c in corner_colors) / 4.0
    avg_bg_b = sum(c[2] for c in corner_colors) / 4.0

    print(f"Processing {os.path.basename(filepath)}: Corner BG color = ({avg_bg_r:.1f}, {avg_bg_g:.1f}, {avg_bg_b:.1f})")

    for x in range(width):
        for y in range(height):
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx * dx + dy * dy)

            r, g, b, a = pixels[x, y]

            # 1. Outer cutoff: Anything beyond radius 450px is background
            if dist > 455:
                pixels[x, y] = (0, 0, 0, 0)
                continue

            # 2. Outer gradient transition: Between radius 420 and 455, remove dark background pixels
            if dist > 400:
                # Calculate color distance to background
                color_diff = math.sqrt((r - avg_bg_r)**2 + (g - avg_bg_g)**2 + (b - avg_bg_b)**2)
                # If color is close to corner background color or total brightness is very low
                brightness = (r + g + b) / 3.0
                if color_diff < 50 or (brightness < 40 and dist > 420):
                    pixels[x, y] = (0, 0, 0, 0)
                elif dist > 440 and color_diff < 80:
                    pixels[x, y] = (0, 0, 0, 0)

            # 3. Inner circle cutout (Radius < 330): remove residual dark center pixels
            if dist < 330:
                brightness = (r + g + b) / 3.0
                if brightness < 60 or dist < 300:
                    pixels[x, y] = (0, 0, 0, 0)

    img.save(filepath, "PNG")
    print(f"Saved cleaned {os.path.basename(filepath)}")

def main():
    frames = glob.glob("public/assets/frames/*.png")
    for f in frames:
        process_frame(f)

    # Also copy cleaned frames to artifact directory if needed
    brain_frames = glob.glob("public/assets/frames/*.png")
    print("All frames cleaned successfully!")

if __name__ == "__main__":
    main()

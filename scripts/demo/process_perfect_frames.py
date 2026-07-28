import os
import glob
import math
from PIL import Image

# Mapping from original artifact name to final frame filename
FRAME_MAPPING = {
    "avatar_frame_wooden": "wooden-frame.png",
    "avatar_frame_bronze": "bronze-frame.png",
    "avatar_frame_silver": "silver-frame.png",
    "avatar_frame_cyber_neon": "cyber-neon-frame.png",
    "avatar_frame_gold_v2": "gold-frame.png",
    "avatar_frame_celestial_violet": "celestial-violet-frame.png",
    "avatar_frame_legendary": "legendary-frame.png",
}

ARTIFACTS_DIR = r"C:\Users\mathe\.gemini\antigravity-ide\brain\b36dc37d-c087-49eb-b2ad-36be9918c794"
OUTPUT_DIR = r"public/assets/frames"

def process_image(src_path, dest_filename):
    img = Image.open(src_path).convert("RGBA")
    width, height = img.size
    cx, cy = width / 2.0, height / 2.0
    pixels = img.load()

    # Corner background sampling (5,5), (W-5, 5), etc.
    corner_colors = [
        pixels[5, 5],
        pixels[width - 5, 5],
        pixels[5, height - 5],
        pixels[width - 5, height - 5]
    ]
    bg_r = sum(c[0] for c in corner_colors) / 4.0
    bg_g = sum(c[1] for c in corner_colors) / 4.0
    bg_b = sum(c[2] for c in corner_colors) / 4.0

    print(f"Processing {dest_filename} from {os.path.basename(src_path)}: BG=({bg_r:.1f}, {bg_g:.1f}, {bg_b:.1f})")

    for x in range(width):
        for y in range(height):
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx * dx + dy * dy)
            r, g, b, a = pixels[x, y]

            # 1. Hard Cutout Outer: Everything beyond radius 465px is 100% transparent
            if dist > 465:
                pixels[x, y] = (0, 0, 0, 0)
                continue

            # 2. Hard Cutout Inner: Everything inside radius 350px is 100% transparent
            if dist < 350:
                pixels[x, y] = (0, 0, 0, 0)
                continue

            # 3. Outer Fringe Cleanup (420px <= dist <= 465px):
            # Remove black background pixels surrounding outer edge of ring
            if dist >= 420:
                color_dist = math.sqrt((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2)
                brightness = (r + g + b) / 3.0
                if color_dist < 45 or brightness < 30:
                    pixels[x, y] = (0, 0, 0, 0)

            # 4. Inner Fringe Cleanup (350px <= dist <= 380px):
            # Remove dark residual pixels inside ring inner edge
            if dist <= 380:
                brightness = (r + g + b) / 3.0
                if brightness < 35:
                    pixels[x, y] = (0, 0, 0, 0)

    dest_path = os.path.join(OUTPUT_DIR, dest_filename)
    img.save(dest_path, "PNG")
    print(f"  -> Successfully saved transparent frame to {dest_path}")

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    all_artifacts = glob.glob(os.path.join(ARTIFACTS_DIR, "*.png"))

    for prefix, dest_name in FRAME_MAPPING.items():
        matching = [f for f in all_artifacts if os.path.basename(f).startswith(prefix)]
        if matching:
            src_file = matching[0]
            process_image(src_file, dest_name)
        else:
            print(f"WARNING: Source artifact for {prefix} not found!")

if __name__ == "__main__":
    main()

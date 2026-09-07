"""
Gamers Aposentados - Guild Asset Automated Processing Pipeline
Usage:
    python scripts/process_guild_asset.py <level_number> [optional_input_file]
    npm run guild:asset <level_number> [optional_input_file]

Examples:
    python scripts/process_guild_asset.py 10
    python scripts/process_guild_asset.py 11 path/to/kaer_morhen.png
"""

import sys
import os
import re
import glob
from pathlib import Path

# Fix Windows console UTF-8 encoding for emojis
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from PIL import Image

# 25-Level Master Rewards Catalog
GUILD_LEVELS = {
    1: {"type": "EMBLEM", "name": "Escudo do Cavaleiro de Astora", "dest": "public/assets/guild/emblems/astora-shield.png"},
    2: {"type": "MASCOT", "name": "Kuro-bot (Gato Cyberpunk)", "dest": "public/assets/guild/mascots/kuro-bot.webm", "dest_png": "public/assets/guild/mascots/kuro-bot.png"},
    3: {"type": "BANNER", "name": "Bastião de Night City", "dest": "public/assets/guild/banners/night-city.jpg"},
    4: {"type": "TITLE", "name": "Agentes da Foxhound"},
    5: {"type": "EMBLEM", "name": "Lâminas Duplas do Hadouken", "dest": "public/assets/guild/emblems/hadouken-swords.png"},
    6: {"type": "MASCOT", "name": "Makar o Korok Folião", "dest": "public/assets/guild/mascots/makar-korok.webm", "dest_png": "public/assets/guild/mascots/makar-korok.png"},
    7: {"type": "BANNER", "name": "Cidade Subaquática de Rapture", "dest": "public/assets/guild/banners/rapture-city.jpg"},
    8: {"type": "TITLE", "name": "Caçadores de Relíquias de Yharnam"},
    9: {"type": "EMBLEM", "name": "Medalhão do Lobo Branco", "dest": "public/assets/guild/emblems/witcher-wolf.png"},
    10: {"type": "MASCOT", "name": "Palico Guerreiro Felyne", "dest": "public/assets/guild/mascots/palico-felyne.webm", "dest_png": "public/assets/guild/mascots/palico-felyne.png"},
    11: {"type": "BANNER", "name": "Fortaleza de Kaer Morhen", "dest": "public/assets/guild/banners/kaer-morhen.jpg"},
    12: {"type": "TITLE", "name": "Viajantes do Fim dos Tempos"},
    13: {"type": "EMBLEM", "name": "Selo dos Belmonts & Alucard", "dest": "public/assets/guild/emblems/castlevania-seal.png"},
    14: {"type": "TITLE", "name": "Herdeiros da Primeira Chama"},
    15: {"type": "MASCOT", "name": "Chocobo Dourado Mecha", "dest": "public/assets/guild/mascots/mecha-chocobo.webm", "dest_png": "public/assets/guild/mascots/mecha-chocobo.png"},
    16: {"type": "TITLE", "name": "Guardiões de Midgard"},
    17: {"type": "EMBLEM", "name": "Insígnia dos Spartanos de Reach", "dest": "public/assets/guild/emblems/spartan-reach.png"},
    18: {"type": "BANNER", "name": "Santuário de Tsushima ao Luar", "dest": "public/assets/guild/banners/tsushima-shrine.jpg"},
    19: {"type": "MASCOT", "name": "Filhote de Dragão de Alduin", "dest": "public/assets/guild/mascots/alduin-dragon.webm", "dest_png": "public/assets/guild/mascots/alduin-dragon.png"},
    20: {"type": "TITLE", "name": "Desbravadores do Oeste Selvagem"},
    21: {"type": "BANNER", "name": "A Cidadela dos Espaços Profundos", "dest": "public/assets/guild/banners/citadel-station.jpg"},
    22: {"type": "EMBLEM", "name": "Vaso de Alma & Ferrão Puro", "dest": "public/assets/guild/emblems/hollow-knight.png"},
    23: {"type": "TITLE", "name": "Testadores da Aperture Science"},
    24: {"type": "BANNER", "name": "A Árvore Sagrada do Cosmos", "dest": "public/assets/guild/banners/erdtree-cosmos.jpg"},
    25: {"type": "MASCOT", "name": "Luna Lovegood", "dest": "public/assets/guild/mascots/luna-lovegood.webm", "dest_png": "public/assets/guild/mascots/luna-lovegood.png"},
}

INBOX_DIR = "public/assets/guild/_inbox"

def find_input_file(specified_path: str = None, level_type: str = "EMBLEM"):
    if specified_path:
        if os.path.exists(specified_path):
            return specified_path
        print(f"❌ Arquivo especificado não encontrado: {specified_path}")
        sys.exit(1)

    # 1. Search inside public/assets/guild/_inbox/
    if os.path.exists(INBOX_DIR):
        candidates = [
            os.path.join(INBOX_DIR, f)
            for f in os.listdir(INBOX_DIR)
            if not f.startswith(".") and f.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".mp4", ".mov", ".webm"))
        ]
        if candidates:
            candidates.sort(key=lambda x: os.path.getmtime(x), reverse=True)
            return candidates[0]

    # 2. Search in target folder for newly dropped raw files (e.g. Midjourney files with long names)
    type_subfolders = {
        "EMBLEM": "public/assets/guild/emblems",
        "BANNER": "public/assets/guild/banners",
        "MASCOT": "public/assets/guild/mascots",
    }
    subfolder = type_subfolders.get(level_type, "public/assets/guild")
    if os.path.exists(subfolder):
        candidates = [
            os.path.join(subfolder, f)
            for f in os.listdir(subfolder)
            if (f.startswith("u819") or "midjourney" in f.lower() or len(f) > 40)
            and f.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".mp4", ".mov", ".webm"))
        ]
        if candidates:
            candidates.sort(key=lambda x: os.path.getmtime(x), reverse=True)
            return candidates[0]

    # 3. Search in user's Downloads folder for recent files (last 6 hours)
    import time
    downloads_dir = os.path.join(os.path.expanduser("~"), "Downloads")
    if os.path.exists(downloads_dir):
        cutoff = time.time() - 6 * 3600
        candidates = [
            os.path.join(downloads_dir, f)
            for f in os.listdir(downloads_dir)
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".mp4", ".mov", ".webm"))
            and os.path.getmtime(os.path.join(downloads_dir, f)) > cutoff
        ]
        if candidates:
            candidates.sort(key=lambda x: os.path.getmtime(x), reverse=True)
            return candidates[0]

    return None

def process_emblem(input_file: str, dest_file: str):
    print(f"⚙️ Processando Brasão com rembg (Remoção de fundo por IA)...")
    from rembg import remove

    os.makedirs(os.path.dirname(dest_file), exist_ok=True)
    img = Image.open(input_file)
    clean_img = remove(img)
    clean_img.save(dest_file, "PNG")
    print(f"✅ Brasão transparente salvo com sucesso em: {dest_file}")

def process_banner(input_file: str, dest_file: str):
    print(f"⚙️ Processando Banner Panorâmico (Proporção 4:1 / 1600x400 JPG)...")
    os.makedirs(os.path.dirname(dest_file), exist_ok=True)

    img = Image.open(input_file).convert("RGB")
    orig_w, orig_h = img.size
    target_ratio = 4.0 / 1.0  # 4:1

    # Crop to 4:1 center
    current_ratio = orig_w / orig_h
    if current_ratio > target_ratio:
        # Too wide -> crop width
        new_w = int(orig_h * target_ratio)
        left = (orig_w - new_w) // 2
        img = img.crop((left, 0, left + new_w, orig_h))
    else:
        # Too tall -> crop height from center
        new_h = int(orig_w / target_ratio)
        top = (orig_h - new_h) // 2
        img = img.crop((0, top, orig_w, top + new_h))

    # Resize to standard 1600x400 HD
    img = img.resize((1600, 400), Image.Resampling.LANCZOS)
    img.save(dest_file, "JPEG", quality=92, optimize=True)
    print(f"✅ Banner 4:1 otimizado salvo em: {dest_file}")

def process_mascot(input_file: str, dest_webm: str, dest_png: str, name_slug: str):
    ext = os.path.splitext(input_file)[1].lower()
    os.makedirs(os.path.dirname(dest_png), exist_ok=True)

    if ext in [".mp4", ".mov", ".webm"]:
        print(f"⚙️ Detectado vídeo animado de mascote. Executando processador de Chroma Key...")
        script_path = "scratch/process_green_screen.py"
        if os.path.exists(script_path):
            import subprocess
            subprocess.run([sys.executable, script_path, input_file, name_slug], check=True)
            print(f"✅ Mascote animado processado com sucesso!")
            return
        else:
            print(f"⚠️ Script {script_path} não encontrado, extraindo frame PNG estático com rembg...")

    print(f"⚙️ Processando Mascote PNG estático com rembg...")
    from rembg import remove
    img = Image.open(input_file)
    clean = remove(img)
    clean.save(dest_png, "PNG")
    print(f"✅ Mascote PNG transparente salvo em: {dest_png}")

def update_code_and_docs(level: int, info: dict):
    # 1. Update src/lib/constants/guild-rewards.ts
    const_file = "src/lib/constants/guild-rewards.ts"
    if os.path.exists(const_file) and "dest" in info:
        dest_path = info["dest"]
        dest_png = info.get("dest_png")
        if dest_png and os.path.exists(dest_png) and not os.path.exists(dest_path):
            chosen = dest_png
        else:
            chosen = dest_path
        asset_url = "/" + chosen.replace("\\", "/").replace("public/", "")

        with open(const_file, "r", encoding="utf-8") as f:
            code = f.read()

        match = re.search(rf"(id:\s*['\"]guild-\w+-{level}['\"][\s\S]*?)(}})", code)
        if match:
            block = match.group(1)
            if "assetUrl:" in block:
                new_block = re.sub(r"assetUrl:\s*['\"][^'\"]+['\"],?", f"assetUrl: '{asset_url}',", block)
                new_code = code.replace(block, new_block, 1)
            else:
                new_block = block + f"  assetUrl: '{asset_url}',\n  "
                new_code = code.replace(block, new_block, 1)

            with open(const_file, "w", encoding="utf-8") as f:
                f.write(new_code)
            print(f"📝 Atualizado assetUrl para '{asset_url}' no arquivo {const_file}")
        else:
            print(f"⚠️ Não foi possível localizar o bloco do nível {level} em {const_file}")

    # 2. Update GUILD_REWARDS_25_LEVELS.md
    doc_file = "GUILD_REWARDS_25_LEVELS.md"
    if os.path.exists(doc_file):
        with open(doc_file, "r", encoding="utf-8") as f:
            doc = f.read()

        lvl_str = f"{level:02d}"
        pattern = rf"(###\s*(?:🛡️|🐾|🖼️|📜)\s*NÍVEL\s*{lvl_str}\s*•\s*)([^\n\-]+?)(?:\s*-\s*DONE)?\n"
        if re.search(pattern, doc):
            new_doc = re.sub(pattern, rf"\1\2 - DONE\n", doc, count=1)
            with open(doc_file, "w", encoding="utf-8") as f:
                f.write(new_doc)
            print(f"📝 Nível {lvl_str} marcado como DONE em {doc_file}")
        else:
            print(f"⚠️ Não foi possível localizar o cabeçalho do nível {lvl_str} em {doc_file}")

def main():
    if len(sys.argv) < 2:
        print("❌ Uso: python scripts/process_guild_asset.py <nivel_1_a_25> [caminho_do_arquivo]")
        sys.exit(1)

    try:
        level = int(sys.argv[1])
    except ValueError:
        print("❌ O nível deve ser um número inteiro de 1 a 25.")
        sys.exit(1)

    if level not in GUILD_LEVELS:
        print(f"❌ Nível {level} inválido. Deve ser entre 1 e 25.")
        sys.exit(1)

    info = GUILD_LEVELS[level]
    ltype = info["type"]
    lname = info["name"]
    print(f"\n==========================================")
    print(f"🏆 Processador de Recompensas da Guilda")
    print(f"Nível {level:02d}: {lname} [{ltype}]")
    print(f"==========================================\n")

    if ltype == "TITLE":
        print(f"ℹ️ O Nível {level} é um TÍTULO textual. Não requer imagem nem processamento.")
        update_code_and_docs(level, info)
        sys.exit(0)

    # Find file
    input_file = sys.argv[2] if len(sys.argv) > 2 else find_input_file(level_type=ltype)
    if not input_file:
        print(f"❌ Nenhum arquivo encontrado para processar!")
        print(f"👉 Soluções:")
        print(f"   1. Cole a imagem em: {INBOX_DIR}/ e rode novamente.")
        print(f"   2. Ou passe o caminho direto: python scripts/process_guild_asset.py {level} caminho/da/imagem.png")
        sys.exit(1)

    print(f"📥 Arquivo de entrada localizado: {input_file}")

    if ltype == "EMBLEM":
        dest = info["dest"]
        process_emblem(input_file, dest)
    elif ltype == "BANNER":
        dest = info["dest"]
        process_banner(input_file, dest)
    elif ltype == "MASCOT":
        slug = Path(info["dest"]).stem
        dest_webm = info.get("dest")
        dest_png = info.get("dest_png", f"public/assets/guild/mascots/{slug}.png")
        process_mascot(input_file, dest_webm, dest_png, slug)

    # If raw file was in _inbox or subfolder, remove it to keep clean
    if "_inbox" in input_file or (os.path.basename(input_file).startswith("u819") and os.path.exists(input_file)):
        try:
            os.remove(input_file)
            print(f"🧹 Arquivo bruto temporário removido de {input_file}")
        except Exception:
            pass

    # Update code & docs
    update_code_and_docs(level, info)
    print(f"\n✨ Tudo pronto! O asset do Nível {level:02d} ({lname}) está configurado e pronto para uso no localhost:3000!\n")

if __name__ == "__main__":
    os.makedirs(INBOX_DIR, exist_ok=True)
    main()

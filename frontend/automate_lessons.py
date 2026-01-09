import os, re

KEY_PHRASES = [
    "Hermetic Law:", "Chakra:", "Frequency Anchor:", "Element:",
    "Access Point:", "Opening Breathwork:", "Core Understanding:",
    "Ritual:", "Journal Worksheet:", "Mantra:", "Core Spell:",
    "Breath Rites:", "Closing Words:"
]

BREATHWORK_RE = re.compile(
    r'(?:→?\s*)(Inhale|Hold|Exhale|Pause)\s*(?:\((\d+)\)|(\d+))\s*:?',
    re.IGNORECASE
)

def bold_key_phrases(line: str) -> str:
    for phrase in KEY_PHRASES:
        line = re.sub(rf'({re.escape(phrase)})', r'**\1**', line, flags=re.I)
    return BREATHWORK_RE.sub(lambda m: f'**{m.group(0)}**', line)

def format_lesson(text: str) -> str:
    out = []
    for raw in text.splitlines():
        stripped = raw.strip()
        if stripped.upper().startswith("MODULE"):
            out.append(f"# **{stripped}**")
        elif stripped.upper().startswith("TIER"):
            out.append(f"### **{stripped}**")
        else:
            out.append(bold_key_phrases(raw))
    return "\n".join(out)

def process_folder(src: str, dst: str) -> None:
    os.makedirs(src, exist_ok=True)
    os.makedirs(dst, exist_ok=True)
    for fname in os.listdir(src):
        if fname.endswith(".txt"):
            with open(os.path.join(src, fname), "r", encoding="utf-8") as f:
                out = format_lesson(f.read())
            with open(os.path.join(dst, fname.replace(".txt", ".md")), "w", encoding="utf-8") as f:
                f.write(out)
    print(f"Processed all lessons in {src} → {dst}")

if __name__ == "__main__":

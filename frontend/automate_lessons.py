import os, re

KEY_PHRASES = [
    "Hermetic Law:", "Chakra:", "Frequency Anchor:", "Element:",
    "Access Point:", "Opening Breath work:", "Opening Breathwork:", "Core Understanding:",
    "Ritual:", "Journal Worksheet:", "Mantra:", "Core Spell:",
    "Breath Rites:", "Closing Words:"
]

# Metadata labels that should each be on their own line
METADATA_LABELS = ["Hermetic Law:", "Chakra:", "Frequency Anchor:", "Element:", "Access Point:"]
SECTION_LABELS = [
    *METADATA_LABELS,
    "Opening Breath work:",
    "Opening Breathwork:",
    "Core Understanding:",
    "Ritual:",
    "Journal Worksheet:",
    "Mantra:",
    "Core Spell:",
    "Breath Rites:",
    "Closing Words:",
]

SOURCE_FILE_MAP = {
    "module1_initiate.txt": "module1_initiate.md",
    "module2_apprentice.txt.txt": "module2_apprentice.md",
    "module3_adept.txt": "module3_adept.md",
}

BREATHWORK_RE = re.compile(
    r'(?:→?\s*)(Inhale|Hold|Exhale|Pause)\s*(?:\((\d+)\)|(\d+))\s*:?',
    re.IGNORECASE
)

# Split combined breath instructions onto separate lines (e.g. "→ Hold... → Exhale" → two lines)
BREATH_SPLIT_RE = re.compile(
    r'(→\s*(?:Inhale|Hold|Exhale|Pause)\s*\(\d+\)\s*:[^→]+?)(?=\s*→\s*(?:Inhale|Hold|Exhale|Pause))',
    re.IGNORECASE
)


def cleanup_line(line: str) -> str:
    """Collapse excessive whitespace and fix common corruption."""
    # Replace nbsp with space, collapse 2+ spaces/tabs to single space
    line = line.replace("\u00a0", " ")
    line = re.sub(r"[ \t]+", " ", line)
    return line.strip()


def normalize_text(text: str) -> str:
    """Normalize broken separators before line-by-line formatting."""
    return (
        text.replace("\ufeff", "")
        .replace("\u00a0", " ")
        .replace("\u2028", "\n")
        .replace("\u2029", "\n")
        .replace("\r\n", "\n")
        .replace("\r", "\n")
    )


def split_inline_labels(line: str) -> str:
    """Split section labels when they appear mid-line."""
    label_pattern = "|".join(re.escape(label) for label in SECTION_LABELS)
    return re.sub(rf"\s+(?=(?:{label_pattern}))", "\n", line)


def split_metadata_line(line: str) -> list[str]:
    """Split a line that has multiple metadata items (Hermetic Law, Chakra, etc.) onto separate lines."""
    if not any(label in line for label in METADATA_LABELS):
        return [line]
    parts = []
    for label in METADATA_LABELS:
        idx = line.find(label)
        if idx >= 0:
            # Include from this label to the next label (or end)
            start = idx
            rest = line[start:]
            # Find where next label starts
            end = len(rest)
            for other in METADATA_LABELS:
                if other == label:
                    continue
                pos = rest.find(other)
                if 0 <= pos < end:
                    end = pos
            chunk = rest[:end].strip()
            if chunk:
                parts.append(chunk)
    return parts if parts else [line]


def split_module_tier_line(line: str) -> list[str]:
    """If MODULE and TIER are on same line, split so TIER is on its own line."""
    # Match "MODULE N — TITLE ... TIER N — THE INITIATE/APPRENTICE/ADEPT" (with possible junk between)
    m = re.search(
        r"^(MODULE\s+\d+\s*[—\-:].*?)\s+(TIER\s+\d+\s*[—\-:]\s*THE\s+(?:INITIATE|APPRENTICE|ADEPT))\s*(.*)$",
        line,
        re.I,
    )
    if m:
        module_part, tier_part, rest = m.group(1), m.group(2), m.group(3).strip()
        out = [module_part]
        if tier_part:
            out.append(tier_part)
        if rest and not rest.upper().startswith("MODULE"):
            out.append(rest)
        return out
    return [line]


def split_breath_instructions(line: str) -> str:
    """If a line has multiple breath instructions, split onto separate lines.
    Also splits when intro text is on same line (e.g. 'Sit upright. → Inhale' or 'Palms rest. → Inhale')."""
    # Split intro text from breath instruction (e.g. "Palms rest downward. → Inhale" -> newline before →)
    line = re.sub(r'([.!])\s*→', r'\1\n→', line)
    if '→' not in line or line.count('→') < 2:
        return line
    # Split before each → that starts Inhale/Hold/Exhale/Pause (except the first)
    parts = re.split(r'\s+(?=→\s*(?:Inhale|Hold|Exhale|Pause)\s*\()', line, flags=re.I)
    if len(parts) > 1:
        return '\n'.join(p.strip() for p in parts if p.strip())
    return line

def bold_key_phrases(line: str) -> str:
    for phrase in KEY_PHRASES:
        line = re.sub(rf'({re.escape(phrase)})', r'**\1**', line, flags=re.I)
    return BREATHWORK_RE.sub(lambda m: f'**{m.group(0)}**', line)

def format_lesson(text: str) -> str:
    out = []
    for raw in normalize_text(text).splitlines():
        cleaned = cleanup_line(raw)
        if not cleaned:
            out.append("")
            continue
        for inline_block in split_inline_labels(cleaned).split("\n"):
            inline_block = cleanup_line(inline_block)
            if not inline_block:
                out.append("")
                continue
            # Split MODULE + TIER if concatenated
            for block in split_module_tier_line(inline_block):
                block = block.strip()
                if not block:
                    continue
                if block.upper().startswith("MODULE"):
                    out.append(f"# **{block}**")
                elif block.upper().startswith("TIER"):
                    out.append(f"### **{block}**")
                elif any(block.startswith(l) for l in METADATA_LABELS):
                    # Split metadata (Hermetic Law, Chakra, etc.) onto separate lines
                    for meta in split_metadata_line(block):
                        if meta.strip():
                            out.append(bold_key_phrases(meta))
                else:
                    # Split lines that have multiple breath instructions
                    for part in split_breath_instructions(block).split("\n"):
                        part = cleanup_line(part)
                        if part:
                            out.append(bold_key_phrases(part))
                        else:
                            out.append("")
    return "\n".join(out)

def process_folder(src: str, dst: str) -> None:
    os.makedirs(src, exist_ok=True)
    os.makedirs(dst, exist_ok=True)
    for source_name, output_name in SOURCE_FILE_MAP.items():
        source_path = os.path.join(src, source_name)
        if not os.path.exists(source_path):
            continue
        with open(source_path, "r", encoding="utf-8") as f:
            out = format_lesson(f.read())
        with open(os.path.join(dst, output_name), "w", encoding="utf-8") as f:
            f.write(out)
    print(f"Processed all lessons in {src} → {dst}")

if __name__ == "__main__":
    process_folder("lessons_raw", "lessons_formatted")

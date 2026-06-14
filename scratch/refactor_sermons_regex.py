import re

file_path = "src/pages/sermons.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Pattern to extract meta-tags-section
pattern = re.compile(
    r'(<div class="meta-tags-section">.*?</div>)(\s*</div>\s*</div>\s*<div class="series-main">)',
    re.DOTALL
)

cards = content.split('<div class="series-card"')
header_part = cards[0]
new_cards = []

for card in cards[1:]:
    match = pattern.search(card)
    if not match:
        new_cards.append(card)
        continue
        
    tags_section = match.group(1)
    group2 = match.group(2)
    
    card_without_tags = card.replace(match.group(0), group2)
    
    info_idx = card_without_tags.find('<div class="series-info">')
    if info_idx == -1:
        new_cards.append(card)
        continue
        
    p_idx = card_without_tags.find('<p>', info_idx)
    p_close_idx = card_without_tags.find('</p>', p_idx)
    if p_close_idx == -1:
        new_cards.append(card)
        continue
        
    insert_pos = p_close_idx + 4
    
    cleaned_tags = tags_section.strip()
    lines = cleaned_tags.split("\n")
    indented_lines = []
    for line in lines:
        indented_lines.append("                            " + line.strip())
    formatted_tags = "\n" + "\n".join(indented_lines) + "\n"
    
    new_card = card_without_tags[:insert_pos] + formatted_tags + card_without_tags[insert_pos:]
    new_cards.append(new_card)

# Properly rejoin with the split delimiter prepended to each card block
new_content = header_part + "".join(['<div class="series-card"' + c for c in new_cards])

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"Successfully refactored {len(new_cards)} cards.")

replacements = {
    "1:05:03": "65 წთ",
    "1:22:51": "82 წთ",
    "1:08:27": "68 წთ",
    "1:04:37": "64 წთ",
    "57:49": "57 წთ",
    "1:08:08": "68 წთ",
    "1:14:59": "74 წთ",
    "1:14:47": "74 წთ"
}

file_path = "src/pages/sermons.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace each duration string
for old_val, new_val in replacements.items():
    content = content.replace(f'<span class="episode-meta">{old_val}</span>', f'<span class="episode-meta">{new_val}</span>')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("HTML durations updated successfully.")

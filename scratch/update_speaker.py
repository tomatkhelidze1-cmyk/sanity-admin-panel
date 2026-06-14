file_path = "src/pages/sermons.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We only target the first card's episodes. Let's find the first series-card block
# and do the replacement only inside it to be safe, or just do it generally.
# Since the user said "იმავე ჩამონათვალში" (in the same list), let's target the first card.

cards = content.split('<div class="series-card"')
if len(cards) > 1:
    # cards[1] is the first card ("იგავები სამეფოს შესახებ")
    cards[1] = cards[1].replace(
        '<span class="episode-speaker">სპიკერი: პასტორი სპარტაკ ჭანკვეტაძე</span>',
        '<span class="episode-speaker">სპიკერი: სპარტაკ ჭანკვეტაძე</span>'
    )
    
new_content = '<div class="series-card"'.join(cards)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Speaker updated successfully in HTML first card.")

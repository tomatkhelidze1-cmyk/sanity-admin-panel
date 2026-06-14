import { getCliClient } from 'sanity/cli'

const shortenTitle = (title) => {
  const replacements = {
    "ღვთის სამეფო (იგავები სამეფოს შესახებ - ნაწილი 1-ლი) | 14 მაისი, 2023": "ღვთის სამეფო (ნაწილი 1-ლი)",
    "მთესველის იგავი (იგავები სამეფოს შესახებ - ნაწილი მე-2) | 21 მაისი, 2023 წელი": "მთესველის იგავი (ნაწილი მე-2)",
    "ხორბლისა და ღვარძლის იგავი (იგავები სამეფოს შესახებ - ნაწილი მე-3) | 28 მაისი. 2023 წელი": "ხორბლისა და ღვარძლის იგავი (ნაწილი მე-3)",
    "იგავი მდოგვის მარცვალზე (იგავები სამეფოს შესახებ - ნაწილი მე-4) | 4 ივნისი, 2023": "იგავი მდოგვის მარცვალზე (ნაწილი მე-4)",
    "საფუარის იგავი (იგავები სამეფოს შესახებ ნაწილი მე-5) | 18 ივნისი, 2023": "საფუარის იგავი (ნაწილი მე-5)",
    "მინდორში დაფარული საუნჯისა და ძვირფასი მარგალიტის იგავი (ნაწილი მე-6) | 25 ივნისი, 2023": "მინდორში დაფარული საუნჯისა და ძვირფასი მარგალიტის იგავი (ნაწილი მე-6)",
    "ბადის იგავი (იგავები სამეფოს შესახებ ნაწილი მე-7) | 9 ივლისი, 2023": "ბადის იგავი (ნაწილი მე-7)",
    "იგავი სახლის მეპატრონეზე (იგავები სამეფოს შესახებ, ნაწილი მე-8) | 16 ივლისი, 2023": "იგავი სახლის მეპატრონეზე (ნაწილი მე-8)"
  };
  return replacements[title] || title;
};

async function run() {
  const client = getCliClient();
  const docId = 'MDh7A306aO3hJzqrDuWQsX';
  
  console.log(`Fetching document: ${docId}`);
  const doc = await client.getDocument(docId);
  if (!doc) {
    throw new Error(`Document not found: ${docId}`);
  }

  console.log("Document fetched. Mapping episodes...");
  const updatedEpisodes = doc.episodes.map(ep => ({
    ...ep,
    title: shortenTitle(ep.title)
  }));

  console.log("Updating document in Sanity...");
  const result = await client.patch(docId).set({ episodes: updatedEpisodes }).commit();
  console.log("Document updated successfully!");
}

run().catch(err => {
  console.error("Failed to update titles:", err);
  process.exit(1);
});

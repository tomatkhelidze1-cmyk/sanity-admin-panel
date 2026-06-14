import { getCliClient } from 'sanity/cli'

const convertToMinutes = (timeStr) => {
  if (!timeStr) return "60 წთ";
  if (timeStr.includes("წთ")) return timeStr; // already converted
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return `${hours * 60 + minutes} წთ`;
  } else if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    return `${minutes} წთ`;
  }
  return "60 წთ";
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
    duration: convertToMinutes(ep.duration)
  }));

  console.log("Updating document in Sanity...");
  const result = await client.patch(docId).set({ episodes: updatedEpisodes }).commit();
  console.log("Document updated successfully!");
}

run().catch(err => {
  console.error("Failed to update durations:", err);
  process.exit(1);
});

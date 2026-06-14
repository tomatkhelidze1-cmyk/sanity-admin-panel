import { getCliClient } from 'sanity/cli'

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
    speaker: ep.speaker === 'პასტორი სპარტაკ ჭანკვეტაძე' ? 'სპარტაკ ჭანკვეტაძე' : ep.speaker
  }));

  console.log("Updating document in Sanity...");
  const result = await client.patch(docId).set({ episodes: updatedEpisodes }).commit();
  console.log("Document updated successfully!");
}

run().catch(err => {
  console.error("Failed to update speakers:", err);
  process.exit(1);
});

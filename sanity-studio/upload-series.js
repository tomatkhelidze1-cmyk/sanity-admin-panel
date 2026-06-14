import { getCliClient } from 'sanity/cli'
import fs from 'fs'
import path from 'path'

async function run() {
  const client = getCliClient()

  console.log("Reading playlist output...")
  const playlistPath = path.join(process.cwd(), '../scratch/playlist_output.json')
  const playlistData = JSON.parse(fs.readFileSync(playlistPath, 'utf8'))

  console.log(`Loaded ${playlistData.length} episodes.`)

  // 1. Fetch the thumbnail from YouTube
  const firstVideoId = '1U6VUElmP9U'
  let thumbnailUrl = `https://img.youtube.com/vi/${firstVideoId}/maxresdefault.jpg`
  console.log(`Downloading thumbnail from: ${thumbnailUrl}`)
  
  let res = await fetch(thumbnailUrl)
  if (!res.ok) {
    thumbnailUrl = `https://img.youtube.com/vi/${firstVideoId}/hqdefault.jpg`
    console.log(`maxresdefault failed, trying hqdefault: ${thumbnailUrl}`)
    res = await fetch(thumbnailUrl)
  }

  if (!res.ok) {
    throw new Error(`Failed to download thumbnail from YouTube: ${res.statusText}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // 2. Upload thumbnail as an image asset to Sanity
  console.log("Uploading thumbnail to Sanity...")
  const imageAsset = await client.assets.upload('image', buffer, {
    filename: `series-thumbnail-${firstVideoId}.jpg`,
    contentType: 'image/jpeg'
  })
  console.log(`Thumbnail uploaded successfully! Asset ID: ${imageAsset._id}`)

  // 3. Construct the sermonSeries document
  const sermonSeriesDoc = {
    _type: 'sermonSeries',
    title: 'იგავები სამეფოს შესახებ',
    subtitle: 'სწავლებათა სერია',
    category: 'biblical',
    thumbnailUrl: {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: imageAsset._id
      }
    },
    description: 'ღვთის სამეფო და მისი პრინციპები იესოს იგავებში. სწავლებათა სერია წარმოთქმულია პასტორი სპარტაკ ჭანკვეტაძის მიერ ქუთაისის სახარების რწმენის ეკლესიაში.',
    speaker: 'პასტორი სპარტაკ ჭანკვეტაძე',
    episodes: playlistData.map((ep, idx) => ({
      _key: `episode_${ep.videoId}_${idx}`,
      title: ep.title,
      speaker: 'პასტორი სპარტაკ ჭანკვეტაძე',
      youtubeUrl: `https://www.youtube.com/watch?v=${ep.videoId}`,
      duration: ep.duration || '1 საათი'
    }))
  }

  console.log("Creating sermonSeries document in Sanity...")
  const createdDoc = await client.create(sermonSeriesDoc)
  console.log("Successfully created sermonSeries document!")
  console.log("Document ID:", createdDoc._id)
}

run().catch(err => {
  console.error("Execution failed:", err)
  process.exit(1)
})

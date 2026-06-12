const PROJECT_ID = 'f9j6xr69';
const DATASET = 'production';
const API_VERSION = 'v2021-10-21';

const query = encodeURIComponent('*[_type == "siteContent"][0]{title, youtubeUrl, imageUrl}');
const url = `https://${PROJECT_ID}.apicdn.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${query}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log('Sanity response:', JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('Fetch error:', err);
  });

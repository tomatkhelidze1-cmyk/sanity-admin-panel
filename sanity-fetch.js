const PROJECT_ID = 'f9j6xr69';
const DATASET = 'production';
const API_VERSION = 'v2021-10-21';

function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function updatePageContent() {
  const groqQuery = `{
    "siteContent": *[_type == "siteContent"][0]{
      title,
      youtubeUrl,
      "imageUrl": imageUrl.asset->url,
      buildingSubtitle,
      buildingTitle,
      buildingText1,
      buildingText2,
      latestSermonUrl,
      youthCampVideoUrl,
      youthCampTitle,
      youthCampDesc1,
      youthCampDesc2,
      kidsCampVideoUrl,
      kidsCampTitle,
      kidsCampDesc1,
      kidsCampDesc2
    },
    "events": *[_type == "registrationEvent"] | order(_createdAt asc) {
      eventId,
      title,
      status,
      dateText,
      detailsText,
      description,
      "imageUrl": imageUrl.asset->url
    },
    "sermons": *[_type == "sermonSeries"] | order(_createdAt desc) {
      title,
      subtitle,
      category,
      "thumbnailUrl": thumbnailUrl.asset->url,
      description,
      speaker,
      episodes[] {
        title,
        speaker,
        youtubeUrl,
        duration
      }
    }
  }`;

  const url = `https://${PROJECT_ID}.apicdn.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(groqQuery)}`;

  fetch(url)
    .then(response => response.json())
    .then(async data => {
      if (data && data.result) {
        const { siteContent, events, sermons } = data.result;

        // Try to fetch the latest video from the YouTube playlist RSS feed
        let latestVideoId = null;
        try {
          const playlistId = 'PLC_n-dqgCYfWAb2CbwumDHPRApAkcP99A';
          const cacheBuster = Math.floor(Date.now() / 300000);
          const feedUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://www.youtube.com/feeds/videos.xml?playlist_id=' + playlistId + '&t=' + cacheBuster)}`;
          const rssRes = await fetch(feedUrl);
          if (rssRes.ok) {
            const rssData = await rssRes.json();
            if (rssData && rssData.items && rssData.items.length > 0) {
              // Find the video item with the latest pubDate
              const latestVideo = rssData.items.reduce((latest, item) => {
                return (new Date(item.pubDate) > new Date(latest.pubDate)) ? item : latest;
              }, rssData.items[0]);
              
              if (latestVideo && latestVideo.guid) {
                const parts = latestVideo.guid.split(':');
                if (parts.length >= 3) {
                  latestVideoId = parts[2];
                } else {
                  latestVideoId = getYouTubeId(latestVideo.link);
                }
              }
            }
          }
        } catch (rssError) {
          console.warn('Failed to fetch latest YouTube playlist video, falling back to Sanity config:', rssError);
        }

        // 1. UPDATE SITECONTENT PROPERTIES
        if (siteContent) {
          // Main Title
          if (siteContent.title) {
            const titleEl = document.getElementById('sanity-main-title');
            if (titleEl) titleEl.textContent = siteContent.title;
          }

          // Main Video
          if (siteContent.youtubeUrl) {
            const videoId = getYouTubeId(siteContent.youtubeUrl);
            const iframeEl = document.getElementById('sanity-video-iframe');
            if (videoId && iframeEl) {
              iframeEl.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&rel=0&modestbranding=1&disablekb=1&fs=0&iv_load_policy=3&showinfo=0&vq=hd1080`;
            }
          }

          // Main Image (Background of Hero Section)
          if (siteContent.imageUrl) {
            const imgEl = document.getElementById('sanity-main-image');
            if (imgEl) imgEl.style.backgroundImage = `url('${siteContent.imageUrl}')`;
          }

          // Building Section Texts
          if (siteContent.buildingSubtitle) {
            const el = document.getElementById('sanity-building-subtitle');
            if (el) el.textContent = siteContent.buildingSubtitle;
          }
          if (siteContent.buildingTitle) {
            const el = document.getElementById('sanity-building-title');
            if (el) el.textContent = siteContent.buildingTitle;
          }
          if (siteContent.buildingText1) {
            const el = document.getElementById('sanity-building-text1');
            if (el) el.textContent = siteContent.buildingText1;
          }
          if (siteContent.buildingText2) {
            const el = document.getElementById('sanity-building-text2');
            if (el) el.textContent = siteContent.buildingText2;
          }

          // Latest Sermon Video ID update (uses YouTube feed if available, otherwise falls back to Sanity)
          let sermonId = latestVideoId;
          if (!sermonId && siteContent.latestSermonUrl) {
            sermonId = getYouTubeId(siteContent.latestSermonUrl);
          }
          if (sermonId) {
            const sermonEls = document.querySelectorAll('#sanity-latest-sermon');
            sermonEls.forEach(el => {
              el.setAttribute('data-video-id', sermonId);
              el.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.2)), url('https://img.youtube.com/vi/${sermonId}/hqdefault.jpg')`;
            });
          }

          // Main Sermon Player Initial Video
          const mainPlayer = document.getElementById('mainSermonPlayer');
          if (mainPlayer) {
            let initialVideoId = sermonId;
            if (!initialVideoId && sermons && sermons.length > 0) {
              const firstEpisode = sermons[0]?.episodes?.[0];
              if (firstEpisode) {
                initialVideoId = getYouTubeId(firstEpisode.youtubeUrl);
              }
            }
            if (initialVideoId) {
              mainPlayer.src = `https://www.youtube-nocookie.com/embed/${initialVideoId}?rel=0&modestbranding=1&vq=hd1080`;
            }
          }

          // Youth Camp (Youth Page)
          if (siteContent.youthCampVideoUrl) {
            const campVideoId = getYouTubeId(siteContent.youthCampVideoUrl);
            const campVideoEl = document.getElementById('sanity-youth-camp-video');
            if (campVideoId && campVideoEl) {
              campVideoEl.setAttribute('data-video-id', campVideoId);
              campVideoEl.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('https://img.youtube.com/vi/${campVideoId}/hqdefault.jpg')`;
            }
          }
          if (siteContent.youthCampTitle) {
            const el = document.getElementById('sanity-youth-camp-title');
            if (el) el.textContent = siteContent.youthCampTitle;
          }
          if (siteContent.youthCampDesc1) {
            const el = document.getElementById('sanity-youth-camp-desc1');
            if (el) el.textContent = siteContent.youthCampDesc1;
          }
          if (siteContent.youthCampDesc2) {
            const el = document.getElementById('sanity-youth-camp-desc2');
            if (el) el.textContent = siteContent.youthCampDesc2;
          }

          // Kids Camp (Kids Page)
          if (siteContent.kidsCampVideoUrl) {
            const kidsVideoId = getYouTubeId(siteContent.kidsCampVideoUrl);
            const kidsVideoEl = document.getElementById('sanity-kids-camp-video');
            if (kidsVideoId && kidsVideoEl) {
              kidsVideoEl.setAttribute('data-video-id', kidsVideoId);
              kidsVideoEl.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('https://img.youtube.com/vi/${kidsVideoId}/hqdefault.jpg')`;
            }
          }
          if (siteContent.kidsCampTitle) {
            const el = document.getElementById('sanity-kids-camp-title');
            if (el) el.textContent = siteContent.kidsCampTitle;
          }
          if (siteContent.kidsCampDesc1) {
            const el = document.getElementById('sanity-kids-camp-desc1');
            if (el) el.textContent = siteContent.kidsCampDesc1;
          }
          if (siteContent.kidsCampDesc2) {
            const el = document.getElementById('sanity-kids-camp-desc2');
            if (el) el.textContent = siteContent.kidsCampDesc2;
          }
        }

        // 2. UPDATE EVENTS (REGISTRATION PAGE)
        if (events && events.length > 0) {
          events.forEach(evt => {
            const card = document.querySelector(`.event-card[data-event="${evt.eventId}"]`);
            if (card) {
              const isActive = evt.status === 'active';
              const statusText = isActive ? 'ღიაა' : 'დასრულდა';
              const statusClassToRemove = isActive ? 'status-closed' : 'status-active';
              const statusClassToAdd = isActive ? 'status-active' : 'status-closed';
              const buttonText = isActive ? 'რეგისტრაციის გავლა' : 'რეგისტრაცია დასრულდა';
              const metaIconClass = evt.eventId === 'conference' ? 'fa-location-dot' : 'fa-users';

              // Update card classes
              card.classList.remove(statusClassToRemove);
              card.classList.add(statusClassToAdd);

              // Update status badge
              const badge = card.querySelector('.event-status-badge');
              if (badge) badge.textContent = statusText;

              // Update image
              const img = card.querySelector('.event-image-wrap img');
              if (img && evt.imageUrl) {
                img.src = evt.imageUrl;
              }

              // Update title
              const title = card.querySelector('.event-title');
              if (title && evt.title) title.textContent = evt.title;

              // Update metadata rows
              const metas = card.querySelectorAll('.event-meta');
              if (metas.length >= 2) {
                if (evt.dateText) {
                  metas[0].innerHTML = `<i class="fa-regular fa-calendar"></i> ${evt.dateText}`;
                }
                if (evt.detailsText) {
                  metas[1].innerHTML = `<i class="fa-solid ${metaIconClass}"></i> ${evt.detailsText}`;
                }
              }

              // Update description
              const desc = card.querySelector('.event-description');
              if (desc && evt.description) desc.textContent = evt.description;

              // Update button
              const button = card.querySelector('.btn-register-cta');
              if (button) {
                button.textContent = buttonText;
                if (isActive) {
                  button.removeAttribute('disabled');
                } else {
                  button.setAttribute('disabled', 'true');
                }
              }
            }
          });
        }

        // 3. UPDATE SERMONS (SERMONS PAGE)
        if (sermons && sermons.length > 0) {
          const seriesGrid = document.querySelector('.series-grid');
          if (seriesGrid) {
            let sermonsHtml = '';
            sermons.forEach(series => {
              let episodesHtml = '';
              const episodeCount = series.episodes ? series.episodes.length : 0;
              
              if (series.episodes) {
                series.episodes.forEach((ep, index) => {
                  const epVideoId = getYouTubeId(ep.youtubeUrl);
                  const isPlayingClass = (index === 0) ? 'is-playing' : '';
                  episodesHtml += `
                    <div class="episode-item ${isPlayingClass}" data-video-id="${epVideoId || ''}">
                        <div class="episode-title-block">
                            <span class="episode-title"><i class="fa-solid fa-play"></i> ${ep.title}</span>
                            <span class="episode-speaker">სპიკერი: ${ep.speaker}</span>
                        </div>
                        <span class="episode-meta">${ep.duration}</span>
                    </div>
                  `;
                });
              }

              sermonsHtml += `
                <div class="series-card" data-category="${series.category}">
                    <div class="series-thumbnail">
                        <div class="thumbnail-img-wrap">
                            <img src="${series.thumbnailUrl || 'https://picsum.photos/600/400'}" alt="${series.title}" onerror="this.onerror=null; this.src='https://picsum.photos/600/400';">
                        </div>
                        <div class="series-meta-details">
                            <div class="meta-description-section">
                                <span class="meta-label">სერიის შესახებ</span>
                                <p class="meta-description-text">${series.description}</p>
                            </div>
                            <div class="meta-tags-section">
                                <div class="meta-tag">
                                    <i class="fa-solid fa-folder"></i>
                                    <div>კატეგორია: ${
                                      series.category === 'spiritual' ? 'სულიერი ზრდა' :
                                      series.category === 'family' ? 'ოჯახი & ცხოვრება' : 'ბიბლიური სწავლებები'
                                    }</div>
                                </div>
                                <div class="meta-tag">
                                    <i class="fa-solid fa-user"></i>
                                    <div>სპიკერი: ${series.speaker}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="series-main">
                        <div class="series-header">
                            <div class="series-info">
                                <h3>${series.title}</h3>
                                <p>${series.subtitle}</p>
                            </div>
                            <div style="display: flex; align-items: center;">
                                <span class="series-badge">${episodeCount} ეპიზოდი</span>
                                <i class="fa-solid fa-chevron-down series-icon"></i>
                            </div>
                        </div>
                        <div class="episodes-panel">
                            <div class="episodes-list">
                                ${episodesHtml}
                            </div>
                        </div>
                    </div>
                </div>
              `;
            });
            seriesGrid.innerHTML = sermonsHtml;
          }
        }
      }
    })
    .catch(error => console.error('Error fetching data from Sanity:', error));
}

document.addEventListener('DOMContentLoaded', updatePageContent);

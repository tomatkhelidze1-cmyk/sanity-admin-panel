import urllib.request
import re
import json

url = "https://www.youtube.com/playlist?list=PLC_n-dqgCYfWLQiKdJHCd5u1MykCJMJJk"
req = urllib.request.Request(
    url, 
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
)

try:
    print("Fetching URL...")
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
    
    print("Searching for ytInitialData...")
    pattern = re.compile(r'ytInitialData\s*=\s*({.*?});', re.DOTALL)
    match = pattern.search(html)
    if not match:
        pattern = re.compile(r'window\["ytInitialData"\]\s*=\s*({.*?});', re.DOTALL)
        match = pattern.search(html)
        
    if match:
        data = json.loads(match.group(1))
        # Let's drill down into contents
        try:
            tabs = data['contents']['twoColumnBrowseResultsRenderer']['tabs']
            tab0 = tabs[0]['tabRenderer']
            section_list = tab0['content']['sectionListRenderer']['contents']
            item_section = section_list[0]['itemSectionRenderer']['contents']
            
            print(f"Found itemSectionRenderer contents: {len(item_section)} items")
            
            episodes = []
            for i, item in enumerate(item_section):
                if 'lockupViewModel' in item:
                    lvm = item['lockupViewModel']
                    
                    # 1. VideoId
                    video_id = None
                    try:
                        video_id = lvm['rendererContext']['commandContext']['onTap']['innertubeCommand']['watchEndpoint']['videoId']
                    except KeyError:
                        pass
                    
                    # 2. Title
                    title = None
                    try:
                        title = lvm['metadata']['lockupMetadataViewModel']['title']['content']
                    except KeyError:
                        pass
                        
                    # 3. Duration
                    duration = None
                    try:
                        overlays = lvm['contentImage']['thumbnailViewModel']['overlays']
                        for overlay in overlays:
                            if 'thumbnailBottomOverlayViewModel' in overlay:
                                badges = overlay['thumbnailBottomOverlayViewModel']['badges']
                                for badge in badges:
                                    if 'thumbnailBadgeViewModel' in badge:
                                        duration = badge['thumbnailBadgeViewModel']['text']
                    except (KeyError, TypeError):
                        pass
                        
                    if video_id and title:
                        episodes.append({
                            'index': i,
                            'videoId': video_id,
                            'title': title,
                            'duration': duration
                        })
            
            print(f"Successfully parsed {len(episodes)} episodes.")
            
            # Save the full list first
            with open("scratch/playlist_output.json", "w", encoding="utf-8") as f:
                json.dump(episodes, f, indent=2, ensure_ascii=False)
            print("Wrote output to scratch/playlist_output.json")
                
        except Exception as drill_error:
            print("Error drilling down into JSON path:", str(drill_error))
    else:
        print("ytInitialData match not found.")
except Exception as e:
    print("Error:", str(e))

import os
import re
import shutil

# Paths
WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(WORKSPACE_DIR, 'templates')
SRC_DIR = os.path.join(WORKSPACE_DIR, 'src')
BACKUP_DIR = os.path.join(WORKSPACE_DIR, 'backup_original')

def backup_original_files():
    if os.path.exists(BACKUP_DIR):
        print("Backup directory already exists. Skipping backup to protect original version.")
        return
    
    os.makedirs(BACKUP_DIR)
    print("Backing up original HTML files to 'backup_original/'...")
    
    # Backup root index.html
    root_index = os.path.join(WORKSPACE_DIR, 'index.html')
    if os.path.isfile(root_index):
        shutil.copy2(root_index, os.path.join(BACKUP_DIR, 'index.html'))
        
    # Backup pages/*.html
    pages_dir = os.path.join(WORKSPACE_DIR, 'pages')
    backup_pages = os.path.join(BACKUP_DIR, 'pages')
    if os.path.exists(pages_dir):
        os.makedirs(backup_pages, exist_ok=True)
        for f in os.listdir(pages_dir):
            if f.endswith('.html'):
                shutil.copy2(os.path.join(pages_dir, f), os.path.join(backup_pages, f))
    print("Backup completed successfully.")

def migrate_original_to_src():
    # If src/ exists, we delete it to re-migrate from the pristine backup
    # to apply the improved splitter algorithm.
    if os.path.exists(SRC_DIR):
        print("Re-initializing 'src/' directory structure from backup...")
        shutil.rmtree(SRC_DIR)
        
    os.makedirs(SRC_DIR)
    os.makedirs(os.path.join(SRC_DIR, 'pages'))
    
    # 1. Migrate index.html from backup
    backup_index = os.path.join(BACKUP_DIR, 'index.html')
    if os.path.isfile(backup_index):
        print("Migrating index.html to src/index.html...")
        meta, blocks = split_html_file(backup_index)
        write_source_file(os.path.join(SRC_DIR, 'index.html'), meta, blocks)
        
    # 2. Migrate pages/*.html from backup
    backup_pages_dir = os.path.join(BACKUP_DIR, 'pages')
    if os.path.exists(backup_pages_dir):
        for f in os.listdir(backup_pages_dir):
            if f.endswith('.html'):
                print(f"Migrating pages/{f} to src/pages/{f}...")
                meta, blocks = split_html_file(os.path.join(backup_pages_dir, f))
                write_source_file(os.path.join(SRC_DIR, 'pages', f), meta, blocks)

def split_html_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()
        
    # 1. Extract Title
    title_match = re.search(r'<title>(.*?)</title>', html, re.DOTALL)
    title = title_match.group(1).strip() if title_match else ""
    
    # 2. Extract Description
    desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html, re.DOTALL)
    if not desc_match:
        desc_match = re.search(r'<meta\s+content=["\'](.*?)["\']\s+name=["\']description["\']', html, re.DOTALL)
    desc = desc_match.group(1).strip() if desc_match else ""
    
    # 3. Extract Extra Head (styles)
    head_match = re.search(r'<head>(.*?)</head>', html, re.DOTALL)
    extra_head = ""
    if head_match:
        head_content = head_match.group(1)
        style_matches = re.findall(r'<style\b[^>]*>(.*?)</style>', head_content, re.DOTALL)
        if style_matches:
            extra_head = "\n".join([f"<style>{s.strip()}</style>" for s in style_matches if s.strip()])
            
    # Now we strip standard elements to isolate page unique body content
    body_content = html
    
    # Strip <!DOCTYPE html>, <html>, </html>, <head>...</head>, <body>, </body>
    body_content = re.sub(r'<!DOCTYPE html>', '', body_content, flags=re.IGNORECASE)
    body_content = re.sub(r'<html\b[^>]*>', '', body_content, flags=re.IGNORECASE)
    body_content = re.sub(r'</html>', '', body_content, flags=re.IGNORECASE)
    body_content = re.sub(r'<head\b[^>]*>.*?</head>', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r'<body\b[^>]*>', '', body_content, flags=re.IGNORECASE)
    body_content = re.sub(r'</body>', '', body_content, flags=re.IGNORECASE)
    
    # Strip main header/navbar
    body_content = re.sub(r'<header class="main-header"[^>]*>.*?</header>', '', body_content, flags=re.DOTALL)
    
    # Strip contact section if present
    has_contact = '<section class="contact-section"' in html
    body_content = re.sub(r'<section class="contact-section"[^>]*>.*?</section>', '', body_content, flags=re.DOTALL)
    
    # Strip minimal copyright strip
    body_content = re.sub(r'<div class="minimal-copyright-strip"[^>]*>.*?</div>', '', body_content, flags=re.DOTALL)
    
    # Strip back to top button
    body_content = re.sub(r'<button class="back-to-top"[^>]*>.*?</button>', '', body_content, flags=re.DOTALL)
    
    # Strip script.js import
    body_content = re.sub(r'<script\s+src=["\'][^"\']*script\.js["\']\s*></script>', '', body_content, flags=re.IGNORECASE)
    
    # Extract page-specific inline script tags
    extra_scripts_list = []
    for match in re.finditer(r'<script\b([^>]*)>(.*?)</script>', body_content, re.DOTALL):
        attrs = match.group(1)
        body = match.group(2)
        if 'src=' not in attrs:
            extra_scripts_list.append(f"<script{attrs}>{body}</script>")
            
    # Strip page-specific inline scripts from body_content
    body_content = re.sub(r'<script\b[^>]*>.*?</script>', '', body_content, flags=re.DOTALL)
    
    extra_scripts = "\n".join(extra_scripts_list) if extra_scripts_list else ""
    
    meta = {
        'title': title,
        'description': desc,
        'has_contact': 'true' if has_contact else 'false'
    }
    
    blocks = {
        'content': body_content.strip()
    }
    if extra_head:
        blocks['extra_head'] = extra_head
    if extra_scripts:
        blocks['extra_scripts'] = extra_scripts
        
    return meta, blocks

def write_source_file(output_path, meta, blocks):
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("<!--\n")
        for k, v in meta.items():
            f.write(f"{k}: {v}\n")
        f.write("-->\n\n")
        
        if 'extra_head' in blocks and blocks['extra_head'].strip():
            f.write("<!-- block: extra_head -->\n")
            f.write(blocks['extra_head'] + "\n")
            f.write("<!-- endblock -->\n\n")
            
        f.write("<!-- block: content -->\n")
        f.write(blocks['content'] + "\n")
        f.write("<!-- endblock -->\n\n")
        
        if 'extra_scripts' in blocks and blocks['extra_scripts'].strip():
            f.write("<!-- block: extra_scripts -->\n")
            f.write(blocks['extra_scripts'] + "\n")
            f.write("<!-- endblock -->\n")

def parse_source_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    meta = {}
    front_matter_match = re.match(r'^<!--\s*(.*?)\s*-->', content, re.DOTALL)
    if front_matter_match:
        front_matter_text = front_matter_match.group(1)
        for line in front_matter_text.strip().split('\n'):
            if ':' in line:
                k, v = line.split(':', 1)
                meta[k.strip()] = v.strip()
        content = content[front_matter_match.end():].strip()
        
    blocks = {}
    block_pattern = r'<!--\s*block:\s*(\w+)\s*-->(.*?)<!--\s*endblock\s*-->'
    for match in re.finditer(block_pattern, content, re.DOTALL):
        block_name = match.group(1)
        block_content = match.group(2).strip()
        blocks[block_name] = block_content
        
    remaining_content = re.sub(block_pattern, '', content, flags=re.DOTALL).strip()
    if 'content' not in blocks:
        blocks['content'] = remaining_content
        
    return meta, blocks

def adapt_paths_for_subpage(html_content):
    # 1. Replace href="pages/filename.html" -> href="filename.html"
    html_content = re.sub(r'href=["\']pages/([^"\']+\.html)["\']', r'href="\1"', html_content)
    
    # 2. Replace href="index.html" -> href="../index.html"
    html_content = re.sub(r'href=["\']index\.html["\']', 'href="../index.html"', html_content)
    
    # 3. Replace src="pages/images/..." -> src="images/..." and href="pages/images/..." -> href="images/..."
    html_content = re.sub(r'(src|href)=["\']pages/images/([^"\']+)["\']', r'\1="images/\2"', html_content)
    
    return html_content

def build_site():
    print("Compiling website pages from 'src/'...")
    
    # Load layout templates
    with open(os.path.join(TEMPLATES_DIR, 'base.html'), 'r', encoding='utf-8') as f:
        base_layout = f.read()
    with open(os.path.join(TEMPLATES_DIR, 'navbar.html'), 'r', encoding='utf-8') as f:
        navbar_template = f.read()
    with open(os.path.join(TEMPLATES_DIR, 'contact.html'), 'r', encoding='utf-8') as f:
        contact_template = f.read()
    with open(os.path.join(TEMPLATES_DIR, 'footer.html'), 'r', encoding='utf-8') as f:
        footer_template = f.read()
        
    # Process pages recursively
    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            if not file.endswith('.html'):
                continue
                
            src_file_path = os.path.join(root, file)
            rel_path = os.path.relpath(src_file_path, SRC_DIR)
            dest_file_path = os.path.join(WORKSPACE_DIR, rel_path)
            
            # Determine if it's a subpage (is it inside "pages/")
            is_subpage = rel_path.startswith('pages' + os.sep) or rel_path.startswith('pages/')
            relative_path_prefix = "../" if is_subpage else ""
            
            print(f"Building {rel_path} -> {os.path.relpath(dest_file_path, WORKSPACE_DIR)}")
            
            meta, blocks = parse_source_file(src_file_path)
            
            # Assemble page
            page_html = base_layout
            
            # Metadata
            page_html = page_html.replace('{{title}}', meta.get('title', ''))
            page_html = page_html.replace('{{description}}', meta.get('description', ''))
            page_html = page_html.replace('{{relative_path}}', relative_path_prefix)
            
            # Blocks
            page_html = page_html.replace('{{extra_head}}', blocks.get('extra_head', ''))
            page_html = page_html.replace('{{extra_scripts}}', blocks.get('extra_scripts', ''))
            page_html = page_html.replace('{{content}}', blocks.get('content', ''))
            
            # Shared components
            # Navbar
            navbar_html = blocks.get('navbar', navbar_template)
            if is_subpage:
                navbar_html = adapt_paths_for_subpage(navbar_html)
            page_html = page_html.replace('{{navbar}}', navbar_html)
            
            # Contact
            if meta.get('has_contact', 'true').lower() == 'true':
                contact_html = contact_template
                if is_subpage:
                    contact_html = adapt_paths_for_subpage(contact_html)
                page_html = page_html.replace('{{contact}}', contact_html)
            else:
                page_html = page_html.replace('{{contact}}', '')
                
            # Footer
            footer_raw = blocks.get('footer', footer_template)
            footer_html = footer_raw.replace('{{relative_path}}', relative_path_prefix)
            page_html = page_html.replace('{{footer}}', footer_html)
            
            # Write compiled file
            os.makedirs(os.path.dirname(dest_file_path), exist_ok=True)
            with open(dest_file_path, 'w', encoding='utf-8') as f:
                f.write(page_html)

if __name__ == '__main__':
    # Build the website
    build_site()
    print("Build complete! All pages generated successfully.")


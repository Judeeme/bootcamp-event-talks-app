from flask import Flask, jsonify, render_template, request
import requests
import feedparser
from bs4 import BeautifulSoup

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def create_update_item(entry_id, date_str, link, category, elements, idx):
    html_content = "".join(str(el) for el in elements)
    
    # Create clean text version
    temp_soup = BeautifulSoup(html_content, 'html.parser')
    text_content = temp_soup.get_text(separator=" ").strip()
    text_content = " ".join(text_content.split())
    
    return {
        "id": f"{entry_id}-{idx}",
        "date": date_str,
        "category": category,
        "content_html": html_content,
        "content_text": text_content,
        "link": link
    }

def parse_release_notes(feed_xml):
    feed = feedparser.parse(feed_xml)
    updates = []
    
    for entry in feed.entries:
        date_str = entry.title  # E.g., "June 15, 2026"
        entry_id = getattr(entry, 'id', f"bq-release-{date_str}")
        link = getattr(entry, 'link', 'https://cloud.google.com/bigquery/docs/release-notes')
        
        content_html = ""
        if 'content' in entry and len(entry.content) > 0:
            content_html = entry.content[0].value
        elif 'summary' in entry:
            content_html = entry.summary
            
        if not content_html:
            continue
            
        soup = BeautifulSoup(content_html, 'html.parser')
        
        current_category = "General"
        current_elements = []
        update_idx = 0
        
        for child in soup.contents:
            if child.name in ['h3', 'h4']:
                if current_elements:
                    updates.append(create_update_item(entry_id, date_str, link, current_category, current_elements, update_idx))
                    update_idx += 1
                    current_elements = []
                current_category = child.get_text().strip()
            elif child.name:
                current_elements.append(child)
                
        if current_elements or update_idx > 0:
            updates.append(create_update_item(entry_id, date_str, link, current_category, current_elements, update_idx))
            
    return updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        updates = parse_release_notes(response.content)
        return jsonify({
            "success": True,
            "updates": updates
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

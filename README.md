# BigQuery Release Navigator

A Flask-based web application featuring a modern glassmorphic interface to fetch, parse, search, filter, and share Google BigQuery release notes on Twitter/X.

## Features

- **GCP Feed Parsing**: Dynamically fetches and parses the official BigQuery release notes Atom feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`).
- **Granular Update Splitting**: Splits daily compound feed entries into individual update items (Features, Changes, Issues) for easier viewing.
- **Dynamic Search & Filtering**: Instant client-side fuzzy search and filtering by update category (Features, Changes, Issues).
- **Tweet Composer Integration**: An interactive simulated tweet preview modal that auto-formats text, implements Twitter's 280-character validation rules (counting URLs as exactly 23 characters), and hooks into Twitter Web Intents for seamless sharing.
- **Glassmorphic Design**: Sleek dark mode dashboard with responsive columns, stats counters, hover animations, and shimmer skeleton loaders.

## Tech Stack

- **Backend**: Python, Flask, `feedparser`, `beautifulsoup4`, `requests`
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (custom styling system), Vanilla JavaScript (ES6)

## File Structure

```text
bootcamp-event-talks-app/
│
├── static/
│   ├── css/
│   │   └── style.css       # Custom styling and CSS variables
│   └── js/
│       └── app.js          # Client-side reactivity, filters, and modal handling
│
├── templates/
│   └── index.html          # Application template
│
├── app.py                  # Flask backend & XML parsing routines
├── requirements.txt        # Python dependency manifest
└── README.md               # Project documentation
```

## Setup & Running Locally

### Prerequisites

- Python 3.8 or higher installed on your system.
- Git (optional, for version control).

### Installation Steps

1. **Clone or navigate to the project directory**:
   ```bash
   cd bootcamp-event-talks-app
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```

4. **Install the dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the Flask server**:
   ```bash
   python app.py
   ```

6. **Open the application**:
   Navigate to [http://127.0.0.1:5000](http://127.0.0.1:5000) in your web browser.

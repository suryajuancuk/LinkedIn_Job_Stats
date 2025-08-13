# LinkedIn Job Stats Extension

<p align="center">
    <img src="logo.png" align="center" width="45%">
</p>
<p align="center"><h1 align="center">LINKEDIN JOB STATS EXTENSION</h1></p>
<p align="center">
	<em><code>❯ A powerful browser extension that extracts and displays LinkedIn job statistics using two distinct architectural approaches.</code></em>
</p>
<p align="center">
	<img src="https://img.shields.io/github/license/evinjohnn/LinkedIn_Job_Stats_Extension?style=default&logo=opensourceinitiative&logoColor=white&color=bf2020" alt="license">
	<img src="https://img.shields.io/github/last-commit/evinjohnn/LinkedIn_Job_Stats_Extension?style=default&logo=git&logoColor=white&color=bf2020" alt="last-commit">
	<img src="https://img.shields.io/github/languages/top/evinjohnn/LinkedIn_Job_Stats_Extension?style=default&color=bf2020" alt="repo-top-language">
	<img src="https://img.shields.io/github/languages/count/evinjohnn/LinkedIn_Job_Stats_Extension?style=default&color=bf2020" alt="repo-language-count">
</p>
<br>

<details><summary>Table of Contents</summary>

- [Overview](#overview)
- [Features](#features)
- [Available On](#available-on)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
  - [Project Index](#project-index)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Usage](#usage)
- [Architecture Comparison](#architecture-comparison)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

</details>
<hr>

## Overview

This browser extension enhances the LinkedIn job searching experience by providing real-time job statistics, including applicant counts and view metrics, directly on the job listings page. The project is implemented with two complete, distinct architectures to demonstrate different technical strategies for data extraction: a standard version using network interception and an advanced version using the Chrome DevTools Protocol (CDP). It is built with vanilla JavaScript (ES6+), requires no external dependencies, and is fully compliant with Manifest V3 for modern security and performance.

### 🎥 Demo Video

Watch the extension in action:

![LinkedIn Job Stats Extension Demo](demo.gif)

*Demo showcasing the extension's real-time job statistics functionality*

---

## Features

-   **✨ Real-time Job Statistics**: Instantly view job views and applicant counts as you browse.
-   **✨ Dual Implementation Methods**: Choose between a standard version (network interception) or a CDP version (Chrome DevTools Protocol) for advanced insights.
-   **✨ Beautiful Glassmorphism UI**: A modern, sleek interface that blends seamlessly with the LinkedIn website.
-   **✨ Non-intrusive Design**: A clean, draggable popup that doesn't interfere with browsing.
-   **✨ Job ID Extraction**: Automatically extracts and displays the unique LinkedIn job ID for each posting.
-   **✨ No API Keys Required**: Works entirely by intelligently interacting with LinkedIn's web interface.
-   **✨ Browser Action Popup**: Extension popup shows the most recent job statistics.
-   **✨ Automatic Job Detection**: Seamlessly detects when you navigate to different job postings.

---

## Available On

The extension is currently pending review on official browser stores. In the meantime, it can be installed directly from the source code.

| Browser | Link | Status |
| :--- | :--- | :---: |
| **Microsoft Edge** | [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/okablpjgdhjmeaiiiklhfifjplmbjlll) | `Available` |
| **Opera** | [Opera Addons](https://addons.opera.com/) | `Available` |
| **Google Chrome** | [Chrome Web Store](https://chrome.google.com/webstore) | `Coming Soon` |

---

## Tech Stack

| Technology | Description |
| :--- | :--- |
| **JavaScript (ES6+)** | Core logic for DOM manipulation, network interception, and UI control. |
| **HTML5 / CSS3** | Structure and advanced styling for the glassmorphism UI, animations, and layout. |
| **Manifest V3** | Utilizes the latest Chrome Extension APIs for security and performance. |
| **Chrome DevTools Protocol** | Powers the advanced version for direct, low-level network monitoring. |
| **Chrome Extension APIs** | Uses storage, scripting, debugger, and activeTab permissions. |

---

## Project Structure

```sh
└── LinkedIn_Job_Stats_Extension/
    ├── Linkedin Job Stats/                    # Standard version (Network Interception)
    │   ├── content-injector.js               # Injects interceptor script at document_start
    │   ├── content-script.js                 # Main UI logic and DOM manipulation
    │   ├── linkedin-interceptor.js           # Network interception (XHR/fetch override)
    │   ├── popup.html                        # Browser action popup interface
    │   ├── popup.js                          # Popup logic and storage communication
    │   ├── manifest.json                     # Extension configuration (storage, scripting)
    │   └── icons/                            # Extension icons (16, 48, 128px)
    ├── Linkedin Job Stats (CDP)/             # Advanced version (Chrome DevTools Protocol)
    │   ├── background.js                     # Service worker with CDP debugging
    │   ├── content-cdp.js                    # UI rendering and CDP data handling
    │   ├── manifest.json                     # Extension configuration (debugger, activeTab)
    │   └── icons/                            # Extension icons (16, 48, 128px)
    └── README.md
```

### Project Index

<details open>
<summary><b><code>LINKEDIN_JOB_STATS_EXTENSION/</code></b></summary>

<details>
<summary><b>Linkedin Job Stats (Standard Version)</b></summary>
<blockquote>
<table>
<tr>
<td><b><a href='Linkedin Job Stats/content-injector.js'>content-injector.js</a></b></td>
<td><code>❯ Injects the main interceptor script into the web page's context at document_start.</code></td>
</tr>
<tr>
<td><b><a href='Linkedin Job Stats/content-script.js'>content-script.js</a></b></td>
<td><code>❯ Handles UI injection, DOM manipulation, job ID extraction, and communication with the interceptor script.</code></td>
</tr>
<tr>
<td><b><a href='Linkedin Job Stats/linkedin-interceptor.js'>linkedin-interceptor.js</a></b></td>
<td><code>❯ The core script that overrides XMLHttpRequest and fetch to capture LinkedIn Voyager API data.</code></td>
</tr>
<tr>
<td><b><a href='Linkedin Job Stats/popup.html'>popup.html</a></b></td>
<td><code>❯ Provides the HTML structure for the browser action popup window with glassmorphism styling.</code></td>
</tr>
<tr>
<td><b><a href='Linkedin Job Stats/popup.js'>popup.js</a></b></td>
<td><code>❯ Contains the logic for the popup, displaying the most recently stored job stats from Chrome storage.</code></td>
</tr>
<tr>
<td><b><a href='Linkedin Job Stats/manifest.json'>manifest.json</a></b></td>
<td><code>❯ Defines permissions (storage, scripting) and configuration for the standard network interception version.</code></td>
</tr>
</table>
</blockquote>
</details>

<details>
<summary><b>Linkedin Job Stats (CDP Version)</b></summary>
<blockquote>
<table>
<tr>
<td><b><a href='Linkedin Job Stats (CDP)/background.js'>background.js</a></b></td>
<td><code>❯ Service worker that handles the Chrome DevTools Protocol (CDP) debugging and network interception.</code></td>
</tr>
<tr>
<td><b><a href='Linkedin Job Stats (CDP)/content-cdp.js'>content-cdp.js</a></b></td>
<td><code>❯ Renders the glassmorphism UI and displays data received from the background script via CDP.</code></td>
</tr>
<tr>
<td><b><a href='Linkedin Job Stats (CDP)/manifest.json'>manifest.json</a></b></td>
<td><code>❯ Defines permissions (debugger, activeTab, storage) and configuration for the CDP version.</code></td>
</tr>
</table>
</blockquote>
</details>
</details>

---

## Getting Started

### Prerequisites

- A modern Chromium-based browser (e.g., Google Chrome, Microsoft Edge, Opera).
- git (for cloning the repository).

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/evinjohnn/LinkedIn_Job_Stats_Extension
   ```

2. **Navigate to your browser's extension page:**
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Opera: `opera://extensions`

3. **Enable Developer Mode:** Find and activate the "Developer mode" toggle, usually located in the top-right corner.

4. **Load the Extension:**
   - Click the "Load unpacked" button.
   - Select the directory of the version you wish to install:
     - `Linkedin Job Stats/` (Recommended for general use)
     - `Linkedin Job Stats (CDP)/` (Advanced version with CDP)

5. **The extension is now installed and active.**

### Usage

1. **Navigate to LinkedIn Jobs:** Go to a job search page, like https://www.linkedin.com/jobs/.

2. **Select a Job:** Click on any job posting in the list to view its details.

3. **View Statistics:** The extension's UI will appear on the page, displaying the job stats. The panel will update as you click on different jobs.

4. **Browser Action:** Click the extension icon in your browser toolbar to see the most recent job statistics in a popup.

---

## Architecture Comparison

| Feature | Standard Version | CDP Version |
|---------|------------------|-------------|
| **Network Interception** | XHR/fetch override in page context | Chrome DevTools Protocol |
| **Permissions** | `storage`, `scripting` | `debugger`, `activeTab`, `storage` |
| **Performance** | Lightweight, runs in page context | More powerful, runs in background |
| **Compatibility** | Works on all Chromium browsers | Chrome-specific features |
| **Debugging Banner** | No debugging banner | No debugging banner |
| **Data Source** | LinkedIn Voyager API | LinkedIn Voyager API |
| **UI Framework** | Glassmorphism design | Glassmorphism design |

### Technical Implementation Details

**Standard Version:**
- Uses `content-injector.js` to inject `linkedin-interceptor.js` into the page context
- Intercepts XMLHttpRequest and fetch calls to LinkedIn's Voyager API
- Extracts job statistics from API responses
- Communicates with content script via postMessage and custom events
- Stores data in Chrome storage for popup access

**CDP Version:**
- Uses background service worker with Chrome DevTools Protocol
- Attaches debugger to LinkedIn job tabs automatically
- Intercepts network responses at the browser level
- Sends data to content script via chrome.runtime.sendMessage
- Provides more reliable network interception

---

## Contributing

💬 **Join the Discussions:** Share your insights, provide feedback, or ask questions.

🐛 **Report Issues:** Submit bugs found or log feature requests.

💡 **Submit Pull Requests:** Review open PRs, and submit your own.

<details><summary>Contributing Guidelines</summary>

1. **Fork the Repository:** Start by forking the project repository to your GitHub account.

2. **Clone Locally:** Clone the forked repository to your local machine.
   ```sh
   git clone https://github.com/YOUR_USERNAME/LinkedIn_Job_Stats_Extension
   ```

3. **Create a New Branch:** Always work on a new branch with a descriptive name.
   ```sh
   git checkout -b new-feature-x
   ```

4. **Make Your Changes:** Develop and test your changes locally.

5. **Commit Your Changes:** Commit with a clear message describing your updates.
   ```sh
   git commit -m 'Implemented new feature x.'
   ```

6. **Push to GitHub:** Push the changes to your forked repository.
   ```sh
   git push origin new-feature-x
   ```

7. **Submit a Pull Request:** Create a PR against the original project repository. Clearly describe the changes and their motivations.

</details>

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Special thanks to the open-source community for providing the tools and inspiration for this project.

Made with ❤️ for the job-hunting community.

---

## Support the Project

If you find this extension helpful and would like to support its development, consider buying me a coffee! ☕

<p align="center">
  <a href="https://buymeacoffee.com/evinjohnn" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="150">
  </a>
</p>



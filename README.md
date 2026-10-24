# 🎓 NeoPat Bulk Student Finder & Exporter

A lightning-fast, mobile-responsive web tool designed to look up student details in bulk using their **NeoPat Neo IDs**. 

Paste up to **1,000+ Neo IDs at once** and immediately retrieve complete student profiles in the **exact order** you pasted them, with one-click export to **Excel (.xlsx)**, **CSV**, or **Clipboard**.

---

## 🚀 Live Demo & Key Features

- **Preloaded with 4,351 Student Records**:
  - Combined from the Master Sheet (Marks, CGPA, Degree, Campus, Resume Link, Contact) and the Accenture Venue Sheet (Assigned test rooms / venues like MG, AB2501, AB2502, AB2503, AB2601, AB2602).
- **Bulk Lookup (1 to 1,000+ IDs at a time)**:
  - Paste directly from an Excel column, CSV, or text list. Handles newlines, spaces, commas, tabs, and lowercase automatically.
- **Strict Order Preservation**:
  - Results are displayed in the exact order you provided, making it effortless to map results back to your original spreadsheet.
- **Mobile & Desktop Optimized**:
  - **Desktop**: High-density interactive data table with sticky headers and search.
  - **Mobile Phone**: Beautiful touch-friendly student cards with direct **Call**, **WhatsApp**, and **Open Resume** buttons.
- **Fast Client-Side Performance**:
  - Runs 100% in your browser using indexed hash maps. Zero server lag, <10ms lookup speed.
- **Works 100% Offline**:
  - No internet connection required after opening! All scripts and datasets are bundled locally.
- **Excel & CSV Exporting**:
  - Export filtered or queried results directly into an Excel `.xlsx` file (with auto-column sizing) or CSV with a single tap.
- **Missing / Not Found IDs Tracker**:
  - Instantly alerts you if any queried ID is missing, with a one-click **"Copy Not Found List"** button.
- **Future-Proof Database Importer**:
  - Need to update marks or upload a new sheet in the future? Click **"Import Excel"** to drag-and-drop any updated `.xlsx` or `.csv` file. It updates locally and remembers it in your browser!

---

## 📂 Project Structure

```
neopat-student-finder/
├── index.html               # Main responsive web application
├── style.css                # Modern responsive stylesheet (light/dark theme, mobile cards, print)
├── app.js                   # Application logic, fast lookup, filters, exports
├── data.js                  # Preloaded database of 4,351 student records
├── xlsx.full.min.js         # Offline SheetJS library for Excel reading/writing
├── students_database.json   # Raw JSON database
└── README.md                # Documentation & deployment guide
```

---

## 💻 How to Run Locally

You don't need to install Node.js, Python, or a database server!

1. Open the folder:
   ```
   C:\Users\prade\.gemini\antigravity\scratch\neopat-student-finder\
   ```
2. Double-click **`index.html`** in any web browser (Google Chrome, Microsoft Edge, Safari, Firefox).
3. That's it! The tool is immediately ready to use.

---

## 📱 How to Use on Mobile Phone

You can access and use this on your phone in three easy ways:

### Option A: Free 60-Second Web Deployment (Recommended)
Deploy this folder for free so you can open a short URL on your phone anytime:

#### Via Netlify Drop (Easiest - 10 seconds):
1. Visit [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop the `neopat-student-finder` folder into the browser window.
3. You immediately get a live HTTPS link (e.g., `https://neopat-finder.netlify.app`) that you can open on your phone!

#### Via GitHub Pages:
1. Push this folder to a GitHub repository.
2. In the repository, go to **Settings** &rarr; **Pages** &rarr; select `main` branch &rarr; **Save**.
3. Your site is live at `https://<your-username>.github.io/<repo-name>/`.

#### Via Vercel:
1. Run `npx vercel` in this folder or import your GitHub repository into Vercel.

### Option B: Add to Home Screen (PWA Style)
Once opened in your mobile browser:
- **iPhone / iOS (Safari)**: Tap the **Share** button (box with upward arrow) &rarr; Tap **"Add to Home Screen"**.
- **Android (Chrome)**: Tap the **Three Dots** menu &rarr; Tap **"Install app"** or **"Add to Home screen"**.

---

## 📊 Data Fields Provided per Student

| Field | Description | Source |
| :--- | :--- | :--- |
| **Neo ID** | Unique Student NeoPat Identifier (e.g., `V4I0G1R4`) | Both Files |
| **Student Name** | Full legal name of student | Both Files |
| **Registration Number** | University student register number (e.g., `23BCE5015`) | Master Sheet |
| **CGPA / UG Mark** | Current Cumulative Grade Point Average (color-coded badge) | Master Sheet |
| **Assigned Venue** | Test venue room code (e.g., `MG`, `AB2601`, `AB2503`) | Venue Sheet |
| **Campus** | Campus branch (Amaravati, Bhopal, Chennai, Vellore) | Master Sheet |
| **Degree & Branch** | Specialization (e.g., B.Tech CSE with AI & ML) | Master Sheet |
| **Mobile Number** | Clickable phone link for calls and WhatsApp | Master Sheet |
| **Email** | University / personal email address | Master Sheet |
| **Gender & DOB** | Gender and Date of Birth | Master Sheet |
| **10th & 12th Marks** | Secondary & Higher Secondary Board % | Master Sheet |
| **Resume URL** | One-click direct link to student's NeoPat resume | Master Sheet |

---

## 🛡️ Privacy & Security

All searches, data matching, and Excel file generation occur **locally on your device**. No student data is transmitted to external servers or cloud databases.

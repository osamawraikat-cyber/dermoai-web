# Setting up your Google Apps Script Webhook (JDD Database)

Follow these simple steps to deploy a free, secure database endpoint under your Google account. This script allows you and other dermatologists using the DermoAI app to upload case details and images directly to a folder in your Google Drive.

---

## 🛠️ Step-by-Step Setup

1.  **Open Google Apps Script:**
    *   Go to [script.google.com](https://script.google.com/) and log in with your Google account.
    *   Click **New Project** (top left).
2.  **Paste the Webhook Code:**
    *   Delete any default code in the editor (`Code.gs`) and paste the code block below.
3.  **Deploy the Script:**
    *   Click **Deploy** (top right) ➔ select **New deployment**.
    *   Click the gear icon next to "Select type" and select **Web app**.
    *   Configure the deployment settings:
        *   **Description:** `DermoAI Case Submission Webhook`
        *   **Execute as:** `Me (your-email@gmail.com)`
        *   **Who has access:** **`Anyone`** *(This is important so other clinicians' browsers can transmit cases. The code itself remains secure and only writes to your designated folder).*
    *   Click **Deploy**.
4.  **Authorize Permissions:**
    *   Google will ask you to authorize the script to access your Google Drive. Click **Authorize access**, choose your account, click **Advanced** (at the bottom), and select **Go to Project (unsafe)** to grant permissions.
5.  **Copy the Web App URL:**
    *   Once deployed, copy the generated **Web app URL** (e.g., `https://script.google.com/macros/s/.../exec`).
6.  **Paste into DermoAI settings:**
    *   Open DermoAI in your browser, find the **⚙️ Database Settings** panel on the right sidebar, paste your Web App URL, and it will be saved!

---

## 💻 Google Apps Script Code

Copy and paste this code into your Apps Script project:

```javascript
function doPost(e) {
  try {
    // 1. Parse JSON payload
    var payload = JSON.parse(e.postData.contents);
    
    // SECURITY GATE: Verify secret authentication token to prevent spam/abuse
    var SECRET_TOKEN = "wraikat_dermoai_secure_2026";
    if (payload.authToken !== SECRET_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unauthorized request" }))
                           .setMimeType(ContentService.MimeType.JSON)
                           .setHeader("Access-Control-Allow-Origin", "*");
    }
    
    // 2. Identify or create target folder in Google Drive
    var folderName = "DermoAI_Collaborative_Database";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    // 3. Prepare file name (using Patient Code & Timestamp)
    var patientCode = payload.patientId || "anonymous";
    var timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    var fileName = "Case_" + patientCode + "_" + timestamp + ".json";
    
    // 4. Save metadata + base64 image as a JSON file
    var fileContent = JSON.stringify(payload, null, 2);
    folder.createFile(fileName, fileContent, MimeType.PLAIN_TEXT);
    
    // 5. Return success response with CORS headers
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Case saved to Google Drive" }))
                         .setMimeType(ContentService.MimeType.JSON)
                         .setHeader("Access-Control-Allow-Origin", "*")
                         .setHeader("Access-Control-Allow-Methods", "POST");
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON)
                         .setHeader("Access-Control-Allow-Origin", "*")
                         .setHeader("Access-Control-Allow-Methods", "POST");
  }
}

// Enable CORS Preflight (OPTIONS request support from browsers)
function doOptions(e) {
  return ContentService.createTextOutput("")
                       .setMimeType(ContentService.MimeType.TEXT)
                       .setHeader("Access-Control-Allow-Origin", "*")
                       .setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
                       .setHeader("Access-Control-Allow-Headers", "Content-Type");
}
```

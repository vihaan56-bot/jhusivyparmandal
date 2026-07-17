# Instructions: Root & Admin Management Guide

This guide explains how to initialize the **Root Administrator** account via the command-line seeding script and create secondary **operational Admin accounts** through the dashboard interface.

---

## 🛠️ Step 1: Configure Environment Credentials

1. Open your local `.env` configuration file in the project root.
2. Verify or add the Root credentials variables at the bottom:
   ```env
   # ROOT ADMIN CREDENTIALS
   ROOT_ADMIN_EMAIL=root@vyparmandal.org
   ROOT_ADMIN_PASSWORD=changeMeRoot123!
   ```
3. Ensure your Firebase configuration keys are populated in the `.env` file (e.g. `VITE_FIREBASE_PROJECT_ID`).

---

## 🔑 Step 2: Initialize Firebase Service Account (For Production/Firebase Mode)

> [!NOTE]
> If you are running in offline mock mode (`VITE_FIREBASE_API_KEY` is blank), you can **skip this step**. The seeding script will automatically simulate success in local memory.

To authenticate the script against your live Firebase instance:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project and click the gear icon **⚙️ Project Settings** > **Service Accounts**.
3. Click the **Generate New Private Key** button.
4. Download the JSON key file, rename it to `serviceAccountKey.json`, and place it in your project's root directory (`F:\vypar mandal\`).
5. Ensure `serviceAccountKey.json` is listed in your `.gitignore` to prevent committing it.

---

## 🚀 Step 3: Run the Root Seeding Script

Execute the following command in your terminal to create the Root account, assign custom auth claims, and write their database profile:

```bash
npx tsx scripts/create-root-user.ts
```

### Script Outputs
* Logs checking for existing Root accounts.
* Auto-creates the user record in Firebase Authentication if not present.
* Assigns Custom Claim `{ role: 'root' }` ensuring server-side rule verification.
* Creates the user profile under the Firestore `users/` collection with the flag `needsPasswordChange: true`.

---

## 🛡️ Step 4: First Login & Forced Password Change

1. Launch your local dev server:
   ```bash
   npm run dev
   ```
2. Navigate to the login portal (usually `/login` or clicking **Sign In**).
3. Input the configured Root email and password:
   * **Email**: `root@vyparmandal.org` (or custom email)
   * **Password**: `changeMeRoot123!` (or custom password)
4. Upon clicking **Verify & Log In**, the platform will recognize the first-login flag and display the **Password Update Required** screen.
5. Enter a new, secure password and click **Update & Verify Account**.
6. You will be successfully authenticated and redirected to your main dashboard.

---

## ➕ Step 5: Create operational Admin staff

Once logged in as the **Root User**, you have access to create and manage Admin staff:

1. Click on **Admin Panel** on the sidebar (or navigate to `/admin`).
2. Go to the **🛡️ Admin Management** tab (visible only to the Root User).
3. Fill out the **Create Admin Account** form:
   * **Full Name** (e.g. `Secretary Rajesh`)
   * **Email ID** (e.g. `rajesh@vypar.org`)
   * **Mobile Number** (e.g. `+91 99999 88888`)
   * **Temporary Password** (Min 6 characters)
4. Click **⚡ Create Admin User**.
5. The account is provisioned in Firebase Auth with claim `{ role: 'admin' }` and written to Firestore.

### Managing Admins
From the **Active Administrative Staff** table on the same tab, Root can:
* **Enable/Disable**: Suspend an Admin's login access.
* **Reset Pass**: Assign a new temporary password forcing them to change it on their next login.
* **Delete**: Permanently delete the Admin account.

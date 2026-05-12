# IMS Portal

Information Management System Portal for academic institutions. Built with Next.js 15, Firebase, TypeScript, and Tailwind CSS v4.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Radix UI |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| Functions | Firebase Cloud Functions (Node 20) |
| Email | Nodemailer (SMTP) |
| PDF | jsPDF + jspdf-autotable |
| Charts | Recharts |

## Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project with Blaze (pay-as-you-go) plan (required for Cloud Functions)

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd ims-portal
npm install
cd functions && npm install && cd ..
```

### 2. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project.
2. Enable **Authentication → Email/Password** sign-in method.
3. Enable **Firestore Database** (start in production mode).
4. Enable **Storage** (start in production mode).
5. Enable **Cloud Functions** (requires Blaze plan).

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase project config. You can find the client SDK config under:
`Firebase Console → Project Settings → Your apps → Web app → SDK setup and configuration`

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Admin SDK (for seed script) — download from Firebase Console → Project Settings → Service accounts
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# SMTP (for Cloud Functions email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-address@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@ims.edu
```

### 4. Update Firebase project ID

Edit `.firebaserc` and replace `your-firebase-project-id` with your actual project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### 5. Deploy Firestore rules and indexes

```bash
firebase deploy --only firestore
firebase deploy --only storage
```

### 6. Seed initial data

Download a service account key from `Firebase Console → Project Settings → Service accounts → Generate new private key` and save it as `service-account.json` in the project root.

```bash
npx ts-node scripts/seed.ts
```

This creates:
- 1 SuperAdmin account (`superadmin@ims.edu` / `Admin@12345`)
- 12 departments (IDs 001–012)
- 5 sample faculty members across departments
- Sample publications and awards for Dr. Priya Sharma

**Change all default passwords immediately after first login.**

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with `superadmin@ims.edu` / `Admin@12345`.

## Firebase Emulators (recommended for development)

Run everything locally without hitting production:

```bash
firebase emulators:start
```

Emulator ports:
| Emulator | Port |
|---|---|
| Auth | 9099 |
| Firestore | 8080 |
| Functions | 5001 |
| Storage | 9199 |
| Hosting | 5000 |
| Emulator UI | 4000 |

Set `NEXT_PUBLIC_USE_EMULATORS=true` in `.env.local` to connect the app to emulators.

## Deploy

### Frontend (Firebase Hosting)

```bash
npm run build
firebase deploy --only hosting
```

### Cloud Functions

Set SMTP and other runtime environment variables first:

```bash
firebase functions:config:set \
  smtp.host="smtp.gmail.com" \
  smtp.port="587" \
  smtp.user="your@email.com" \
  smtp.password="your-app-password" \
  smtp.from_email="noreply@ims.edu" \
  app.url="https://your-project.web.app"
```

Then deploy:

```bash
firebase deploy --only functions
```

### Full deploy

```bash
firebase deploy
```

## Role Hierarchy

| Role | Scope |
|---|---|
| `superadmin` | Unrestricted access to all data and settings |
| `admin` | Institution-wide read/write, cannot modify superadmin accounts |
| `hod` | Department-scoped read/write, department reports |
| `faculty` | Own profile and subcollection data (publications, research, etc.) |
| `staff` | Limited read access |
| `student` | Own record only |

## Faculty Modules

Each faculty member has the following subcollections in Firestore:

- `publications` — Journal articles, conference papers, book chapters
- `research` — Research projects with funding details
- `awards` — Awards and recognition with certificates
- `workshops` — Workshops attended and organized
- `patents` — Patents, copyrights, designs
- `memberships` — Professional body memberships
- `contributions` — Academic service contributions
- `interactions` — Industry and community interactions
- `financialSupport` — Financial support received
- `qualifications` — Academic qualifications

## Department ID Format

Departments use zero-padded 3-digit IDs displayed in JetBrains Mono: `[001]` through `[012]`. Auto-incremented when new departments are added.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx ts-node scripts/seed.ts` | Seed Firestore with initial data |
| `cd functions && npm run build` | Build Cloud Functions |
| `cd functions && npm run serve` | Serve functions locally |

## Project Structure

```
ims-portal/
├── app/
│   ├── (auth)/          # Login, forgot-password, change-password
│   ├── (protected)/     # All authenticated pages
│   │   ├── dashboard/
│   │   ├── faculty/
│   │   ├── students/
│   │   ├── departments/
│   │   ├── reports/
│   │   ├── settings/
│   │   ├── admin/       # users, audit-logs
│   │   └── superadmin/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/              # Primitive components (Button, Input, Dialog, …)
│   ├── shared/          # PageHeader, DataTable, FileUpload, …
│   ├── layout/          # Sidebar, Header
│   ├── faculty/         # Module components (Publications, Research, …)
│   ├── users/           # PermissionMatrix
│   └── departments/     # DeptIdBadge
├── lib/
│   ├── firebase/        # config, auth, firestore, storage helpers
│   ├── context/         # AuthContext
│   ├── hooks/           # usePermissions, useFacultyData, …
│   ├── types/           # TypeScript interfaces
│   ├── schemas/         # Zod validation schemas
│   └── utils/           # formatters, pdf, cn, departmentId
├── functions/
│   └── src/             # Cloud Functions (triggers, doi, email, reports)
├── scripts/
│   └── seed.ts          # Firestore seed script
├── firestore.rules
├── storage.rules
├── firestore.indexes.json
└── firebase.json
```

## Environment Variables Reference

See `.env.local.example` for the complete list with descriptions.

## Security Notes

- Firestore rules enforce role-based access at the database level — client-side permission checks are UI-only.
- Storage rules restrict uploads to authenticated users within their own path.
- `auditLogs` collection is append-only for all authenticated users; only `superadmin` can read.
- The seed script default password `Admin@12345` must be changed before going to production.
- Never commit `.env.local` or `service-account.json` to version control.

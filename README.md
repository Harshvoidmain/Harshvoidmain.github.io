
# IMS Portal  
(Information Management System)

## 📌 Overview  
IMS Portal is a web-based academic management system built using **Next.js**.  
It is designed for **colleges and educational institutions** to manage information related to **students, faculty, departments, reports, and research work** in a digital and organized way.

The system helps users upload, view, and generate academic documents, making institutional record keeping easier and faster.

---

## 🚀 Main Features  

- Secure login system for different users  
- Role-based access for:
  - Admin  
  - HOD  
  - Faculty  
  - Staff  
  - Students  
- Faculty profile management  
- Upload and manage:
  - Reports  
  - Research papers  
  - Publications  
- Department-wise data and statistics  
- Student academic record management  
- PDF report generation  
- Dashboard with charts and summaries  

---

## 🛠️ Technology Used  

- **Frontend:** Next.js (React)  
- **Backend:** Next.js API Routes  
- **Language:** TypeScript  
- **Database:** MySQL  
- **Styling:** Tailwind CSS  
- **Authentication:** JWT with NextAuth  
- **Charts:** Recharts  
- **PDF Reports:** jsPDF  
- **Email Service:** Nodemailer  

---

## 👥 User Roles  

| Role | What they can do |
|------|----------------|
| Admin | Manage whole system |
| HOD | Manage department data |
| Faculty | Manage profile and publications |
| Staff | Handle academic records |
| Student | View academic details |

---

## 📊 What This System Manages  

- Faculty profiles and achievements  
- Research papers and publications  
- Department details  
- Student records  
- Academic performance  
- Institutional reports  

---

## 📂 File and Document Handling  

- Upload important academic documents  
- Store certificates and reports  
- Download and print documents  
- Generate faculty CVs and reports in PDF format  

---

## ⚙️ How to Run the Project  
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

1. Install all required packages  
```bash
npm install
```
2. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# FinEdge - AI Finance Platform

FinEdge is a modern, AI-powered financial management platform built to help users track, analyze, and optimize their spending with real-time insights.

## Features

- **Dashboard & Overview**: Get a comprehensive view of all your accounts and recent transactions.
- **Account Management**: Create and manage multiple financial accounts.
- **Transaction Tracking**: Add, edit, and categorize your transactions easily.
- **Budgeting**: Set up and monitor your budgets with visual progress indicators.
- **AI-Powered Insights**: Get intelligent spending forecasts and financial advice using Google Generative AI.
- **Security & Bot Protection**: Secured by Clerk authentication and ArcJet bot protection.
- **Background Jobs**: Asynchronous tasks handled reliably with Inngest.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: JavaScript / React 18
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Database & ORM**: [Prisma](https://www.prisma.io/) (with Supabase/PostgreSQL)
- **Authentication**: [Clerk](https://clerk.com/)
- **AI Integration**: [@google/generative-ai](https://ai.google.dev/)
- **Security**: [ArcJet](https://arcjet.com/)
- **Background Jobs**: [Inngest](https://www.inngest.com/)
- **Email**: [Resend](https://resend.com/) & [React Email](https://react.email/)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn or pnpm
- PostgreSQL database (e.g., Supabase)
- API Keys for Clerk, ArcJet, Google Gemini, Inngest, and Resend.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd FinEdge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add the necessary environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:port/database"

   # Clerk Auth
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

   # ArcJet
   ARCJET_KEY=your_arcjet_key

   # Gemini AI
   GEMINI_API_KEY=your_gemini_api_key

   # Inngest
   INNGEST_EVENT_KEY=your_inngest_key
   INNGEST_SIGNING_KEY=your_inngest_signing_key

   # Resend
   RESEND_API_KEY=your_resend_api_key
   ```

4. **Initialize the Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `npm run dev`: Starts the development server using Turbopack.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to catch issues.
- `npm run email`: Starts the React Email development server.

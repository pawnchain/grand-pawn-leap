# PawnEarn - Triangle Payment System

A chess-themed earning platform with a revolutionary triangle payment structure where strategic moves lead to royal rewards.

## Project info

**URL**: https://lovable.dev/projects/f973628e-7e61-463b-a597-07a6e0c394e8

## System Overview

PawnEarn is a triangle-based payment system with 4 membership tiers (Princess, Prince, Queen, King). Users join triangles, and when triangles complete (fill all 3 positions), the top member receives a 4x payout while the triangle splits into two new triangles with the other members moving up.

### Key Features

- **4 Membership Plans**: Princess (₦2K), Prince (₦5K), Queen (₦10K), King (₦20K)
- **4x Returns**: Members receive 4x their investment when triangle completes
- **Referral System**: 10% bonus for referring new users
- **Automated Payouts**: Automatic withdrawal processing when triangles complete
- **Admin Dashboard**: Complete analytics, user management, and financial tracking
- **Coupon System**: Secure coupon-based registration
- **Triangle Visualization**: Real-time view of triangle structure and progress

## Default Admin Credentials

The system auto-creates a default admin user on first deployment:

- **Email**: `admin@pawnearn.com`
- **Password**: `Admin@123456`

⚠️ **Important**: Change the default password immediately after first login!

## System Architecture

### Frontend
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui components
- React Router for navigation
- TanStack Query for data management

### Backend (Lovable Cloud/Supabase)
- PostgreSQL database with Row Level Security (RLS)
- Edge Functions for business logic
- Automated authentication system
- Real-time updates support

### Database Tables
- `profiles`: User information and bank details
- `user_roles`: Role-based access control (admin/user)
- `plans`: Membership plan configurations
- `triangles`: Triangle structure and status
- `triangle_members`: User positions in triangles
- `coupons`: Registration coupon management
- `referrals`: Referral tracking and bonuses
- `withdrawals`: Payout requests and processing
- `expenses`: Operational cost tracking

### Edge Functions
- `join-triangle`: Handles user joining and triangle logic
- `split-triangle`: Manages triangle splitting when complete
- `initialize-system`: Auto-creates default admin on deployment

## Auto-Initialization

The system automatically:
1. ✅ Creates all database tables with proper RLS policies
2. ✅ Seeds the 4 membership plans
3. ✅ Creates default admin user if none exists
4. ✅ Runs on every deployment (idempotent - safe to run multiple times)

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f973628e-7e61-463b-a597-07a6e0c394e8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f973628e-7e61-463b-a597-07a6e0c394e8) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

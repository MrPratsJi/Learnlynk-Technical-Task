# LearnLynk – Technical Assessment 

This project is a submission for the LearnLynk technical test. It includes database schema, row-level security, an Edge Function for task creation, a Next.js page that lists today’s tasks, and a short written answer about Stripe Checkout.

## 📁 Project Structure

backend/
  schema.sql
  rls_policies.sql
  edge-functions/
    create-task/
      index.ts
      .env         (for local testing)

frontend/
  pages/
    dashboard/
      today.tsx
  lib/
    supabaseClient.ts
  .env.local       (for local testing)

.env.sample        (for understanding)
.gitignore        

## 🚀 Setup

### Clone and install

git clone <https://github.com/MrPratsJi/Learnlynk-Technical-Task.git>
cd learnlynk-tech-test

### Supabase SQL setup

- Log in to your Supabase project
- Open SQL Editor
- Run the contents of:
  - backend/schema.sql
  - backend/rls_policies.sql

This creates all required tables and policies.

### Environment variables

Create the following files locally (do not push to github):

- frontend/.env.local
- NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
- backend/edge-functions/create-task/.env
- SUPABASE_URL=https://<project>.supabase.co
- SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

A .env.sample file at the project root shows expected variables.

## 🧪 Testing

### Database

- Insert test rows using Supabase Table Editor:
- Add a lead
- Add an application linked to that lead
- Add a task with: 
   - status = "open"
   - type = "call" | "email" | "review"
   - due_at = today

### To verify filtering directly:

select *
from tasks
where status != 'completed'
  and due_at::date = current_date;

### Frontend

From the frontend directory:

npm install
npm run dev

Open: http://localhost:3000/dashboard/today

### Features:

- Lists tasks due today
- Shows task type, application_id, due_at, status
- Provides “Mark Complete” to update Supabase

### Edge Function

The Edge Function validates input, inserts a task using the service role key, and emits a "task.created" realtime broadcast event.

Example request body:
{
  "application_id": "uuid",
  "task_type": "call",
  "due_at": "2025-01-01T12:00:00Z"
}

Response pattern: 

{ "success": true, "task_id": "..." }

### Edge Function Notes

The `create-task` edge function assumes the following environment variables are set at runtime:

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

For this assignment I focused on correctness of validation and insertion logic.

### Realtime Notes

The create-task function emits a Supabase broadcast event ("task.created") after inserting a task. For this assignment I only implemented the publisher side, as the frontend listener was not required in the instructions. The event payload includes task ID, application ID, type and due date for potential UI updates.


## Stripe Answer

I would start by inserting a new row in payment_requests when the user chooses to pay the application fee. This row stores the application_id, amount, and a pending status before any Stripe call is made. The backend then creates a Stripe Checkout Session and saves the checkout_session_id, payment_intent_id, and return URL back to that same row. The user is redirected to the Stripe hosted page to complete the payment. A webhook endpoint listens for checkout.session.completed from Stripe, verifies the signature, then finds the correct payment_requests entry using the stored session data. Once confirmed, I update the row to paid and write any relevant values from the session, like currency or final amount. Finally, I change the linked application to reflect a successful payment, for example setting a paid flag or advancing its stage so the admissions team can continue processing.

## ✔️ Submission

This repository includes:

- Database schema and indexes
- RLS policies
- Edge Function written in TypeScript
- Working Next.js page with data fetch and update
- Stripe written answer







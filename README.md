# ApexBudget — Personal Monthly Budget Planner

A modern, responsive, and visually stunning web application for personal financial budgeting and expense tracking.

## 🌟 Features Overview

- **Set Monthly Budget**: Configure customizable spending thresholds per month with instant visual pacing indicators and presets ($1,500, $2,500, $3,500, $5,000, $7,500).
- **Record Income and Expenses**:
  - Add and edit transactions with amount, category, date, description, and optional tags/notes.
  - Quick segmented switcher between **Income** and **Expense**.
- **Categorize Spending**:
  - Rich predefined categories with icons and tailored color palettes (Housing, Food, Groceries, Transport, Utilities, Entertainment, Health, Shopping, Education, Debt, Salary, Freelance, Investments, and more).
- **Display Remaining Balance & KPIs**:
  - **Remaining Balance**: Real-time net cash flow (`Income - Expense`) with surplus/deficit status badges.
  - **Total Budget & Available**: Visual progress bar with threshold alerts (On track, Alert, Over Budget).
  - **Safe Daily Spend**: Smart calculation of allowance remaining for the rest of the month.
  - **Savings Rate %**: Automatic savings rate indicator.
- **Interactive Visual Analytics**:
  - High-DPI HTML5 Canvas Donut Chart for category expense distribution with center overlay for top category.
  - Monthly pacing vs. budget consumption comparison bars.
  - Top spending categories ranked list with percentages.
- **Search, Filter & Sort**:
  - Filter by Type (All, Expenses, Income).
  - Filter by Category.
  - Real-time search across description, tags, and category names.
  - Sort by Date (newest/oldest) or Amount (highest/lowest).
- **Persistent Data Storage with `localStorage`**:
  - All records, monthly budgets, selected currency, and theme preferences are saved locally in the browser.
  - Backup & restore via JSON.
  - Export monthly or all transactions directly to CSV.
  - Preloaded with realistic sample data on first visit (with options to reset or reload demo data anytime).
- **Client-Side Authentication & Multi-Account Support**:
  - Dedicated **Sign In** and **Sign Up** portal (`auth.html` & `auth.js`) with glassmorphism aesthetics and animated floating ambient halos.
  - Interactive tab switcher between Sign In and Create Account.
  - **Live Password Strength Meter** (Weak, Fair, Good, Strong) with criteria calculation.
  - Show/Hide password toggle buttons.
  - **Remember Me** persistence support (stored securely via `localStorage`).
  - **Guest Mode** for immediate one-click exploration without an account.
  - **User Profile & Logout System** in the dashboard header: displays dynamic user initials avatar, name, email, and confirmation dialog on sign-out.
  - **Isolated User Storage**: Data is segregated per user email in `localStorage` so multiple accounts don't overwrite each other.

- **Design & Experience**:
  - Sleek dark and light mode toggle across both the auth and dashboard pages.
  - Translucent glassmorphism styling and smooth micro-animations.
  - Multi-currency support ($, €, £, ₹, ¥, C$, A$).
  - Full keyboard accessibility and mobile-responsive layout.

## 🚀 How to Run

Since the application uses 100% vanilla HTML, CSS, and JavaScript with zero build steps or server dependencies:

Simply open `auth.html` or `index.html` in your browser:
```bash
open auth.html
```
Or run a lightweight local HTTP server:
```bash
python3 -m http.server 3000
```
Then open `http://localhost:3000/auth.html` in your browser.

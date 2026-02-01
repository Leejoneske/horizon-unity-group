# Horizon Unit - Group Savings Management Platform

A modern, mobile-first web application for managing group savings and contributions. Built with React, TypeScript, and Supabase.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node Version](https://img.shields.io/badge/node-%3E%3D18-green)

---

## 📱 Features

### For Members
- 📊 **Track Contributions** - View daily, monthly, and lifetime savings
- 📅 **Calendar View** - Visual calendar showing contribution history
- 🎯 **Quick Add** - One-click daily contribution recording (KES 100 default)
- 💰 **Real-time Balance** - Instant update of total savings
- 📈 **Statistics** - Monthly and lifetime contribution tracking
- 🔐 **Secure Authentication** - Phone number-based login

### For Admins
- 👥 **Member Management** - View all members and their contributions
- 📊 **Group Analytics** - Total savings, monthly trends, per-member averages
- 💳 **Contribution Management** - Monitor and manage all group contributions
- 🔍 **Real-time Feed** - Recent activity updates
- 📋 **Detailed Reports** - Member contribution history and statistics

---

## 🛠️ Tech Stack

**Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- Vite
- React Router v6
- Lucide React Icons

**Backend & Database:**
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Real-time subscriptions

**UI Components:**
- shadcn-ui (Radix UI)
- React Hook Form
- Zod (validation)
- React Query (TanStack Query)

**Styling:**
- Tailwind CSS
- Modern fintech design language
- Responsive mobile-first approach

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Leejoneske/horizon-unity-group.git
cd horizon-unity-group
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_EMAIL=admin@example.com
VITE_ADMIN_PASSWORD=secure_password
```

4. **Start the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 📚 Project Structure

```
src/
├── pages/              # Page components
│   ├── Index.tsx       # Landing page
│   ├── UserLogin.tsx   # User/Admin login
│   ├── UserRegister.tsx # User registration
│   ├── UserDashboard.tsx # Member dashboard
│   ├── AdminDashboard.tsx # Admin dashboard
│   └── NotFound.tsx    # 404 page
├── components/         # Reusable UI components
│   ├── ui/            # shadcn-ui components
│   └── NavLink.tsx    # Navigation component
├── lib/               # Utilities and helpers
│   ├── auth.tsx       # Authentication context
│   └── utils.ts       # Helper functions
├── hooks/             # Custom React hooks
│   └── use-toast.ts   # Toast notifications
├── integrations/      # External integrations
│   └── supabase/      # Supabase client setup
└── styles/
    └── index.css      # Global styles & design tokens
```

---

## 🔐 Authentication

The app uses Supabase Authentication with two role types:

### Members
- **Login Method:** Phone number
- **Access:** User Dashboard
- **Features:** View and record contributions

### Admins
- **Login Method:** Email
- **Access:** Admin Dashboard
- **Features:** Manage members, view analytics

---

## 💾 Database Schema

### Tables
- **profiles** - User profile information
- **user_roles** - Role management (admin/member)
- **contributions** - Contribution records with status tracking

All tables have Row Level Security (RLS) policies:
- Users can only access their own data
- Admins can access all data
- Security enforced at database level

---

## 🎨 Design System

### Color Palette
- **Primary Orange:** `#FF5722` - Main CTAs and actions
- **Accent Green:** `#4CAF50` - Positive actions and highlights
- **Neutral Gray:** `#FAFAFA` - Backgrounds
- **Text:** `#2D3436` - Primary text color

### Key Design Features
- **Extreme Roundedness:** 28px border radius on cards, fully rounded buttons
- **Generous Spacing:** 24px padding and gaps for breathing room
- **Soft Shadows:** Subtle elevation with 0 2px 8px shadow
- **Mobile-First:** Responsive design optimized for all devices

---

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start dev server

# Build
npm run build           # Production build
npm run build:dev       # Development build

# Preview
npm run preview         # Preview production build locally

# Testing
npm run test            # Run tests
npm run test:watch      # Watch mode testing

# Linting
npm run lint            # Check code quality
```

---

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

### Deploy to Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Deploy to Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### Deploy to Other Platforms
The `dist/` folder is a static site and can be deployed to:
- GitHub Pages
- AWS S3 + CloudFront
- Google Cloud Storage
- Any static hosting provider

---

## 🔧 Configuration

### Supabase Setup

1. Create a Supabase project
2. Run migrations in `supabase/migrations/`
3. Set up authentication
4. Configure Row Level Security policies

### Environment Variables
```
VITE_SUPABASE_URL       # Your Supabase URL
VITE_SUPABASE_ANON_KEY  # Supabase anonymous key
VITE_ADMIN_EMAIL        # Admin user email
VITE_ADMIN_PASSWORD     # Admin user password
```

---

## 📖 Usage

### Member User Flow
1. Register with phone number
2. Login with phone number
3. View dashboard with savings overview
4. Add daily contribution with one click
5. Track progress in calendar view

### Admin User Flow
1. Login with email
2. View admin dashboard with group statistics
3. Monitor all members and their contributions
4. Review recent activity feed
5. Manage group data

---

## 🐛 Known Issues

- Admin invitation system coming soon
- Custom contribution amounts (currently fixed at KES 100)
- Offline mode not yet implemented

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙋 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: support@horizonunit.io

---

## 🎯 Roadmap

- [ ] Multi-currency support
- [ ] Admin invitation system
- [ ] Custom contribution amounts
- [ ] SMS notifications
- [ ] Mobile app (React Native)
- [ ] Data export/reports
- [ ] Advanced analytics dashboard
- [ ] Payment integration

---

## 👨‍💻 Development

### Code Quality
- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting

### Testing
- Vitest for unit testing
- React Testing Library for component testing

### Performance
- Vite for fast builds
- Code splitting with React Router
- Optimized bundle size

---

## 📞 Contact

**Project:** Horizon Unit  
**Repository:** [github.com/Leejoneske/horizon-unity-group](https://github.com/Leejoneske/horizon-unity-group)  
**Email:** contact@horizonunit.io

---

**Built with ❤️ for community-driven savings**

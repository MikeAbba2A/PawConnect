# PawConnect - Social Network for Pets

PawConnect is a social network platform that allows pet owners to create profiles for their pets, share updates, connect with other pet owners, and discover pet-friendly events and services in their area.

## Features (MVP)

- **User Authentication**: Secure signup and login using Supabase Auth
- **Pet Profiles**: Create and manage pet profiles with photos, details, and more
- **Social Feed**: Share photos, videos, and updates about your pets
- **Social Interactions**: Like (paw), comment, and follow other pets
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **Backend/Auth/Database**: Supabase
- **State Management**: Zustand
- **Routing**: React Router
- **Icons**: Lucide React

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up Supabase:
   - Create a Supabase project
   - Set up authentication
   - Run the SQL migrations found in `supabase/migrations/`
   - Configure your environment variables

4. Start the development server:

```bash
npm run dev
```

## Project Structure

- `/src/components` - Reusable UI components
- `/src/pages` - Page components
- `/src/lib` - Service functions and API calls
- `/src/store` - State management
- `/src/types` - TypeScript types and interfaces
- `/supabase` - Supabase configuration and migrations

## Development Roadmap

### Phase 1 - Foundations (MVP) - Current
- Authentication
- Profiles (users and pets)
- Social feed
- Basic social interactions

### Phase 2 - Social Features
- Enhanced social features
- Geolocation
- Messaging

### Phase 3 - Advanced Features
- Events
- Stories
- Marketplace

### Phase 4 - Administration and Optimization
- Admin panel
- Premium features
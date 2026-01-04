# 🚀 Auth Implementation Quick Reference

> **Quick reference card for user authentication**
> **Full details**: See `21-USER-AUTH-IMPLEMENTATION.md` and `AUTH-README.md`

---

## ✅ Phase 1: Critical Auth - COMPLETE

All critical auth features have been implemented:

### ✅ Login Page
```
📁 src/app/auth/login/page.tsx
```
- Email input form with magic link
- "Check your email" success state
- Accepts `?redirect=` query param
- Error handling with user feedback

### ✅ Callback Route
```
📁 src/app/auth/callback/route.ts
```
- Handles `?token_hash=xxx&type=magiclink`
- Exchanges token for session using Supabase
- Redirects to `?next=` param or `/`
- Graceful error handling

### ✅ Logout Route
```
📁 src/app/auth/logout/route.ts
```
- Signs out via Supabase Auth
- Supports both GET and POST
- Redirects to home

### ✅ Auth Context
```
📁 src/contexts/auth-context.tsx
📁 src/hooks/use-auth.ts
```
- Listens to `onAuthStateChange`
- Provides session to all components
- App wrapped with AuthProvider in `layout.tsx`

### ✅ Header Auth
```
📁 src/components/layout/header-auth.tsx
📁 src/components/auth/user-menu.tsx
📁 src/components/auth/user-avatar.tsx
📁 src/components/layout/mobile-menu.tsx
```
- Login button for guests
- Avatar + dropdown for authenticated users
- Mobile menu drawer with auth integration

---

## 📋 File Creation Checklist

### Phase 1: Critical Auth ✅ COMPLETE
```
✅ src/app/auth/login/page.tsx
✅ src/app/auth/callback/route.ts
✅ src/app/auth/logout/route.ts
✅ src/contexts/auth-context.tsx
✅ src/contexts/index.ts
✅ src/components/auth/index.ts
✅ src/components/auth/login-form.tsx
✅ src/components/auth/user-menu.tsx
✅ src/components/auth/user-avatar.tsx
✅ src/components/layout/header-auth.tsx
✅ src/components/layout/mobile-menu.tsx
✅ src/hooks/index.ts
✅ src/hooks/use-auth.ts
✅ src/types/user.ts
✅ UPDATE: src/app/layout.tsx (wrap with AuthProvider)
✅ UPDATE: src/components/layout/header.tsx (add HeaderAuth, MobileMenu)
✅ UPDATE: src/lib/constants/routes.ts (add auth routes)
```

### Phase 2: Protected Routes
```
□ src/middleware.ts
□ src/components/auth/login-modal.tsx
□ src/components/auth/require-auth.tsx
□ src/components/layout/mobile-menu.tsx
□ src/hooks/use-require-auth.ts
```

### Phase 3: Hearts
```
□ RUN: 00010_user_profiles_and_roles.sql
□ src/app/my/hearts/page.tsx
□ src/app/api/hearts/route.ts
□ src/components/hearts/index.ts
□ src/components/hearts/heart-button.tsx
□ src/components/hearts/hearts-list.tsx
□ src/data/hearts/index.ts
□ src/data/hearts/get-user-hearts.ts
□ src/data/hearts/toggle-heart.ts
□ src/data/hearts/check-heart.ts
□ src/hooks/use-heart.ts
□ UPDATE: src/components/events/event-card.tsx (add heart button)
```

### Phase 4: Profiles
```
□ src/app/my/settings/page.tsx
□ src/app/api/profile/route.ts
□ src/data/profile/index.ts
□ src/data/profile/get-profile.ts
□ src/data/profile/update-profile.ts
```

### Phase 5: Organizer Claiming
```
□ src/app/organizer/claim/[slug]/page.tsx
□ src/app/organizer/dashboard/page.tsx
□ src/app/api/organizer/claim/route.ts
□ src/app/api/organizer/verify/route.ts
□ src/data/organizer/index.ts
□ src/data/organizer/request-claim.ts
□ src/data/organizer/verify-claim.ts
□ src/data/organizer/get-user-organizers.ts
□ UPDATE: src/app/organizer/[slug]/page.tsx (add claim button)
```

---

## 🔑 Key Functions (Already Exist)

From `src/lib/auth/session.ts`:
```typescript
getSession()           // Get current user session (server)
requireAuth()          // Throw if not authenticated
requireAdminAuth()     // Throw if not admin
signInWithMagicLink()  // Send magic link email
signOut()              // Sign out user
```

From `src/lib/auth/is-admin.ts`:
```typescript
isAdmin(email)         // Check if email is admin
```

---

## 🎨 Component Patterns

### Login Form (compact pattern)
```tsx
'use client';

import { useState } from 'react';
import { signInWithMagicLink } from '@/lib/auth';

export function LoginForm({ redirectTo, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    const result = await signInWithMagicLink(email, redirectTo);
    
    if (result.success) {
      setStatus('success');
      onSuccess?.();
    } else {
      setStatus('error');
    }
  };
  
  if (status === 'success') {
    return <CheckEmailMessage email={email} onResend={() => setStatus('idle')} />;
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending...' : 'Send Magic Link'}
      </button>
    </form>
  );
}
```

### Auth Provider Pattern
```tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { UserSession, AuthContextValue } from '@/types/user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children, initialSession }: Props) {
  const [session, setSession] = useState<UserSession | null>(initialSession ?? null);
  const [isLoading, setIsLoading] = useState(!initialSession);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // Fetch additional user data, build UserSession
          setSession(buildUserSession(session.user));
        } else {
          setSession(null);
        }
        setIsLoading(false);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  return (
    <AuthContext.Provider value={{ session, isLoading, signIn, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

### Callback Route Pattern
```typescript
// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/';
  
  if (token_hash && type) {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'magiclink' | 'signup',
    });
    
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }
  
  // Error case
  return NextResponse.redirect(
    new URL('/auth/login?error=invalid_token', request.url)
  );
}
```

---

## 🗄️ Database Quick Ref

### Run This Migration
```sql
-- 00010_user_profiles_and_roles.sql

-- 1. Profiles table (auto-created on signup)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  display_name TEXT,
  -- ... see full migration
);

-- 2. Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Organizer claiming columns
ALTER TABLE organizers ADD COLUMN user_id UUID;
ALTER TABLE organizers ADD COLUMN claim_verified BOOLEAN DEFAULT false;

-- 4. Hearts table
CREATE TABLE hearts (
  user_id UUID REFERENCES auth.users(id),
  event_id UUID REFERENCES events(id),
  UNIQUE(user_id, event_id)
);
```

---

## 🔒 Middleware Pattern

```typescript
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  const { data: { session } } = await supabase.auth.getSession();
  
  const pathname = request.nextUrl.pathname;
  
  // Protected routes
  if (pathname.startsWith('/my') || pathname.startsWith('/submit')) {
    if (!session) {
      return NextResponse.redirect(
        new URL(`/auth/login?redirect=${pathname}`, request.url)
      );
    }
  }
  
  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (!session || !isAdmin(session.user.email)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return res;
}

export const config = {
  matcher: ['/my/:path*', '/submit/:path*', '/admin/:path*'],
};
```

---

## 🧪 Test Checklist

```
✅ Can access /auth/login
✅ Can enter email and submit
✅ Magic link email received (check Supabase logs)
✅ Clicking link logs user in
✅ Header shows user avatar
✅ User menu dropdown works
✅ Can sign out
✅ Session persists on refresh
□ Protected routes redirect to login (middleware - Phase 2)
□ Admin routes blocked for non-admins (middleware - Phase 2)
```

---

## 🚨 Common Errors

| Error | Fix |
|-------|-----|
| "permission denied for table users" | Add `auth.uid() IS NOT NULL` before querying auth.users in RLS |
| Magic link not working | Check Supabase redirect URLs include your callback |
| Session not persisting | Verify `NEXT_PUBLIC_SITE_URL` matches actual domain |
| 500 on callback | Token already used (single-use) or expired |

---

## 📦 Install These

```bash
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog sonner
```

---

## 🔗 Related Docs

- `20-EVENT-FLOWS-ARCHITECTURE.md` - Event submission system
- `21-USER-AUTH-IMPLEMENTATION.md` - Full auth implementation guide
- `02-DATABASE-SCHEMA.md` - Base database schema


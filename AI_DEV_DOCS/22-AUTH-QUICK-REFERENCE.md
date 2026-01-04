# 🚀 Auth Implementation Quick Reference

> **Quick reference card for user authentication system**
> **Full details**: See `21-USER-AUTH-IMPLEMENTATION.md`
> **Status**: ✅ PHASES 1-4 COMPLETE (Updated 2026-01-04)

---

## ✅ Implementation Status

**All core authentication features are now implemented!**

| Feature | Status | Location |
|---------|--------|----------|
| Magic link login | ✅ Done | `/auth/login` |
| Auth callback | ✅ Done | `/auth/callback` |
| Logout | ✅ Done | `/auth/logout` |
| Auth context | ✅ Done | `contexts/auth-context.tsx` |
| User menu | ✅ Done | `components/auth/user-menu.tsx` |
| Middleware | ✅ Done | `middleware.ts` |
| Hearts | ✅ Done | `/my/hearts`, `/api/hearts` |
| Follows | ✅ Done | `/api/follows` |
| Profile | ✅ Done | `/my/settings`, `/api/profile` |
| Organizer claims | ⏳ Pending | Not yet implemented |

---

## 📋 Completed File Checklist

### Phase 1: Critical Auth ✅
```
✅ src/app/auth/login/page.tsx
✅ src/app/auth/callback/route.ts
✅ src/app/auth/logout/route.ts
✅ src/contexts/auth-context.tsx
✅ src/components/auth/index.ts
✅ src/components/auth/login-form.tsx
✅ src/components/auth/user-menu.tsx
✅ src/components/auth/user-avatar.tsx
✅ src/hooks/use-auth.ts
✅ src/types/user.ts
✅ src/app/layout.tsx (wrapped with AuthProvider)
✅ src/components/layout/header.tsx (user menu added)
```

### Phase 2: Protected Routes ✅
```
✅ src/middleware.ts
✅ src/components/layout/mobile-menu.tsx
```

### Phase 3: Hearts ✅
```
✅ RUN: 00011_user_auth_complete.sql
✅ src/app/my/hearts/page.tsx
✅ src/app/api/hearts/route.ts
✅ src/components/hearts/index.ts
✅ src/components/hearts/heart-button.tsx
✅ src/data/user/toggle-heart.ts
✅ src/data/user/get-hearts.ts
✅ src/data/user/check-hearts.ts
✅ src/hooks/use-heart.ts
```

### Phase 4: Profiles & Follows ✅
```
✅ src/app/my/settings/page.tsx
✅ src/app/my/settings/profile-form.tsx
✅ src/app/api/profile/route.ts
✅ src/app/api/follows/route.ts
✅ src/data/user/get-profile.ts
✅ src/data/user/update-profile.ts
✅ src/data/user/toggle-follow.ts
✅ src/data/user/get-follows.ts
```

### Phase 5: Organizer Claiming ⏳ PENDING
```
□ src/app/organizer/claim/[slug]/page.tsx
□ src/app/organizer/dashboard/page.tsx
□ src/app/api/organizer/claim/route.ts
□ src/app/api/organizer/verify/route.ts
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
✅ Protected routes redirect to login
✅ Admin routes blocked for non-admins
✅ Can heart/unheart events
✅ /my/hearts shows saved events
✅ Can update profile in /my/settings
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


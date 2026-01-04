/**
 * USE AUTH HOOK
 * =============
 * Convenient hook to access auth state from any component.
 *
 * This is a re-export from the auth context for easier imports.
 *
 * USAGE:
 * ```tsx
 * import { useAuth } from '@/hooks/use-auth';
 *
 * function MyComponent() {
 *   const { session, isLoading, signIn, signOut } = useAuth();
 *
 *   if (isLoading) return <Spinner />;
 *   if (!session) return <LoginButton />;
 *
 *   return <div>Hello, {session.name}!</div>;
 * }
 * ```
 *
 * @module hooks/use-auth
 */

export { useAuth } from '@/contexts/auth-context';

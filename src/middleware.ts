import { defineMiddleware } from 'astro:middleware';
import { createSupabaseClient } from './lib/supabase';

export const onRequest = defineMiddleware(async ({ cookies, url, redirect }, next) => {
  if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/api/dashboard')) {
    const supabase = createSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return redirect('/login');
    }
  }

  return next();
});

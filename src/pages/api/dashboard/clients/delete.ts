import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createSupabaseClient(cookies);
  const formData = await request.formData();
  const id = formData.get('id') as string;

  if (!id) {
    return redirect('/dashboard?error=missing_id');
  }

  const { error } = await supabase.from('clients').delete().eq('id', id);

  if (error) {
    return redirect('/dashboard?error=delete_failed');
  }

  return redirect('/dashboard?success=deleted');
};

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function hasStripeEnv() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

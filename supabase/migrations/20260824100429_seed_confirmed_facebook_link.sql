/*
# Seed the confirmed public social link

The Facebook profile URL was provided as verified project information and is safe to expose as a public social link.
*/
update public.site_settings
set setting_value = '"https://www.facebook.com/profile.php?id=100017154126901"'::jsonb,
    is_public = true,
    updated_at = now()
where setting_key = 'facebook';

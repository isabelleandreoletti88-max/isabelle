/*
# Grant EXECUTE on is_staff to anon and authenticated

The is_staff() function is SECURITY DEFINER but only callable by postgres/service_role.
The hero_slides SELECT policy calls is_staff('editor') for TO anon, authenticated,
so those roles need EXECUTE permission on the function.
*/

GRANT EXECUTE ON FUNCTION public.is_staff(text) TO anon, authenticated;

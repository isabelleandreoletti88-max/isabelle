/*
# Fix public catalog read policies

1. Purpose
- Separate public published-content reads from staff-only draft reads.
- Prevent anonymous visitors from invoking the private staff-checking function.

2. Modified tables
- `products`: public visitors can read published products; staff can also read drafts.
- `categories`: public visitors can read published categories; staff can also read unpublished categories.
- `product_images`: public visitors can read images belonging to published products; staff can also read images for drafts.
- `product_seasons`: public visitors can read season links belonging to published products; staff can also read links for drafts.

3. Security
- Anonymous reads no longer evaluate `private.is_staff`.
- Staff-only policies remain restricted to authenticated users checked by `private.is_staff('editor')`.
- No data is deleted or changed.
*/

DROP POLICY IF EXISTS "products_public_select" ON public.products;
DROP POLICY IF EXISTS "products_staff_select" ON public.products;
CREATE POLICY "products_public_select" ON public.products
  FOR SELECT TO anon, authenticated
  USING (published);
CREATE POLICY "products_staff_select" ON public.products
  FOR SELECT TO authenticated
  USING (private.is_staff('editor'));

DROP POLICY IF EXISTS "categories_public_select" ON public.categories;
DROP POLICY IF EXISTS "categories_staff_select" ON public.categories;
CREATE POLICY "categories_public_select" ON public.categories
  FOR SELECT TO anon, authenticated
  USING (published);
CREATE POLICY "categories_staff_select" ON public.categories
  FOR SELECT TO authenticated
  USING (private.is_staff('editor'));

DROP POLICY IF EXISTS "product_images_public_select" ON public.product_images;
DROP POLICY IF EXISTS "product_images_staff_select" ON public.product_images;
CREATE POLICY "product_images_public_select" ON public.product_images
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_images.product_id AND p.published
  ));
CREATE POLICY "product_images_staff_select" ON public.product_images
  FOR SELECT TO authenticated
  USING (private.is_staff('editor'));

DROP POLICY IF EXISTS "product_seasons_public_select" ON public.product_seasons;
DROP POLICY IF EXISTS "product_seasons_staff_select" ON public.product_seasons;
CREATE POLICY "product_seasons_public_select" ON public.product_seasons
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_seasons.product_id AND p.published
  ));
CREATE POLICY "product_seasons_staff_select" ON public.product_seasons
  FOR SELECT TO authenticated
  USING (private.is_staff('editor'));

-- Allow unauthenticated users to view active coupons during signup
CREATE POLICY "Anyone can view active unused coupons"
ON public.coupons
FOR SELECT
TO anon
USING (status = 'active' AND used_by IS NULL);
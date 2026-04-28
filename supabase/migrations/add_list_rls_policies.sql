-- RLS Policies for the lists table
-- Run these in your Supabase SQL editor

-- Policy 1: Users can view their own lists
CREATE POLICY "Users can view their own lists"
  ON lists FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Anyone can view public lists
CREATE POLICY "Anyone can view public lists"
  ON lists FOR SELECT
  USING (is_public = true);

-- Policy 3: Users can insert their own lists
CREATE POLICY "Users can insert their own lists"
  ON lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can update their own lists
CREATE POLICY "Users can update their own lists"
  ON lists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 5: Users can delete their own lists
CREATE POLICY "Users can delete their own lists"
  ON lists FOR DELETE
  USING (auth.uid() = user_id);

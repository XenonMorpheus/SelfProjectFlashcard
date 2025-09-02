-- Add sharing and collaboration features to existing tables

-- Add sharing fields to flashcard_decks
ALTER TABLE flashcard_decks 
ADD COLUMN is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN share_code VARCHAR(10) UNIQUE,
ADD COLUMN clone_count INTEGER DEFAULT 0,
ADD COLUMN rating_average DECIMAL(3,2) DEFAULT 0,
ADD COLUMN rating_count INTEGER DEFAULT 0;

-- Create deck_shares table for tracking shared access
CREATE TABLE deck_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission VARCHAR(20) DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deck_id, shared_with)
);

-- Create deck_ratings table
CREATE TABLE deck_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deck_id, user_id)
);

-- Create study_groups table
CREATE TABLE study_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  join_code VARCHAR(8) UNIQUE,
  member_limit INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_group_members table
CREATE TABLE study_group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create group_leaderboards table
CREATE TABLE group_leaderboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sessions INTEGER DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  average_accuracy DECIMAL(5,2) DEFAULT 0,
  points INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE deck_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_leaderboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deck_shares
CREATE POLICY "Users can view shares for their decks or shares with them" ON deck_shares
  FOR SELECT USING (
    shared_by = auth.uid() OR 
    shared_with = auth.uid() OR
    EXISTS (
      SELECT 1 FROM flashcard_decks 
      WHERE id = deck_shares.deck_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create shares for their decks" ON deck_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM flashcard_decks 
      WHERE id = deck_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shares they created" ON deck_shares
  FOR DELETE USING (shared_by = auth.uid());

-- RLS Policies for deck_ratings
CREATE POLICY "Anyone can view ratings for public decks" ON deck_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM flashcard_decks 
      WHERE id = deck_ratings.deck_id AND is_public = TRUE
    )
  );

CREATE POLICY "Users can create ratings for public decks" ON deck_ratings
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM flashcard_decks 
      WHERE id = deck_id AND is_public = TRUE
    )
  );

CREATE POLICY "Users can update their own ratings" ON deck_ratings
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for study_groups
CREATE POLICY "Anyone can view public groups" ON study_groups
  FOR SELECT USING (is_public = TRUE OR created_by = auth.uid());

CREATE POLICY "Users can create groups" ON study_groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creators can update their groups" ON study_groups
  FOR UPDATE USING (created_by = auth.uid());

-- RLS Policies for study_group_members
CREATE POLICY "Group members can view other members" ON study_group_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM study_group_members sgm2 
      WHERE sgm2.group_id = study_group_members.group_id AND sgm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups" ON study_group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for group_leaderboards
CREATE POLICY "Group members can view leaderboards" ON group_leaderboards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM study_group_members 
      WHERE group_id = group_leaderboards.group_id AND user_id = auth.uid()
    )
  );

-- Functions to generate share codes
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Function to update deck ratings
CREATE OR REPLACE FUNCTION update_deck_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE flashcard_decks 
  SET 
    rating_average = (
      SELECT AVG(rating)::DECIMAL(3,2) 
      FROM deck_ratings 
      WHERE deck_id = COALESCE(NEW.deck_id, OLD.deck_id)
    ),
    rating_count = (
      SELECT COUNT(*) 
      FROM deck_ratings 
      WHERE deck_id = COALESCE(NEW.deck_id, OLD.deck_id)
    )
  WHERE id = COALESCE(NEW.deck_id, OLD.deck_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ratings
CREATE TRIGGER update_deck_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON deck_ratings
  FOR EACH ROW EXECUTE FUNCTION update_deck_rating();

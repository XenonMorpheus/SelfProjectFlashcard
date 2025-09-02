-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Create flashcard decks table
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on flashcard_decks
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for flashcard_decks
CREATE POLICY "decks_select_own_or_public" ON public.flashcard_decks FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "decks_insert_own" ON public.flashcard_decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "decks_update_own" ON public.flashcard_decks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "decks_delete_own" ON public.flashcard_decks FOR DELETE USING (auth.uid() = user_id);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  front_image_url TEXT,
  back_image_url TEXT,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on flashcards
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for flashcards
CREATE POLICY "flashcards_select_own_or_public_deck" ON public.flashcards FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.flashcard_decks WHERE id = deck_id AND is_public = TRUE)
);
CREATE POLICY "flashcards_insert_own" ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "flashcards_update_own" ON public.flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "flashcards_delete_own" ON public.flashcards FOR DELETE USING (auth.uid() = user_id);

-- Create study sessions table for tracking progress
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  time_spent_seconds INTEGER DEFAULT 0,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on study_sessions
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for study_sessions
CREATE POLICY "sessions_select_own" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update_own" ON public.study_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sessions_delete_own" ON public.study_sessions FOR DELETE USING (auth.uid() = user_id);

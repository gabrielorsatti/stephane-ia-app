-- Migration: add weekly_goal to profiles
-- Run this in the Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_goal integer;

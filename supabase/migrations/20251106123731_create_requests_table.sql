/*
  # Department Request Automation Tool - Database Schema

  ## Summary
  Creates the core database structure for the Department Request Automation Tool,
  enabling automated request handling, categorization, and tracking.

  ## New Tables
  
  ### `requests`
  Main table for storing all employee requests with full tracking capabilities.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier for each request
  - `title` (text) - Subject/title of the request
  - `description` (text) - Full description of the request
  - `category` (text) - Classification (IT Support, Facilities, Equipment, Safety, HR, Other)
  - `priority` (text) - Priority level (Critical, High, Medium, Low)
  - `status` (text) - Current status (Received, In Progress, Resolved)
  - `submitter_id` (uuid, foreign key) - Reference to auth.users
  - `submitter_name` (text) - Name of the person submitting
  - `assigned_unit` (text) - Department/unit handling the request
  - `assigned_handler` (text) - Specific person assigned to handle
  - `ai_response` (text) - AI-generated initial response
  - `created_at` (timestamptz) - Submission timestamp
  - `updated_at` (timestamptz) - Last modification timestamp
  - `resolved_at` (timestamptz) - Resolution timestamp
  - `deadline` (timestamptz) - Optional deadline for completion
  
  ### `request_comments`
  Table for storing comments and updates on requests.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier
  - `request_id` (uuid, foreign key) - Reference to requests table
  - `user_id` (uuid, foreign key) - User who made the comment
  - `user_name` (text) - Name of commenter
  - `comment` (text) - Comment content
  - `created_at` (timestamptz) - Comment timestamp
  
  ### `user_roles`
  Table for managing user permissions (submitter vs handler).
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Reference to auth.users
  - `role` (text) - Role type: 'submitter' or 'handler'
  - `created_at` (timestamptz) - Role assignment timestamp

  ## Security
  
  ### Row Level Security (RLS)
  All tables have RLS enabled with the following policies:
  
  **requests table:**
  - Authenticated users can insert their own requests
  - Submitters can view only their own requests
  - Handlers can view all requests
  - Handlers can update request status and assignments
  - Only handlers can delete requests (if necessary)
  
  **request_comments table:**
  - Users can insert comments on requests they have access to
  - Users can view comments on requests they have access to
  
  **user_roles table:**
  - Users can view their own role
  - Only authenticated users can check roles

  ## Important Notes
  1. All timestamps use `timestamptz` for proper timezone handling
  2. Foreign key constraints ensure data integrity
  3. Default values are set for status (Received) and timestamps
  4. Indexes are created for common query patterns
*/

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Received',
  submitter_id uuid REFERENCES auth.users(id) NOT NULL,
  submitter_name text NOT NULL,
  assigned_unit text DEFAULT '',
  assigned_handler text DEFAULT '',
  ai_response text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  deadline timestamptz
);

-- Create request_comments table
CREATE TABLE IF NOT EXISTS request_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  user_name text NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  role text NOT NULL CHECK (role IN ('submitter', 'handler')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_submitter ON requests(submitter_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_category ON requests(category);
CREATE INDEX IF NOT EXISTS idx_requests_priority ON requests(priority);
CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_request ON request_comments(request_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

-- Enable RLS
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for requests table

-- Users can insert their own requests
CREATE POLICY "Users can create requests"
  ON requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = submitter_id);

-- Users can view their own requests
CREATE POLICY "Submitters can view own requests"
  ON requests FOR SELECT
  TO authenticated
  USING (auth.uid() = submitter_id);

-- Handlers can view all requests
CREATE POLICY "Handlers can view all requests"
  ON requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'handler'
    )
  );

-- Handlers can update requests
CREATE POLICY "Handlers can update requests"
  ON requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'handler'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'handler'
    )
  );

-- Handlers can delete requests if necessary
CREATE POLICY "Handlers can delete requests"
  ON requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'handler'
    )
  );

-- RLS Policies for request_comments table

-- Users can insert comments on requests they can view
CREATE POLICY "Users can create comments on accessible requests"
  ON request_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM requests
        WHERE requests.id = request_id
        AND requests.submitter_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'handler'
      )
    )
  );

-- Users can view comments on requests they can access
CREATE POLICY "Users can view comments on accessible requests"
  ON request_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = request_id
      AND requests.submitter_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'handler'
    )
  );

-- RLS Policies for user_roles table

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to set resolved_at when status changes to Resolved
CREATE OR REPLACE FUNCTION set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Resolved' AND OLD.status != 'Resolved' THEN
    NEW.resolved_at = now();
  ELSIF NEW.status != 'Resolved' THEN
    NEW.resolved_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set resolved_at
CREATE TRIGGER update_resolved_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION set_resolved_at();
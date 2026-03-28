/*
  # Finance and Notifications System

  1. New Tables
    - `fee_structures`
      - `id` (uuid, primary key)
      - `class_name` (text) - e.g. "PP1", "Grade 7"
      - `amount_per_term` (numeric) - tuition fee
      - `lunch_fee` (numeric)
      - `academic_year` (text) - e.g. "2024/2025"
      - `created_at` (timestamptz)
    
    - `student_fees`
      - `id` (uuid, primary key)
      - `student_id` (uuid, FK to profiles)
      - `term` (text) - e.g. "Term 1 2024"
      - `total_expected` (numeric)
      - `total_paid` (numeric)
      - `balance` (numeric) - calculated: expected - paid
      - `mpesa_ref` (text, nullable) - M-Pesa transaction reference
      - `payment_date` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
  2. Security
    - Enable RLS on all tables
    - fee_structures: admin can manage, all can read
    - student_fees: admin can manage, students can read own records
*/

-- Fee structures table
CREATE TABLE IF NOT EXISTS fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name text NOT NULL,
  amount_per_term numeric NOT NULL DEFAULT 0,
  lunch_fee numeric NOT NULL DEFAULT 0,
  academic_year text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fee structures"
  ON fee_structures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage fee structures"
  ON fee_structures FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Student fees table
CREATE TABLE IF NOT EXISTS student_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  term text NOT NULL,
  total_expected numeric NOT NULL DEFAULT 0,
  total_paid numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  mpesa_ref text,
  payment_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own fee records"
  ON student_fees FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all fee records"
  ON student_fees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage student fees"
  ON student_fees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_fees_student_id ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_term ON student_fees(term);
CREATE INDEX IF NOT EXISTS idx_fee_structures_class ON fee_structures(class_name);

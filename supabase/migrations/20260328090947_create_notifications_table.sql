/*
  # Create notifications table

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `title` (text, required) - notification title
      - `message` (text, required) - notification message content
      - `type` (text, required) - notification type: 'fee', 'quiz', 'general', 'attendance'
      - `sender_id` (uuid, FK to profiles) - user who sent the notification
      - `created_at` (timestamp) - creation timestamp
    - `notification_recipients`
      - `id` (uuid, primary key)
      - `notification_id` (uuid, FK to notifications)
      - `recipient_id` (uuid, FK to profiles)
      - `read_at` (timestamp, nullable) - when recipient read the notification
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `notifications` table
    - Enable RLS on `notification_recipients` table
    - Only senders (admin/teacher) can create notifications
    - Users can only read their own notifications
    - Only senders can update/delete notifications they sent

  3. Indexes
    - Index on `notification_recipients.recipient_id` for fast lookups of user notifications
    - Index on `notification_recipients.read_at` for filtering unread notifications
    - Composite index on (recipient_id, read_at) for common queries
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('fee', 'quiz', 'general', 'attendance')),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and teachers can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    (
      SELECT role FROM user_roles WHERE user_id = auth.uid()
    ) IN ('admin', 'teacher')
  );

CREATE POLICY "Users can view notifications they received"
  ON notification_recipients FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notification read status"
  ON notification_recipients FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Admins and teachers can insert notification recipients"
  ON notification_recipients FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('admin', 'teacher')
  );

CREATE POLICY "Senders can delete their notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

CREATE INDEX idx_notification_recipients_recipient_id ON notification_recipients(recipient_id);
CREATE INDEX idx_notification_recipients_read_at ON notification_recipients(read_at);
CREATE INDEX idx_notification_recipients_recipient_read ON notification_recipients(recipient_id, read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_sender_id ON notifications(sender_id);

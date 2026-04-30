USE finance_tracker_db;

/*
  Template insert user setelah akun Firebase Auth sudah dibuat.
  Ganti nilai firebase_uid, email, dan display_name sesuai user yang valid.
*/

INSERT INTO users (
  firebase_uid,
  email,
  display_name
) VALUES (
  'firebase-uid-example',
  'user@example.com',
  'Finance Tracker User'
);

CREATE TABLE drive_days (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  start_time TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX drive_days_user_id_idx ON drive_days(user_id);

CREATE TRIGGER update_drive_days_updated_at
  BEFORE UPDATE ON drive_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE legs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_day_id     UUID NOT NULL REFERENCES drive_days(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_location_id UUID NOT NULL REFERENCES locations(id),
  to_location_id   UUID NOT NULL REFERENCES locations(id),
  passenger_id     UUID REFERENCES passengers(id) ON DELETE SET NULL,
  label            TEXT NOT NULL,
  distance_km      FLOAT NOT NULL,
  duration_min     INT NOT NULL,
  is_passenger_leg BOOLEAN NOT NULL DEFAULT false,
  position         INT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX legs_drive_day_id_idx ON legs(drive_day_id);
CREATE INDEX legs_user_id_idx ON legs(user_id);

CREATE TRIGGER update_legs_updated_at
  BEFORE UPDATE ON legs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

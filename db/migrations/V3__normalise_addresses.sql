ALTER TABLE passengers ADD COLUMN home_location_id UUID REFERENCES locations(id);
ALTER TABLE app_settings ADD COLUMN home_location_id UUID REFERENCES locations(id);

DO $$
DECLARE
  p_row RECORD;
  s_row RECORD;
  loc_id UUID;
BEGIN
  FOR p_row IN SELECT * FROM passengers LOOP
    INSERT INTO locations (user_id, name, address, lat, lon)
    VALUES (p_row.user_id, p_row.name || '''s home', p_row.home_address, p_row.home_lat, p_row.home_lon)
    RETURNING id INTO loc_id;
    UPDATE passengers SET home_location_id = loc_id WHERE id = p_row.id;
  END LOOP;

  FOR s_row IN SELECT * FROM app_settings LOOP
    INSERT INTO locations (user_id, name, address, lat, lon)
    VALUES (s_row.user_id, 'Home', s_row.home_address, s_row.home_lat, s_row.home_lon)
    RETURNING id INTO loc_id;
    UPDATE app_settings SET home_location_id = loc_id WHERE id = s_row.id;
  END LOOP;
END $$;

ALTER TABLE passengers  ALTER COLUMN home_location_id SET NOT NULL;
ALTER TABLE app_settings ALTER COLUMN home_location_id SET NOT NULL;

ALTER TABLE passengers  DROP COLUMN home_address, DROP COLUMN home_lat, DROP COLUMN home_lon;
ALTER TABLE app_settings DROP COLUMN home_address, DROP COLUMN home_lat, DROP COLUMN home_lon;

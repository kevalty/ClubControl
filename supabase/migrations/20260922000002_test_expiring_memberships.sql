-- Test data: memberships expiring soon (for dashboard testing)
-- Only inserts if the org 'club-demo' exists and has a plan
DO $$
DECLARE
  v_org_id uuid;
  v_plan_id uuid;
  v_member_ids uuid[];
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'club-demo' LIMIT 1;
  IF v_org_id IS NULL THEN RETURN; END IF;

  SELECT id INTO v_plan_id FROM membership_plans WHERE organization_id = v_org_id LIMIT 1;
  IF v_plan_id IS NULL THEN RETURN; END IF;

  SELECT ARRAY(SELECT id FROM members WHERE organization_id = v_org_id LIMIT 3) INTO v_member_ids;
  IF array_length(v_member_ids, 1) IS NULL THEN RETURN; END IF;

  -- Insert expiring memberships (1, 3, 6 days from now)
  INSERT INTO memberships (organization_id, member_id, plan_id, start_date, end_date, status)
  VALUES
    (v_org_id, v_member_ids[1], v_plan_id, current_date - 29, current_date + 1, 'active'),
    (v_org_id, v_member_ids[2], v_plan_id, current_date - 27, current_date + 3, 'active'),
    (v_org_id, v_member_ids[3], v_plan_id, current_date - 24, current_date + 6, 'active')
  ON CONFLICT DO NOTHING;
END $$;

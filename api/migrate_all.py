"""Run all migrations idempotently. Safe to call on every startup."""
import importlib
import os
import sys

MIGRATION_MODULES = [
    'migrate_add_columns',
    'migrate_match_post_id',
    'migrate_password_reset',
    'migrate_email_verification',
    'migrate_league',
]

def run_all():
    api_dir = os.path.dirname(os.path.abspath(__file__))
    if api_dir not in sys.path:
        sys.path.insert(0, api_dir)
    for mod_name in MIGRATION_MODULES:
        mod_path = os.path.join(api_dir, f'{mod_name}.py')
        if os.path.exists(mod_path):
            print(f"Running migration: {mod_name}")
            mod = importlib.import_module(mod_name)
            mod.migrate()
        else:
            print(f"Skipping (not found): {mod_name}")
    print("All migrations complete.")

if __name__ == '__main__':
    run_all()

"""
PgAdmin servers configuration
Automatically connects to PostgreSQL database
"""

SERVERS = {
    '1': {
        'name': 'nba-stats-db',
        'group_name': 'Servers',
        'host': 'postgres',
        'port': 5432,
        'maintenance_db': 'postgres',
        'username': 'postgres',
        'password': 'postgres',
        'ssl_mode': 'prefer',
        'connect_timeout': 10,
        'save_password': True,
    }
}

#!/bin/sh
# Import SQL if tables don't exist
TABLE_COUNT=$(mysql -h "${MYSQL_HOST:-primary.alraled-mysql--8n7zm5bdjx8d.addon.code.run}" -P "${MYSQL_PORT:-3306}" -u "${MYSQL_USER:-a596b9ca0173e9c6}" -p"${MYSQL_PASSWORD:-183972f03cd9d8460dec142ca06fbf}" "${MYSQL_DATABASE:-252638c8748b}" -e "SHOW TABLES" 2>/dev/null | wc -l)
if [ "$TABLE_COUNT" -le 1 ]; then
  echo "No tables found, importing data..."
  mysql -h "${MYSQL_HOST:-primary.alraled-mysql--8n7zm5bdjx8d.addon.code.run}" -P "${MYSQL_PORT:-3306}" -u "${MYSQL_USER:-a596b9ca0173e9c6}" -p"${MYSQL_PASSWORD:-183972f03cd9d8460dec142ca06fbf}" "${MYSQL_DATABASE:-252638c8748b}" --ssl < alraled-backup.sql 2>&1 || echo "Import failed, continuing..."
  echo "Import done."
else
  echo "Tables already exist, skipping import."
fi
node dist/index.js

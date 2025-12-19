set -e
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from api-test
EXIT_CODE=$?
docker compose -f docker-compose.test.yml down -v
exit $EXIT_CODE

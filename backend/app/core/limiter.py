from slowapi import Limiter
from slowapi.util import get_remote_address

# Basic brute-force protection on login/register. In-memory by default,
# which is fine for a single backend instance; if this ever runs as
# multiple replicas behind a load balancer, point storage_uri at Redis
# instead (see slowapi docs) so limits are shared across instances.
limiter = Limiter(key_func=get_remote_address)
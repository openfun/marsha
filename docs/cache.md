# Cache

## RedisCacheWithFallback

Marsha has a cache allowing to use redis backend and to fallback on the memory cache if redis is not available.
The package `django-redis` is used in combination with the backend `marsha.core.cache.RedisCacheWithFallback`.

The configuration followed the [django-redis](https://github.com/jazzband/django-redis) configuration but you have to use the `marsha.core.cache.RedisCacheWithFallback` backend instead of `django_redis.cache.RedisCache` for your `default` backend.
Then you have to declare a second backend named `memory_cache` where you can use the `django.core.cache.backends.locmem.LocMemCache` backend.

A complete simple example:

```
CACHES = {
    "default": {
        "BACKEND": "marsha.core.cache.RedisCacheWithFallback",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    },
    "memory_cache": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    },
}
```
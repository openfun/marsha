import time


def debounce(wait):
    def decorator(func):
        last_call_time = 0

        def debounced(*args, **kwargs):
            nonlocal last_call_time

            elapsed_time = time.monotonic() - last_call_time

            if elapsed_time < wait:
                return

            last_call_time = time.monotonic()

            return func(*args, **kwargs)

        return debounced

    return decorator
"""Gunicorn configuration file for marsha."""

# Gunicorn-django settings
bind = ["0.0.0.0:8000"]
name = "marsha"
python_path = "/app"

# Run
graceful_timeout = 90
timeout = 90
workers = 3
worker_class = "marsha.workers.MarshaUvicornWorker"
worker_tmp_dir = "/dev/shm"
threads = 6

# Logging
# Using '-' for the access log file makes gunicorn log accesses to stdout
accesslog = "-"
# Using '-' for the error log file makes gunicorn log errors to stderr
errorlog = "-"
loglevel = "info"

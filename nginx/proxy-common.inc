proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
# overwrite (not append) so a client cannot spoof the address the rate limiter keys on
proxy_set_header X-Forwarded-For $remote_addr;
proxy_connect_timeout 1s;
proxy_read_timeout 30s;
add_header X-Upstream $upstream_addr always;

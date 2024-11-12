FROM marsha:dev AS marsha

USER root:root

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && \
    NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")" && \
    [ -s "$NVM_DIR/nvm.sh" ] && \
    \. "$NVM_DIR/nvm.sh" # This loads nvm && \
    nvm install 20 --default && \
    npx -y playwright@1.48.0 install --with-deps


RUN pip install .[e2e]

RUN playwright install-deps chrome firefox webkit && \
    playwright install chrome firefox webkit

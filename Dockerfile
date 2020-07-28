FROM buildkite/puppeteer
RUN adduser --disabled-password --gecos '' app && mkdir app && chown -R app /app
USER app
WORKDIR /app
ADD ./app .
RUN npm i 
ENTRYPOINT [ "node", "index.js" ]
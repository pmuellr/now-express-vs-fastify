# profiling express vs fastify on zeit now

This repo has a sample designed to be deployed on https://zeit.co/now
using the [@now/node builder][], which shows off a couple of things you
can do with @now/node lambdas:

- using [express][] for routing and middleware purposes
- using [fastify][] for routing and middleware purposes
- using [@no-pro/runtime][] to generate CPU profiles

To operate the demo:

- clone the git repo
- cd into the new directory
- run `npm install`
- pick a secret to use with no-pro, set in env var `NO_PRO_KEY`
- write the secret down somewhere, you may want it later
- set the secret in now via `now secret add no-pro-key $NO_PRO_KEY`
- deploy to now via `now`


After that completes, the server should be deployed, so let's test them.  In my
case, the URL to the now server is:
https://now-express-vs-fastify.pmuellr.now.sh

Using [HTTPie][]:

```console
$ http get https://now-express-vs-fastify.pmuellr.now.sh/lambdas/express.js
HTTP/1.1 200 OK
...

<h1>hello from /var/task/user/lambdas/express.js</h1>


$ http post https://now-express-vs-fastify.pmuellr.now.sh/lambdas/fastify.js a:2
HTTP/1.1 200 OK
...

{
    "ok": true
}
```

Great!

Now let's run a profile.  First you'll need to run the profile collector.
This app has an HTTP PUT endpoint to write a profile to your file system,
and will be exposed as an https server on the public internet, using [ngrok][],
with basic auth using the `NO_PRO_KEY` as the password.

We'll pass the public internet url in a header in the request to our now server.

To start the profile collector:

```console
$ PORT=3001 tools/profile-collector.js
writing files to /Users/pmuellr/Projects/now-express-vs-fastify/tmp
local  server listening on http://localhost:3001
remote server listening on https://67c8934a.ngrok.io
```

Now we can make a request to the now server with appropriate headers to
authenticate the profile request and indicate where to write it.  The
relevant headers are:

- `x-no-pro-profiling-key` - should be `NO_PRO_KEY` value
- `x-no-pro-http-put` - a URL where the generated profile will be written to

Again, using HTTPie:

```console
$ http post https://now-express-vs-fastify.pmuellr.now.sh/lambdas/express.js \ 
   x-no-pro-profiling-key:$NO_PRO_KEY \
   x-no-pro-http-put:https://67c8934a.ngrok.io \
   a=2
```

The HTTP response should be unchanged, but the output of
`tools/profile-collector.js` should now include some similar to this:

```
writing file tmp/2019-04-02@22-02-20-321.post._.cpuprofile
```

\o/ you captured a profile!

Now what?  You can load it into Chrome Dev Tools -
[`chrome://inspect/#devices`](chrome://inspect/#devices).  Or drop it onto
the [no-pro profile viewer][].

Note that because the @now/node builder bundles your application, the source
file information profiled in the profile is not very useful.  I hope you
named your functions wisely!

[@now/node builder]: https://zeit.co/docs/v2/deployments/official-builders/node-js-now-node/
[express]: http://expressjs.com/
[fastify]: https://www.fastify.io/
[HTTPie]: https://httpie.org/#installation
[ngrok]: https://ngrok.com/
[no-pro profile viewer]: https://pmuellr.github.io/no-pro/
[@no-pro/runtime]: https://www.npmjs.com/package/@no-pro/runtime
# nodehub
Listen 1 port, handle many virtual hosts

nodehub dispatch requests from the listened port (80 by default) to the right
node.js server based on the hostname of the request header.
